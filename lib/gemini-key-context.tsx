"use client";

import React, { createContext, useContext, useState } from "react";

type GeminiKeyContextValue = {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
};

const GeminiKeyContext = createContext<GeminiKeyContextValue | null>(null);

export function GeminiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const value = React.useMemo(() => ({ apiKey, setApiKey }), [apiKey]);
  return (
    <GeminiKeyContext.Provider value={value}>{children}</GeminiKeyContext.Provider>
  );
}

export function useGeminiKey() {
  const ctx = useContext(GeminiKeyContext);
  if (!ctx) {
    throw new Error("useGeminiKey must be used within a GeminiKeyProvider");
  }
  return ctx;
}

