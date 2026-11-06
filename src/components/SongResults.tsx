import React from 'react';
import { Plus, Video, Play, KeyRound, Clock, ServerOff, Loader2, Sparkles, ShieldAlert, Flame } from 'lucide-react';
import type { Song } from '../data/mockSongs';
import type { SearchErrorType } from '../services/youtubeService';

interface SongResultsProps {
  songs: Song[];
  searchQuery: string;
  isLoading: boolean;
  error: SearchErrorType;
  errorMessage?: string;
  isDemoMode?: boolean;
  onToggleDemoMode: () => void;
  onPlaySong: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onRetry?: () => void;
}

export const SongResults: React.FC<SongResultsProps> = ({
  songs,
  searchQuery,
  isLoading,
  error,
  errorMessage,
  onToggleDemoMode,
  onPlaySong,
  onAddToQueue,
  onRetry
}) => {
  const isSearchActive = searchQuery.trim().length >= 2;

  return (
    <div className="song-results-section">
      {/* 1. Trạng thái Loading */}
      {isLoading && (
        <div className="status-box loading-box">
          <Loader2 className="spinner-large animate-spin" />
          <h3 className="status-title">Đang tìm kiếm bài hát karaoke trên YouTube...</h3>
          <p className="status-desc">Hệ thống đang kết nối trực tiếp đến YouTube Data API v3.</p>
        </div>
      )}

      {/* 2. Trạng thái Thiếu API Key */}
      {!isLoading && error === 'MISSING_API_KEY' && (
        <div className="status-box warning-box">
          <div className="icon-circle warning">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="status-title">Chưa Cấu Hình YouTube API Key</h3>
          <p className="status-desc">
            {errorMessage || 'Hệ thống server chưa tìm thấy YOUTUBE_API_KEY trong file .env.'}
          </p>
          <div className="guide-box">
            <p className="guide-title"><strong>Hướng dẫn cấu hình nhanh:</strong></p>
            <ol>
              <li>Mở file <code>.env</code> ở thư mục gốc của dự án.</li>
              <li>Thêm khóa API: <code>YOUTUBE_API_KEY=AIzaSy...</code></li>
              <li>Khởi động lại backend server là có thể tìm kiếm video thật!</li>
            </ol>
          </div>
          <button type="button" onClick={onToggleDemoMode} className="btn-switch-demo">
            <Sparkles className="w-4 h-4" /> Bật chế độ Bài Mẫu (Demo)
          </button>
        </div>
      )}

      {/* 3. Trạng thái Quota Exceeded */}
      {!isLoading && error === 'QUOTA_EXCEEDED' && (
        <div className="status-box error-box">
          <div className="icon-circle error">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="status-title">Hết Hạn Ngạch YouTube API Hôm Nay</h3>
          <p className="status-desc">
            {errorMessage || 'Tài khoản Google Cloud đã sử dụng hết 10,000 units hạn ngạch miễn phí hôm nay. Hạn ngạch sẽ tự làm mới lúc 14:00 (giờ VN).'}
          </p>
          <button type="button" onClick={onToggleDemoMode} className="btn-switch-demo">
            Chuyển sang Chế độ Demo
          </button>
        </div>
      )}

      {/* 4. Trạng thái API Key không hợp lệ */}
      {!isLoading && error === 'INVALID_API_KEY' && (
        <div className="status-box error-box">
          <div className="icon-circle error">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="status-title">API Key YouTube Không Hợp Lệ</h3>
          <p className="status-desc">
            {errorMessage || 'Khóa YOUTUBE_API_KEY trong .env không đúng hoặc chưa được kích hoạt YouTube Data API v3.'}
          </p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-retry">
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* 5. Trạng thái Lỗi mạng */}
      {!isLoading && (error === 'NETWORK_ERROR' || error === 'YOUTUBE_API_ERROR' || error === 'API_FORBIDDEN') && (
        <div className="status-box error-box">
          <div className="icon-circle error">
            <ServerOff className="w-7 h-7" />
          </div>
          <h3 className="status-title">Không Thể Kết Nối Đến YouTube API</h3>
          <p className="status-desc">
            {errorMessage || 'Đã xảy ra sự cố khi gọi API qua server proxy. Vui lòng kiểm tra kết nối mạng hoặc thử lại.'}
          </p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-retry">
              Thử tìm lại
            </button>
          )}
        </div>
      )}

      {/* 6. Trạng thái Không có kết quả tìm kiếm */}
      {!isLoading && !error && isSearchActive && songs.length === 0 && (
        <div className="status-box empty-box">
          <div className="icon-circle empty">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="status-title">Không Tìm Thấy Video Nào</h3>
          <p className="status-desc">
            Không tìm thấy video karaoke nào phù hợp với từ khóa "{searchQuery}". Hãy thử tên bài hát hoặc ca sĩ khác nhé.
          </p>
        </div>
      )}

      {/* 7. Tiêu đề danh sách: Đang tìm kiếm hoặc Gợi ý Hot Trend YouTube */}
      {!isLoading && !error && (
        <div className="results-header-bar">
          <div className="results-header-left">
            {isSearchActive ? (
              <h2 className="results-heading">
                Kết quả tìm kiếm cho: <span className="highlight-query">"{searchQuery}"</span>
              </h2>
            ) : (
              <h2 className="results-heading flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                <span>Thịnh Hành & Bài Hát Được Chọn Nhiều Nhất</span>
                <span className="trending-pill">HOT TREND</span>
              </h2>
            )}
            <p className="results-subheading">
              {isSearchActive 
                ? `Tìm thấy ${songs.length} video karaoke bản quyền YouTube.` 
                : 'Các bài hát Karaoke tuyển chọn hạt dẻ, dễ hát, chất lượng cao sẵn sàng đưa lên TV.'}
            </p>
          </div>
        </div>
      )}

      {/* 8. Danh sách kết quả video nổi bật chuẩn phong cách YouTube */}
      {!isLoading && !error && songs.length > 0 && (
        <div className="yt-results-list">
          {songs.map((song) => (
            <div 
              key={song.id} 
              className="yt-video-row"
              onClick={() => onPlaySong(song)}
              title={`Bấm để mở xem: "${song.title}"`}
            >
              {/* Thumbnail 16:9 nổi bật */}
              <div className="yt-thumb-wrapper">
                <img 
                  src={song.thumbnail} 
                  alt={song.title} 
                  className="yt-thumb-img" 
                  loading="lazy" 
                />
                
                {/* Thời lượng */}
                {song.duration && (
                  <span className="yt-thumb-duration">{song.duration}</span>
                )}

                {/* Nhãn nguồn YouTube */}
                <span className={`yt-source-chip ${song.isYouTube ? 'real' : 'mock'}`}>
                  {song.isYouTube ? 'YouTube' : 'Mẫu'}
                </span>

                {/* Hover Play Overlay */}
                <div className="yt-thumb-overlay">
                  <div className="play-circle">
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Thông tin video rõ nét, chữ sáng dễ đọc */}
              <div className="yt-info-col">
                <h3 className="yt-video-title" title={song.title}>
                  {song.title}
                </h3>

                <div className="yt-channel-row">
                  <div className="yt-channel-avatar">
                    {(song.channelTitle || song.artist || 'K')[0].toUpperCase()}
                  </div>
                  <span className="yt-channel-name" title={song.channelTitle || song.artist}>
                    {song.channelTitle || song.artist}
                  </span>
                </div>

                <div className="yt-video-meta">
                  <span className="yt-tag-pill">{song.genre || 'Karaoke Beat'}</span>
                  <span className="meta-dot">•</span>
                  <span className="meta-text">Full HD 1080p</span>
                </div>

                {/* Nút thao tác kích thước lớn, dễ bấm bằng ngón tay */}
                <div className="yt-row-actions">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySong(song);
                    }}
                    className="btn-play-video"
                    title="Mở xem và phát video ngay"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Phát video</span>
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(song);
                    }}
                    className="btn-add-queue"
                    title="Thêm vào hàng chờ bài hát"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm hàng chờ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .song-results-section {
          width: 100%;
        }

        .results-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .results-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.25rem 0;
        }

        .highlight-query {
          color: #38bdf8;
        }

        .trending-pill {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .results-subheading {
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 0;
        }

        /* Khung hướng dẫn rút gọn - Gọn gàng và sáng sủa */
        .compact-search-guide-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 0.95rem 1.25rem;
          margin: 0.5rem 0 1.25rem 0;
          backdrop-filter: blur(8px);
        }

        .guide-icon-pill {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .guide-text-box {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .guide-headline {
          font-weight: 700;
          font-size: 0.95rem;
          color: #ffffff;
        }

        .guide-detail {
          font-size: 0.9rem;
          color: #e2e8f0; /* Chữ sáng, tương phản cao trên nền tối */
          line-height: 1.5;
          margin: 0;
        }

        .guide-detail em {
          color: #fca5a5;
          font-style: normal;
          font-weight: 600;
        }

        /* Hộp trạng thái */
        .status-box {
          background: var(--bg-surface);
          border: 1px dashed var(--border-subtle);
          border-radius: 16px;
          padding: 2.25rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 1rem 0;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          color: var(--accent-red);
          margin-bottom: 0.85rem;
        }

        .icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .icon-circle.empty {
          background: rgba(148, 163, 184, 0.15);
          color: #cbd5e1;
        }

        .icon-circle.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        .icon-circle.error {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .status-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.4rem;
        }

        .status-desc {
          color: #cbd5e1;
          font-size: 0.95rem;
          max-width: 500px;
          line-height: 1.5;
        }

        .guide-box {
          margin-top: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          text-align: left;
          font-size: 0.9rem;
          color: #f1f5f9;
        }

        .guide-title {
          margin-bottom: 0.35rem;
          color: #ffffff;
        }

        .guide-box ol {
          margin-left: 1.25rem;
          line-height: 1.5;
        }

        .guide-box code {
          background: rgba(255, 255, 255, 0.1);
          color: #f472b6;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }

        .btn-switch-demo, .btn-retry {
          margin-top: 1.25rem;
          background: var(--bg-secondary);
          color: #ffffff;
          border: 1px solid var(--border-medium);
          padding: 0.65rem 1.35rem;
          min-height: 42px;
          border-radius: 20px;
          font-size: 0.92rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .btn-switch-demo:hover, .btn-retry:hover {
          background: var(--bg-hover);
        }

        /* Danh sách kết quả theo phong cách YouTube */
        .yt-results-list {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .yt-video-row {
          display: flex;
          gap: 1.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 0.85rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .yt-video-row:hover {
          transform: translateY(-2px);
          border-color: rgba(239, 68, 68, 0.45);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .yt-thumb-wrapper {
          position: relative;
          width: 330px;
          aspect-ratio: 16 / 9;
          border-radius: 10px;
          overflow: hidden;
          background: #000000;
          flex-shrink: 0;
        }

        .yt-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .yt-video-row:hover .yt-thumb-img {
          transform: scale(1.04);
        }

        .yt-thumb-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.88);
          color: #ffffff;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .yt-source-chip {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          backdrop-filter: blur(4px);
        }

        .yt-source-chip.real {
          background: rgba(239, 68, 68, 0.92);
          color: #ffffff;
        }

        .yt-source-chip.mock {
          background: rgba(139, 92, 246, 0.92);
          color: #ffffff;
        }

        .yt-thumb-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .yt-video-row:hover .yt-thumb-overlay {
          opacity: 1;
        }

        .play-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent-red);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
          transform: scale(0.9);
          transition: transform 0.2s;
        }

        .yt-video-row:hover .play-circle {
          transform: scale(1);
        }

        .yt-info-col {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          justify-content: space-between;
        }

        .yt-video-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.38;
          margin-bottom: 0.45rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .yt-channel-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.45rem;
        }

        .yt-channel-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-hover);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .yt-channel-name {
          font-size: 0.92rem;
          color: #cbd5e1;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yt-video-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #94a3b8;
          margin-bottom: 0.75rem;
        }

        .yt-tag-pill {
          background: var(--bg-secondary);
          color: #cbd5e1;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .meta-dot {
          color: #64748b;
        }

        .yt-row-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .btn-play-video {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: var(--accent-red);
          color: #ffffff;
          padding: 0.65rem 1.25rem;
          min-height: 42px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.15s;
        }

        .btn-play-video:hover {
          background: var(--accent-red-hover);
          transform: translateY(-1px);
        }

        .btn-add-queue {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: var(--bg-secondary);
          color: #ffffff;
          border: 1px solid var(--border-medium);
          padding: 0.65rem 1.15rem;
          min-height: 42px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .btn-add-queue:hover {
          background: var(--bg-hover);
        }

        /* Responsive Mobile: Xếp dọc với tiêu đề & nút lớn, dễ bấm */
        @media (max-width: 860px) {
          .yt-video-row {
            flex-direction: column;
            gap: 0.75rem;
            padding: 0.75rem;
          }

          .yt-thumb-wrapper {
            width: 100%;
          }

          .yt-video-title {
            font-size: 1.1rem;
            margin-bottom: 0.35rem;
          }

          .yt-channel-name {
            font-size: 0.92rem;
          }

          .yt-row-actions {
            margin-top: 0.65rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            width: 100%;
          }

          .btn-play-video, .btn-add-queue {
            width: 100%;
            justify-content: center;
            min-height: 44px; /* Kích thước tối ưu cho ngón tay */
            font-size: 0.92rem;
            padding: 0.6rem 0.5rem;
          }
        }

        @media (max-width: 360px) {
          .yt-video-title {
            font-size: 1.02rem;
          }
          .yt-row-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
