// lib/notifications.ts
// Sistema unificado de notificaciones Toast

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  duration?: number; // milisegundos, 0 = permanente
  compact?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  createdAt: number;
}

// Almacenamiento en memoria
let toasts: Map<string, Toast> = new Map();
let listeners: Set<(toasts: Array<Toast>) => void> = new Set();

// Generar ID único
const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Notificar a listeners
const notifyListeners = () => {
  listeners.forEach(listener => listener(Array.from(toasts.values())));
};

// Crear toast
const createToast = (
  type: ToastType,
  title: string,
  message?: string,
  options: ToastOptions = {}
): string => {
  const id = generateId();
  const duration = options.duration !== undefined ? options.duration : 3000;

  const toast: Toast = {
    id,
    type,
    title,
    message,
    duration,
    createdAt: Date.now(),
  };

  toasts.set(id, toast);
  notifyListeners();

  // Auto-eliminar si duration > 0
  if (duration > 0) {
    setTimeout(() => {
      toasts.delete(id);
      notifyListeners();
      options.onClose?.();
    }, duration);
  }

  return id;
};

export const Toast = {
  // Métodos básicos
  success: (title: string, message?: string, options?: ToastOptions) =>
    createToast('success', title, message, options),

  error: (title: string, message?: string, options?: ToastOptions) =>
    createToast('error', title, message, options),

  warning: (title: string, message?: string, options?: ToastOptions) =>
    createToast('warning', title, message, options),

  info: (title: string, message?: string, options?: ToastOptions) =>
    createToast('info', title, message, options),

  loading: (title: string, message?: string) =>
    createToast('loading', title, message, { duration: 0 }),

  // Actualizar toast existente
  update: (id: string, type: ToastType, title: string, message?: string) => {
    const existing = toasts.get(id);
    if (existing) {
      toasts.set(id, {
        ...existing,
        type,
        title,
        message: message || existing.message,
      });
      notifyListeners();

      // Si el toast anterior tenía auto-close, mantener esa lógica
      if (existing.duration > 0) {
        setTimeout(() => {
          toasts.delete(id);
          notifyListeners();
        }, 2000);
      }
    }
  },

  // Promise handler
  promise: async (
    promise: Promise<any>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    const loadingId = createToast('loading', messages.loading, '', { duration: 0 });

    try {
      const result = await promise;
      Toast.update(loadingId, 'success', messages.success);
      toasts.delete(loadingId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error';
      Toast.update(loadingId, 'error', messages.error, errorMessage);
      throw error;
    }
  },

  // Cerrar un toast específico
  close: (id: string) => {
    toasts.delete(id);
    notifyListeners();
  },

  // Cerrar todos
  closeAll: () => {
    toasts.clear();
    notifyListeners();
  },

  // Subscribe a cambios
  subscribe: (listener: (toasts: Array<Toast>) => void) => {
    listeners.add(listener);
    // Retornar unsubscribe
    return () => {
      listeners.delete(listener);
    };
  },

  // Obtener todos los toasts
  getAll: (): Array<Toast> => Array.from(toasts.values()),
};
