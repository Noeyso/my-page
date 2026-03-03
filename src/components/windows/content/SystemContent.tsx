import { useMemo, useState } from 'react';
import m1Image from '../../../../assets/mood/m1.png';
import m2Image from '../../../../assets/mood/m2.png';
import m3Image from '../../../../assets/mood/m3.png';
import m4Image from '../../../../assets/mood/m4.jpg';
import m8Image from '../../../../assets/mood/m8.png';
import m9Image from '../../../../assets/mood/m9.png';
import m10Image from '../../../../assets/mood/m10.gif';
import m11Image from '../../../../assets/mood/m11.png';
import m13Image from '../../../../assets/mood/m13.png';

const monitorAssets = [
  { id: 'm1', name: 'Glitch TV Feed', src: m1Image, tag: 'VISUAL' },
  { id: 'm10', name: 'UFO Surveillance', src: m10Image, tag: 'MOTION' },
  { id: 'm11', name: 'Wireframe Globe', src: m11Image, tag: 'SIGNAL' },
  { id: 'm3', name: 'Emergency HELP', src: m3Image, tag: 'ALERT' },
  { id: 'm9', name: 'Static Field', src: m9Image, tag: 'NOISE' },
  { id: 'm13', name: 'Suit Figure', src: m13Image, tag: 'ENTITY' },
  { id: 'm2', name: 'Door Link', src: m2Image, tag: 'PORTAL' },
  { id: 'm4', name: 'Sky Object', src: m4Image, tag: 'ANOMALY' },
  { id: 'm8', name: 'Comms Banner', src: m8Image, tag: 'TEXT' },
];

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
