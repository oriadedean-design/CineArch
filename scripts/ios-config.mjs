// Writes ios/Config/Secrets.xcconfig from .env.local so the iPhone app talks
// to the same Supabase project as the website. Run: npm run ios:config
import { loadEnv } from 'vite';
import { writeFileSync } from 'fs';
const env = loadEnv('', process.cwd(), 'VITE_');
const url = env.VITE_SUPABASE_URL, key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local'); process.exit(1); }
// xcconfig treats "//" as a comment, so store the host and build the URL in Swift.
const host = new URL(url).host;
writeFileSync('ios/Config/Secrets.xcconfig', `SUPABASE_HOST = ${host}\nSUPABASE_ANON_KEY = ${key}\n`);
console.log(`ios/Config/Secrets.xcconfig written for ${host}`);
