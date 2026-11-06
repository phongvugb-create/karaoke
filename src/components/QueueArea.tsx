import React, { useState } from 'react';
import { 
  ListMusic, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Music2, 
  GripVertical,
  User,
  Sparkles,
  Play
} from 'lucide-react';
import type { Song } from '../data/mockSongs';

interface QueueAreaProps {
  queue: Song[];
  currentSongId?: string;
  onPlaySong: (song: Song) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onClearQueue: () => void;
  onAddSampleQueue: () => void;
}

export const QueueArea: React.FC<QueueAreaProps> = ({
  queue,
  currentSongId,
  onPlaySong,
  onRemove,
  onMoveUp,
  onMoveDown,
  onReorder,
  onClearQueue,
  onAddSampleQueue
}) => {
  // Trạng thái kéo thả HTML5 Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="queue-container">
      {/* Header của hàng chờ */}
      <div className="queue-header">
        <div className="queue-title-badge">
          <ListMusic className="queue-header-icon" />
          <h2 className="queue-heading">Hàng Chờ Bài Hát</h2>
          <span className="queue-count">{queue.length}</span>
        </div>

        {queue.length > 0 && (
          <button 
            onClick={onClearQueue} 
            className="btn-clear-all"
            title="Xóa toàn bộ bài hát khỏi hàng chờ"
          >
            <Trash2 className="icon-trash" />
            <span>Xóa hết</span>
          </button>
        )}
      </div>

      {/* Danh sách bài hát trong hàng chờ */}
      {queue.length === 0 ? (
        <div className="queue-empty-box">
          <div className="empty-icon-circle">
            <Music2 className="empty-icon" />
          </div>
          <h3 className="empty-title">Hàng Chờ Đang Trống</h3>
          <p className="empty-desc">
            Chưa có bài hát nào được thêm vào hàng chờ. Hãy tìm kiếm bài hát hoặc bấm nút bên dưới để nạp các bài hát mẫu!
          </p>
          <button onClick={onAddSampleQueue} className="btn-add-sample">
            <Plus className="icon-plus" />
            <span>Thêm bài hát mẫu vào hàng chờ</span>
          </button>
          
          <div className="empty-hint">
            <Sparkles className="hint-icon" />
            <span>Hàng chờ được tự động lưu vào trình duyệt (Local Storage)</span>
          </div>
        </div>
      ) : (
        <div className="queue-list-wrapper">
          <div className="queue-helper-tip">
            <span>💡 Mẹo: Nhấn vào bài hoặc nút ▶ để hát, kéo thả để đổi thứ tự</span>
          </div>

          <div className="queue-list">
            {queue.map((song, index) => {
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;
              const isCurrent = song.id === currentSongId;

              return (
                <div 
                  key={`${song.id}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`queue-item ${isCurrent ? 'is-currently-playing' : ''} ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-drag-over' : ''}`}
                >
                  {/* Tay cầm kéo thả Grip */}
                  <div className="queue-grip-handle" title="Kéo để đổi thứ tự bài">
                    <GripVertical className="grip-icon" />
                  </div>

                  {/* Số thứ tự hoặc icon đang phát */}
                  <span className="queue-index">
                    {isCurrent ? <span className="playing-dot" title="Đang phát">▶</span> : `#${index + 1}`}
                  </span>
                  
                  {/* Thumbnail nhỏ kèm nút phát nhanh */}
                  <div 
                    className="queue-thumb-wrap" 
                    onClick={() => onPlaySong(song)}
                    title="Nhấn để phát bài này"
                  >
                    <img 
                      src={song.thumbnail} 
                      alt={song.title} 
                      className="queue-thumb" 
                      loading="lazy" 
                    />
                    <div className="thumb-play-overlay">
                      <Play className="thumb-play-icon" />
                    </div>
                  </div>

                  {/* Thông tin bài hát & Người thêm */}
                  <div className="queue-info" onClick={() => onPlaySong(song)}>
                    <h4 className="queue-song-title" title={song.title}>
                      {song.title}
                    </h4>
                    <div className="queue-song-meta">
                      <span className="queue-artist" title={song.channelTitle || song.artist}>
                        {song.channelTitle || song.artist}
                      </span>
                      {song.requestedBy && (
                        <>
                          <span className="meta-bullet">•</span>
                          <span className="queue-user" title={`Người thêm: ${song.requestedBy}`}>
                            <User className="user-icon-sm" />
                            {song.requestedBy}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bộ nút thao tác: Chọn phát / Lên / Xuống / Xóa */}
                  <div className="queue-actions">
                    {/* Nút Chọn bài phát ngay */}
                    <button 
                      onClick={() => onPlaySong(song)}
                      className={`btn-play-queue-item ${isCurrent ? 'active' : ''}`}
                      title="Chọn bài này phát ngay"
                    >
                      <Play className="play-queue-icon" />
                    </button>

                    {/* Nút di chuyển Lên */}
                    <button 
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className="btn-move btn-move-up"
                      title={index === 0 ? "Đã ở vị trí đầu tiên" : "Di chuyển lên"}
                    >
                      <ChevronUp className="move-icon" />
                    </button>

                    {/* Nút di chuyển Xuống */}
                    <button 
                      onClick={() => onMoveDown(index)}
                      disabled={index === queue.length - 1}
                      className="btn-move btn-move-down"
                      title={index === queue.length - 1 ? "Đã ở vị trí cuối cùng" : "Di chuyển xuống"}
                    >
                      <ChevronDown className="move-icon" />
                    </button>

                    {/* Nút Xóa bài */}
                    <button 
                      onClick={() => onRemove(song.id)}
                      className="btn-remove-song"
                      title="Xóa bài hát khỏi hàng chờ"
                    >
                      <Trash2 className="remove-icon" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .queue-container {
          background: var(--bg-secondary);
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100%;
          min-height: 520px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
        }

        .queue-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-subtle);
        }

        .queue-title-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .queue-header-icon {
          width: 24px;
          height: 24px;
          color: var(--accent-pink);
        }

        .queue-heading {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .queue-count {
          background: var(--accent-gradient);
          color: white;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 0.15rem 0.55rem;
          border-radius: 9999px;
          box-shadow: 0 2px 8px var(--accent-glow);
        }

        .btn-clear-all {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-clear-all:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        .icon-trash {
          width: 15px;
          height: 15px;
        }

        /* Empty State */
        .queue-empty-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .empty-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          margin-bottom: 1.25rem;
        }

        .empty-icon {
          width: 32px;
          height: 32px;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }

        .empty-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          max-width: 340px;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .btn-add-sample {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.35);
          color: #f472b6;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-sample:hover {
          background: rgba(236, 72, 153, 0.25);
          transform: translateY(-1px);
        }

        .icon-plus {
          width: 18px;
          height: 18px;
        }

        .empty-hint {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 1.75rem;
          font-size: 0.78rem;
          color: #64748b;
        }

        .hint-icon {
          width: 14px;
          height: 14px;
          color: #a78bfa;
        }

        /* Queue List */
        .queue-list-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .queue-helper-tip {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
        }

        .queue-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .queue-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 0.85rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }

        .queue-item:hover {
          background: var(--bg-card-hover);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .queue-item.is-currently-playing {
          border-color: var(--accent-pink);
          background: rgba(236, 72, 153, 0.08);
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.2);
        }

        .queue-item.is-dragging {
          opacity: 0.4;
          background: #111827;
          border-style: dashed;
          border-color: var(--accent-pink);
        }

        .queue-item.is-drag-over {
          border-color: var(--accent-pink);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.25);
        }

        .queue-grip-handle {
          color: #64748b;
          cursor: grab;
          display: flex;
          align-items: center;
          padding: 0.2rem;
          transition: color 0.15s ease;
        }

        .queue-grip-handle:hover {
          color: var(--text-main);
        }

        .grip-icon {
          width: 16px;
          height: 16px;
        }

        .queue-index {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-muted);
          min-width: 24px;
          text-align: center;
        }

        .playing-dot {
          color: #f472b6;
          font-size: 0.85rem;
          animation: blink 1.2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .queue-thumb-wrap {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: #000;
          cursor: pointer;
        }

        .queue-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumb-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .queue-thumb-wrap:hover .thumb-play-overlay {
          opacity: 1;
        }

        .thumb-play-icon {
          width: 18px;
          height: 18px;
          color: white;
        }

        .queue-info {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .queue-song-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .queue-song-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-artist {
          color: #cbd5e1;
          font-weight: 500;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-user {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #c084fc;
          font-weight: 600;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-icon-sm {
          width: 12px;
          height: 12px;
        }

        .meta-bullet {
          color: #475569;
        }

        .queue-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-play-queue-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(236, 72, 153, 0.3);
          background: rgba(236, 72, 153, 0.1);
          color: #f472b6;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-play-queue-item:hover, .btn-play-queue-item.active {
          background: var(--accent-gradient);
          color: white;
          border-color: transparent;
        }

        .play-queue-icon {
          width: 14px;
          height: 14px;
          margin-left: 1px;
        }

        .btn-move {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-sub);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-move:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-move:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .move-icon {
          width: 18px;
          height: 18px;
        }

        .btn-remove-song {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.06);
          color: #f87171;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-remove-song:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: white;
        }

        .remove-icon {
          width: 15px;
          height: 15px;
        }

        @media (max-width: 640px) {
          .queue-container {
            min-height: auto;
          }
          .queue-header {
            padding: 0.85rem 1rem;
          }
          .queue-heading {
            font-size: 1.1rem;
          }
          .queue-item {
            gap: 0.5rem;
            padding: 0.65rem 0.5rem;
          }
          .queue-thumb-wrap {
            width: 44px;
            height: 44px;
          }
          .queue-song-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: #ffffff;
          }
          .queue-song-meta {
            font-size: 0.82rem;
            color: #cbd5e1;
          }
          /* Nút thao tác kích thước lớn, dễ bấm bằng ngón tay */
          .btn-move, .btn-remove-song, .btn-play-queue-item {
            width: 36px;
            height: 36px;
            min-width: 36px;
            border-radius: 8px;
          }
          .move-icon, .remove-icon {
            width: 16px;
            height: 16px;
          }
        }

        @media (min-width: 1920px) {
          .queue-heading {
            font-size: 1.6rem;
          }
          .queue-item {
            padding: 0.85rem 1.15rem;
          }
          .queue-song-title {
            font-size: 1.2rem;
          }
          .queue-song-meta {
            font-size: 1rem;
          }
          .queue-thumb-wrap {
            width: 58px;
            height: 58px;
          }
          .btn-move, .btn-remove-song, .btn-play-queue-item {
            width: 40px;
            height: 40px;
          }
          .move-icon, .remove-icon {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
};
