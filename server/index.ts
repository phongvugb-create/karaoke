import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import express from 'express';
import type { Request, Response } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. Cấu hình CORS
const allowedOriginsStr = process.env.CORS_ORIGINS || '';
const allowedOrigins = allowedOriginsStr
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '200kb' }));

// Tạo HTTP server và gắn Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

// Hàm làm sạch chuỗi đầu vào
function sanitizeString(str: unknown, maxLen = 100): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"\\;]/g, '').trim().slice(0, maxLen);
}

// Hàm lấy địa chỉ IP LAN Wi-Fi cục bộ để điện thoại cùng Wi-Fi quét mã QR vào thẳng
function getLocalIpAddress(): string {
  const ifaces = os.networkInterfaces();
  let wifiIp = '';
  let fallbackIp = '127.0.0.1';

  for (const name of Object.keys(ifaces)) {
    const list = ifaces[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) {
        // Ưu tiên card Wi-Fi hoặc Ethernet thật
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') || name.toLowerCase().includes('eth') || name.toLowerCase().includes('en0')) {
          return net.address;
        }
        if (!name.toLowerCase().includes('vmware') && !name.toLowerCase().includes('virtual') && !name.toLowerCase().includes('vbox')) {
          wifiIp = net.address;
        } else if (!wifiIp) {
          fallbackIp = net.address;
        }
      }
    }
  }
  return wifiIp || fallbackIp;
}

// 2. Phục vụ Static Files Frontend nếu chạy chế độ Production Single-Server
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ==========================================
// CƠ CHẾ PHÒNG HÁT REALTIME (SOCKET.IO)
// ==========================================
interface RoomSong {
  id: string;
  title: string;
  artist?: string;
  channelTitle?: string;
  thumbnail: string;
  duration?: string;
  isYouTube?: boolean;
  genre?: string;
  requestedBy?: string;
  addedAt?: number;
}

interface RoomUser {
  socketId: string;
  name: string;
  isHost: boolean;
  isTv?: boolean;
}

interface RoomState {
  code: string;
  hostName: string;
  autoPlayNext: boolean;
  currentSong: RoomSong | null;
  queue: RoomSong[];
  users: RoomUser[];
  history: RoomSong[];
  lastActive: number;
}

const rooms = new Map<string, RoomState>();

// Hàm tạo mã phòng 4 ký tự dễ đọc
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

io.on('connection', (socket: Socket) => {
  let currentRoomCode: string | null = null;

  // 1. Tạo phòng mới (Từ TV hoặc Laptop)
  socket.on('create_room', (data: { hostName: string; isTv?: boolean }, callback) => {
    const code = generateRoomCode();
    const hostName = sanitizeString(data?.hostName || 'Chủ phòng', 30);
    const isTv = !!data?.isTv;

    const newRoom: RoomState = {
      code,
      hostName,
      autoPlayNext: true,
      currentSong: null,
      queue: [],
      users: [{
        socketId: socket.id,
        name: hostName,
        isHost: true,
        isTv
      }],
      history: [],
      lastActive: Date.now()
    };

    rooms.set(code, newRoom);
    socket.join(code);
    currentRoomCode = code;

    console.log(`[Socket] Tạo phòng mới: ${code} bởi "${hostName}" (isTv: ${isTv})`);

    if (typeof callback === 'function') {
      callback({
        success: true,
        room: {
          code: newRoom.code,
          hostName: newRoom.hostName,
          autoPlayNext: newRoom.autoPlayNext,
          currentSong: newRoom.currentSong,
          queue: newRoom.queue,
          userCount: newRoom.users.length,
          users: newRoom.users
        },
        isHost: true
      });
    }
  });

  // 2. Tham gia phòng (Từ Điện thoại hoặc Laptop chọn bài)
  socket.on('join_room', (data: { code: string; userName: string; isTv?: boolean }, callback) => {
    const code = sanitizeString(data?.code || '', 8).toUpperCase();
    const userName = sanitizeString(data?.userName || 'Khách chọn bài', 30);
    const isTv = !!data?.isTv;

    const room = rooms.get(code);
    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Phòng không tồn tại hoặc đã hết hạn.' });
      }
      return;
    }

    room.lastActive = Date.now();
    currentRoomCode = code;
    socket.join(code);

    // Kiểm tra xem socket đã có trong danh sách chưa
    const existingIndex = room.users.findIndex(u => u.socketId === socket.id);
    if (existingIndex >= 0) {
      room.users[existingIndex].name = userName;
      if (isTv) room.users[existingIndex].isTv = true;
    } else {
      room.users.push({
        socketId: socket.id,
        name: userName,
        isHost: room.users.length === 0,
        isTv
      });
    }

    console.log(`[Socket] "${userName}" tham gia phòng: ${code}`);

    // Báo cho tất cả người trong phòng danh sách thành viên mới
    io.to(code).emit('room_users_updated', {
      userCount: room.users.length,
      users: room.users
    });

    if (typeof callback === 'function') {
      callback({
        success: true,
        room: {
          code: room.code,
          hostName: room.hostName,
          autoPlayNext: room.autoPlayNext,
          currentSong: room.currentSong,
          queue: room.queue,
          userCount: room.users.length,
          users: room.users
        },
        isHost: room.users.find(u => u.socketId === socket.id)?.isHost || false
      });
    }
  });

  // 3. Thêm bài hát vào hàng chờ (Từ Điện thoại hoặc Laptop)
  socket.on('add_to_queue', (data: { code: string; song: RoomSong; requestedBy?: string; priority?: boolean }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room || !data?.song?.id) return;

    room.lastActive = Date.now();
    const isAlready = room.queue.some(s => s.id === data.song.id);
    if (isAlready) {
      socket.emit('queue_action_error', { message: `Bài "${data.song.title}" đã có trong hàng chờ rồi nhé!` });
      return;
    }

    const songWithMeta: RoomSong = {
      ...data.song,
      requestedBy: sanitizeString(data.requestedBy || 'Ai đó', 30),
      addedAt: Date.now()
    };

    if (data.priority) {
      room.queue.unshift(songWithMeta);
    } else {
      room.queue.push(songWithMeta);
    }

    console.log(`[Room ${code}] Thêm bài: "${songWithMeta.title}" bởi ${songWithMeta.requestedBy}`);

    // Nếu TV chưa có bài nào đang phát, tự động phát bài này luôn
    let autoStarted = false;
    if (!room.currentSong) {
      room.currentSong = room.queue.shift() || null;
      autoStarted = true;
      io.to(code).emit('current_song_changed', { currentSong: room.currentSong });
    }

    // Gửi cập nhật hàng chờ đến tất cả thiết bị trong phòng (bao gồm TV và các điện thoại)
    io.to(code).emit('queue_updated', {
      queue: room.queue,
      addedSong: songWithMeta,
      autoStarted
    });
  });

  // 4. Chọn phát bài ngay lập tức
  socket.on('play_song', (data: { code: string; song: RoomSong }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room || !data?.song?.id) return;

    room.lastActive = Date.now();
    if (room.currentSong) {
      room.history.unshift(room.currentSong);
    }
    room.currentSong = data.song;
    room.queue = room.queue.filter(s => s.id !== data.song.id);

    io.to(code).emit('current_song_changed', { currentSong: room.currentSong });
    io.to(code).emit('queue_updated', { queue: room.queue });
  });

  // 5. Chuyển sang bài tiếp theo (Khi hát xong hoặc bấm Next)
  socket.on('next_song', (data: { code: string }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.lastActive = Date.now();
    if (room.queue.length > 0) {
      if (room.currentSong) {
        room.history.unshift(room.currentSong);
      }
      room.currentSong = room.queue.shift() || null;
      io.to(code).emit('current_song_changed', { currentSong: room.currentSong });
      io.to(code).emit('queue_updated', { queue: room.queue });
    } else {
      // Hết bài trong hàng chờ
      if (room.currentSong) {
        room.history.unshift(room.currentSong);
      }
      room.currentSong = null;
      io.to(code).emit('current_song_changed', { currentSong: null });
      io.to(code).emit('queue_updated', { queue: [] });
    }
  });

  // 6. Xóa bài khỏi hàng chờ
  socket.on('remove_from_queue', (data: { code: string; songId: string }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room || !data?.songId) return;

    room.lastActive = Date.now();
    const removedSong = room.queue.find(s => s.id === data.songId);
    room.queue = room.queue.filter(s => s.id !== data.songId);

    io.to(code).emit('queue_updated', {
      queue: room.queue,
      removedSong
    });
  });

  // 7. Sắp xếp lại thứ tự hàng chờ (Kéo thả)
  socket.on('reorder_queue', (data: { code: string; videoIds: string[] }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room || !Array.isArray(data?.videoIds)) return;

    room.lastActive = Date.now();
    const songMap = new Map(room.queue.map(s => [s.id, s]));
    const newQueue: RoomSong[] = [];

    for (const vid of data.videoIds) {
      const song = songMap.get(vid);
      if (song) {
        newQueue.push(song);
        songMap.delete(vid);
      }
    }
    // Giữ các bài chưa có trong list id
    for (const remaining of songMap.values()) {
      newQueue.push(remaining);
    }

    room.queue = newQueue;
    io.to(code).emit('queue_updated', { queue: room.queue });
  });

  // 8. Xóa toàn bộ hàng chờ
  socket.on('clear_queue', (data: { code: string }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.lastActive = Date.now();
    room.queue = [];
    io.to(code).emit('queue_updated', { queue: [] });
  });

  // 9. Bật/tắt tự chuyển bài (Autoplay Next)
  socket.on('toggle_autoplay', (data: { code: string; autoPlayNext: boolean }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    room.autoPlayNext = !!data.autoPlayNext;
    io.to(code).emit('autoplay_updated', { autoPlayNext: room.autoPlayNext });
  });

  // 10. Đồng bộ tiến độ phát từ TV đến Điện thoại/Laptop
  socket.on('sync_playback_state', (data: { code: string; isPlaying: boolean; currentTime: number; duration: number }) => {
    const code = sanitizeString(data?.code || currentRoomCode || '', 8).toUpperCase();
    if (!code) return;
    // Broadcast cho các thiết bị khác trong phòng để hiển thị tiến độ
    socket.to(code).emit('playback_state_synced', {
      isPlaying: !!data.isPlaying,
      currentTime: data.currentTime || 0,
      duration: data.duration || 0
    });
  });

  // Rời phòng hoặc mất kết nối
  socket.on('disconnect', () => {
    if (currentRoomCode) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.users = room.users.filter(u => u.socketId !== socket.id);
        io.to(currentRoomCode).emit('room_users_updated', {
          userCount: room.users.length,
          users: room.users
        });
        if (room.users.length === 0) {
          room.lastActive = Date.now();
        }
      }
    }
  });
});

// Định kỳ dọn phòng không còn ai sau 3 giờ
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.users.length === 0 && now - room.lastActive > 3 * 3600 * 1000) {
      rooms.delete(code);
      console.log(`[Cleaner] Đã dọn phòng rỗng: ${code}`);
    }
  }
}, 30 * 60 * 1000);

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Endpoint cung cấp thông tin IP LAN máy tính để tạo QR Code mở trên điện thoại
app.get('/api/server-info', (_req: Request, res: Response): void => {
  const localIp = getLocalIpAddress();
  res.json({
    localIp,
    port: PORT,
    clientPort: 5173, // Port mặc định của Vite dev
    fullUrl: `http://${localIp}:${NODE_ENV === 'production' ? PORT : 5173}`
  });
});

// Endpoint proxy tìm kiếm YouTube Data API v3 (Bảo vệ API key an toàn ở server)
app.get('/api/youtube/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = sanitizeString(req.query.q as string || '', 100);
    const maxResults = Math.min(Math.max(parseInt(req.query.maxResults as string) || 12, 1), 25);
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_actual_youtube_api_key_here') {
      res.status(400).json({
        error: 'MISSING_API_KEY',
        message: 'Chưa cấu hình YOUTUBE_API_KEY trong file .env trên server.'
      });
      return;
    }

    if (!query || query.length < 2) {
      res.json({ items: [] });
      return;
    }

    const searchQuery = query.toLowerCase().includes('karaoke') ? query : `${query} karaoke`;

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('maxResults', maxResults.toString());
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      const errorObj = data?.error;
      const firstError = errorObj?.errors?.[0];
      const reason = firstError?.reason || '';

      if (response.status === 403 && (reason === 'quotaExceeded' || reason === 'rateLimitExceeded' || reason === 'dailyLimitExceeded')) {
        res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'Tài khoản YouTube API đã hết hạn ngạch truy vấn (10,000 units/ngày) từ Google Cloud.'
        });
        return;
      }

      if (response.status === 400 && (reason === 'keyInvalid' || reason === 'badRequest')) {
        res.status(400).json({
          error: 'INVALID_API_KEY',
          message: 'API Key YouTube không hợp lệ hoặc chưa kích hoạt YouTube Data API v3.'
        });
        return;
      }

      if (response.status === 403) {
        res.status(403).json({
          error: 'API_FORBIDDEN',
          message: errorObj?.message || 'YouTube Data API từ chối quyền truy cập (Kiểm tra hạn chế API Key hoặc IP).'
        });
        return;
      }

      res.status(response.status).json({
        error: 'YOUTUBE_API_ERROR',
        message: errorObj?.message || 'Lỗi khi gọi tới YouTube Data API.'
      });
      return;
    }

    const items = (data.items || [])
      .filter((item: any) => item.id && item.id.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.high?.url || 
                   item.snippet.thumbnails?.medium?.url || 
                   item.snippet.thumbnails?.default?.url || '',
        publishTime: item.snippet.publishTime
      }));

    res.json({
      items,
      totalResults: data.pageInfo?.totalResults || items.length
    });
  } catch (err) {
    console.error('Server YouTube search error:', err);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Lỗi máy chủ nội bộ hoặc lỗi mạng khi kết nối tới YouTube API.'
    });
  }
});

// Endpoint kiểm tra phòng có tồn tại không
app.get('/api/rooms/:code', (req: Request, res: Response): void => {
  const code = sanitizeString(req.params.code, 8).toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' });
    return;
  }
  res.json({
    code: room.code,
    hostName: room.hostName,
    currentSong: room.currentSong,
    queueCount: room.queue.length,
    userCount: room.users.length
  });
});

// Endpoint kiểm tra trạng thái máy chủ
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    mode: NODE_ENV,
    roomsCount: rooms.size,
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY !== 'your_actual_youtube_api_key_here'
  });
});

// Endpoint SPA Fallback cho client-side routing trong Production
if (fs.existsSync(distPath)) {
  app.use((req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  const localIp = getLocalIpAddress();
  console.log(`[Karaoke Server] Running on http://localhost:${PORT} (Node: ${NODE_ENV})`);
  console.log(`[Karaoke Server] LAN IP for Mobile/TV: http://${localIp}:${PORT}`);
});
