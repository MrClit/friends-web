import { Header } from '@/shared/components/Header';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center bg-linear-to-b from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-950 p-4">
      <Header />
      <main className="w-full max-w-2xl flex-1">{children}</main>
    </div>
  );
}
