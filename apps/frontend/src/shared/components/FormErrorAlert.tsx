interface FormErrorAlertProps {
  message: string | null;
}

export function FormErrorAlert({ message }: FormErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
      {message}
    </div>
  );
}
