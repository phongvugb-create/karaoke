import React from 'react';
import { Home, Search, ListMusic, History, Sparkles, X } from 'lucide-react';

export type SidebarTab = 'home' | 'search' | 'queue' | 'history';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onCloseMobile: () => void;
  queueCount: number;
  historyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isMobile,
  activeTab,
  onSelectTab,
  onCloseMobile,
  queueCount,
  historyCount
}) => {
  const handleItemClick = (tab: SidebarTab) => {
    onSelectTab(tab);
    if (isMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isMobile && isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true" 
        />
      )}

      <aside className={`yt-sidebar ${isOpen ? 'open' : 'collapsed'} ${isMobile ? 'mobile-drawer' : ''}`}>
        {/* Mobile drawer header with close button */}
        {isMobile && (
          <div className="drawer-header">
            <div className="drawer-brand">
              <span className="drawer-title">Hát Cùng Nhau</span>
            </div>
            <button 
              type="button" 
              onClick={onCloseMobile}
              className="btn-close-drawer"
              title="Đóng menu"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        )}

        <nav className="sidebar-nav">
          {/* 1. Trang chủ */}
          <button
            type="button"
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleItemClick('home')}
            title="Trang chủ"
          >
            <div className="nav-icon-box">
              <Home className="nav-icon" />
            </div>
            {(isOpen || isMobile) && <span className="nav-label">Trang chủ</span>}
          </button>

          {/* 2. Tìm kiếm */}
          <button
            type="button"
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleItemClick('search')}
            title="Tìm kiếm bài hát"
          >
            <div className="nav-icon-box">
              <Search className="nav-icon" />
            </div>
            {(isOpen || isMobile) && <span className="nav-label">Tìm kiếm</span>}
          </button>

          {/* 3. Hàng chờ */}
          <button
            type="button"
            className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => handleItemClick('queue')}
            title="Hàng chờ bài hát"
          >
            <div className="nav-icon-box">
              <ListMusic className="nav-icon" />
            </div>
            {(isOpen || isMobile) && (
              <div className="nav-label-group">
                <span className="nav-label">Hàng chờ</span>
                {queueCount > 0 && (
                  <span className="nav-count-badge">{queueCount}</span>
                )}
              </div>
            )}
            {!isOpen && !isMobile && queueCount > 0 && (
              <span className="mini-badge">{queueCount}</span>
            )}
          </button>

          {/* 4. Lịch sử xem */}
          <button
            type="button"
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleItemClick('history')}
            title="Lịch sử xem & hát"
          >
            <div className="nav-icon-box">
              <History className="nav-icon" />
            </div>
            {(isOpen || isMobile) && (
              <div className="nav-label-group">
                <span className="nav-label">Lịch sử hát</span>
                {historyCount > 0 && (
                  <span className="nav-count-badge neutral">{historyCount}</span>
                )}
              </div>
            )}
          </button>
        </nav>

        {(isOpen || isMobile) && (
          <div className="sidebar-footer-hint">
            <div className="hint-card">
              <Sparkles className="hint-sparkle" />
              <p className="hint-text">
                Tìm kiếm trực tiếp từ YouTube Data API và phát video IFrame bản quyền chính thức.
              </p>
            </div>
          </div>
        )}
      </aside>

      <style>{`
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          z-index: 140;
          animation: fadeIn 0.2s ease-out;
        }

        .yt-sidebar {
          position: sticky;
          top: 56px;
          height: calc(100vh - 56px);
          background-color: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          padding: 0.75rem 0.5rem;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          overflow-x: hidden;
          flex-shrink: 0;
          z-index: 90;
        }

        .yt-sidebar.open {
          width: 220px;
        }

        .yt-sidebar.collapsed {
          width: 72px;
          padding: 0.75rem 0.25rem;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.5rem 1rem 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 0.75rem;
        }

        .drawer-title {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-main);
        }

        .btn-close-drawer {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }

        .btn-close-drawer:hover {
          background: var(--bg-secondary);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 0.65rem 0.75rem;
          border-radius: 12px;
          color: var(--text-main);
          font-size: 0.92rem;
          font-weight: 500;
          transition: background-color 0.15s, color 0.15s;
          text-align: left;
          position: relative;
        }

        .yt-sidebar.collapsed .nav-item {
          flex-direction: column;
          gap: 0.3rem;
          padding: 0.75rem 0.25rem;
          border-radius: 10px;
        }

        .nav-item:hover {
          background-color: var(--bg-hover);
        }

        .nav-item.active {
          background-color: var(--bg-secondary);
          font-weight: 700;
          color: var(--accent-red);
        }

        .nav-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
        }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yt-sidebar.collapsed .nav-label {
          font-size: 0.68rem;
          font-weight: 500;
        }

        .nav-label-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
        }

        .nav-count-badge {
          background-color: var(--accent-red);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.1rem 0.45rem;
          border-radius: 9999px;
        }

        .nav-count-badge.neutral {
          background-color: var(--bg-hover);
          color: var(--text-muted);
        }

        .mini-badge {
          position: absolute;
          top: 6px;
          right: 14px;
          background-color: var(--accent-red);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-footer-hint {
          margin-top: auto;
          padding: 0.75rem 0.5rem;
        }

        .hint-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .hint-sparkle {
          width: 16px;
          height: 16px;
          color: var(--accent-red);
        }

        .hint-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin: 0;
        }

        /* Mobile Drawer Mode */
        @media (max-width: 768px) {
          .yt-sidebar.mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh;
            width: 260px !important;
            z-index: 150;
            box-shadow: 4px 0 25px rgba(0, 0, 0, 0.4);
            transform: translateX(-100%);
            transition: transform 0.25s ease-out;
            padding: 1rem;
          }

          .yt-sidebar.mobile-drawer.open {
            transform: translateX(0);
          }

          .yt-sidebar:not(.mobile-drawer) {
            display: none;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

