interface KPIBoxProps {
  label: string;
  value: number;
  colorClass?: string; // Nueva prop para clases de color
}

export default function KPIBox({ label, value, colorClass }: KPIBoxProps) {
  return (
    <div className={`rounded-xl shadow p-4 flex flex-col items-center ${colorClass || 'bg-white dark:bg-teal-800'}`}>
      <span className="text-xs mb-1 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold">
        € {value.toFixed(2)}
      </span>
    </div>
  );
}
