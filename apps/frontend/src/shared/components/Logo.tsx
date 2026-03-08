import { Link } from 'react-router-dom';

type LogoRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

const ROUNDED_CLASS_BY_SIZE: Record<LogoRounded, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

type LogoIconProps = {
  size?: number;
  rounded?: LogoRounded;
};

type LogoProps = {
  showText?: boolean;
  size?: number;
  rounded?: LogoRounded;
};

/**
 * Render the app logo image from /public.
 */
export function LogoIcon({ size = 40, rounded = '3xl' }: LogoIconProps) {
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

  return (
    <img
      src={logoSrc}
      alt="Friends logo"
      width={size}
      height={size}
      className={`block object-contain ${ROUNDED_CLASS_BY_SIZE[rounded]} border-teal-300 dark:border-teal-500`}
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * Logo principal, configurable para mostrar solo icono o icono+texto.
 * @param showText Si true, muestra el texto "FRI€NDS" debajo del icono.
 */
export function Logo({ showText = false, size = 40, rounded = '3xl' }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="Friends - Ir a la página principal"
      className="flex flex-col items-center hover:opacity-90 transition-opacity"
    >
      <LogoIcon size={size} rounded={rounded} />
      {showText && (
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-700 dark:text-teal-300 mt-2">
          FRI<span className="text-yellow-400">€</span>NDS
        </h1>
      )}
    </Link>
  );
}
