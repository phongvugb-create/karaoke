import React from 'react';
import { Menu, Search, X, Mic2, ListMusic, Sparkles, Loader2, Play, Tv } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
  isLoading: boolean;
  queueCount: number;
  onOpenQueue: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onGoHome: () => void;
  isPlayingNow?: boolean;
  currentSongTitle?: string;
  onOpenWatchPage?: () => void;
  roomCode?: string | null;
  onOpenRoomModal?: () => void;
  onOpenTvMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  isLoading,
  queueCount,
  onOpenQueue,
  isDemoMode,
  onToggleDemoMode,
  onGoHome,
  isPlayingNow = false,
  currentSongTitle,
  onOpenWatchPage,
  roomCode,
  onOpenRoomModal,
  onOpenTvMode
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <header className="yt-header">
      {/* Hàng 1 (Desktop: nằm chung hàng, Mobile: hàng trên) */}
      <div className="header-primary-row">
        {/* Cụm Trái: Menu & Logo nhận diện thương hiệu */}
        <div className="header-left">
          <button 
            type="button"
            onClick={onToggleSidebar}
            className="btn-icon-round"
            title="Menu điều hướng"
            aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
          >
            <Menu className="w-5 h-5 text-gray-200" />
          </button>

          <div className="brand-logo" onClick={onGoHome} title="Về trang chủ Hát Cùng Nhau">
            <div className="brand-icon-box">
              <Mic2 className="brand-mic-icon" />
            </div>
            <div className="brand-text-stack">
              <span className="brand-main-title">Hát Cùng Nhau</span>
              <span className="brand-tag">KARAOKE</span>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm trên Desktop (Ẩn trên mobile vì chuyển xuống hàng 2) */}
        <div className="header-center desktop-only">
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-box-container">
              <input 
                type="text" 
                className="search-text-input"
                placeholder="Tìm tên bài hát, ca sĩ..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Tìm kiếm video karaoke"
              />
              {isLoading && (
                <div className="search-spinner-box">
                  <Loader2 className="spinner-icon animate-spin" />
                </div>
              )}
              {searchQuery && !isLoading && (
                <button 
                  type="button" 
                  onClick={onClearSearch}
                  className="btn-clear-query"
                  title="Xóa tìm kiếm"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-search-submit"
              title="Tìm kiếm"
              aria-label="Nút tìm kiếm"
            >
              <Search className="w-5 h-5 text-gray-200" />
            </button>
          </form>
        </div>

        {/* Cụm Phải: Các thao tác phụ */}
        <div className="header-right">
          {/* Nút quay lại màn hình phát nếu đang có bài chạy */}
          {isPlayingNow && onOpenWatchPage && (
            <button 
              type="button"
              onClick={onOpenWatchPage}
              className="btn-now-playing-pill"
              title={`Đang phát: ${currentSongTitle || 'Bài hát'}`}
            >
              <span className="live-playing-dot" />
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="now-playing-pill-text">Xem Player</span>
            </button>
          )}

          {/* Nút Kết Nối TV / Quản lý phòng */}
          {onOpenRoomModal && (
            <button 
              type="button"
              onClick={onOpenRoomModal}
              className={`btn-tv-badge ${roomCode ? 'connected' : ''}`}
              title={roomCode ? `Phòng TV [${roomCode}] - Quét mã chọn bài` : 'Kết nối TV & Điện thoại chọn bài'}
            >
              <Tv className="w-4 h-4 text-red-400" />
              <span className="tv-badge-text">
                {roomCode ? `TV: ${roomCode}` : 'Kết nối TV'}
              </span>
              {roomCode && <span className="tv-dot-green" />}
            </button>
          )}

          {/* Nút Mở Màn Hình TV Toàn Màn Hình */}
          {roomCode && onOpenTvMode && (
            <button
              type="button"
              onClick={onOpenTvMode}
              className="btn-open-tv-quick desktop-only"
              title="Phóng to toàn màn hình TV này để hát"
            >
              <span>Màn hình TV</span>
            </button>
          )}

          {/* Nút xem hàng chờ */}
          <button 
            type="button" 
            onClick={onOpenQueue}
            className="btn-queue-badge"
            title="Xem hàng chờ bài hát"
          >
            <ListMusic className="w-4 h-4 text-gray-200" />
            <span className="queue-label">Hàng chờ</span>
            {queueCount > 0 && (
              <span className="queue-number-badge">{queueCount}</span>
            )}
          </button>

          {/* Nút bật/tắt demo mode */}
          <button 
            type="button"
            onClick={onToggleDemoMode}
            className={`btn-demo-chip ${isDemoMode ? 'active' : ''}`}
            title="Bật/Tắt bài hát mẫu"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="demo-chip-text">{isDemoMode ? 'Bài mẫu' : 'Mẫu'}</span>
          </button>
        </div>
      </div>

      {/* Hàng 2: Dành riêng cho Mobile - Chiếm trọn 100% chiều ngang */}
      <div className="header-mobile-search-row mobile-only">
        <form className="search-form mobile-search-form" onSubmit={handleSubmit}>
          <div className="search-box-container">
            <input 
              type="text" 
              className="search-text-input mobile-input"
              placeholder="Tìm tên bài hát, ca sĩ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Tìm kiếm video karaoke"
            />
            {isLoading && (
              <div className="search-spinner-box">
                <Loader2 className="spinner-icon animate-spin" />
              </div>
            )}
            {searchQuery && !isLoading && (
              <button 
                type="button" 
                onClick={onClearSearch}
                className="btn-clear-query"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-search-submit mobile-submit"
            title="Tìm kiếm"
            aria-label="Nút tìm kiếm"
          >
            <Search className="w-5 h-5 text-gray-200" />
          </button>
        </form>
      </div>

      <style>{`
        .yt-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .header-primary-row {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          gap: 0.75rem;
          width: 100%;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }

        .btn-icon-round {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
          color: var(--text-main);
        }

        .btn-icon-round:hover {
          background-color: var(--bg-hover);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .brand-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        .brand-mic-icon {
          width: 18px;
          height: 18px;
          color: #ffffff;
        }

        .brand-text-stack {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
        }

        .brand-main-title {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: var(--text-main);
          white-space: nowrap;
        }

        .brand-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.15);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .header-center {
          flex: 1;
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
        }

        .search-form {
          display: flex;
          width: 100%;
          height: 42px;
        }

        .search-box-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-medium);
          border-right: none;
          border-radius: 24px 0 0 24px;
          padding: 0 0.85rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-box-container:focus-within {
          border-color: var(--accent-red);
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
        }

        .search-text-input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 0.95rem;
          color: var(--text-main);
          background: transparent;
        }

        .search-text-input::placeholder {
          color: var(--text-dim);
        }

        .search-spinner-box {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 0.35rem;
        }

        .spinner-icon {
          width: 18px;
          height: 18px;
          color: var(--accent-red);
        }

        .btn-clear-query {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: var(--text-muted);
          transition: background-color 0.15s;
        }

        .btn-clear-query:hover {
          background-color: var(--bg-hover);
          color: var(--text-main);
        }

        .btn-search-submit {
          width: 64px;
          height: 42px;
          background-color: var(--bg-hover);
          border: 1px solid var(--border-medium);
          border-radius: 0 24px 24px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
          cursor: pointer;
        }

        .btn-search-submit:hover {
          background-color: rgba(255, 255, 255, 0.18);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .btn-now-playing-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.85rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .live-playing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
        }

        .btn-tv-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.85rem;
          min-height: 40px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-tv-badge:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: white;
        }

        .btn-tv-badge.connected {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #6ee7b7;
        }

        .tv-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .btn-open-tv-quick {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--accent-red);
          color: white;
          padding: 0.45rem 0.85rem;
          min-height: 40px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-open-tv-quick:hover {
          background: #dc2626;
        }

        .btn-queue-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.85rem;
          min-height: 40px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .btn-queue-badge:hover {
          background-color: var(--bg-hover);
        }

        .queue-number-badge {
          background-color: var(--accent-red);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.1rem 0.5rem;
          border-radius: 10px;
        }

        .btn-demo-chip {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.75rem;
          min-height: 40px;
          background-color: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-demo-chip:hover {
          background-color: var(--bg-secondary);
          color: var(--text-main);
        }

        .btn-demo-chip.active {
          background-color: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.45);
          color: #fca5a5;
        }

        /* Mobile Search Row - Chiếm gần hết chiều ngang */
        .mobile-only {
          display: none;
        }

        .header-mobile-search-row {
          padding: 0 0.75rem 0.65rem 0.75rem;
          width: 100%;
        }

        .mobile-search-form {
          height: 44px;
          width: 100%;
        }

        .mobile-input {
          font-size: 1rem;
        }

        .mobile-submit {
          width: 52px;
          height: 44px;
        }

        /* Ẩn / Hiện theo kích thước */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block;
          }
          .header-primary-row {
            padding: 0 0.75rem;
            height: 52px;
          }
          .brand-tag,
          .queue-label,
          .now-playing-pill-text {
            display: none;
          }
          .btn-tv-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.85rem;
          min-height: 40px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-tv-badge:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: white;
        }

        .btn-tv-badge.connected {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #6ee7b7;
        }

        .tv-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .btn-open-tv-quick {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--accent-red);
          color: white;
          padding: 0.45rem 0.85rem;
          min-height: 40px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-open-tv-quick:hover {
          background: #dc2626;
        }

        .btn-queue-badge {
            padding: 0.4rem 0.65rem;
            min-height: 38px;
          }
          .btn-demo-chip {
            padding: 0.4rem 0.6rem;
            min-height: 38px;
          }
          .brand-main-title {
            font-size: 1.05rem;
          }
        }

        @media (max-width: 360px) {
          .header-primary-row {
            padding: 0 0.5rem;
          }
          .header-mobile-search-row {
            padding: 0 0.5rem 0.5rem 0.5rem;
          }
          .brand-main-title {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </header>
  );
};
