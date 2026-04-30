type AppNameProps = {
  className?: string;
};

export function AppName({ className }: AppNameProps) {
  return (
    <h1 className={className}>
      FRI<span className="text-yellow-400">€</span>ND<span className="text-yellow-400">$</span>
    </h1>
  );
}
