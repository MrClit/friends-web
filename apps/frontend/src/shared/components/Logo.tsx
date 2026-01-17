import { Link } from 'react-router-dom';

/**
 * Only the logo icon (circle with €).
 */
export function LogoIcon({ size = 40 }: { size?: number }) {
  const px = size;
  const textSize = size >= 64 ? 'text-4xl' : size >= 48 ? 'text-3xl' : 'text-2xl';
  return (
    <div
      className="rounded-full bg-linear-to-tr from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center shadow-lg"
      style={{ width: px, height: px }}
    >
      <span className={`font-black text-white drop-shadow ${textSize}`}>€</span>
    </div>
  );
}

/**
 * Logo con texto "FRI€NDS" debajo.
 */
export function LogoFull() {
  return (
    <div className="flex flex-col items-center">
      <LogoIcon size={80} />
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-700 dark:text-teal-300 mt-2">
        FRI<span className="text-yellow-400">€</span>NDS
      </h1>
    </div>
  );
}

/**
 * Logo principal, configurable para mostrar solo icono o icono+texto.
 * @param showText Si true, muestra el texto "FRI€NDS" debajo del icono.
 */
export default function Logo({ showText = false, size = 40 }: { showText?: boolean; size?: number }) {
  return (
    <Link
      to="/"
      aria-label="Friends - Ir a la página principal"
      className="flex flex-col items-center hover:opacity-90 transition-opacity"
    >
      <LogoIcon size={size} />
      {showText && (
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-700 dark:text-teal-300 mt-2">
          FRI<span className="text-yellow-400">€</span>NDS
        </h1>
      )}
    </Link>
  );
}
