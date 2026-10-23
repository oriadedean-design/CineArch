// The few Resend API calls CineArch uses (https://resend.com/docs/api-reference).

const API = 'https://api.resend.com';

export class Resend {
  constructor(private key: string) {}

  // Resend's default limit is a few requests a second; keep well under it.
  private async call(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
    await new Promise(r => setTimeout(r, 550));
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data };
  }

  private async ok(method: string, path: string, body?: unknown, allow: number[] = []) {
    const r = await this.call(method, path, body);
    if (r.status >= 300 && !allow.includes(r.status)) throw new Error(`Resend ${method} ${path}: ${r.status} ${JSON.stringify(r.data)}`);
    return r;
  }

  /** Custom contact properties, created once (all strings). */
  async ensureProperties(keys: string[]) {
    const { data } = await this.ok('GET', '/contact-properties');
    const have = new Set<string>((data?.data ?? []).map((p: any) => p.key));
    for (const key of keys.filter(k => !have.has(k))) await this.ok('POST', '/contact-properties', { key, type: 'string' });
  }

  /** Segment ids by name, creating any that don't exist yet. */
  async ensureSegments(names: string[]): Promise<Map<string, string>> {
    const { data } = await this.ok('GET', '/segments');
    const ids = new Map<string, string>((data?.data ?? []).map((s: any) => [s.name, s.id]));
    for (const name of names.filter(n => !ids.has(n))) {
      const r = await this.ok('POST', '/segments', { name });
      ids.set(name, r.data.id);
    }
    return ids;
  }

  /** Creates or updates a contact by email. */
  async upsertContact(c: { email: string; firstName: string | null; unsubscribed: boolean; properties: Record<string, string> }) {
    const body = { first_name: c.firstName ?? undefined, unsubscribed: c.unsubscribed, properties: c.properties };
    const r = await this.ok('PATCH', `/contacts/${encodeURIComponent(c.email)}`, body, [404]);
    if (r.status === 404) await this.ok('POST', '/contacts', { email: c.email, ...body });
  }

  /** Puts a contact in exactly these segments (of the ones CineArch manages). */
  async setSegments(email: string, want: Set<string>, managed: Set<string>) {
    const path = `/contacts/${encodeURIComponent(email)}/segments`;
    const { data } = await this.ok('GET', path);
    const have = new Set<string>((data?.data ?? []).map((s: any) => s.id));
    for (const id of want) if (!have.has(id)) await this.ok('POST', `${path}/${id}`);
    for (const id of have) if (managed.has(id) && !want.has(id)) await this.ok('DELETE', `${path}/${id}`, undefined, [404]);
  }

  async deleteContact(email: string) {
    await this.ok('DELETE', `/contacts/${encodeURIComponent(email)}`, undefined, [404]);
  }

  /** Sends one email; returns Resend's id. */
  async send(e: { from: string; to: string; subject: string; html: string; text: string; unsubscribe: string; tag: string; idempotencyKey: string }) {
    const res = await fetch(`${API}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': e.idempotencyKey },
      body: JSON.stringify({
        from: e.from, to: [e.to], subject: e.subject, html: e.html, text: e.text,
        headers: { 'List-Unsubscribe': `<${e.unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        tags: [{ name: 'kind', value: e.tag }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Resend send ${e.tag}: ${res.status} ${JSON.stringify(data)}`);
    await new Promise(r => setTimeout(r, 550));
    return data.id as string;
  }
}

/** The unsubscribe token for a person: an HMAC of their id, so links can't be guessed. */
export async function unsubscribeToken(userId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(sig)).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}
