export function WalletMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="8" width="28" height="18" rx="6" fill="#F5C518" />
      <rect x="5" y="12" width="14" height="3" rx="1.5" fill="#FFF6D6" />
      <circle cx="23.5" cy="17.5" r="4" fill="#FFF" />
      <circle cx="23.5" cy="17.5" r="1.6" fill="#E0A800" />
    </svg>
  );
}
