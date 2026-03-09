import { useMemo, useState } from 'react';
import { monitorAssets } from '../../../data/galleryAssets';

export default function SystemContent() {
  const [selectedId, setSelectedId] = useState(monitorAssets[0].id);
  const [showAlert, setShowAlert] = useState(false);
  const selectedAsset = useMemo(
    () => monitorAssets.find((asset) => asset.id === selectedId) ?? monitorAssets[0],
    [selectedId],
  );

  const handleMainImageClick = () => {
    if (selectedId === 'm2') {
      setShowAlert(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="window-heading">Signal Monitor</div>

      <div className="mine-panel space-y-3">
        <div className="mine-topbar">
          <span>LIVE FEED</span>
          <button className="mine-face" type="button" onClick={() => setSelectedId(monitorAssets[0].id)}>
            ↻
          </button>
          <span>{selectedAsset.tag}</span>
        </div>

        <img
          src={selectedAsset.src}
          alt={selectedAsset.name}
          className={`h-[170px] w-full rounded border border-[#6f8fb5] bg-black/45 object-contain p-1${
            selectedId === 'm2' ? ' cursor-pointer' : ''
          }`}
          onClick={handleMainImageClick}
        />

        <div className="text-[12px] font-bold text-[#23466d]">{selectedAsset.name}</div>

        <div className="grid grid-cols-3 gap-1">
          {monitorAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedId(asset.id)}
              className={`mine-cell h-[44px] overflow-hidden !p-0 ${
                selectedId === asset.id ? 'ring-2 ring-[#2c8bff]' : ''
              }`}
              title={asset.name}
            >
              <img src={asset.src} alt={asset.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>

      {showAlert && (
        <div className="easter-alert-overlay" onClick={() => setShowAlert(false)}>
          <div className="easter-alert" onClick={(e) => e.stopPropagation()}>
            <div className="easter-alert-titlebar">
              <span>Warning</span>
              <button type="button" className="easter-alert-close" onClick={() => setShowAlert(false)}>
                ×
              </button>
            </div>
            <div className="easter-alert-body">
              <div className="easter-alert-icon">⚠️</div>
              <div className="easter-alert-message">Your existence will now be erased.</div>
            </div>
            <div className="easter-alert-buttons">
              <button type="button" className="easter-alert-btn" onClick={() => setShowAlert(false)}>
                Finally I'll be free
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
