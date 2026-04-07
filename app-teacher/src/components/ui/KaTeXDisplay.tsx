import { useEffect, useRef } from 'react';
import katex from 'katex';

interface Props {
  tex: string;
  displayMode?: boolean;
  className?: string;
}

export default function KaTeXDisplay({ tex, displayMode = false, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(tex, ref.current, { throwOnError: false, displayMode });
    } catch {
      if (ref.current) ref.current.textContent = tex;
    }
  }, [tex, displayMode]);

  return (
    <span
      ref={ref}
      className={`math-ltr ${className}`}
      style={{ direction: 'ltr', unicodeBidi: 'bidi-override', display: 'inline-block' }}
    />
  );
}
