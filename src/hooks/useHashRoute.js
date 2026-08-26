import { useState, useEffect } from "react";

export function useHashRoute(validTabs, defaultTab) {
  const getTabFromHash = () => {
    const hash = window.location.hash.replace("#", "");
    return validTabs.includes(hash) ? hash : defaultTab;
  };
  const [tab, setTab] = useState(getTabFromHash);

  useEffect(() => {
    window.location.hash = tab;
  }, [tab]);

  useEffect(() => {
    const onHash = () => setTab(getTabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return [tab, setTab];
}
