import { useEffect, useRef } from 'react';

// Re-runs `loader` on an interval and whenever the tab regains focus, so boards
// stay fresh when teammates make changes (crew/truck assignments, status, etc.)
// without a manual refresh. Pauses while the tab is hidden to save resources.
export function useLive(loader, deps = [], intervalMs = 12000) {
  const saved = useRef(loader);
  saved.current = loader;
  useEffect(() => {
    let timer = null;
    const tick = () => { if (!document.hidden) saved.current(); };
    timer = setInterval(tick, intervalMs);
    const onFocus = () => saved.current();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
