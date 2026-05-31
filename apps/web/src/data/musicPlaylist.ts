export interface MusicTrack {
  id: string; // iTunes trackId — preview URL 갱신 시 lookup 키
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
}

export const musicPlaylist: MusicTrack[] = [
  {
    id: '1883592967',
    title: 'Helium Balloon',
    artist: 'Xdinary Heroes',
    album: 'DEAD AND',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ee/de/2f/eede2f38-3a35-414a-14b5-16ec2fd35d90/8809928958163.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4b/c8/82/4bc88291-bc9e-07c4-3332-ca2557affe58/mzaf_8589679659286725541.plus.aac.p.m4a',
  },
  {
    id: '1317911072',
    title: 'My Ordinary Life',
    artist: 'The Living Tombstone',
    album: 'My Ordinary Life - Single',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/75/15/46/7515460e-9a7b-1200-5663-010e82e2cf17/artwork.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/19/fb/cd/19fbcdbe-94fe-764c-2229-24cec1f53a32/mzaf_13716566996445004979.plus.aac.p.m4a',
  },
  {
    id: '1686874596',
    title: 'Shining Road',
    artist: '술탄 오브 더 디스코',
    album: 'Easy Listening For Love',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4d/98/e7/4d98e7bb-05a3-c935-0e55-d22ecd1dfab4/191953033693.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/b9/40/e9/b940e92b-9b7f-d5e2-ad93-5a00b81e951a/mzaf_5499864217531304863.plus.aac.p.m4a',
  },
  {
    id: '1888110751',
    title: '1111',
    artist: '한로로',
    album: '애증 - Single',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/da/20/3f/da203f39-e086-da2b-3344-e770e53b4f8a/8800323979364.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/53/56/e35356dc-1230-65e1-7600-cd2d112610d8/mzaf_12660985028670842405.plus.aac.p.m4a',
  },
  {
    id: '1865062180',
    title: 'Andre99',
    artist: '실리카겔',
    album: 'POWER ANDRE 99',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/42/9c/e6/429ce6b1-2702-18bf-de93-7d1b8b5a666d/8809964653299.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a1/18/11/a118115b-29cc-de48-6778-98db0255f5b6/mzaf_18232567120891197133.plus.aac.p.m4a',
  },
];
