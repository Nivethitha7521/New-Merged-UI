'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface TopBarConfig {
  title?: string;
  rightContent?: React.ReactNode;
  mobileDrawerContent?: React.ReactNode;
  mobileDrawerTitle?: string;
}

interface TopBarContextValue {
  config: TopBarConfig | null;
  setConfig: React.Dispatch<React.SetStateAction<TopBarConfig | null>>;
  onRefresh: (() => Promise<void> | void) | null;
  setOnRefresh: (fn: (() => Promise<void> | void) | null) => void;
}

const TopBarContext = createContext<TopBarContextValue | null>(null);

export function TopBarProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TopBarConfig | null>(null);
  const [onRefresh, setOnRefreshState] = useState<(() => Promise<void> | void) | null>(null);

  /**
   * useState cannot store a function directly — React treats a function passed
   * to setState as an updater. Wrapping in () => fn stores the function as a value.
   */
  const setOnRefresh = useCallback((fn: (() => Promise<void> | void) | null) => {
    setOnRefreshState(() => fn);
  }, []);

  const value = useMemo(
    () => ({ config, setConfig, onRefresh, setOnRefresh }),
    [config, onRefresh, setOnRefresh],
  );

  return <TopBarContext.Provider value={value}>{children}</TopBarContext.Provider>;
}

export function useTopBarContext() {
  const ctx = useContext(TopBarContext);
  if (!ctx) throw new Error('useTopBarContext must be used within TopBarProvider');
  return ctx;
}
