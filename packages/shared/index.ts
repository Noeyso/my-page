// @my-page/shared — 공유 패키지 엔트리포인트

// Types
export type { PixelDecoration } from './types/desktop';
export type { WindowType, WindowPosition, ManagedWindow, WindowRegistryItem, WindowRegistry } from './types/window';
export type { AppDefinition, GalleryAsset, VideoId } from './types/app';

// Lib
export { supabase } from './lib/supabase';

// Store
export { useSessionStore } from './store/useSessionStore';

// Services
export { fetchEvents, addEvent, deleteEvent, updateEvent } from './services/calendarService';
export type { CalendarEventRow } from './services/calendarService';

export { fetchCommentLikes, toggleCommentLike } from './services/commentLikeService';
export type { CommentLikeState } from './services/commentLikeService';

export { fetchComments, fetchAllCommentCounts, addComment, deleteComment } from './services/commentService';
export type { CommentRow } from './services/commentService';

export {
  recordVisit,
  fetchVisitorCount,
  fetchIlchon,
  addIlchon,
  removeIlchon,
  checkIlchon,
  checkIlchonPending,
  fetchPendingIlchon,
  fetchAcceptedIlchon,
  acceptIlchon,
  rejectIlchon,
  fetchIlchonPyeong,
  addIlchonPyeong,
  deleteIlchonPyeong,
  fetchGuestbook,
  addGuestbook,
  deleteGuestbook,
} from './services/cyworldService';
export type { VisitorCount, IlchonRow, IlchonPyeongRow, GuestbookRow } from './services/cyworldService';

export { fetchLikes, fetchAllLikes, toggleLike } from './services/likeService';
export type { LikeRow } from './services/likeService';

export { sendMessage, fetchMessages } from './services/messageService';
export type { MessageRow } from './services/messageService';

export { NEWS_CATEGORIES, fetchNews } from './services/newsService';
export type { NewsItem } from './services/newsService';

export { getDefaultPaintingName, savePainting, fetchPaintings, deletePainting } from './services/paintingService';
export type { PaintingRow } from './services/paintingService';

export { fetchTopScores, submitScore } from './services/tetrisScoreService';
export type { TetrisScoreRow } from './services/tetrisScoreService';

// Data
export { pixelDecorations } from './data/decorations';
export { getHolidaysForYear, getHolidaysForMonth, getHolidayName, isHoliday } from './data/koreanHolidays';
export { VIRTUAL_FS, deepCloneFS, resolvePath, formatSize, getPrompt } from './data/virtualFileSystem';
export type { FSNode } from './data/virtualFileSystem';

// Hooks
export { useCanvasResize } from './hooks/useCanvasResize';
export { useGameLoop } from './hooks/useGameLoop';
export { useLocalStorageState } from './hooks/useLocalStorageState';
export { usePaintingLogic } from './hooks/usePaintingLogic';
export { default as useWindowManager } from './hooks/useWindowManager';
