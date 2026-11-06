import { io, Socket } from 'socket.io-client';
import type { Song } from '../data/mockSongs';

export interface RoomUserInfo {
  socketId: string;
  name: string;
  isHost: boolean;
}

export interface RoomData {
  code: string;
  hostName: string;
  autoPlayNext: boolean;
  currentSong: Song | null;
  queue: Song[];
  userCount: number;
  users: RoomUserInfo[];
}

let socket: Socket | null = null;

// Lấy hoặc tự sinh userToken bí mật lưu trên localStorage của trình duyệt
// Token này giúp chứng minh danh tính khi tải lại trang (F5) hoặc kết nối lại
export function getUserToken(): string {
  const key = 'hat_cung_nhau_user_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(key, token);
  }
  return token;
}

export function getSocket(): Socket {
  if (!socket) {
    // Đọc URL server từ biến môi trường Vite (nếu triển khai frontend riêng biệt)
    // Nếu deploy chung server duy nhất, URL mặc định rỗng '' sẽ trỏ vào chính domain hiện tại
    const serverUrl = import.meta.env.VITE_SERVER_URL || '';

    socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
  }
  return socket;
}
