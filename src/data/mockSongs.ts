export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  thumbnail: string;
  genre?: string;
  views?: string;
  requestedBy?: string;
  channelTitle?: string;
  isYouTube?: boolean;
}

// Danh sách các video Karaoke Hot Trend thực tế trên YouTube, có thumbnail chuẩn từ YouTube
export const HOT_TRENDING_KARAOKE: Song[] = [
  {
    id: '8LXu8LrbvgA',
    title: 'KARAOKE | Ai Chung Tình Được Mãi Tone Nữ Beat Chuẩn',
    artist: 'karaoke Lâm Nguyễn HD',
    channelTitle: 'karaoke Lâm Nguyễn HD',
    duration: '05:15',
    thumbnail: 'https://i.ytimg.com/vi/8LXu8LrbvgA/hqdefault.jpg',
    genre: 'Hot Trend / Ballad',
    isYouTube: true,
    views: '18M lượt xem'
  },
  {
    id: 'k1O-Qp7Zq_k',
    title: 'Cắt Đôi Nỗi Sầu (Karaoke Beat Gốc Tone Nam)',
    artist: 'Tăng Duy Tân',
    channelTitle: 'Big Arts Entertainment',
    duration: '03:15',
    thumbnail: 'https://i.ytimg.com/vi/k1O-Qp7Zq_k/hqdefault.jpg',
    genre: 'Nhạc trẻ remix',
    isYouTube: true,
    views: '25M lượt xem'
  },
  {
    id: 'WdIuN_1xM3k',
    title: 'Bên Trên Tầng Lầu (Karaoke Hạ Tone Nam Beat Chuẩn)',
    artist: 'Tăng Duy Tân',
    channelTitle: 'Karaoke Beat Chuẩn',
    duration: '03:05',
    thumbnail: 'https://i.ytimg.com/vi/WdIuN_1xM3k/hqdefault.jpg',
    genre: 'Nhạc trẻ',
    isYouTube: true,
    views: '32M lượt xem'
  },
  {
    id: 'SxwyB92QA34',
    title: '(KARAOKE LIVE VERSION) HÔM NAY EM CƯỚI RỒI - KHẢI ĐĂNG (THANH HƯNG)',
    artist: 'Khải Đăng Official',
    channelTitle: 'Khải Đăng Official',
    duration: '04:45',
    thumbnail: 'https://i.ytimg.com/vi/SxwyB92QA34/hqdefault.jpg',
    genre: 'Ballad sâu lắng',
    isYouTube: true,
    views: '14M lượt xem'
  },
  {
    id: 'kaZj3varrNc',
    title: 'Yêu Lại Từ Đầu - Khắc Việt | Karaoke Beat Chuẩn Mới Nhất',
    artist: 'Khắc Việt',
    channelTitle: 'KHẮC VIỆT',
    duration: '04:20',
    thumbnail: 'https://i.ytimg.com/vi/kaZj3varrNc/hqdefault.jpg',
    genre: 'Nhạc trẻ bất hủ',
    isYouTube: true,
    views: '29M lượt xem'
  },
  {
    id: 'KBz-kr4cUW8',
    title: 'Một Vòng Việt Nam Karaoke Tone Nam ( D#m ) Beat Phối Chuyên Nghiệp',
    artist: 'Trọng Hiếu / Tùng Dương',
    channelTitle: 'Hiếu Organ',
    duration: '05:02',
    thumbnail: 'https://i.ytimg.com/vi/KBz-kr4cUW8/hqdefault.jpg',
    genre: 'Hào khí Việt Nam',
    isYouTube: true,
    views: '11M lượt xem'
  },
  {
    id: '04ZbJnk_Ob4',
    title: 'Hạt Mưa Vương Vấn Karaoke (Hai Yang Remix) - Beat Cực Sung',
    artist: 'VŨ TRỤ VINAHOUSE',
    channelTitle: 'VŨ TRỤ VINAHOUSE',
    duration: '03:40',
    thumbnail: 'https://i.ytimg.com/vi/04ZbJnk_Ob4/hqdefault.jpg',
    genre: 'Vinahouse Remix',
    isYouTube: true,
    views: '21M lượt xem'
  },
  {
    id: '33oWa3k-uf0',
    title: 'Karaoke Con Đường Xưa Em Đi - Liên Khúc Trữ Tình Nhạc Sống Tone Nam Dễ Hát',
    artist: 'Hoài Phong Organ',
    channelTitle: 'Hoài Phong Organ',
    duration: '06:15',
    thumbnail: 'https://i.ytimg.com/vi/33oWa3k-uf0/hqdefault.jpg',
    genre: 'Bolero trữ tình',
    isYouTube: true,
    views: '35M lượt xem'
  },
  {
    id: 'dh7bmj1NuYw',
    title: 'KARAOKE | Đến Khi Nào - Yanbi Cover x Khắc Việt | Beat Tone Nam Chuẩn',
    artist: 'ACV Karaoke',
    channelTitle: 'ACV Karaoke',
    duration: '04:10',
    thumbnail: 'https://i.ytimg.com/vi/dh7bmj1NuYw/hqdefault.jpg',
    genre: 'Nhạc trẻ hot',
    isYouTube: true,
    views: '9M lượt xem'
  },
  {
    id: 'ceEW-L8ICv8',
    title: 'Karaoke Em Thua Cô Ta Tone Nữ ( Beat Dễ Hát )',
    artist: 'Thanh Duy Organ',
    channelTitle: 'Thanh Duy Organ',
    duration: '04:50',
    thumbnail: 'https://i.ytimg.com/vi/ceEW-L8ICv8/hqdefault.jpg',
    genre: 'Ballad buồn',
    isYouTube: true,
    views: '8M lượt xem'
  },
  {
    id: 'yQgskNESGd4',
    title: 'Karaoke Bài Ca Kỷ Niệm - Tone Nữ Bbm | Nhạc Sống Huỳnh Lê',
    artist: 'Karaoke Huỳnh Lê',
    channelTitle: 'Karaoke Huỳnh Lê',
    duration: '05:30',
    thumbnail: 'https://i.ytimg.com/vi/yQgskNESGd4/hqdefault.jpg',
    genre: 'Bolero trữ tình',
    isYouTube: true,
    views: '16M lượt xem'
  },
  {
    id: '0gAtpSVdSr4',
    title: 'Thương Biệt Ly Karaoke Tone Nữ ( Rumba Nhạc Trẻ Dễ Hát )',
    artist: 'Karaoke Huỳnh Lê',
    channelTitle: 'Karaoke Huỳnh Lê',
    duration: '04:35',
    thumbnail: 'https://i.ytimg.com/vi/0gAtpSVdSr4/hqdefault.jpg',
    genre: 'Rumba trữ tình',
    isYouTube: true,
    views: '12M lượt xem'
  }
];

export const MOCK_SEARCH_RESULTS: Song[] = HOT_TRENDING_KARAOKE;

export const MOCK_QUEUE_INITIAL: Song[] = [
  HOT_TRENDING_KARAOKE[0],
  HOT_TRENDING_KARAOKE[1]
];
