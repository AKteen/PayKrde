export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-[11px] text-danger">
      {message}
    </p>
  );
}
