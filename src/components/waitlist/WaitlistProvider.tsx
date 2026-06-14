"use client";

import { createContext, useContext, useState, useCallback } from "react";
import WaitlistModal from "./WaitlistModal";

const WaitlistContext = createContext<{ open: () => void }>({ open: () => {} });

export function useWaitlist() {
  return useContext(WaitlistContext);
}

export default function WaitlistProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <WaitlistContext.Provider value={{ open }}>
      {children}
      <WaitlistModal isOpen={isOpen} onClose={close} />
    </WaitlistContext.Provider>
  );
}
