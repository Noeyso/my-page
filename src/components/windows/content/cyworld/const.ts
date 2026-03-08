export type CyTab = 'home' | 'profile' | 'diary' | 'jukebox' | 'photo' | 'board' | 'guestbook';

export const TAB_LIST: { id: CyTab; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'profile', label: '프로필' },
  { id: 'diary', label: '다이어리' },
  { id: 'jukebox', label: '쥬크박스' },
  { id: 'photo', label: '사진첩' },
  { id: 'board', label: '게시판' },
  { id: 'guestbook', label: '방명록' },
];

export const MOODS = ['행복', '신남', '그냥', '우울', '파이팅', '졸림', '설렘', '분노'];

export const RECENT_NEWS = [
  { icon: '📢', text: '맘에 드는 아이템을 쇼핑상...', category: '쥬크박스', count: '0/2' },
  { icon: '🎵', text: '내 계정은 미니미...', category: '사진첩', count: '10/64' },
  { icon: '🆕', text: '스킨, 메뉴효과 예약기능 출시!', category: '방명록', count: '22/155' },
  { icon: '✨', text: '더욱 편리해진 사용중 아이템', category: '게시판', count: '0/3' },
];

export const ILCHON_PYEONG = [
  { author: 'hyeon', content: '하이~', date: '06.15' },
  { author: 'jeong', content: '미니미 이쁘다~', date: '06.10' },
  { author: 'moon', content: '일촌맺어요~ㅎ', date: '06.07' },
];

export const FRIEND_SUGGEST = [
  { name: '보라', avatar: '👩‍🦰', mutual: 3 },
  { name: '지훈', avatar: '👨', mutual: 5 },
  { name: '예린', avatar: '👧', mutual: 2 },
  { name: '태민', avatar: '🧑', mutual: 4 },
];

export const DIARY_ENTRIES = [
  { date: '2009.06.15', title: '오늘 날씨가 너무 좋다 ☀️', mood: '🌞' },
  { date: '2009.06.12', title: '드디어 시험 끝!! 놀러가자~', mood: '🎉' },
  { date: '2009.06.08', title: '비가 오는 날엔 감성이...', mood: '🌧️' },
  { date: '2009.06.03', title: '친구들이랑 노래방 갔다 ㅋㅋ', mood: '🎤' },
];

export const PHOTOS = [
  { id: 1, label: '졸업사진', emoji: '🎓' },
  { id: 2, label: 'MT 사진', emoji: '🏕️' },
  { id: 3, label: '여행사진', emoji: '✈️' },
  { id: 4, label: '셀카', emoji: '🤳' },
  { id: 5, label: '음식사진', emoji: '🍕' },
  { id: 6, label: '풍경', emoji: '🏞️' },
];

export const BOARD_POSTS = [
  { id: 1, title: '오늘 뭐 먹지?', author: '나', date: '06.15', views: 12 },
  { id: 2, title: '추천 노래 있어?', author: '나', date: '06.12', views: 24 },
  { id: 3, title: '주말에 만날 사람~', author: '나', date: '06.08', views: 8 },
];

export const GUESTBOOK_ENTRIES = [
  { author: 'hyeon', avatar: '👦', date: '06.15', content: '하이~' },
  { author: 'jeong', avatar: '🧑', date: '06.10', content: '미니미 이쁘다~' },
  { author: 'moon', avatar: '👩', date: '06.07', content: '일촌맺어요~ㅎ' },
];

export const JUKEBOX_SONGS = [
  { title: 'Y (Please Tell Me Why)', artist: '프리스타일', playing: true },
  { title: 'Abracadabra', artist: 'Brown Eyed Girls', playing: false },
  { title: '거짓말', artist: 'BIGBANG', playing: false },
  { title: '우산 (feat. 윤하)', artist: '에픽하이', playing: false },
  { title: '사랑했나봐', artist: '윤도현', playing: false },
];

export type IlchonEntry = (typeof ILCHON_PYEONG)[number];
export type GuestbookEntry = (typeof GUESTBOOK_ENTRIES)[number];
