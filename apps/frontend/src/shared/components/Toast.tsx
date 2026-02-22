import * as ToastPrimitive from '@radix-ui/react-toast';
import { FaCheck, FaCircleXmark, FaCircleInfo, FaTriangleExclamation } from 'react-icons/fa6';
import { useToastStore } from '@/shared/store/useToastStore';
import { cn } from '@/shared/utils/cn';

const iconMap = {
  success: <FaCheck className="text-green-600 dark:text-green-400" />,
  error: <FaCircleXmark className="text-red-600 dark:text-red-400" />,
  info: <FaCircleInfo className="text-blue-600 dark:text-blue-400" />,
  warning: <FaTriangleExclamation className="text-yellow-600 dark:text-yellow-400" />,
};

const bgMap = {
  success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastPrimitive.Provider>
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          onOpenChange={(open) => !open && removeToast(toast.id)}
          open
          duration={toast.duration}
          className={cn(
            'flex gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top-full fade-in duration-300',
            bgMap[toast.type],
          )}
        >
          <div className="shrink-0 flex items-center">{iconMap[toast.type]}</div>
          <div className="flex-1 flex flex-col">
            <ToastPrimitive.Title className="font-semibold text-sm">{toast.message}</ToastPrimitive.Title>
            {toast.description && (
              <ToastPrimitive.Description className="text-xs opacity-75 mt-1">
                {toast.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close asChild>
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close toast"
            >
              <FaCircleXmark size={14} />
            </button>
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed top-0 left-1/2 -translate-x-1/2 flex flex-col gap-2 p-4 max-w-sm pointer-events-none z-50" />
    </ToastPrimitive.Provider>
  );
}
