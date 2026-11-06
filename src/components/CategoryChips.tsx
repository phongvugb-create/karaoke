import React from 'react';

const CATEGORIES = [
  'Tất cả',
  'Bolero trữ tình',
  'Nhạc trẻ remix',
  'Song ca nam nữ',
  'Acoustic nhẹ nhàng',
  'Nhạc sống thôn quê',
  'Ballad sâu lắng',
  'Nhạc tiền chiến',
  'Karaoke thiếu nhi'
];

interface CategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="chips-container" role="region" aria-label="Thể loại bài hát">
      <div className="chips-scroll">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              className={`category-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <style>{`
        .chips-container {
          width: 100%;
          margin-bottom: 0.85rem;
          position: relative;
        }

        .chips-scroll {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          /* Padding hai bên đảm bảo chip đầu và cuối không bao giờ bị cắt mép */
          padding: 0.4rem 0.85rem;
          scroll-padding: 0.85rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .category-chip {
          white-space: nowrap;
          padding: 0.5rem 1.05rem;
          min-height: 40px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          background-color: var(--bg-secondary);
          color: var(--text-sub);
          border: 1px solid var(--border-medium);
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .category-chip:hover {
          background-color: var(--bg-hover);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .category-chip.selected {
          background-color: var(--accent-red);
          color: #ffffff;
          border-color: var(--accent-red);
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
        }

        @media (max-width: 768px) {
          .chips-scroll {
            padding: 0.35rem 0.65rem;
            scroll-padding: 0.65rem;
            gap: 0.5rem;
          }
          .category-chip {
            padding: 0.45rem 0.85rem;
            font-size: 0.85rem;
            min-height: 38px;
          }
        }

        @media (max-width: 360px) {
          .chips-scroll {
            padding: 0.25rem 0.5rem;
            scroll-padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
