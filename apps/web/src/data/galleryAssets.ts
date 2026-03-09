import m1Image from '../../assets/images/mood/m1.png';
import m2Image from '../../assets/images/mood/m2.png';
import m3Image from '../../assets/images/mood/m3.png';
import m4Image from '../../assets/images/mood/m4.jpg';
import m8Image from '../../assets/images/mood/m8.png';
import m9Image from '../../assets/images/mood/m9.png';
import m10Image from '../../assets/images/mood/m10.gif';
import m11Image from '../../assets/images/mood/m11.png';
import m13Image from '../../assets/images/mood/m13.png';

export interface GalleryAsset {
  id: string;
  name: string;
  src: string;
  tag: string;
}

export const monitorAssets: GalleryAsset[] = [
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
