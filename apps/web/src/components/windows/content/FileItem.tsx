import type { ReactNode } from 'react';
import clsx from 'clsx';

interface FileItemProps {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
  thumbnail: ReactNode;
  name: string;
  subtitle: string;
  onDelete?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

export default function FileItem({
  isSelected,
  onSelect,
  thumbnail,
  name,
  subtitle,
  onDelete,
  onDoubleClick,
}: FileItemProps) {
  return (
    <div
      className={clsx('explorer-file-item', { selected: isSelected })}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <div className="explorer-file-thumb">{thumbnail}</div>
      <div className="explorer-file-info">
        <div className="explorer-file-name">{name}</div>
        <div className="explorer-file-date">{subtitle}</div>
      </div>
      {onDelete && (
        <button
          type="button"
          className="explorer-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          title="Delete"
        >
          ✕
        </button>
      )}
    </div>
  );
}
