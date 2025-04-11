"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface NavigationContextProps {
  navigating: boolean;
  setNavigating: (navigating: boolean) => void;
  navigatingTo: string | null;
  startNavigation: (path: string) => void;
  endNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const startNavigation = (path: string) => {
    setNavigating(true);
    setNavigatingTo(path);
  };

  const endNavigation = () => {
    setNavigating(false);
    setNavigatingTo(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        navigating,
        setNavigating,
        navigatingTo,
        startNavigation,
        endNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
