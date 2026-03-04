import { useMemo, useState } from 'react';
import { monitorAssets } from '../../../data/galleryAssets';

export default function SystemContent() {
  const [selectedId, setSelectedId] = useState(monitorAssets[0].id);
  const selectedAsset = useMemo(
    () => monitorAssets.find((asset) => asset.id === selectedId) ?? monitorAssets[0],
    [selectedId],
  );

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
          className="h-[170px] w-full rounded border border-[#6f8fb5] bg-black/45 object-contain p-1"
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
              <img src={asset.src} alt={asset.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
