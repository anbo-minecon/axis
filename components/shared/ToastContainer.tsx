"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/lib/notifications";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Loader } from "lucide-react";

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  createdAt: number;
}

const getIcon = (type: string) => {
  const iconProps = "w-5 h-5";
  switch (type) {
    case 'success':
      return <CheckCircle className={`${iconProps} text-green-500`} />;
    case 'error':
      return <AlertCircle className={`${iconProps} text-red-500`} />;
    case 'warning':
      return <AlertTriangle className={`${iconProps} text-yellow-500`} />;
    case 'info':
      return <Info className={`${iconProps} text-blue-500`} />;
    case 'loading':
      return <Loader className={`${iconProps} text-blue-500 animate-spin`} />;
    default:
      return null;
  }
};

const getStyles = (type: string) => {
  const baseStyles = "fixed right-4 bottom-4 p-4 rounded-lg shadow-lg flex items-start gap-3 mb-2 animation-fadeIn transition-all max-w-sm";
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-50 border border-green-200`;
    case 'error':
      return `${baseStyles} bg-red-50 border border-red-200`;
    case 'warning':
      return `${baseStyles} bg-yellow-50 border border-yellow-200`;
    case 'info':
      return `${baseStyles} bg-blue-50 border border-blue-200`;
    case 'loading':
      return `${baseStyles} bg-blue-50 border border-blue-200`;
    default:
      return baseStyles;
  }
};

const getTextColors = (type: string) => {
  switch (type) {
    case 'success':
      return { title: 'text-green-900', message: 'text-green-700' };
    case 'error':
      return { title: 'text-red-900', message: 'text-red-700' };
    case 'warning':
      return { title: 'text-yellow-900', message: 'text-yellow-700' };
    case 'info':
      return { title: 'text-blue-900', message: 'text-blue-700' };
    case 'loading':
      return { title: 'text-blue-900', message: 'text-blue-700' };
    default:
      return { title: 'text-gray-900', message: 'text-gray-700' };
  }
};

export default function ToastContainer() {
  const [toastList, setToastList] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Subscribe a cambios en los toasts
    const unsubscribe = Toast.subscribe((toasts) => {
      setToastList(toasts);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed right-0 bottom-0 z-50 pointer-events-none">
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        
        .animation-fadeIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .animation-fadeOut {
          animation: slideOut 0.3s ease-out forwards;
        }
      `}</style>

      <div className="pointer-events-auto p-4">
        {toastList.map((toast) => {
          const colors = getTextColors(toast.type);
          return (
            <div
              key={toast.id}
              className={getStyles(toast.type)}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${colors.title}`}>
                  {toast.title}
                </h3>
                {toast.message && (
                  <p className={`text-sm mt-1 ${colors.message}`}>
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => Toast.close(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
