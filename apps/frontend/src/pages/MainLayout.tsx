import { Header } from '@/shared/components/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-radial from-emerald-100 via-emerald-50 to-white dark:from-emerald-900 dark:via-emerald-900 dark:to-emerald-900 transition-colors duration-300">
      <Header />
      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
