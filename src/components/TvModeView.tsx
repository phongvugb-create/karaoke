import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  QrCode, 
  SkipForward, 
  Sparkles, 
  Music4, 
  AlertTriangle,
  Play,
  ExternalLink
} from 'lucide-react';
import type { Song } from '../data/mockSongs';
import { loadYouTubeIframeAPI, type YTPlayerInstance } from '../utils/youtubeIframe';

interface TvModeViewProps {
  roomCode: string;
  currentSong: Song | null;
  queue: Song[];
  autoPlayNext: boolean;
  onNextSong: () => void;
  onCloseTvMode: () => void;
  onSelectSampleSong: () => void;
  joinUrl: string;
  lastAddedSong?: { song: Song; addedBy: string } | null;
}

export const TvModeView: React.FC<TvModeViewProps> = ({
  roomCode,
  currentSong,
  queue,
  autoPlayNext,
  onNextSong,
  onCloseTvMode,
  onSelectSampleSong,
  joinUrl,
  lastAddedSong
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState<{ code: number; message: string } | null>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // QR Code data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto-hide OSD controls after inactivity
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notification on TV
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Sinh QR Code cho màn hình TV
  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Lỗi tạo QR TV:', err));
    }
  }, [joinUrl]);

  // Thông báo toast khi có người thêm bài
  useEffect(() => {
    if (lastAddedSong) {
      setToastNotification(`🎵 ${lastAddedSong.addedBy} vừa thêm: "${lastAddedSong.song.title}"`);
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedSong]);

  // Lắng nghe phím F / ESC để toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && !document.fullscreenElement) {
        onCloseTvMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lắng nghe thay đổi trạng thái fullscreen của trình duyệt
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Tự động ẩn thanh công cụ sau 4 giây chuột không di chuyển
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Khởi tạo YouTube Player cho TV Mode
  useEffect(() => {
    if (!currentSong || !currentSong.id) {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
      setIsPlaying(false);
      setPlayerError(null);
      setIsAutoplayBlocked(false);
      return;
    }

    let isSubscribed = true;
    setPlayerError(null);
    setIsAutoplayBlocked(false);

    loadYouTubeIframeAPI().then(() => {
      if (!isSubscribed) return;

      const target = document.getElementById('tv-yt-player-target');
      if (!target) return;

      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }

      target.innerHTML = '<div id="tv-yt-iframe"></div>';

      try {
        if (!window.YT) return;

        playerRef.current = new window.YT.Player('tv-yt-iframe', {
          videoId: currentSong.id,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              try {
                event.target.setVolume(100);
                event.target.playVideo();
              } catch (e) {
                console.error('TV Play error:', e);
              }
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;
              const state = event.data;
              if (state === 1) { // PLAYING
                setIsPlaying(true);
                setIsAutoplayBlocked(false);
                setPlayerError(null);
              } else if (state === 2) { // PAUSED
                setIsPlaying(false);
              } else if (state === 0) { // ENDED -> Tự động qua bài tiếp theo
                setIsPlaying(false);
                if (autoPlayNext) {
                  onNextSong();
                }
              } else if (state === -1) {
                setTimeout(() => {
                  if (isSubscribed && playerRef.current) {
                    try {
                      if (playerRef.current.getPlayerState() === -1) {
                        setIsAutoplayBlocked(true);
                      }
                    } catch (e) {}
                  }
                }, 2500);
              }
            },
            onError: (event) => {
              if (!isSubscribed) return;
              const code = event.data;
              let message = 'Không thể phát video này trên YouTube.';
              if (code === 2) message = 'Mã video không hợp lệ.';
              else if (code === 100) message = 'Video đã bị xóa hoặc đặt ở chế độ riêng tư.';
              else if (code === 101 || code === 150) message = 'Video bị chủ sở hữu chặn nhúng trên màn hình ngoài.';
              setPlayerError({ code, message });
              setIsPlaying(false);
            }
          }
        });
      } catch (err) {
        console.error('Lỗi khởi tạo player TV:', err);
      }
    });

    return () => {
      isSubscribed = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [currentSong?.id]);

  const handleUnblockPlay = () => {
    if (playerRef.current) {
      try {
        playerRef.current.playVideo();
        setIsAutoplayBlocked(false);
      } catch (e) {}
    }
  };

  const nextSong = queue.length > 0 ? queue[0] : null;

  return (
    <div 
      ref={containerRef} 
      className={`tv-mode-fullscreen-container ${isFullscreen ? 'is-fs' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* 1. Màn hình phát video YouTube chính */}
      <div className="tv-player-viewport">
        {currentSong ? (
          <div className="tv-player-active-screen">
            <div id="tv-yt-player-target" className="tv-yt-iframe-box" />

            {/* Thông báo nếu trình duyệt chặn tự phát */}
            {isAutoplayBlocked && !playerError && (
              <div className="tv-overlay-block">
                <div className="tv-block-card">
                  <h3>Trình duyệt yêu cầu xác nhận phát</h3>
                  <button onClick={handleUnblockPlay} className="btn-tv-unblock">
                    <Play className="w-6 h-6 fill-white" />
                    <span>Bấm để phát ngay</span>
                  </button>
                </div>
              </div>
            )}

            {/* Thông báo nếu video YouTube lỗi chặn nhúng */}
            {playerError && (
              <div className="tv-overlay-block tv-error-block">
                <div className="tv-error-card">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mb-2" />
                  <h3>Không thể phát video này</h3>
                  <p>{playerError.message}</p>
                  <div className="tv-error-actions">
                    <button onClick={onNextSong} className="btn-tv-skip">
                      <SkipForward className="w-5 h-5" />
                      <span>Bỏ qua sang bài tiếp theo</span>
                    </button>
                    <a 
                      href={`https://www.youtube.com/watch?v=${currentSong.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-tv-open-link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Xem trên YouTube</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Màn hình chờ khi chưa có bài hát trong hàng chờ */
          <div className="tv-standby-screen">
            <div className="tv-standby-ambient-glow" />
            <div className="tv-standby-content">
              <div className="tv-brand-banner">
                <div className="tv-mic-icon-circle">
                  <Music4 className="w-10 h-10 text-white" />
                </div>
                <h1 className="tv-brand-title">Hát Cùng Nhau</h1>
                <span className="tv-badge-live">MÀN HÌNH HÁT CHÍNH</span>
              </div>

              <div className="tv-instruction-card">
                <div className="tv-qr-box">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="tv-qr-img" />
                  ) : (
                    <div className="tv-qr-placeholder">Đang tải QR...</div>
                  )}
                  <div className="tv-qr-label">Quét mã bằng Điện thoại</div>
                </div>

                <div className="tv-instruction-text">
                  <h2 className="tv-room-code-heading">
                    Mã phòng: <span className="highlight-code">{roomCode}</span>
                  </h2>
                  <p className="tv-guide-step">
                    1. Mọi người mở Camera điện thoại quét mã QR hoặc vào:
                  </p>
                  <div className="tv-url-pill">{joinUrl}</div>
                  <p className="tv-guide-step">
                    2. Tìm kiếm bất kỳ bài hát karaoke nào trên YouTube.
                  </p>
                  <p className="tv-guide-step">
                    3. Bấm <strong>"+ Thêm vào hàng chờ"</strong> để bài hát tự động phát lên màn hình TV này!
                  </p>

                  <div className="tv-sample-action">
                    <button onClick={onSelectSampleSong} className="btn-tv-sample-start">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>Hát ngay bài hát mẫu</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Thanh điều khiển OSD mờ phủ trên màn hình TV (Tự động ẩn sau 4s) */}
      <div className={`tv-osd-overlay ${showControls ? 'visible' : 'hidden'}`}>
        {/* Góc trên: Logo + Mã phòng + QR + Nút Fullscreen */}
        <div className="tv-osd-top">
          <div className="tv-top-left">
            <span className="tv-live-dot" />
            <span className="tv-osd-brand">Hát Cùng Nhau</span>
            <span className="tv-room-pill">Phòng: <strong>{roomCode}</strong></span>
          </div>

          <div className="tv-top-right">
            {/* Nút bật popup QR Code */}
            <button 
              type="button"
              onClick={() => setShowQrModal((prev) => !prev)}
              className="btn-tv-osd-icon"
              title="Xem mã QR để điện thoại quét chọn bài"
            >
              <QrCode className="w-5 h-5 text-white" />
              <span className="btn-osd-text">Mã QR chọn bài</span>
            </button>

            {/* Nút Toàn màn hình */}
            <button 
              type="button"
              onClick={toggleFullscreen}
              className="btn-tv-osd-icon"
              title={isFullscreen ? "Thu nhỏ (F)" : "Toàn màn hình (F)"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
              <span className="btn-osd-text">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>

            {/* Nút Thoát TV mode */}
            <button 
              type="button"
              onClick={onCloseTvMode}
              className="btn-tv-osd-icon btn-exit-tv"
              title="Đóng chế độ TV"
            >
              <X className="w-5 h-5 text-white" />
              <span className="btn-osd-text">Đóng TV</span>
            </button>
          </div>
        </div>

        {/* Góc dưới: Thông tin bài đang phát & Bài tiếp theo */}
        {currentSong && (
          <div className="tv-osd-bottom">
            <div className="tv-bottom-meta">
              <span className="tv-now-tag">▶ ĐANG HÁT:</span>
              <h2 className="tv-song-title" title={currentSong.title}>{currentSong.title}</h2>
              <span className="tv-channel-name">• {currentSong.channelTitle || currentSong.artist}</span>
            </div>

            <div className="tv-bottom-right-controls">
              {nextSong && (
                <div className="tv-next-preview">
                  <span className="next-label">Kế tiếp:</span>
                  <span className="next-title" title={nextSong.title}>{nextSong.title}</span>
                </div>
              )}

              <button onClick={onNextSong} className="btn-tv-next-skip" title="Chuyển sang bài kế tiếp">
                <SkipForward className="w-5 h-5 text-white" />
                <span>Qua bài</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Toast thông báo nổi khi có người thêm bài từ Điện thoại / Laptop */}
      {toastNotification && (
        <div className="tv-floating-toast">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* 4. Popup QR Code lớn khi bấm nút xem QR */}
      {showQrModal && (
        <div className="tv-qr-modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="tv-qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)} className="btn-close-qr-modal">
              <X className="w-6 h-6 text-gray-400" />
            </button>
            <h2 className="qr-modal-title">Quét mã bằng Điện thoại</h2>
            <p className="qr-modal-sub">
              Mở camera điện thoại quét mã dưới đây để tham gia chọn bài hát cho TV!
            </p>
            <div className="qr-large-frame">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Join" className="qr-large-img" />}
            </div>
            <div className="qr-modal-code-badge">MÃ PHÒNG: <strong>{roomCode}</strong></div>
            <p className="qr-modal-url">{joinUrl}</p>
          </div>
        </div>
      )}

      <style>{`
        .tv-mode-fullscreen-container {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background-color: #000000;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          user-select: none;
        }

        .tv-player-viewport {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tv-player-active-screen {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .tv-yt-iframe-box {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
        }

        .tv-yt-iframe-box iframe,
        .tv-yt-iframe-box > div {
          width: 100% !important;
          height: 100% !important;
          border: none;
        }

        /* Standby Screen */
        .tv-standby-screen {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%);
          position: relative;
          padding: 2rem;
        }

        .tv-standby-ambient-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: rgba(239, 68, 68, 0.15);
          filter: blur(140px);
          border-radius: 50%;
          pointer-events: none;
        }

        .tv-standby-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 950px;
          width: 100%;
        }

        .tv-brand-banner {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .tv-mic-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 30px rgba(239, 68, 68, 0.5);
        }

        .tv-brand-title {
          font-size: 2.8rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .tv-badge-live {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #fca5a5;
          font-size: 0.85rem;
          font-weight: 800;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.08em;
        }

        .tv-instruction-card {
          display: flex;
          background: rgba(24, 24, 27, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 2.5rem;
          gap: 2.5rem;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
          width: 100%;
          align-items: center;
        }

        .tv-qr-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #ffffff;
          padding: 1rem;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          flex-shrink: 0;
        }

        .tv-qr-img {
          width: 220px;
          height: 220px;
          display: block;
        }

        .tv-qr-label {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
        }

        .tv-instruction-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tv-room-code-heading {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .highlight-code {
          color: #ef4444;
          font-size: 2.5rem;
          font-weight: 900;
          background: rgba(239, 68, 68, 0.15);
          padding: 0.2rem 0.85rem;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.4);
          letter-spacing: 0.1em;
        }

        .tv-guide-step {
          font-size: 1.1rem;
          color: #e2e8f0;
          line-height: 1.5;
        }

        .tv-url-pill {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #93c5fd;
          font-family: monospace;
          font-size: 1.15rem;
          padding: 0.65rem 1rem;
          border-radius: 10px;
          width: fit-content;
          font-weight: 600;
        }

        .tv-sample-action {
          margin-top: 1rem;
        }

        .btn-tv-sample-start {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 0.85rem 1.75rem;
          border-radius: 30px;
          font-size: 1.15rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
          transition: transform 0.2s;
        }

        .btn-tv-sample-start:hover {
          transform: translateY(-2px);
        }

        /* OSD Overlay */
        .tv-osd-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.5rem 2.5rem;
          transition: opacity 0.4s ease;
          z-index: 10;
        }

        .tv-osd-overlay.hidden {
          opacity: 0;
        }

        .tv-osd-overlay.visible {
          opacity: 1;
        }

        .tv-osd-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: auto;
          background: rgba(0, 0, 0, 0.65);
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .tv-top-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .tv-live-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
          animation: pulse 2s infinite;
        }

        .tv-osd-brand {
          font-weight: 800;
          font-size: 1.25rem;
          color: white;
        }

        .tv-room-pill {
          background: rgba(255, 255, 255, 0.15);
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #f1f5f9;
        }

        .tv-top-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-tv-osd-icon {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-tv-osd-icon:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .btn-exit-tv {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .btn-exit-tv:hover {
          background: rgba(239, 68, 68, 0.45);
        }

        /* OSD Bottom */
        .tv-osd-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: auto;
          background: rgba(0, 0, 0, 0.75);
          padding: 1rem 2rem;
          border-radius: 20px;
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          gap: 2rem;
        }

        .tv-bottom-meta {
          display: flex;
          align-items: baseline;
          gap: 0.85rem;
          overflow: hidden;
          flex: 1;
        }

        .tv-now-tag {
          color: #ef4444;
          font-weight: 900;
          font-size: 1rem;
          white-space: nowrap;
        }

        .tv-song-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tv-channel-name {
          font-size: 1.1rem;
          color: #94a3b8;
          white-space: nowrap;
        }

        .tv-bottom-right-controls {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-shrink: 0;
        }

        .tv-next-preview {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.45rem 0.85rem;
          border-radius: 10px;
          max-width: 320px;
        }

        .next-label {
          color: #cbd5e1;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .next-title {
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-tv-next-skip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: var(--accent-red);
          color: white;
          padding: 0.65rem 1.25rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-tv-next-skip:hover {
          background: #dc2626;
        }

        /* Floating Toast */
        .tv-floating-toast {
          position: absolute;
          bottom: 7.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid #ef4444;
          color: white;
          padding: 0.85rem 1.75rem;
          border-radius: 30px;
          font-size: 1.15rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.5);
          z-index: 100;
          animation: slideUp 0.3s ease-out;
        }

        /* QR Modal */
        .tv-qr-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tv-qr-modal-card {
          background: #18181b;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          max-width: 450px;
          width: 90%;
          text-align: center;
        }

        .btn-close-qr-modal {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .qr-modal-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.35rem;
        }

        .qr-modal-sub {
          font-size: 0.95rem;
          color: #cbd5e1;
          margin-bottom: 1.5rem;
        }

        .qr-large-frame {
          background: white;
          padding: 1rem;
          border-radius: 20px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
        }

        .qr-large-img {
          width: 260px;
          height: 260px;
          display: block;
        }

        .qr-modal-code-badge {
          margin-top: 1.5rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          font-size: 1.25rem;
          font-weight: 800;
          padding: 0.45rem 1.25rem;
          border-radius: 12px;
        }

        .qr-modal-url {
          margin-top: 0.75rem;
          color: #93c5fd;
          font-family: monospace;
          font-size: 0.9rem;
        }

        /* Error & Block Overlays */
        .tv-overlay-block {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .tv-block-card, .tv-error-card {
          background: #18181b;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 500px;
        }

        .btn-tv-unblock {
          margin-top: 1.5rem;
          background: var(--accent-red);
          color: white;
          padding: 0.85rem 1.75rem;
          border-radius: 30px;
          font-size: 1.15rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .tv-error-actions {
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
        }

        .btn-tv-skip {
          background: var(--accent-red);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .btn-tv-open-link {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};
