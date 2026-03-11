import { useCallback, useReducer } from 'react';
import type { ManagedWindow, WindowType } from '../types/window';

interface WindowState {
  windows: ManagedWindow[];
  nextZIndex: number;
}

type WindowAction =
  | { type: 'OPEN'; windowType: WindowType }
  | { type: 'CLOSE'; windowId: string }
  | { type: 'FOCUS'; windowId: string }
  | { type: 'MINIMIZE'; windowId: string };

interface UseWindowManagerResult {
  windows: ManagedWindow[];
  openWindow: (windowType: WindowType) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
}

const isMobile = () => window.innerWidth <= 768;

const INITIAL_WINDOWS: ManagedWindow[] = isMobile()
  ? [
      {
        id: 'default-profile',
        type: 'profile',
        zIndex: 200,
        tilt: 0,
        position: { x: 8, y: 50 },
        isMinimized: false,
      },
    ]
  : [
      {
        id: 'default-profile',
        type: 'profile',
        zIndex: 200,
        tilt: -2,
        position: { x: 150, y: 132 },
        isMinimized: false,
      },
      {
        id: 'default-music',
        type: 'music',
        zIndex: 201,
        tilt: -1,
        position: { x: 840, y: 148 },
        isMinimized: false,
      },
      {
        id: 'default-system',
        type: 'gallery',
        zIndex: 202,
        tilt: 0,
        position: { x: 760, y: 360 },
        isMinimized: false,
      },
      {
        id: 'default-chat',
        type: 'chat',
        zIndex: 203,
        tilt: 0,
        position: { x: 460, y: 80 },
        isMinimized: false,
      },
      {
        id: 'default-instagram',
        type: 'instagram',
        zIndex: 204,
        tilt: 1,
        position: { x: 1200, y: 60 },
        isMinimized: false,
      },
      {
        id: 'default-video',
        type: 'video',
        zIndex: 205,
        tilt: 0,
        position: { x: 120, y: 500 },
        isMinimized: false,
      },
    ];

const WINDOW_TILT_BY_TYPE: Record<WindowType, number> = {
  profile: 0,
  chat: 0,
  music: 0,
  memo: 0,
  files: 0,
  gallery: 0,
  mycomputer: 0,
  tetris: 0,
  internet: 0,
  video: 0,
  games: 0,
  minesweeper: 0,
  snake: 0,
  fortress: 0,
  terminal: 0,
  yahoo: 0,
  instagram: 0,
  calendar: 0,
  cyworld: 0,
  'cyworld-shop': 0,
};

const INITIAL_STATE: WindowState = {
  windows: INITIAL_WINDOWS,
  nextZIndex: 206,
};

function getWindowId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function windowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case 'OPEN': {
      const { windowType } = action;
      const existing = state.windows.find((item) => item.type === windowType);

      if (existing) {
        return {
          ...state,
          windows: state.windows.map((item) =>
            item.id === existing.id ? { ...item, zIndex: state.nextZIndex, isMinimized: false } : item,
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }

      const mobile = isMobile();
      const newWindow: ManagedWindow = {
        id: getWindowId(),
        type: windowType,
        zIndex: state.nextZIndex,
        tilt: mobile ? 0 : WINDOW_TILT_BY_TYPE[windowType],
        position: mobile
          ? { x: 4 + (state.windows.length % 3) * 8, y: 44 + (state.windows.length % 3) * 12 }
          : { x: 110 + state.windows.length * 40, y: 90 + state.windows.length * 24 },
        isMinimized: false,
      };

      return {
        windows: [...state.windows, newWindow],
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'CLOSE': {
      return {
        ...state,
        windows: state.windows.filter((item) => item.id !== action.windowId),
      };
    }

    case 'FOCUS': {
      return {
        ...state,
        windows: state.windows.map((item) =>
          item.id === action.windowId ? { ...item, zIndex: state.nextZIndex } : item,
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'MINIMIZE': {
      return {
        ...state,
        windows: state.windows.map((item) => (item.id === action.windowId ? { ...item, isMinimized: true } : item)),
      };
    }

    default:
      return state;
  }
}

export default function useWindowManager(): UseWindowManagerResult {
  const [state, dispatch] = useReducer(windowReducer, INITIAL_STATE);

  const openWindow = useCallback((windowType: WindowType) => {
    dispatch({ type: 'OPEN', windowType });
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'CLOSE', windowId });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    dispatch({ type: 'FOCUS', windowId });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MINIMIZE', windowId });
  }, []);

  return {
    windows: state.windows,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
  };
}
