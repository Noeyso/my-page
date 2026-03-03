import { useState } from 'react';
import bgImage from '../../../../assets/mood/bg.png';
import m1Image from '../../../../assets/mood/m1.png';
import m2Image from '../../../../assets/mood/m2.png';
import m3Image from '../../../../assets/mood/m3.png';
import m4Image from '../../../../assets/mood/m4.jpg';
import m8Image from '../../../../assets/mood/m8.png';
import m9Image from '../../../../assets/mood/m9.png';
import m10Image from '../../../../assets/mood/m10.gif';
import m11Image from '../../../../assets/mood/m11.png';
import m12Image from '../../../../assets/mood/m12.png';
import m13Image from '../../../../assets/mood/m13.png';

const galleryItems = [
  { id: 'm1', name: 'Glitch TV', src: m1Image, type: 'PNG' },
  { id: 'm2', name: 'Door Portal', src: m2Image, type: 'PNG' },
  { id: 'm3', name: 'HELP Screen', src: m3Image, type: 'PNG' },
  { id: 'm4', name: 'Sky Vehicle', src: m4Image, type: 'JPG' },
  { id: 'm8', name: 'Communication', src: m8Image, type: 'PNG' },
  { id: 'm9', name: 'Static Mountain', src: m9Image, type: 'PNG' },
  { id: 'm10', name: 'UFO Feed', src: m10Image, type: 'GIF' },
  { id: 'm11', name: 'Wire Globe', src: m11Image, type: 'PNG' },
  { id: 'm12', name: 'User Generated', src: m12Image, type: 'PNG' },
  { id: 'm13', name: 'Suit Figure', src: m13Image, type: 'PNG' },
  { id: 'bg', name: 'Base Scene', src: bgImage, type: 'PNG' },
];

export default function GalleryContent() {
  const [selectedId, setSelectedId] = useState(galleryItems[0].id);
  const selectedItem = galleryItems.find((item) => item.id === selectedId) ?? galleryItems[0];

  return (
    <div className="space-y-3">
      <div className="window-heading">Artifact Shelf</div>

      <div className="text-[11px] tracking-[0.08em] text-[#355986]">Click thumbnail to inspect</div>

      <div className="grid grid-cols-[1fr_1.25fr] gap-3">
        <div className="grid grid-cols-3 gap-2">
          {galleryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`h-[70px] overflow-hidden rounded border p-0 ${
                selectedItem.id === item.id ? 'border-[#2c8bff] shadow-[0_0_10px_rgba(44,139,255,0.45)]' : 'border-[#6f8fb5]'
              }`}
              title={item.name}
            >
              <img src={item.src} alt={item.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <div className="inset-box space-y-2">
          <img src={selectedItem.src} alt={selectedItem.name} className="h-[188px] w-full rounded object-contain bg-black/45" />
          <div className="text-[12px] font-bold text-[#23466d]">{selectedItem.name}</div>
          <div className="text-[11px] text-[#4b6f97]">
            {selectedItem.id}.{selectedItem.type.toLowerCase()} - mood asset preview
          </div>
        </div>
      </div>
    </div>
  );
}
