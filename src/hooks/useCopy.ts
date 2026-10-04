import { useEffect, useState } from 'react';

/** クリップボードへコピーし、一定時間 copied=true にする */
export function useCopy(resetMs = 1500) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetMs);
    return () => clearTimeout(timer);
  }, [copied, resetMs]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return { copied, copy };
}
