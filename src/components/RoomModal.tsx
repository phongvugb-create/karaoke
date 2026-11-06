import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Users, 
  LogOut, 
  Share2, 
  Crown,
  Smartphone,
  Tv,
  ExternalLink
} from 'lucide-react';
import type { RoomUserInfo } from '../services/socketService';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  isHost: boolean;
  users: RoomUserInfo[];
  onCreateRoom: (hostName: string) => void;
  onJoinRoom: (code: string, userName: string) => void;
  onLeaveRoom: () => void;
  userName: string;
  setUserName: (name: string) => void;
  onOpenTvMode?: () => void;
  onOpenPopoutTv?: () => void;
  joinUrl?: string;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  users,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  userName,
  setUserName,
  onOpenTvMode,
  onOpenPopoutTv,
  joinUrl: customJoinUrl
}) => {
  const [inputCode, setInputCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinTab, setJoinTab] = useState<'create' | 'join'>('create');

  const joinUrl = customJoinUrl || (roomCode ? `${window.location.origin}/?room=${roomCode}` : '');

  // Tạo mã QR Code khi có roomCode
  useEffect(() => {
    if (roomCode && joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Lỗi sinh QR code:', err));
    }
  }, [roomCode, joinUrl]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(userName);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onJoinRoom(inputCode.trim().toUpperCase(), userName);
  };

  return (
    <div className="room-modal-backdrop" onClick={onClose}>
      <div className="room-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button onClick={onClose} className="btn-close-modal" title="Đóng">
          <X className="w-5 h-5" />
        </button>

        {/* NẾU ĐÃ Ở TRONG PHÒNG */}
        {roomCode ? (
          <div className="room-active-view">
            <div className="room-header-badge">
              <span className="room-status-dot" />
              <span>Đang kết nối Phòng Hát Realtime</span>
            </div>

            <div className="room-code-display">
              <span className="code-label">MÃ PHÒNG:</span>
              <h2 className="code-value">{roomCode}</h2>
              <button 
                onClick={handleCopyCode} 
                className="btn-copy-chip"
                title="Sao chép mã phòng"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Đã sao chép' : 'Sao chép mã'}</span>
              </button>
            </div>

            {/* Cụm Thao Tác Chuyên Dụng Cho Màn Hình TV */}
            <div className="tv-mode-shortcuts-box">
              <h3 className="shortcut-title">📺 Dành cho màn hình TV:</h3>
              <div className="shortcut-buttons-grid">
                {onOpenTvMode && (
                  <button 
                    type="button" 
                    onClick={() => {
                      onOpenTvMode();
                      onClose();
                    }}
                    className="btn-tv-fullscreen"
                    title="Phóng to toàn màn hình TV này để mọi người nhìn vào hát"
                  >
                    <Tv className="w-4 h-4 text-red-400" />
                    <span>Màn hình TV (Toàn màn hình)</span>
                  </button>
                )}

                {onOpenPopoutTv && (
                  <button 
                    type="button" 
                    onClick={() => {
                      onOpenPopoutTv();
                      onClose();
                    }}
                    className="btn-tv-popout"
                    title="Mở cửa sổ phát riêng kéo sang màn hình TV phụ cắm dây HDMI"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>Tách cửa sổ phát sang TV (HDMI)</span>
                  </button>
                )}
              </div>
            </div>

            {/* QR Code cho điện thoại */}
            <div className="qr-box-wrapper">
              <div className="qr-image-frame">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR tham gia phòng ${roomCode}`} className="qr-image" />
                ) : (
                  <div className="qr-loading">Đang tạo mã QR...</div>
                )}
              </div>
              <p className="qr-hint">
                <Smartphone className="w-4 h-4 inline mr-1 text-red-400" />
                Dùng điện thoại quét mã QR hoặc mở link để chọn bài ngay:
              </p>
              <div className="qr-url-text">{joinUrl}</div>

              <button onClick={handleCopyLink} className="btn-copy-link">
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã sao chép liên kết phòng!' : 'Sao chép đường dẫn gửi cho bạn bè'}</span>
              </button>
            </div>

            {/* Danh sách người tham gia */}
            <div className="room-users-section">
              <div className="users-title">
                <Users className="w-4 h-4 text-red-400" />
                <span>Thiết bị trong phòng ({users.length})</span>
              </div>
              <div className="users-list-tags">
                {users.map((u) => (
                  <span key={u.socketId} className={`user-pill ${u.isHost ? 'host-pill' : ''}`}>
                    {u.isHost && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{u.name}</span>
                    {u.isHost && <span className="host-tag">(Chủ phòng)</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Nút Rời phòng */}
            <div className="modal-footer-actions">
              <button onClick={onLeaveRoom} className="btn-leave-room">
                <LogOut className="w-4 h-4" />
                <span>Rời phòng</span>
              </button>
            </div>
          </div>
        ) : (
          /* NẾU CHƯA CÓ PHÒNG: TẠO HOẶC NHẬP MÃ */
          <div className="room-join-view">
            <h2 className="modal-title">Phòng Karaoke Đồng Bộ TV & Điện Thoại</h2>
            <p className="modal-subtitle">
              Màn hình TV phát video toàn màn hình, còn Điện thoại và Laptop khác dùng để chọn bài vào hàng đợi!
            </p>

            <div className="name-input-group">
              <label htmlFor="user-nickname-input" className="input-label">Tên thiết bị / Biệt danh của bạn:</label>
              <input 
                id="user-nickname-input"
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ví dụ: Tivi Phòng Khách, Điện thoại của Nam..."
                className="modal-text-input"
                maxLength={25}
              />
            </div>

            <div className="tab-switch-buttons">
              <button 
                type="button"
                className={`tab-btn ${joinTab === 'create' ? 'active' : ''}`}
                onClick={() => setJoinTab('create')}
              >
                <Tv className="w-4 h-4" />
                <span>Tạo phòng phát TV</span>
              </button>
              <button 
                type="button"
                className={`tab-btn ${joinTab === 'join' ? 'active' : ''}`}
                onClick={() => setJoinTab('join')}
              >
                <Smartphone className="w-4 h-4" />
                <span>Nhập mã chọn bài</span>
              </button>
            </div>

            {joinTab === 'create' ? (
              <form onSubmit={handleCreate} className="create-tab-form">
                <p className="tab-desc">
                  Thiết bị này sẽ làm <strong>Màn hình phát chính (TV)</strong>: video sẽ phát toàn màn hình để mọi người cùng hát. Bạn bè dùng Điện thoại và Laptop quét mã QR để thêm bài vào hàng chờ!
                </p>
                <button type="submit" className="btn-primary-action">
                  <span>Khởi Tạo Phòng TV Ngay</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="join-tab-form">
                <p className="tab-desc">
                  Nhập mã phòng hiển thị trên màn hình TV để biến Điện thoại hoặc Laptop này thành <strong>Remote chọn bài</strong>:
                </p>
                <input 
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="MÃ PHÒNG (Ví dụ: KARA)..."
                  className="modal-code-input"
                  maxLength={6}
                  required
                />
                <button type="submit" className="btn-primary-action">
                  <span>Kết Nối Đến TV</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <style>{`
        .room-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: modalFadeIn 0.25s ease-out;
        }

        .room-modal-card {
          background: #18181b;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 2rem;
          max-width: 520px;
          width: 100%;
          position: relative;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
          max-height: 90vh;
          overflow-y: auto;
          color: white;
        }

        .btn-close-modal {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .btn-close-modal:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .modal-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.35rem;
        }

        .modal-subtitle {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.45;
          margin-bottom: 1.25rem;
        }

        .name-input-group {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .input-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #cbd5e1;
        }

        .modal-text-input {
          background: #27272a;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.95rem;
          outline: none;
        }

        .modal-text-input:focus {
          border-color: #ef4444;
        }

        .tab-switch-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          background: #27272a;
          padding: 0.35rem;
          border-radius: 14px;
          margin-bottom: 1.25rem;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.65rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tab-btn.active {
          background: var(--accent-red);
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        .tab-desc {
          font-size: 0.9rem;
          color: #cbd5e1;
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .modal-code-input {
          width: 100%;
          background: #27272a;
          border: 2px dashed rgba(239, 68, 68, 0.4);
          border-radius: 14px;
          padding: 0.85rem;
          text-align: center;
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 0.2em;
          color: #ef4444;
          margin-bottom: 1.25rem;
          outline: none;
          text-transform: uppercase;
        }

        .btn-primary-action {
          width: 100%;
          background: var(--accent-red);
          color: white;
          padding: 0.85rem;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
          transition: transform 0.15s, background-color 0.15s;
        }

        .btn-primary-action:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        /* Active Room View */
        .room-active-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .room-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.3rem 0.85rem;
          border-radius: 9999px;
          margin-bottom: 1rem;
        }

        .room-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .room-code-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #27272a;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.65rem 1.25rem;
          border-radius: 16px;
          margin-bottom: 1.25rem;
        }

        .code-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .code-value {
          font-size: 1.75rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #ef4444;
          margin: 0;
        }

        .btn-copy-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* TV Shortcuts */
        .tv-mode-shortcuts-box {
          width: 100%;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.25rem;
          text-align: left;
        }

        .shortcut-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fca5a5;
          margin-bottom: 0.6rem;
        }

        .shortcut-buttons-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .btn-tv-fullscreen {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--accent-red);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .btn-tv-fullscreen:hover {
          background: #dc2626;
        }

        .btn-tv-popout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.65rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
        }

        .btn-tv-popout:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        /* QR Box */
        .qr-box-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          background: #27272a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .qr-image-frame {
          background: white;
          padding: 0.65rem;
          border-radius: 14px;
          margin-bottom: 0.75rem;
        }

        .qr-image {
          width: 180px;
          height: 180px;
          display: block;
        }

        .qr-hint {
          font-size: 0.88rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 0.25rem;
        }

        .qr-url-text {
          font-size: 0.82rem;
          color: #93c5fd;
          font-family: monospace;
          margin-bottom: 0.75rem;
          word-break: break-all;
        }

        .btn-copy-link {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-copy-link:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        /* Users */
        .room-users-section {
          width: 100%;
          text-align: left;
          margin-bottom: 1.25rem;
        }

        .users-title {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #cbd5e1;
          margin-bottom: 0.5rem;
        }

        .users-list-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .user-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0.25rem 0.65rem;
          border-radius: 8px;
          font-size: 0.8rem;
          color: #f1f5f9;
        }

        .user-pill.host-pill {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.1);
        }

        .host-tag {
          color: #f59e0b;
          font-size: 0.72rem;
        }

        .modal-footer-actions {
          width: 100%;
        }

        .btn-leave-room {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 0.65rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-leave-room:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
