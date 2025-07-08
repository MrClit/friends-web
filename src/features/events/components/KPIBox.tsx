interface KPIBoxProps {
  label: string;
  value: number;
}

export default function KPIBox({ label, value }: KPIBoxProps) {
  return (
    <div className="bg-white dark:bg-teal-800 rounded-xl shadow p-4 flex flex-col items-center">
      <span className="text-xs text-teal-400 mb-1 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-teal-700 dark:text-teal-200">€ {value.toFixed(2)}</span>
    </div>
  );
}
