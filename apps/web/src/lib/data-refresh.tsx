import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type RefreshValue = {
  nonce: number;
  refresh: () => void;
};

const DataRefreshContext = createContext<RefreshValue | null>(null);

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const value = useMemo(() => ({ nonce, refresh }), [nonce, refresh]);
  return <DataRefreshContext.Provider value={value}>{children}</DataRefreshContext.Provider>;
}

export function useDataRefresh() {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) throw new Error('useDataRefresh must be used within DataRefreshProvider');
  return ctx;
}
