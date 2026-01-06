import { Link } from 'react-router-dom';

/**
 * Application logo with link to home page.
 * Responsive sizing and accessible for screen readers.
 */
export default function Logo() {
  return (
    <Link
      to="/"
      aria-label="Friends - Ir a la página principal"
      className="flex flex-col items-center hover:opacity-90 transition-opacity"
    >
      <div className="rounded-full bg-linear-to-tr from-teal-400 via-teal-500 to-teal-600 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-2 shadow-lg">
        <span className="text-3xl sm:text-4xl font-black text-white drop-shadow">€</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-700 dark:text-teal-300">
        FRI<span className="text-yellow-400">€</span>NDS
      </h1>
    </Link>
  );
}
