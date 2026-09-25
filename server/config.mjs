import { loadEnvFile } from 'node:process';
import { resolveLanHost } from '../scripts/network.mjs';

try {
  loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

export const API_HOST = process.env.STUDYSPACE_API_HOST ?? '0.0.0.0';
export const API_PORT = Number(process.env.STUDYSPACE_API_PORT ?? 4000);
export const API_LAN_HOST = resolveLanHost();
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
export const DEMO_USER_ID = 'student-demo';
