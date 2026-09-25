import { createServer } from 'node:http';
import {
  ApiError,
  cancelBooking,
  createBooking,
  findBooking,
  getAvailability,
  getRoom,
  listBookings,
  listRooms,
  healthCheck,
  openDatabase,
} from './supabase-database.mjs';

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  response.end(payload);
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new ApiError(413, 'Dữ liệu gửi lên quá lớn.', 'PAYLOAD_TOO_LARGE');
    }
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new ApiError(400, 'JSON không hợp lệ.', 'INVALID_JSON');
  }
}

function userIdFrom(request, url) {
  return request.headers['x-user-id'] || url.searchParams.get('userId') || 'student-demo';
}

function handler(db) {
  return async (request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      });
      response.end();
      return;
    }
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const userId = String(userIdFrom(request, url));
      const roomMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
      const availabilityMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/availability$/);
      const bookingMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)$/);
      const cancelMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/);

      if (request.method === 'GET' && url.pathname === '/api/health') {
        await healthCheck(db);
        sendJson(response, 200, {
          ok: true,
          service: 'studyspace-api',
          database: 'connected',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/rooms') {
        const date = url.searchParams.get('date');
        if (!date) throw new ApiError(400, 'Thiếu ngày cần kiểm tra.', 'DATE_REQUIRED');
        sendJson(response, 200, { rooms: await listRooms(db, { date, userId }) });
        return;
      }
      if (request.method === 'GET' && availabilityMatch) {
        const date = url.searchParams.get('date');
        if (!date) throw new ApiError(400, 'Thiếu ngày cần kiểm tra.', 'DATE_REQUIRED');
        const duration = Number(url.searchParams.get('duration') ?? 1);
        sendJson(
          response,
          200,
          await getAvailability(db, {
            userId,
            roomId: decodeURIComponent(availabilityMatch[1]),
            date,
            duration,
          }),
        );
        return;
      }
      if (request.method === 'GET' && roomMatch) {
        sendJson(response, 200, { room: await getRoom(db, decodeURIComponent(roomMatch[1])) });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/bookings') {
        sendJson(response, 200, { bookings: await listBookings(db, userId) });
        return;
      }
      if (request.method === 'GET' && bookingMatch) {
        sendJson(response, 200, {
          booking: await findBooking(db, decodeURIComponent(bookingMatch[1]), userId),
        });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/bookings') {
        const input = await readJson(request);
        sendJson(response, 201, { booking: await createBooking(db, { ...input, userId }) });
        return;
      }
      if (request.method === 'PATCH' && cancelMatch) {
        sendJson(response, 200, {
          booking: await cancelBooking(db, decodeURIComponent(cancelMatch[1]), userId),
        });
        return;
      }
      throw new ApiError(404, 'Endpoint không tồn tại.', 'NOT_FOUND');
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      const message =
        error instanceof ApiError ? error.message : 'Backend gặp lỗi. Vui lòng thử lại.';
      const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
      if (status === 500) console.error(error);
      sendJson(response, status, { error: { code, message } });
    }
  };
}

export async function startServer({ supabaseUrl, supabaseKey, host = '127.0.0.1', port = 0 }) {
  const db = openDatabase({ url: supabaseUrl, key: supabaseKey });
  await healthCheck(db);
  const server = createServer(handler(db));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return {
    db,
    server,
    origin: `http://${host}:${actualPort}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
        server.closeAllConnections?.();
      }),
  };
}
