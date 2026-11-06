import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, type SidebarTab } from './components/Sidebar';
import { CategoryChips } from './components/CategoryChips';
import { SongResults } from './components/SongResults';
import { PlayerArea } from './components/PlayerArea';
import { QueueArea } from './components/QueueArea';
import { RoomModal } from './components/RoomModal';
import { TvModeView } from './components/TvModeView';
import { useDebounce } from './hooks/useDebounce';
import { searchYouTubeVideos, type SearchErrorType } from './services/youtubeService';
import { getSocket, type RoomUserInfo, type RoomData } from './services/socketService';
import type { Song } from './data/mockSongs';
import { MOCK_SEARCH_RESULTS, MOCK_QUEUE_INITIAL, HOT_TRENDING_KARAOKE } from './data/mockSongs';
import { Play, RotateCcw, ArrowLeft, Tv } from 'lucide-react';

const QUEUE_STORAGE_KEY = 'hat_cung_nhau_queue';
const AUTOPLAY_STORAGE_KEY = 'hat_cung_nhau_autoplay_next';
const HISTORY_STORAGE_KEY = 'hat_cung_nhau_history';
const ROOM_STORAGE_KEY = 'hat_cung_nhau_room_code';
const USERNAME_STORAGE_KEY = 'hat_cung_nhau_username';

export function App() {
  // Đọc params từ URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialRoomFromUrl = searchParams.get('room');
  const initialTvFromUrl = searchParams.get('tv') === '1';

  // Trạng thái tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Điều hướng và chế độ xem (Bố cục YouTube: Search View vs Watch Page)
  const [activeTab, setActiveTab] = useState<SidebarTab>('home');
  const [activeView, setActiveView] = useState<'search' | 'watch'>('search');

  // Trạng thái Màn hình TV
  const [isTvMode, setIsTvMode] = useState<boolean>(initialTvFromUrl);

  // Trạng thái Phòng Karaoke Realtime (TV + Điện thoại + Laptop)
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    return initialRoomFromUrl ? initialRoomFromUrl.toUpperCase() : localStorage.getItem(ROOM_STORAGE_KEY);
  });
  const [roomUsers, setRoomUsers] = useState<RoomUserInfo[]>([]);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || (initialTvFromUrl ? 'Màn Hình TV' : 'Người chọn bài');
  });

  // URL LAN của server để tạo mã QR mở được trên điện thoại cùng mạng Wi-Fi
  const [serverLanUrl, setServerLanUrl] = useState<string>('');
  const [lastAddedSong, setLastAddedSong] = useState<{ song: Song; addedBy: string } | null>(null);

  // Trạng thái Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  // Quản lý kích thước màn hình responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lấy thông tin IP LAN từ máy chủ
  useEffect(() => {
    fetch('/api/server-info')
      .then((res) => res.json())
      .then((data) => {
        if (data.fullUrl) {
          setServerLanUrl(data.fullUrl);
        }
      })
      .catch(() => {
        setServerLanUrl(window.location.origin);
      });
  }, []);

  // Lưu userName và roomCode vào localStorage
  useEffect(() => {
    localStorage.setItem(USERNAME_STORAGE_KEY, userName);
  }, [userName]);

  useEffect(() => {
    if (roomCode) {
      localStorage.setItem(ROOM_STORAGE_KEY, roomCode);
    } else {
      localStorage.removeItem(ROOM_STORAGE_KEY);
    }
  }, [roomCode]);

  // Bài hát đang phát & Lịch sử
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [historySongs, setHistorySongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Chế độ demo
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Tùy chọn tự chuyển bài
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Hàng chờ bài hát cá nhân
  const [queue, setQueue] = useState<Song[]>(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Lỗi đọc queue:', e);
    }
    return MOCK_QUEUE_INITIAL;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // ==========================================
  // KẾT NỐI REALTIME SOCKET.IO CHO PHÒNG HÁT
  // ==========================================
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      console.log('Socket.IO kết nối thành công:', socket.id);
      const codeToJoin = roomCode || initialRoomFromUrl;
      if (codeToJoin) {
        socket.emit('join_room', { code: codeToJoin, userName, isTv: isTvMode }, (res: { success: boolean; room?: RoomData; message?: string }) => {
          if (res.success && res.room) {
            setRoomCode(res.room.code);
            setRoomUsers(res.room.users);
            setQueue(res.room.queue);
            if (res.room.currentSong) {
              setCurrentSong(res.room.currentSong);
            }
            showToast(`🎉 Đã kết nối phòng "${res.room.code}"`);
          } else {
            console.warn('Phòng không tồn tại:', res.message);
            if (initialRoomFromUrl) {
              showToast(`⚠️ Không tìm thấy phòng ${initialRoomFromUrl}`);
            }
          }
        });
      }
    };

    const onQueueUpdated = (data: { queue: Song[]; addedSong?: Song; removedSong?: Song; autoStarted?: boolean }) => {
      setQueue(data.queue);
      if (data.addedSong) {
        setLastAddedSong({ song: data.addedSong, addedBy: data.addedSong.requestedBy || 'Ai đó' });
        showToast(`🎵 ${data.addedSong.requestedBy || 'Ai đó'} vừa thêm: "${data.addedSong.title}" vào hàng chờ!`);
      } else if (data.removedSong) {
        showToast(`🗑 Đã xóa bài "${data.removedSong.title}" khỏi hàng chờ`);
      }
    };

    const onCurrentSongChanged = (data: { currentSong: Song | null }) => {
      setCurrentSong(data.currentSong);
      if (data.currentSong) {
        showToast(`▶ TV đang phát: "${data.currentSong.title}"`);
      }
    };

    const onRoomUsersUpdated = (data: { userCount: number; users: RoomUserInfo[] }) => {
      setRoomUsers(data.users);
    };

    const onAutoplayUpdated = (data: { autoPlayNext: boolean }) => {
      setAutoPlayNext(data.autoPlayNext);
    };

    const onQueueActionError = (data: { message: string }) => {
      showToast(`⚠️ ${data.message}`);
    };

    socket.on('connect', onConnect);
    socket.on('queue_updated', onQueueUpdated);
    socket.on('current_song_changed', onCurrentSongChanged);
    socket.on('room_users_updated', onRoomUsersUpdated);
    socket.on('autoplay_updated', onAutoplayUpdated);
    socket.on('queue_action_error', onQueueActionError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('queue_updated', onQueueUpdated);
      socket.off('current_song_changed', onCurrentSongChanged);
      socket.off('room_users_updated', onRoomUsersUpdated);
      socket.off('autoplay_updated', onAutoplayUpdated);
      socket.off('queue_action_error', onQueueActionError);
    };
  }, [roomCode, userName, isTvMode, initialRoomFromUrl, showToast]);

  // Tạo phòng mới (Màn hình TV hoặc Laptop)
  const handleCreateRoom = (hostName: string) => {
    const socket = getSocket();
    socket.emit('create_room', { hostName, isTv: isTvMode }, (res: { success: boolean; room: RoomData }) => {
      if (res.success) {
        setRoomCode(res.room.code);
        setRoomUsers(res.room.users);
        setQueue([]);
        showToast(`🎉 Tạo phòng thành công! Mã phòng: ${res.room.code}`);
      }
    });
  };

  // Tham gia phòng (Điện thoại hoặc Laptop chọn bài)
  const handleJoinRoom = (code: string, joinerName: string) => {
    const socket = getSocket();
    socket.emit('join_room', { code, userName: joinerName, isTv: isTvMode }, (res: { success: boolean; room?: RoomData; message?: string }) => {
      if (res.success && res.room) {
        setRoomCode(res.room.code);
        setRoomUsers(res.room.users);
        setQueue(res.room.queue);
        if (res.room.currentSong) {
          setCurrentSong(res.room.currentSong);
        }
        showToast(`🎉 Đã kết nối đến phòng "${res.room.code}"`);
      } else {
        showToast(`❌ ${res.message || 'Không thể tham gia phòng.'}`);
      }
    });
  };

  // Rời phòng
  const handleLeaveRoom = () => {
    const socket = getSocket();
    socket.disconnect();
    setRoomCode(null);
    setRoomUsers([]);
    showToast('Đã rời phòng hát.');
    setTimeout(() => socket.connect(), 500);
  };

  // Mở cửa sổ TV rời riêng biệt (Pop-out Window kéo sang màn hình TV HDMI)
  const handleOpenPopoutTv = () => {
    let targetCode = roomCode;
    if (!targetCode) {
      // Nếu chưa có phòng, tự tạo phòng rồi mở pop-out
      const socket = getSocket();
      socket.emit('create_room', { hostName: userName, isTv: true }, (res: { success: boolean; room: RoomData }) => {
        if (res.success) {
          setRoomCode(res.room.code);
          window.open(
            `/?tv=1&room=${res.room.code}`,
            'KaraokeTVWindow',
            'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
          );
        }
      });
      return;
    }

    window.open(
      `/?tv=1&room=${targetCode}`,
      'KaraokeTVWindow',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  // Lưu localStorage cá nhân nếu không ở trong phòng
  useEffect(() => {
    if (!roomCode) {
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      } catch {}
    }
  }, [queue, roomCode]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTOPLAY_STORAGE_KEY, JSON.stringify(autoPlayNext));
    } catch {}
  }, [autoPlayNext]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historySongs));
    } catch {}
  }, [historySongs]);

  // Tìm kiếm YouTube Data API v3
  const [youtubeSongs, setYoutubeSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<SearchErrorType>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const performSearch = useCallback(async (query: string) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      setYoutubeSongs([]);
      setIsSearching(false);
      setSearchError(null);
      setErrorMessage('');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setErrorMessage('');

    const res = await searchYouTubeVideos(cleanQuery, 16);
    setIsSearching(false);

    if (res.error) {
      setSearchError(res.error);
      setErrorMessage(res.message || 'Lỗi kết nối máy chủ YouTube');
      setYoutubeSongs([]);
    } else {
      const converted: Song[] = res.items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.channelTitle,
        channelTitle: item.channelTitle,
        thumbnail: item.thumbnail,
        isYouTube: true,
        genre: 'YouTube Karaoke'
      }));
      setYoutubeSongs(converted);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery);
    } else {
      // Khi ô tìm kiếm rỗng, tự động tải các bài Karaoke Hot Trend từ YouTube Data API
      searchYouTubeVideos('karaoke beat hot trend viet nam', 16).then((res) => {
        if (!res.error && res.items.length > 0) {
          const converted: Song[] = res.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.channelTitle,
            channelTitle: item.channelTitle,
            thumbnail: item.thumbnail,
            isYouTube: true,
            genre: 'YouTube Hot Trend'
          }));
          setYoutubeSongs(converted);
        }
      });
    }
  }, [debouncedQuery, performSearch]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'Tất cả') {
      setSearchQuery('');
    } else {
      setSearchQuery(cat);
    }
    setActiveView('search');
    setActiveTab('search');
  };

  // Thao tác phát bài
  const handlePlaySong = (song: Song) => {
    if (currentSong && currentSong.id !== song.id) {
      setHistorySongs((prev) => [currentSong, ...prev.filter(s => s.id !== currentSong.id)].slice(0, 30));
    }
    setCurrentSong(song);

    if (roomCode) {
      const socket = getSocket();
      socket.emit('play_song', { code: roomCode, song });
    } else {
      setQueue((prev) => prev.filter((item) => item.id !== song.id));
    }

    setActiveView('watch');
    showToast(`▶ Đang phát: "${song.title}"`);
  };

  // Chuyển bài kế tiếp
  const handleNextSong = () => {
    if (roomCode) {
      const socket = getSocket();
      socket.emit('next_song', { code: roomCode });
    } else {
      if (queue.length > 0) {
        const nextSong = queue[0];
        if (currentSong) {
          setHistorySongs((prev) => [currentSong, ...prev.filter(s => s.id !== currentSong.id)].slice(0, 30));
        }
        setCurrentSong(nextSong);
        setQueue((prev) => prev.slice(1));
        showToast(`⏭ Bài tiếp theo: "${nextSong.title}"`);
      } else {
        showToast('⚠️ Hàng chờ đã hết bài!');
      }
    }
  };

  // Quay lại bài trước
  const handlePreviousSong = () => {
    if (historySongs.length > 0) {
      const prevSong = historySongs[0];
      setHistorySongs((prev) => prev.slice(1));
      if (currentSong) {
        if (roomCode) {
          const socket = getSocket();
          socket.emit('add_to_queue', { code: roomCode, song: currentSong, requestedBy: userName, priority: true });
        } else {
          setQueue((prev) => [currentSong, ...prev]);
        }
      }
      setCurrentSong(prevSong);
      showToast(`⏮ Quay lại: "${prevSong.title}"`);
    } else {
      showToast('Không có bài hát trước đó.');
    }
  };

  // Thêm bài vào hàng chờ (Đồng bộ phòng realtime nếu có phòng)
  const handleAddToQueue = (song: Song, priority = false) => {
    if (queue.some((s) => s.id === song.id)) {
      showToast(`⚠️ Video "${song.title}" đã nằm trong hàng chờ!`);
      return;
    }

    const requestedName = userName || 'Khách chọn bài';

    if (roomCode) {
      const socket = getSocket();
      socket.emit('add_to_queue', {
        code: roomCode,
        song,
        requestedBy: requestedName,
        priority
      });
      showToast(`✓ Đã gửi "${song.title}" lên TV phòng ${roomCode}`);
    } else {
      setQueue((prev) => priority ? [{ ...song, requestedBy: requestedName }, ...prev] : [...prev, { ...song, requestedBy: requestedName }]);
      showToast(`✓ Đã thêm "${song.title}" vào hàng chờ`);
    }
  };

  // Xóa bài khỏi hàng chờ
  const handleRemoveFromQueue = (id: string) => {
    if (roomCode) {
      const socket = getSocket();
      socket.emit('remove_from_queue', { code: roomCode, songId: id });
    } else {
      const song = queue.find((s) => s.id === id);
      setQueue((prev) => prev.filter((s) => s.id !== id));
      showToast(`🗑 Đã xóa "${song?.title || 'bài hát'}" khỏi hàng chờ`);
    }
  };

  // Di chuyển bài hát
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index - 1];
    newQueue[index - 1] = temp;

    if (roomCode) {
      const socket = getSocket();
      socket.emit('reorder_queue', { code: roomCode, videoIds: newQueue.map(s => s.id) });
    } else {
      setQueue(newQueue);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index + 1];
    newQueue[index + 1] = temp;

    if (roomCode) {
      const socket = getSocket();
      socket.emit('reorder_queue', { code: roomCode, videoIds: newQueue.map(s => s.id) });
    } else {
      setQueue(newQueue);
    }
  };

  const handleReorder = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    const newQueue = [...queue];
    const [dragged] = newQueue.splice(dragIndex, 1);
    newQueue.splice(hoverIndex, 0, dragged);

    if (roomCode) {
      const socket = getSocket();
      socket.emit('reorder_queue', { code: roomCode, videoIds: newQueue.map(s => s.id) });
    } else {
      setQueue(newQueue);
    }
  };

  const handleClearQueue = () => {
    if (roomCode) {
      const socket = getSocket();
      socket.emit('clear_queue', { code: roomCode });
    } else {
      setQueue([]);
    }
    showToast('🧹 Đã xóa toàn bộ hàng chờ');
  };

  const handleAddSampleQueue = () => {
    if (roomCode) {
      MOCK_QUEUE_INITIAL.forEach((song) => {
        handleAddToQueue(song);
      });
    } else {
      setQueue(MOCK_QUEUE_INITIAL);
    }
    showToast('✨ Đã nạp lại bài hát mẫu vào hàng chờ');
  };

  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      showToast(next ? '★ Đã bật danh sách bài hát mẫu' : 'Đã quay lại tìm kiếm YouTube thật');
      return next;
    });
  };

  // URL liên kết để quét mã QR (Ưu tiên IP LAN Wi-Fi để điện thoại quét mở được ngay)
  const baseUrlForJoin = serverLanUrl || window.location.origin;
  const currentJoinUrl = roomCode ? `${baseUrlForJoin}/?room=${roomCode}` : '';

  const isSearchActive = searchQuery.trim().length >= 2;
  const displayedSongs = isSearchActive 
    ? youtubeSongs 
    : (youtubeSongs.length > 0 ? youtubeSongs : HOT_TRENDING_KARAOKE);

  // ==========================================
  // NẾU ĐANG Ở CHẾ ĐỘ MÀN HÌNH TV (CỬA SỔ 1)
  // ==========================================
  if (isTvMode) {
    return (
      <TvModeView 
        roomCode={roomCode || 'KARA'}
        currentSong={currentSong}
        queue={queue}
        autoPlayNext={autoPlayNext}
        onNextSong={handleNextSong}
        onCloseTvMode={() => setIsTvMode(false)}
        onSelectSampleSong={() => handlePlaySong(MOCK_SEARCH_RESULTS[0])}
        joinUrl={currentJoinUrl || `${baseUrlForJoin}/?room=${roomCode || 'KARA'}`}
        lastAddedSong={lastAddedSong}
      />
    );
  }

  // ==========================================
  // GIAO DIỆN CHỌN BÀI CHO ĐIỆN THOẠI & LAPTOP (CỬA SỔ 2)
  // ==========================================
  return (
    <div className="yt-app-layout">
      {/* 1. Header cố định trên cùng */}
      <Header 
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          performSearch(searchQuery);
          setActiveView('search');
          setActiveTab('search');
        }}
        onClearSearch={() => setSearchQuery('')}
        isLoading={isSearching}
        queueCount={queue.length}
        onOpenQueue={() => {
          setActiveTab('queue');
          if (currentSong) {
            setActiveView('watch');
          } else {
            setActiveView('search');
          }
        }}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onGoHome={() => {
          setActiveTab('home');
          setActiveView('search');
          setSearchQuery('');
        }}
        isPlayingNow={!!currentSong}
        currentSongTitle={currentSong?.title}
        onOpenWatchPage={() => setActiveView('watch')}
        roomCode={roomCode}
        onOpenRoomModal={() => setRoomModalOpen(true)}
        onOpenTvMode={() => setIsTvMode(true)}
      />

      {/* 2. Thân trang: Sidebar bên trái + Khu vực nội dung chính */}
      <div className="yt-body-container">
        {/* Sidebar điều hướng có thể thu gọn */}
        <Sidebar 
          isOpen={sidebarOpen}
          isMobile={isMobile}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'home' || tab === 'search') {
              setActiveView('search');
            } else if (tab === 'queue') {
              if (currentSong) setActiveView('watch');
            }
          }}
          onCloseMobile={() => setSidebarOpen(false)}
          queueCount={queue.length}
          historyCount={historySongs.length}
        />

        {/* Nội dung chính */}
        <main className={`yt-main-content ${activeView === 'watch' ? 'watch-mode' : 'search-mode'}`}>
          
          {/* Banner thông báo bài đang phát hoặc trạng thái kết nối TV */}
          {activeView === 'search' && (
            <div className="now-playing-banner">
              <div className="banner-left">
                {currentSong ? (
                  <>
                    <span className="live-badge-glow">
                      {roomCode ? 'TV ĐANG PHÁT' : 'ĐANG PHÁT'}
                    </span>
                    <span className="banner-song-title" title={currentSong.title}>
                      {currentSong.title}
                    </span>
                    <span className="banner-channel">• {currentSong.channelTitle}</span>
                  </>
                ) : (
                  <>
                    <span className="live-badge-glow tv-badge">
                      {roomCode ? `PHÒNG TV [${roomCode}]` : 'HÁT CÙNG NHAU'}
                    </span>
                    <span className="banner-song-title">
                      {roomCode 
                        ? `Đã kết nối với TV phòng ${roomCode} - Chọn bài để đưa lên màn hình!` 
                        : 'Mẹo: Nhấn "Kết nối TV" ở góc trên để mời bạn bè cùng chọn bài bằng điện thoại!'}
                    </span>
                  </>
                )}
              </div>

              <div className="banner-actions">
                {roomCode ? (
                  <button 
                    type="button" 
                    onClick={() => setIsTvMode(true)}
                    className="btn-go-tv-mode"
                    title="Phóng to toàn màn hình TV này"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Mở màn hình TV</span>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setRoomModalOpen(true)}
                    className="btn-go-tv-mode"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Kết nối TV</span>
                  </button>
                )}

                {currentSong && (
                  <button 
                    type="button" 
                    onClick={() => setActiveView('watch')}
                    className="btn-go-watch-page"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Xem Player</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              A. TRANG XEM VIDEO (WATCH PAGE)
             ======================================================== */}
          {activeView === 'watch' && (
            <div className="watch-page-layout">
              {/* Cột Trái: Player lớn 16:9 + Tiêu đề + Kênh + Điều khiển phát */}
              <div className="watch-primary-column">
                <div className="watch-nav-back">
                  <button 
                    type="button"
                    onClick={() => setActiveView('search')}
                    className="btn-back-to-browse"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại trang tìm kiếm</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsTvMode(true)}
                    className="btn-launch-tv-mode"
                    title="Bật chế độ TV toàn màn hình để mọi người nhìn vào hát"
                  >
                    <Tv className="w-4 h-4 text-red-400" />
                    <span>Bật Màn Hình TV (Toàn màn hình)</span>
                  </button>
                </div>

                <PlayerArea 
                  currentSong={currentSong}
                  hasPrevious={historySongs.length > 0}
                  hasNext={queue.length > 0}
                  autoPlayNext={autoPlayNext}
                  onToggleAutoPlayNext={() => {
                    const nextVal = !autoPlayNext;
                    setAutoPlayNext(nextVal);
                    if (roomCode) {
                      const socket = getSocket();
                      socket.emit('toggle_autoplay', { code: roomCode, autoPlayNext: nextVal });
                    }
                    showToast(`🔁 Tự động phát bài kế tiếp: ${nextVal ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}`);
                  }}
                  onNext={handleNextSong}
                  onPrevious={handlePreviousSong}
                  onSelectSampleSong={() => handlePlaySong(MOCK_SEARCH_RESULTS[0])}
                  onBackToSearch={() => setActiveView('search')}
                />
              </div>

              {/* Cột Phải: Hàng chờ bài hát đồng bộ thời gian thực */}
              <aside className="watch-secondary-column">
                <QueueArea 
                  queue={queue}
                  currentSongId={currentSong?.id}
                  onPlaySong={handlePlaySong}
                  onRemove={handleRemoveFromQueue}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onReorder={handleReorder}
                  onClearQueue={handleClearQueue}
                  onAddSampleQueue={handleAddSampleQueue}
                />
              </aside>
            </div>
          )}

          {/* ========================================================
              B. TRANG TÌM KIẾM (SEARCH & BROWSE PAGE)
             ======================================================== */}
          {activeView === 'search' && activeTab !== 'history' && activeTab !== 'queue' && (
            <div className="search-page-layout">
              {/* Dải Thể Loại Gợi Ý Nhanh (Category Chips) */}
              <CategoryChips 
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />

              {/* Danh sách kết quả theo phong cách YouTube */}
              <SongResults 
                songs={displayedSongs}
                searchQuery={searchQuery}
                isLoading={isSearching}
                error={searchError}
                errorMessage={errorMessage}
                isDemoMode={isDemoMode}
                onToggleDemoMode={handleToggleDemoMode}
                onPlaySong={handlePlaySong}
                onAddToQueue={handleAddToQueue}
                onRetry={() => performSearch(debouncedQuery)}
              />
            </div>
          )}

          {/* ========================================================
              C. TAB HÀNG CHỜ TOÀN MÀN HÌNH (KHI BẤM SIDEBAR HÀNG CHỜ)
             ======================================================== */}
          {activeView === 'search' && activeTab === 'queue' && (
            <div className="queue-full-tab">
              <QueueArea 
                queue={queue}
                currentSongId={currentSong?.id}
                onPlaySong={handlePlaySong}
                onRemove={handleRemoveFromQueue}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onReorder={handleReorder}
                onClearQueue={handleClearQueue}
                onAddSampleQueue={handleAddSampleQueue}
              />
            </div>
          )}

          {/* ========================================================
              D. TAB LỊCH SỬ XEM & HÁT
             ======================================================== */}
          {activeView === 'search' && activeTab === 'history' && (
            <div className="history-tab-layout">
              <div className="history-header">
                <h2 className="history-title">Lịch Sử Bài Hát Đã Phát</h2>
                {historySongs.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setHistorySongs([]);
                      showToast('Đã xóa lịch sử hát');
                    }}
                    className="btn-clear-history"
                  >
                    Xóa toàn bộ lịch sử
                  </button>
                )}
              </div>

              {historySongs.length === 0 ? (
                <div className="history-empty">
                  <RotateCcw className="w-12 h-12 text-gray-500 mb-3" />
                  <h3>Chưa có bài hát nào trong lịch sử</h3>
                  <p>Khi bạn chọn phát một video karaoke, video đó sẽ được lưu lại tại đây.</p>
                </div>
              ) : (
                <div className="history-list">
                  {historySongs.map((song) => (
                    <div key={song.id} className="history-item-row" onClick={() => handlePlaySong(song)}>
                      <img src={song.thumbnail} alt={song.title} className="history-thumb" />
                      <div className="history-meta">
                        <h4 className="history-song-title">{song.title}</h4>
                        <p className="history-song-artist">{song.channelTitle || song.artist}</p>
                      </div>
                      <div className="history-actions">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySong(song);
                          }}
                          className="btn-history-play"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Hát lại</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Quản lý Phòng & Kết Nối TV / Điện thoại */}
      <RoomModal 
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        roomCode={roomCode}
        isHost={true}
        users={roomUsers}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        userName={userName}
        setUserName={setUserName}
        onOpenTvMode={() => setIsTvMode(true)}
        onOpenPopoutTv={handleOpenPopoutTv}
        joinUrl={currentJoinUrl}
      />

      {/* Thông báo Toast */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      <style>{`
        .yt-app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
          color: var(--text-main);
        }

        .yt-body-container {
          display: flex;
          flex: 1;
          position: relative;
        }

        .yt-main-content {
          flex: 1;
          min-width: 0;
          padding: 1rem 1.75rem 3rem 1.75rem;
          overflow-y: auto;
        }

        .yt-main-content.watch-mode {
          padding: 1.25rem 2.5rem 3rem 2.5rem;
          max-width: 1800px;
          margin: 0 auto;
        }

        /* Banner thông báo bài đang phát hoặc kết nối TV */
        .now-playing-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(220, 38, 38, 0.35);
          border-radius: 14px;
          padding: 0.75rem 1.25rem;
          margin-bottom: 1.25rem;
          backdrop-filter: blur(8px);
          gap: 1rem;
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          overflow: hidden;
          white-space: nowrap;
        }

        .live-badge-glow {
          background: var(--accent-red);
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .live-badge-glow.tv-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .banner-song-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .banner-channel {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .banner-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .btn-go-tv-mode {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 0.45rem 0.9rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-go-tv-mode:hover {
          background: rgba(239, 68, 68, 0.3);
          color: white;
        }

        .btn-go-watch-page {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--accent-red);
          color: white;
          padding: 0.45rem 1rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.82rem;
          white-space: nowrap;
          transition: background-color 0.15s;
        }

        .btn-go-watch-page:hover {
          background: var(--accent-red-hover);
        }

        /* ================= Bố Cục Trang Xem Video (Watch Page) ================= */
        .watch-page-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 1.75rem;
          align-items: start;
        }

        .watch-primary-column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .watch-nav-back {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .btn-back-to-browse {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-muted);
          font-size: 0.88rem;
          font-weight: 600;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .btn-back-to-browse:hover {
          background: var(--bg-secondary);
          color: var(--text-main);
        }

        .btn-launch-tv-mode {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 0.4rem 0.85rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-launch-tv-mode:hover {
          background: var(--accent-red);
          color: white;
        }

        .watch-secondary-column {
          position: sticky;
          top: 72px;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 90px);
        }

        /* ================= Bố Cục Trang Tìm Kiếm ================= */
        .search-page-layout {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .queue-full-tab {
          max-width: 800px;
          margin: 0 auto;
        }

        /* Tab Lịch sử */
        .history-tab-layout {
          max-width: 850px;
          margin: 0 auto;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .history-title {
          font-size: 1.4rem;
          font-weight: 700;
        }

        .btn-clear-history {
          color: #ef4444;
          font-size: 0.88rem;
          font-weight: 600;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.35rem 0.85rem;
          border-radius: 8px;
          transition: background-color 0.15s;
        }

        .btn-clear-history:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .history-empty {
          background: var(--bg-surface);
          border: 1px dashed var(--border-subtle);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .history-item-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 0.65rem;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .history-item-row:hover {
          background: var(--bg-secondary);
        }

        .history-thumb {
          width: 140px;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 8px;
        }

        .history-meta {
          flex: 1;
          min-width: 0;
        }

        .history-song-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-song-artist {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .btn-history-play {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--accent-red);
          color: white;
          padding: 0.45rem 0.85rem;
          border-radius: 16px;
          font-size: 0.82rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Toast thông báo */
        .toast-notification {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid var(--accent-red);
          color: #ffffff;
          padding: 0.85rem 1.4rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          z-index: 200;
          font-weight: 600;
          font-size: 0.92rem;
          backdrop-filter: blur(8px);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive Mobile / Tablet Layout */
        @media (max-width: 1100px) {
          .watch-page-layout {
            grid-template-columns: 1fr;
          }
          .watch-secondary-column {
            position: static;
            height: auto;
            margin-top: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .yt-main-content {
            padding: 0.75rem 0.65rem 3.5rem 0.65rem;
          }
          .yt-main-content.watch-mode {
            padding: 0.65rem 0.45rem 3.5rem 0.45rem;
          }
          .now-playing-banner {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            padding: 0.75rem;
          }
          .banner-left {
            width: 100%;
          }
          .banner-actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .btn-go-tv-mode, .btn-go-watch-page {
            width: 100%;
            justify-content: center;
            min-height: 42px;
          }
          .toast-notification {
            left: 0.75rem;
            right: 0.75rem;
            bottom: 0.75rem;
            text-align: center;
          }
        }

        @media (max-width: 360px) {
          .yt-main-content {
            padding: 0.65rem 0.35rem 3.5rem 0.35rem;
          }
          .banner-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
