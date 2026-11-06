import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2, 
  VolumeX, 
  Music4, 
  Sparkles,
  AlertTriangle,
  Repeat,
  Radio,
  ExternalLink
} from 'lucide-react';
import type { Song } from '../data/mockSongs';
import { loadYouTubeIframeAPI, type YTPlayerInstance } from '../utils/youtubeIframe';

interface PlayerAreaProps {
  currentSong: Song | null;
  hasPrevious: boolean;
  hasNext: boolean;
  autoPlayNext: boolean;
  onToggleAutoPlayNext: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelectSampleSong: () => void;
  onBackToSearch?: () => void;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  currentSong,
  hasPrevious,
  hasNext,
  autoPlayNext,
  onToggleAutoPlayNext,
  onNext,
  onPrevious,
  onSelectSampleSong,
  onBackToSearch
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Trạng thái lỗi và chặn Autoplay
  const [playerError, setPlayerError] = useState<{ code: number; message: string } | null>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

  // Định dạng thời gian mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Khởi tạo YouTube IFrame Player
  useEffect(() => {
    if (!currentSong || !currentSong.id) {
      if (playerRef.current) {
        playerRef.current.destroy();
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
      if (!isSubscribed || !playerContainerRef.current) return;

      // Hủy player cũ nếu có
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error(e);
        }
        playerRef.current = null;
      }

      // Tạo một div con để YouTube API thay thế bằng iframe
      playerContainerRef.current.innerHTML = '<div id="yt-player-target"></div>';

      try {
        if (!window.YT) return;

        playerRef.current = new window.YT.Player('yt-player-target', {
          videoId: currentSong.id,
          playerVars: {
            autoplay: 1, // Yêu cầu tự phát
            controls: 1, // Giữ thanh điều khiển YouTube gốc cho người dùng
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
                event.target.setVolume(volume);
                if (isMuted) event.target.mute();
                // Bắt đầu phát
                event.target.playVideo();
              } catch (e) {
                console.error('Lỗi khi kích hoạt playVideo:', e);
              }
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;
              const state = event.data;
              // YT.PlayerState: -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
              if (state === 1) { // PLAYING
                setIsPlaying(true);
                setIsAutoplayBlocked(false);
                setPlayerError(null);
              } else if (state === 2) { // PAUSED
                setIsPlaying(false);
              } else if (state === 0) { // ENDED - Bài hát kết thúc
                setIsPlaying(false);
                if (autoPlayNext) {
                  onNext();
                }
              } else if (state === -1) {
                // Kiểm tra sau 2.5 giây nếu vẫn UNSTARTED mà không phát được thì báo có thể bị Autoplay block
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
              // Các mã lỗi chuẩn của YouTube Player API:
              // 2: Tham số videoId không hợp lệ
              // 5: Lỗi trình phát HTML5
              // 100: Video không tồn tại hoặc đã bị xóa
              // 101 / 150: Chủ sở hữu video không cho phép nhúng trên trang ngoài hoặc bị giới hạn khu vực
              if (code === 2) {
                message = 'Mã định danh video không hợp lệ.';
              } else if (code === 100) {
                message = 'Video này đã bị xóa hoặc đặt ở chế độ riêng tư trên YouTube.';
              } else if (code === 101 || code === 150) {
                message = 'Chủ sở hữu video không cho phép nhúng (Embed) trên ứng dụng ngoài hoặc video bị chặn khu vực.';
              }

              setPlayerError({ code, message });
              setIsPlaying(false);
            }
          }
        });
      } catch (err) {
        console.error('Lỗi khởi tạo YouTube player:', err);
      }
    });

    return () => {
      isSubscribed = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [currentSong?.id]);

  // Cập nhật tiến độ phát thời gian thực
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (cur !== undefined) setCurrentTime(cur);
          if (dur !== undefined && dur > 0) setDuration(dur);
        } catch (e) {}
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Điều khiển Phát / Tạm dừng
  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
        setIsAutoplayBlocked(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [isPlaying]);

  // Điều khiển Âm lượng
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch (e) {}
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {}
  };

  return (
    <div className="player-wrapper">
      <div className="player-aspect-box">
        {currentSong ? (
          <div className="player-active-screen">
            {/* Vùng chứa IFrame chính thức của YouTube */}
            <div 
              ref={playerContainerRef} 
              className={`youtube-iframe-container ${playerError ? 'hidden-under-error' : ''}`}
            />

            {/* Màn hình thông báo khi Trình duyệt chặn Autoplay */}
            {isAutoplayBlocked && !playerError && (
              <div className="player-overlay-message autoplay-block-overlay">
                <div className="autoplay-card">
                  <Radio className="autoplay-icon" />
                  <h3>Trình duyệt đang chặn tự động phát âm thanh</h3>
                  <p>Hãy nhấn nút bên dưới để bắt đầu thưởng thức bản karaoke này!</p>
                  <button onClick={handleTogglePlay} className="btn-unblock-play">
                    <Play className="btn-play-icon" />
                    <span>Nhấn Vào Đây Để Phát</span>
                  </button>
                </div>
              </div>
            )}

            {/* Màn hình thông báo khi Video YouTube bị lỗi / Chặn nhúng / Giới hạn khu vực */}
            {playerError && (
              <div className="player-overlay-message error-overlay">
                <div className="error-card">
                  <div className="error-icon-box">
                    <AlertTriangle className="error-icon-large" />
                  </div>
                  <h3>Không Thể Phát Video YouTube Này</h3>
                  <p className="error-reason">{playerError.message}</p>
                  <span className="error-code">Mã lỗi: {playerError.code}</span>

                  <div className="error-actions">
                    <button onClick={onNext} className="btn-skip-error" title="Bỏ qua và hát bài kế tiếp">
                      <SkipForward className="btn-icon-xs" />
                      <span>Bỏ qua sang bài tiếp theo</span>
                    </button>
                    <a 
                      href={`https://www.youtube.com/watch?v=${currentSong.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-open-yt"
                    >
                      <ExternalLink className="btn-icon-xs" />
                      <span>Xem trên YouTube</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Màn hình chờ khi chưa chọn bài */
          <div className="player-standby-screen">
            <div className="standby-ambient-circle" />
            <div className="standby-content">
              <div className="standby-icon-badge">
                <Music4 className="standby-mic" />
              </div>
              <h2 className="standby-title">Màn Hình Chờ Karaoke</h2>
              <p className="standby-desc">
                Chưa có bài hát nào được chọn. Hãy chọn một bài trong hàng chờ bên phải hoặc bấm nút bên dưới để thưởng thức video mẫu!
              </p>

              <div className="standby-actions">
                <button onClick={onSelectSampleSong} className="btn-sample-play">
                  <Sparkles className="btn-sparkle" />
                  <span>Phát Ngay Video Mẫu</span>
                </button>
              </div>

              <div className="standby-features-badge">
                <span>✓ YouTube IFrame Player API chính thức</span>
                <span>✓ Phát an toàn, không vi phạm bản quyền</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thanh Điều Khiển Tích Hợp Đầy Đủ Dưới Player */}
      <div className="player-integrated-controls">
        {/* Cụm điều khiển Playback */}
        <div className="ctrl-group-left">
          {/* Nút Bài trước */}
          <button 
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="btn-ctrl-circle"
            title="Bài trước đó"
          >
            <SkipBack className="ctrl-icon" />
          </button>

          {/* Nút Phát / Tạm dừng */}
          <button 
            onClick={handleTogglePlay}
            disabled={!currentSong}
            className="btn-ctrl-main"
            title={isPlaying ? "Tạm dừng" : "Tiếp tục phát"}
          >
            {isPlaying ? <Pause className="ctrl-icon-lg" /> : <Play className="ctrl-icon-lg ml-1" />}
          </button>

          {/* Nút Bài tiếp theo */}
          <button 
            onClick={onNext}
            disabled={!hasNext && !currentSong}
            className="btn-ctrl-circle"
            title="Bài tiếp theo trong hàng chờ"
          >
            <SkipForward className="ctrl-icon" />
          </button>
        </div>

          {/* Thông tin bài đang phát & Thanh thời gian */}
          <div className="ctrl-center-info">
            {currentSong ? (
              <div className="song-playing-meta">
                <span className={`now-playing-tag ${isPlaying ? 'playing' : 'paused'}`}>
                  {isPlaying ? '▶ ĐANG PHÁT' : '⏸ ĐÃ TẠM DỪNG'}
                </span>
                <span className="now-playing-title" title={currentSong.title}>
                  {currentSong.title}
                </span>
                <span className="time-badge">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            ) : (
              <span className="no-playing-text">Sẵn sàng chọn bài từ danh sách...</span>
            )}
          </div>

        {/* Cụm công tắc Tự động phát & Âm lượng */}
        <div className="ctrl-group-right">
          {/* Nút chuyển đổi Tự động phát bài kế tiếp (Autoplay Next) */}
          <button 
            onClick={onToggleAutoPlayNext}
            className={`btn-autoplay-toggle ${autoPlayNext ? 'active' : ''}`}
            title={autoPlayNext ? "Tự động phát bài kế tiếp: ĐANG BẬT" : "Tự động phát bài kế tiếp: ĐÃ TẮT"}
          >
            <Repeat className="repeat-icon" />
            <span className="autoplay-text">Tự chuyển bài: {autoPlayNext ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Điều chỉnh âm lượng */}
          <div className="volume-control-box">
            <button onClick={handleToggleMute} className="btn-vol-icon">
              {isMuted || volume === 0 ? <VolumeX className="vol-icon" /> : <Volume2 className="vol-icon" />}
            </button>
            <input 
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="volume-range-slider"
              title={`Âm lượng: ${isMuted ? 0 : volume}%`}
            />
          </div>
        </div>
      </div>

      {/* Chi tiết video dưới Player chuẩn phong cách YouTube */}
      {currentSong && (
        <div className="watch-video-meta-section">
          <h1 className="watch-main-title" title={currentSong.title}>
            {currentSong.title}
          </h1>

          <div className="watch-channel-action-row">
            <div className="watch-channel-info-box">
              <div className="watch-channel-avatar-circle">
                {(currentSong.channelTitle || currentSong.artist || 'K')[0].toUpperCase()}
              </div>
              <div className="watch-channel-names">
                <span className="channel-display-name">{currentSong.channelTitle || currentSong.artist}</span>
                <span className="channel-sub-info">YouTube Video Karaoke • Chuẩn HD</span>
              </div>
            </div>

            {onBackToSearch && (
              <button 
                type="button" 
                onClick={onBackToSearch}
                className="btn-back-search"
                title="Quay lại danh sách tìm kiếm để chọn thêm bài hát khác"
              >
                <span>🔍 Tìm thêm bài hát</span>
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .player-wrapper {
          width: 100%;
          background: #0f1524;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
        }

        .player-aspect-box {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .player-active-screen {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .youtube-iframe-container {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
        }

        .youtube-iframe-container iframe,
        .youtube-iframe-container > div {
          width: 100% !important;
          height: 100% !important;
          border: none;
        }

        .hidden-under-error {
          visibility: hidden;
        }

        /* Overlay Messages */
        .player-overlay-message {
          position: absolute;
          inset: 0;
          background: rgba(7, 10, 18, 0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          z-index: 20;
          text-align: center;
        }

        .autoplay-card, .error-card {
          max-width: 480px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 2rem;
          border-radius: 18px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .autoplay-icon {
          width: 44px;
          height: 44px;
          color: var(--accent-pink);
          margin-bottom: 1rem;
          animation: pulse 1.5s infinite;
        }

        .autoplay-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }

        .autoplay-card p {
          font-size: 0.92rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }

        .btn-unblock-play {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--accent-gradient);
          color: white;
          border: none;
          padding: 0.85rem 1.75rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 20px var(--accent-glow);
          transition: transform 0.15s ease;
        }

        .btn-unblock-play:hover {
          transform: scale(1.05);
        }

        .btn-play-icon {
          width: 20px;
          height: 20px;
        }

        /* Error state overlay */
        .error-icon-box {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .error-icon-large {
          width: 32px;
          height: 32px;
        }

        .error-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.4rem;
        }

        .error-reason {
          font-size: 0.92rem;
          color: #cbd5e1;
          margin-bottom: 0.6rem;
          line-height: 1.4;
        }

        .error-code {
          font-size: 0.75rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .error-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-skip-error {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--accent-gradient);
          color: white;
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 4px 15px var(--accent-glow);
        }

        .btn-skip-error:hover {
          opacity: 0.95;
        }

        .btn-open-yt {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-sub);
          border: 1px solid var(--border-subtle);
          padding: 0.65rem 1.15rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
        }

        .btn-open-yt:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .btn-icon-xs {
          width: 16px;
          height: 16px;
        }

        /* Standby State */
        .player-standby-screen {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: radial-gradient(circle at center, #1b253f 0%, #080c16 80%);
          padding: 1.5rem;
          text-align: center;
        }

        .standby-ambient-circle {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
          animation: pulseAmbient 4s ease-in-out infinite alternate;
        }

        @keyframes pulseAmbient {
          0% { transform: scale(0.85); opacity: 0.4; }
          100% { transform: scale(1.15); opacity: 0.8; }
        }

        .standby-content {
          position: relative;
          z-index: 2;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .standby-icon-badge {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f472b6;
          margin-bottom: 1.25rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .standby-mic {
          width: 38px;
          height: 38px;
        }

        .standby-title {
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.6rem;
          letter-spacing: -0.01em;
        }

        .standby-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .btn-sample-play {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--accent-gradient);
          color: white;
          border: none;
          padding: 0.85rem 1.75rem;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 20px var(--accent-glow);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-sample-play:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(236, 72, 153, 0.5);
        }

        .btn-sparkle {
          width: 20px;
          height: 20px;
        }

        .standby-features-badge {
          display: flex;
          gap: 1.2rem;
          margin-top: 1.75rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Player Controls Bar */
        .player-integrated-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: #111827;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .ctrl-group-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-ctrl-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-ctrl-circle:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .btn-ctrl-circle:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .btn-ctrl-main {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--accent-gradient);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
          box-shadow: 0 4px 18px var(--accent-glow);
        }

        .btn-ctrl-main:hover:not(:disabled) {
          transform: scale(1.08);
        }

        .btn-ctrl-main:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ctrl-icon {
          width: 20px;
          height: 20px;
        }

        .ctrl-icon-lg {
          width: 24px;
          height: 24px;
        }

        .ml-1 {
          margin-left: 2px;
        }

        .ctrl-center-info {
          flex: 1;
          min-width: 220px;
        }

        .song-playing-meta {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .now-playing-tag {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .now-playing-tag.playing {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .now-playing-tag.paused {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }

        .now-playing-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 380px;
        }

        .time-badge {
          font-size: 0.82rem;
          font-family: monospace;
          color: var(--text-muted);
          background: rgba(0, 0, 0, 0.35);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .no-playing-text {
          font-size: 0.88rem;
          color: var(--text-muted);
          font-style: italic;
        }

        .ctrl-group-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .btn-autoplay-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-autoplay-toggle.active {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: #34d399;
        }

        .repeat-icon {
          width: 16px;
          height: 16px;
        }

        .volume-control-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-vol-icon {
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .btn-vol-icon:hover {
          color: var(--text-main);
        }

        .vol-icon {
          width: 20px;
          height: 20px;
        }

        .volume-range-slider {
          width: 85px;
          height: 5px;
          accent-color: var(--accent-pink);
          cursor: pointer;
        }

        .watch-video-meta-section {
          padding: 1.25rem 1.5rem;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .watch-main-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.35;
          margin: 0;
        }

        .watch-channel-action-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .watch-channel-info-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .watch-channel-avatar-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .watch-channel-names {
          display: flex;
          flex-direction: column;
        }

        .channel-display-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .channel-sub-info {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .btn-back-search {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: var(--bg-secondary);
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
          padding: 0.55rem 1.1rem;
          border-radius: 20px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.15s;
        }

        .btn-back-search:hover {
          background: var(--bg-hover);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .watch-main-title {
            font-size: 1.15rem;
          }
          .watch-video-meta-section {
            padding: 1rem;
          }
          .player-integrated-controls {
            flex-direction: column;
            align-items: flex-start;
          }
          .ctrl-center-info {
            width: 100%;
          }
          .now-playing-title {
            max-width: 220px;
          }
          .ctrl-group-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};
