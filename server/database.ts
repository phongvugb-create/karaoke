import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Đảm bảo thư mục lưu dữ liệu tồn tại
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'karaoke.db');
const db = new Database(dbPath);

// Bật WAL mode (Write-Ahead Logging) cho hiệu năng đọc/ghi đồng thời cực cao
db.pragma('journal_mode = WAL');

// Khởi tạo bảng dữ liệu nếu chưa tồn tại
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    code TEXT PRIMARY KEY,
    host_token TEXT NOT NULL,
    host_name TEXT NOT NULL,
    auto_play_next INTEGER DEFAULT 1,
    current_song TEXT,
    created_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS room_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    thumbnail TEXT,
    duration TEXT,
    genre TEXT,
    requested_by TEXT,
    user_token TEXT,
    sort_order INTEGER NOT NULL,
    added_at INTEGER NOT NULL,
    FOREIGN KEY(room_code) REFERENCES rooms(code) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_room_queue_order ON room_queue(room_code, sort_order);
  CREATE INDEX IF NOT EXISTS idx_rooms_last_active ON rooms(last_active);
`);

export interface DbSongItem {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  genre?: string;
  requestedBy?: string;
  userToken?: string;
}

export interface DbRoomState {
  code: string;
  hostToken: string;
  hostName: string;
  autoPlayNext: boolean;
  currentSong: DbSongItem | null;
  createdAt: number;
  lastActive: number;
  queue: DbSongItem[];
}

// 1. Tạo phòng mới
export function createDbRoom(code: string, hostToken: string, hostName: string): DbRoomState {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO rooms (code, host_token, host_name, auto_play_next, current_song, created_at, last_active)
    VALUES (?, ?, ?, 1, NULL, ?, ?)
  `);
  stmt.run(code, hostToken, hostName, now, now);

  return {
    code,
    hostToken,
    hostName,
    autoPlayNext: true,
    currentSong: null,
    createdAt: now,
    lastActive: now,
    queue: []
  };
}

// 2. Lấy thông tin phòng và hàng chờ
export function getDbRoom(code: string): DbRoomState | null {
  const roomRow = db.prepare(`SELECT * FROM rooms WHERE code = ?`).get(code) as any;
  if (!roomRow) return null;

  const queueRows = db.prepare(`
    SELECT video_id, title, artist, thumbnail, duration, genre, requested_by, user_token
    FROM room_queue
    WHERE room_code = ?
    ORDER BY sort_order ASC, id ASC
  `).all(code) as any[];

  const queue: DbSongItem[] = queueRows.map(row => ({
    id: row.video_id,
    title: row.title,
    artist: row.artist,
    thumbnail: row.thumbnail || '',
    duration: row.duration || undefined,
    genre: row.genre || undefined,
    requestedBy: row.requested_by || undefined,
    userToken: row.user_token || undefined
  }));

  let currentSong: DbSongItem | null = null;
  if (roomRow.current_song) {
    try {
      currentSong = JSON.parse(roomRow.current_song);
    } catch {}
  }

  return {
    code: roomRow.code,
    hostToken: roomRow.host_token,
    hostName: roomRow.host_name,
    autoPlayNext: !!roomRow.auto_play_next,
    currentSong,
    createdAt: roomRow.created_at,
    lastActive: roomRow.last_active,
    queue
  };
}

// 3. Cập nhật thời gian hoạt động của phòng
export function touchDbRoom(code: string): void {
  db.prepare(`UPDATE rooms SET last_active = ? WHERE code = ?`).run(Date.now(), code);
}

// 4. Cập nhật bài đang phát (Chỉ host)
export function updateDbCurrentSong(code: string, song: DbSongItem | null): void {
  const now = Date.now();
  db.prepare(`
    UPDATE rooms 
    SET current_song = ?, last_active = ? 
    WHERE code = ?
  `).run(song ? JSON.stringify(song) : null, now, code);
}

// 5. Cập nhật cài đặt autoPlayNext (Chỉ host)
export function updateDbAutoPlay(code: string, autoPlayNext: boolean): void {
  const now = Date.now();
  db.prepare(`
    UPDATE rooms 
    SET auto_play_next = ?, last_active = ? 
    WHERE code = ?
  `).run(autoPlayNext ? 1 : 0, now, code);
}

// 6. Cập nhật chủ phòng mới (Chuyển quyền an toàn khi host cũ rời)
export function updateDbHost(code: string, newHostToken: string, newHostName: string): void {
  const now = Date.now();
  db.prepare(`
    UPDATE rooms 
    SET host_token = ?, host_name = ?, last_active = ? 
    WHERE code = ?
  `).run(newHostToken, newHostName, now, code);
}

// 7. Thêm bài hát vào hàng chờ
export function addSongToDbQueue(code: string, song: DbSongItem): boolean {
  // Kiểm tra trùng video_id trong phòng
  const exists = db.prepare(`SELECT 1 FROM room_queue WHERE room_code = ? AND video_id = ?`).get(code, song.id);
  if (exists) return false;

  // Lấy sort_order cao nhất hiện tại
  const maxOrderRow = db.prepare(`SELECT MAX(sort_order) as max_order FROM room_queue WHERE room_code = ?`).get(code) as any;
  const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

  const now = Date.now();
  db.prepare(`
    INSERT INTO room_queue (room_code, video_id, title, artist, thumbnail, duration, genre, requested_by, user_token, sort_order, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code,
    song.id,
    song.title,
    song.artist,
    song.thumbnail,
    song.duration || null,
    song.genre || null,
    song.requestedBy || null,
    song.userToken || null,
    nextOrder,
    now
  );

  touchDbRoom(code);
  return true;
}

// 8. Xóa bài hát khỏi hàng chờ
export function removeSongFromDbQueue(code: string, videoId: string): void {
  db.prepare(`DELETE FROM room_queue WHERE room_code = ? AND video_id = ?`).run(code, videoId);
  touchDbRoom(code);
}

// 9. Cập nhật thứ tự toàn bộ hàng chờ
export function reorderDbQueue(code: string, videoIds: string[]): void {
  const updateStmt = db.prepare(`UPDATE room_queue SET sort_order = ? WHERE room_code = ? AND video_id = ?`);
  const tx = db.transaction(() => {
    videoIds.forEach((vid, idx) => {
      updateStmt.run(idx, code, vid);
    });
  });
  tx();
  touchDbRoom(code);
}

// 10. Xóa sạch hàng chờ của phòng
export function clearDbQueue(code: string): void {
  db.prepare(`DELETE FROM room_queue WHERE room_code = ?`).run(code);
  touchDbRoom(code);
}

// 11. Xóa phòng
export function deleteDbRoom(code: string): void {
  db.prepare(`DELETE FROM room_queue WHERE room_code = ?`).run(code);
  db.prepare(`DELETE FROM rooms WHERE code = ?`).run(code);
}

// 12. Dọn dẹp phòng hết hạn (Mặc định không hoạt động sau 6 tiếng)
export function cleanupExpiredRooms(maxInactiveMs: number = 6 * 60 * 60 * 1000): number {
  const expireThreshold = Date.now() - maxInactiveMs;
  const expiredRooms = db.prepare(`SELECT code FROM rooms WHERE last_active < ?`).all(expireThreshold) as any[];

  if (expiredRooms.length > 0) {
    const deleteQueue = db.prepare(`DELETE FROM room_queue WHERE room_code = ?`);
    const deleteRoom = db.prepare(`DELETE FROM rooms WHERE code = ?`);

    const tx = db.transaction(() => {
      for (const r of expiredRooms) {
        deleteQueue.run(r.code);
        deleteRoom.run(r.code);
      }
    });
    tx();
  }

  return expiredRooms.length;
}

export default db;

