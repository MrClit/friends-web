export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-full bg-gradient-to-tr from-teal-400 via-teal-500 to-teal-600 w-20 h-20 flex items-center justify-center mb-2 shadow-lg">
        <span className="text-4xl font-black text-white drop-shadow">€</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-teal-700 dark:text-teal-300">
        FRI<span className="text-yellow-400">€</span>NDS
      </h1>
    </div>
  );
}
