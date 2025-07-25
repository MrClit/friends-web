import { formatAmount } from "../../../shared/utils/formatAmount";

interface KPIBoxProps {
  label: string;
  value: number;
  colorClass?: string; // Nueva prop para clases de color
  onClick?: () => void; // Prop opcional para manejar clics
  style?: React.CSSProperties; // Prop opcional para estilos en línea
  labelClassName?: string; // Nueva prop para clases del label
  valueClassName?: string; // Nueva prop para clases del value
}

export default function KPIBox({
  label,
  value,
  colorClass,
  onClick,
  style,
  labelClassName,
  valueClassName
}: KPIBoxProps) {
  return (
    <div
      className={`rounded-xl shadow p-4 flex flex-col items-center ${colorClass || 'bg-white dark:bg-teal-800'}`}
      onClick={onClick}
      style={style}
      tabIndex={onClick ? 0 : undefined} // Hace que el div sea enfocablesi onClick está presente
      role={onClick ? 'button' : undefined} // Establece el rol como botón si onClick está presente
    >
      <span className={`text-xs mb-1 font-medium uppercase tracking-wide whitespace-nowrap ${labelClassName || ''}`}>
        {label}
      </span>
      <span className={`text-2xl font-bold ${valueClassName || ''}`}>
        {formatAmount(value)}
      </span>
    </div>
  );
}
