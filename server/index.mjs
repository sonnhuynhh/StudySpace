import { startServer } from './app.mjs';
import { API_HOST, API_LAN_HOST, API_PORT, SUPABASE_KEY, SUPABASE_URL } from './config.mjs';

const application = await startServer({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
  host: API_HOST,
  port: API_PORT,
});

console.log(`StudySpace API: http://${API_LAN_HOST}:${API_PORT}/api`);
console.log(`Supabase: ${SUPABASE_URL}`);

async function shutdown() {
  await application.close();
  process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
