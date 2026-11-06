// Khai báo kiểu cho YouTube IFrame Player API
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            rel?: 0 | 1;
            modestbranding?: 0 | 1;
            playsinline?: 0 | 1;
            origin?: string;
            enablejsapi?: 0 | 1;
            [key: string]: unknown;
          };
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getVolume: () => number;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

let isScriptLoading = false;
let isScriptLoaded = false;
const callbacks: (() => void)[] = [];

/**
 * Tải mã kịch bản YouTube IFrame Player API chính thức một cách an toàn
 */
export function loadYouTubeIframeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (isScriptLoaded && window.YT && window.YT.Player) {
      resolve();
      return;
    }

    callbacks.push(resolve);

    if (isScriptLoading) {
      return;
    }

    isScriptLoading = true;

    // Thiết lập hàm callback toàn cục mà script YouTube sẽ gọi khi nạp xong
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      isScriptLoaded = true;
      isScriptLoading = false;
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };

    // Kiểm tra xem script đã có trên DOM chưa
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  });
}

