export interface YouTubeVideoItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishTime?: string;
}

export type SearchErrorType = 
  | 'MISSING_API_KEY' 
  | 'QUOTA_EXCEEDED' 
  | 'INVALID_API_KEY' 
  | 'API_FORBIDDEN'
  | 'YOUTUBE_API_ERROR' 
  | 'SERVER_ERROR' 
  | 'NETWORK_ERROR' 
  | null;

export interface YouTubeSearchResponse {
  items: YouTubeVideoItem[];
  error?: SearchErrorType;
  message?: string;
}

export async function searchYouTubeVideos(query: string, maxResults: number = 12): Promise<YouTubeSearchResponse> {
  const trimmed = query.trim();
  // Chỉ tìm kiếm khi từ khóa có ít nhất 2 ký tự
  if (!trimmed || trimmed.length < 2) {
    return { items: [] };
  }

  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmed)}&maxResults=${maxResults}`);
    const data = await res.json();

    if (!res.ok) {
      return {
        items: [],
        error: data.error || 'YOUTUBE_API_ERROR',
        message: data.message || 'Không thể tải video từ YouTube.'
      };
    }

    return {
      items: data.items || []
    };
  } catch (err: unknown) {
    console.error('Fetch YouTube API network error:', err);
    return {
      items: [],
      error: 'NETWORK_ERROR',
      message: 'Lỗi mạng: Không thể kết nối đến máy chủ backend (Port 3001). Vui lòng kiểm tra server.'
    };
  }
}
