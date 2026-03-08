import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { fetchPaintings, deletePainting, type PaintingRow } from '../../../services/paintingService';
import { fetchMessages, type MessageRow } from '../../../services/messageService';
import { monitorAssets } from '../../../data/galleryAssets';
import { useSessionStore } from '../../../store/useSessionStore';
import iconFolder from '../../../../assets/images/icon-folder.png';
import { setCurrentVideo, type VideoId } from '../../../data/currentVideo';
import FileItem from './FileItem';

type FolderType = 'root' | 'paintings' | 'memo' | 'gallery' | 'videos';

interface FolderInfo {
  label: string;
  fileCount?: number;
}

const folderMeta: Record<Exclude<FolderType, 'root'>, FolderInfo> = {
  paintings: { label: 'Paintings' },
  memo: { label: 'Memo' },
  gallery: { label: 'Gallery' },
  videos: { label: 'Videos' },
};

export default function MyComputerContent() {
  const [currentFolder, setCurrentFolder] = useState<FolderType>('root');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [paintings, setPaintings] = useState<PaintingRow[]>([]);
  const [memos, setMemos] = useState<MessageRow[]>([]);
  const [isPaintingsLoading, setLoadingPaintings] = useState(false);
  const [isMemosLoading, setLoadingMemos] = useState(false);

  const nickname = useSessionStore((s) => s.nickname);

  const loadPaintings = useCallback(async () => {
    setLoadingPaintings(true);
    try {
      setPaintings(await fetchPaintings());
    } catch {
      /* silently fail */
    } finally {
      setLoadingPaintings(false);
    }
  }, []);

  const loadMemos = useCallback(async () => {
    setLoadingMemos(true);
    try {
      setMemos(await fetchMessages('memo'));
    } catch {
      /* silently fail */
    } finally {
      setLoadingMemos(false);
    }
  }, []);

  useEffect(() => {
    if (currentFolder === 'paintings') loadPaintings();
    if (currentFolder === 'memo') loadMemos();
  }, [currentFolder, loadPaintings, loadMemos]);

  const handleNavigateTo = (folder: FolderType) => {
    setCurrentFolder(folder);
    setSelectedFile(null);
  };

  const handleDeletePainting = async (painting: PaintingRow) => {
    if (!confirm('Delete this painting?')) return;
    try {
      await deletePainting(painting.id, painting.image_url);
      setPaintings((prev) => prev.filter((p) => p.id !== painting.id));
      if (selectedFile === painting.id) setSelectedFile(null);
    } catch {
      /* silently fail */
    }
  };

  const selectedPainting = paintings.find((p) => p.id === selectedFile);
  const selectedGallery = monitorAssets.find((a) => a.id === selectedFile);
  const selectedMemo = memos.find((m) => m.id === selectedFile);

  return (
    <div className="explorer">
      {/* Toolbar row: back, forward, address */}
      <div className="explorer-toolbar-row">
        <div className="explorer-toolbar-buttons">
          <button
            type="button"
            className="explorer-tool-btn"
            onClick={() => handleNavigateTo('root')}
            disabled={currentFolder === 'root'}
            title="Back"
          >
            ◀
          </button>
          <button
            type="button"
            className="explorer-tool-btn"
            disabled
            title="Forward"
          >
            ▶
          </button>
          <span className="explorer-toolbar-sep" />
          <button
            type="button"
            className="explorer-tool-btn"
            onClick={() => {
              if (currentFolder === 'paintings') loadPaintings();
              else if (currentFolder === 'memo') loadMemos();
            }}
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Address bar */}
      <div className="explorer-address-row">
        <span className="explorer-address-label">Address</span>
        <div className="explorer-address-bar">
          <img src={iconFolder} alt="" className="explorer-address-icon" />
          {currentFolder === 'root'
            ? 'C:\\'
            : `C:\\${folderMeta[currentFolder].label}\\`}
        </div>
      </div>

      {/* Main content area */}
      <div className="explorer-body">
        {/* Left sidebar - tree view */}
        <div className="explorer-sidebar">
          <div className="explorer-tree-header">All Folders</div>
          <div className="explorer-tree">
            <div
              className={clsx('explorer-tree-item', { active: currentFolder === 'root' })}
              onClick={() => handleNavigateTo('root')}
            >
              <span className="explorer-tree-icon">🖥️</span> My Computer
            </div>
            {(Object.entries(folderMeta) as [Exclude<FolderType, 'root'>, FolderInfo][]).map(
              ([key, info]) => (
                <div
                  key={key}
                  className={clsx('explorer-tree-item explorer-tree-child', { active: currentFolder === key })}
                  onClick={() => handleNavigateTo(key)}
                >
                  <img src={iconFolder} alt="" className="explorer-tree-folder-icon" />
                  {info.label}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Right content pane */}
        <div className="explorer-main">
          {/* Root folder view */}
          {currentFolder === 'root' && (
            <div className="explorer-folder-grid">
              {(Object.entries(folderMeta) as [Exclude<FolderType, 'root'>, FolderInfo][]).map(
                ([key, info]) => (
                  <div
                    key={key}
                    className="explorer-folder-item"
                    onClick={() => handleNavigateTo(key)}
                  >
                    <img src={iconFolder} alt="" className="explorer-folder-icon" />
                    <div className="explorer-folder-label">{info.label}</div>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Paintings folder */}
          {currentFolder === 'paintings' && (
            <>
              {selectedPainting && (
                <div className="explorer-preview">
                  <img src={selectedPainting.image_url} alt="painting preview" />
                  <button
                    type="button"
                    className="explorer-preview-close"
                    onClick={() => setSelectedFile(null)}
                  >
                    X
                  </button>
                </div>
              )}
              <div className="explorer-file-list">
                {isPaintingsLoading && <div className="explorer-empty">Loading...</div>}
                {!isPaintingsLoading && paintings.length === 0 && (
                  <div className="explorer-empty">
                    No paintings yet. Open MS Paint and save your artwork!
                  </div>
                )}
                {paintings.map((painting) => {
                  const base = painting.image_url.split('/').pop()?.replace(/\.png$/i, '') ?? '';
                  const displayName = /^.+_\d{13}$/.test(base)
                    ? `${painting.nickname}'s painting`
                    : (base || `${painting.nickname}'s painting`);
                  return (
                    <FileItem
                      key={painting.id}
                      id={painting.id}
                      isSelected={selectedFile === painting.id}
                      onSelect={() => setSelectedFile(painting.id === selectedFile ? null : painting.id)}
                      thumbnail={<img src={painting.image_url} alt="painting thumbnail" />}
                      name={displayName}
                      subtitle={new Date(painting.created_at).toLocaleString()}
                      onDelete={painting.nickname === nickname ? () => handleDeletePainting(painting) : undefined}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* Memo folder */}
          {currentFolder === 'memo' && (
            <>
              {selectedMemo && (
                <div className="explorer-text-preview">
                  <div className="explorer-text-preview-header">
                    <span>{selectedMemo.nickname}'s memo</span>
                    <button
                      type="button"
                      className="explorer-preview-close"
                      onClick={() => setSelectedFile(null)}
                    >
                      X
                    </button>
                  </div>
                  <div className="explorer-text-preview-body">{selectedMemo.content}</div>
                </div>
              )}
              <div className="explorer-file-list">
                {isMemosLoading && <div className="explorer-empty">Loading...</div>}
                {!isMemosLoading && memos.length === 0 && (
                  <div className="explorer-empty">No memos found.</div>
                )}
                {memos.map((memo) => (
                  <FileItem
                    key={memo.id}
                    id={memo.id}
                    isSelected={selectedFile === memo.id}
                    onSelect={() => setSelectedFile(memo.id === selectedFile ? null : memo.id)}
                    thumbnail={<span className="explorer-memo-icon">📄</span>}
                    name={`${memo.nickname}'s memo`}
                    subtitle={new Date(memo.created_at).toLocaleString()}
                  />
                ))}
              </div>
            </>
          )}

          {/* Videos folder */}
          {currentFolder === 'videos' && (
            <div className="explorer-file-list">
              {(['video-1', 'video-2'] as VideoId[]).map((id) => (
                <FileItem
                  key={id}
                  id={id}
                  isSelected={selectedFile === id}
                  onSelect={() => setSelectedFile(selectedFile === id ? null : id)}
                  onDoubleClick={() => {
                    setCurrentVideo(id);
                    window.dispatchEvent(
                      new CustomEvent('open-window', { detail: { windowType: 'video' } }),
                    );
                  }}
                  thumbnail={<span className="explorer-memo-icon">🎬</span>}
                  name={`${id}.mp4`}
                  subtitle={id === 'video-1' ? '3.2 MB' : '2.8 MB'}
                />
              ))}
            </div>
          )}

          {/* Gallery folder */}
          {currentFolder === 'gallery' && (
            <>
              {selectedGallery && (
                <div className="explorer-preview">
                  <img src={selectedGallery.src} alt={selectedGallery.name} />
                  <button
                    type="button"
                    className="explorer-preview-close"
                    onClick={() => setSelectedFile(null)}
                  >
                    X
                  </button>
                </div>
              )}
              <div className="explorer-file-list">
                {monitorAssets.map((asset) => (
                  <FileItem
                    key={asset.id}
                    id={asset.id}
                    isSelected={selectedFile === asset.id}
                    onSelect={() => setSelectedFile(asset.id === selectedFile ? null : asset.id)}
                    thumbnail={<img src={asset.src} alt={asset.name} />}
                    name={asset.name}
                    subtitle={`[${asset.tag}]`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="explorer-statusbar">
        <span>
          {currentFolder === 'root' && '4 object(s)'}
          {currentFolder === 'paintings' && `${paintings.length} object(s)`}
          {currentFolder === 'memo' && `${memos.length} object(s)`}
          {currentFolder === 'gallery' && `${monitorAssets.length} object(s)`}
          {currentFolder === 'videos' && '2 object(s)'}
        </span>
      </div>
    </div>
  );
}
