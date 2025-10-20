'use client';

import { useState, useEffect } from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
};

// ✅ Keep dismiss separate from the toast props
type ToastWithDismiss = ToastProps & {
  dismiss: () => void;
};

interface ToastState {
  toasts: ToastWithDismiss[];
}

const toastStore = {
  state: { toasts: [] as ToastWithDismiss[] },
  listeners: new Set<(state: ToastState) => void>(),

  getState: () => toastStore.state,

  setState: (nextState: ((state: ToastState) => ToastState) | Partial<ToastState>) => {
    if (typeof nextState === 'function') {
      toastStore.state = (nextState as (state: ToastState) => ToastState)(toastStore.state);
    } else {
      toastStore.state = { ...toastStore.state, ...nextState };
    }
    toastStore.listeners.forEach((listener) => listener(toastStore.state));
  },

  subscribe: (listener: (state: ToastState) => void) => {
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  },
};

export const toast = (props: ToastProps) => {
  const id = generateId();

  const update = (newProps: Partial<ToastProps>) =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...newProps } : t)),
    }));

  const dismiss = () =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    }));

  toastStore.setState((state) => ({
    ...state,
    toasts: [{ ...props, id, dismiss }, ...state.toasts].slice(0, TOAST_LIMIT),
  }));

  return { id, dismiss, update };
};

export function useToast() {
  const [state, setState] = useState(toastStore.getState());

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    state.toasts.forEach((toastItem) => {
      if (toastItem.duration === Infinity) return;

      const timeout = setTimeout(() => toastItem.dismiss(), toastItem.duration || TOAST_REMOVE_DELAY);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [state.toasts]);

  return {
    toast,
    toasts: state.toasts,
  };
}