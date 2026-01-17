import { GoogleLoginButton } from '@/features/auth/GoogleLoginButton';
import { Logo } from '@/shared/components';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-teal-100 to-teal-300 dark:from-teal-900 dark:to-teal-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center">
        {/* <img src="/logo.svg" alt="Friends Logo" className="w-16 h-16 mb-4" /> */}
        <Logo />
        <h1 className="text-2xl font-bold mb-2 text-teal-800 dark:text-teal-200">Bienvenido a Friends</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">
          Comparte gastos y gestiona eventos fácilmente.
          <br />
          Inicia sesión con Google para continuar.
        </p>
        <GoogleLoginButton />
      </div>
      <footer className="mt-8 text-xs text-gray-400">Powered by Friends • 2026</footer>
    </div>
  );
}
