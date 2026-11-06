import React from 'react';
import { Search, X, Sparkles, Loader2 } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
  isLoading = false
}) => {
  return (
    <div className="search-section" role="search">
      <div className="search-input-wrapper">
        <label htmlFor="karaoke-search-input" className="sr-only">
          Tìm kiếm bài hát hoặc ca sĩ
        </label>
        <Search className="search-icon" aria-hidden="true" />
        <input
          id="karaoke-search-input"
          type="text"
          className="search-input"
          placeholder="Tìm tên bài hát, ca sĩ, thể loại (ví dụ: Nàng Thơ, Sơn Tùng, Nhạc Trẻ)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Tìm kiếm bài hát, ca sĩ hoặc thể loại karaoke"
        />
        
        <div className="right-tools">
          {isLoading && (
            <div className="loading-spinner" title="Đang tìm kiếm trên YouTube..." aria-label="Đang tìm kiếm">
              <Loader2 className="spinner-icon animate-spin" aria-hidden="true" />
            </div>
          )}
          {searchQuery && (
            <button 
              type="button"
              onClick={onClear} 
              className="btn-clear-search" 
              title="Xóa tìm kiếm"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="clear-icon" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="quick-suggestions" role="group" aria-label="Gợi ý tìm kiếm nhanh">
        <span className="suggestion-label">
          <Sparkles className="suggestion-sparkle" aria-hidden="true" /> Gợi ý nhanh:
        </span>
        {['Tăng Duy Tân', 'Bùi Lan Hương', 'Nàng Thơ', 'Sơn Tùng M-TP', 'Lệ Quyên Bolero', 'Mashup Trẻ'].map((item) => (
          <button
            key={item}
            type="button"
            className="suggestion-chip"
            onClick={() => onSearchChange(item)}
            aria-label={`Tìm từ khóa ${item}`}
          >
            {item}
          </button>
        ))}
      </div>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .search-section {
          width: 100%;
          margin: 0 auto;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 1.25rem;
          width: 24px;
          height: 24px;
          color: var(--text-muted);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .search-input {
          width: 100%;
          height: 3.8rem;
          padding: 0 4.5rem 0 3.5rem;
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--text-main);
          background: var(--bg-secondary);
          border: 2px solid var(--border-subtle);
          border-radius: 18px;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .search-input:focus {
          border-color: var(--accent-pink);
          box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.2), 0 8px 30px rgba(0, 0, 0, 0.35);
          background: #162038;
        }

        .search-input:focus + .search-icon {
          color: var(--accent-pink);
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .right-tools {
          position: absolute;
          right: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-pink);
        }

        .spinner-icon {
          width: 22px;
          height: 22px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .btn-clear-search {
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .btn-clear-search:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.1);
        }

        .clear-icon {
          width: 20px;
          height: 20px;
        }

        .quick-suggestions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.85rem;
          padding: 0 0.5rem;
        }

        .suggestion-label {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .suggestion-sparkle {
          width: 15px;
          height: 15px;
          color: #f472b6;
        }

        .suggestion-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--text-sub);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }

        .suggestion-chip:hover {
          background: rgba(236, 72, 153, 0.15);
          color: #fbcfe8;
          border-color: rgba(236, 72, 153, 0.4);
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .search-input {
            height: 3.2rem;
            font-size: 0.95rem;
            padding-left: 2.8rem;
          }
          .search-icon {
            left: 0.9rem;
            width: 20px;
            height: 20px;
          }
          .quick-suggestions {
            gap: 0.4rem;
          }
          .suggestion-chip {
            font-size: 0.75rem;
            padding: 0.25rem 0.65rem;
          }
        }

        @media (min-width: 1920px) {
          .search-input {
            height: 4.8rem;
            font-size: 1.4rem;
            padding-left: 4.2rem;
            border-radius: 22px;
          }
          .search-icon {
            left: 1.5rem;
            width: 30px;
            height: 30px;
          }
          .suggestion-chip {
            font-size: 1.05rem;
            padding: 0.5rem 1.15rem;
          }
        }
      `}</style>
    </div>
  );
};
