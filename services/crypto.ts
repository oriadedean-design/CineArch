
/**
 * CANONICAL ENCRYPTION SERVICE
 * Implements AES-GCM (256-bit) client-side encryption.
 * Supports the "Zero-Knowledge" charter.
 */

const ENCRYPTION_KEY_ID = 'cinearch-vault-key';

async function getDerivedKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('cinearch-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export const cryptoService = {
  async encrypt(data: string, secret: string): Promise<string> {
    try {
      const key = await getDerivedKey(secret);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.error('Encryption Failure:', e);
      throw new Error('SEC_ERR_01: Integrity violation during encryption.');
    }
  },

  async decrypt(encryptedBase64: string, secret: string): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedBase64).split('').map((c) => c.charCodeAt(0))
      );
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      const key = await getDerivedKey(secret);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('Decryption Failure:', e);
      throw new Error('SEC_ERR_02: Key mismatch or data corruption.');
    }
  }
};
