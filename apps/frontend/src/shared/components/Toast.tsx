import * as ToastPrimitive from '@radix-ui/react-toast';
import { FaCheck, FaCircleXmark, FaCircleInfo, FaTriangleExclamation } from 'react-icons/fa6';
import { useToastStore } from '@/shared/store/useToastStore';
import { cn } from '@/shared/utils/cn';

const iconMap = {
  success: <FaCheck className="text-green-700 dark:text-green-300" />,
  error: <FaCircleXmark className="text-red-700 dark:text-red-300" />,
  info: <FaCircleInfo className="text-blue-700 dark:text-blue-300" />,
  warning: <FaTriangleExclamation className="text-yellow-700 dark:text-yellow-300" />,
};

const bgMap = {
  success:
    'bg-green-100/95 border-green-300 text-green-950 dark:bg-green-900/85 dark:border-green-700 dark:text-green-50',
  error: 'bg-red-100/95 border-red-300 text-red-950 dark:bg-red-900/85 dark:border-red-700 dark:text-red-50',
  info: 'bg-blue-100/95 border-blue-300 text-blue-950 dark:bg-blue-900/85 dark:border-blue-700 dark:text-blue-50',
  warning:
    'bg-yellow-100/95 border-yellow-300 text-yellow-950 dark:bg-yellow-900/85 dark:border-yellow-700 dark:text-yellow-50',
};

export function Toast() {
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
            'pointer-events-auto flex w-[min(92vw,26rem)] gap-3 p-4 rounded-xl border shadow-xl ring-1 ring-black/10 dark:ring-white/15 backdrop-blur-md animate-in slide-in-from-top-full fade-in duration-300',
            bgMap[toast.type],
          )}
        >
          <div className="shrink-0 flex items-center">{iconMap[toast.type]}</div>
          <div className="flex-1 flex flex-col">
            <ToastPrimitive.Title className="font-semibold text-sm leading-5">{toast.message}</ToastPrimitive.Title>
            {toast.description && (
              <ToastPrimitive.Description className="text-xs text-current/85 mt-1 leading-4">
                {toast.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close asChild>
            <button className="text-current/70 hover:text-current transition-colors" aria-label="Close toast">
              <FaCircleXmark size={14} />
            </button>
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed top-0 left-1/2 -translate-x-1/2 flex flex-col gap-3 p-4 max-w-sm pointer-events-none z-50" />
    </ToastPrimitive.Provider>
  );
}
