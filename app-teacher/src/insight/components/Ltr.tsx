/** Math/English isolation wrapper — always renders LTR for numbers and formulas */
export default function Ltr({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={`inline-block font-mono ${className}`}>
      {children}
    </span>
  );
}
