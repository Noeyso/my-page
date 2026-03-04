import { useCallback, useReducer } from 'react';
import type { ManagedWindow, WindowType } from '../types/window';

interface WindowState {
  windows: ManagedWindow[];
  nextZIndex: number;
}

type WindowAction =
  | { type: 'OPEN'; windowType: WindowType }
  | { type: 'CLOSE'; windowId: string }
  | { type: 'FOCUS'; windowId: string };

interface UseWindowManagerResult {
  windows: ManagedWindow[];
  openWindow: (windowType: WindowType) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
}

const INITIAL_WINDOWS: ManagedWindow[] = [
  {
    id: 'default-profile',
    type: 'profile',
    zIndex: 100,
    tilt: -2,
    position: { x: 150, y: 132 },
  },
  {
    id: 'default-music',
    type: 'music',
    zIndex: 101,
    tilt: -1,
    position: { x: 840, y: 148 },
  },
  {
    id: 'default-system',
    type: 'gallery',
    zIndex: 102,
    tilt: -2,
    position: { x: 760, y: 360 },
  },
];

const WINDOW_TILT_BY_TYPE: Record<WindowType, number> = {
  profile: -2,
  chat: 2,
  music: -1,
  memo: 3,
  files: -3,
  gallery: 1,
  mycomputer: -1,
};

const INITIAL_STATE: WindowState = {
  windows: INITIAL_WINDOWS,
  nextZIndex: 103,
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
            item.id === existing.id ? { ...item, zIndex: state.nextZIndex } : item,
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }

      const newWindow: ManagedWindow = {
        id: getWindowId(),
        type: windowType,
        zIndex: state.nextZIndex,
        tilt: WINDOW_TILT_BY_TYPE[windowType],
        position: {
          x: 110 + state.windows.length * 40,
          y: 90 + state.windows.length * 24,
        },
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

  return {
    windows: state.windows,
    openWindow,
    closeWindow,
    focusWindow,
  };
}
