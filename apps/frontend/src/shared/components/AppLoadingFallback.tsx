import { LogoIcon } from './Logo';

export function AppLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-emerald-950 transition-colors duration-300">
      <LogoIcon size={64} />
      <div className="mt-6 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
