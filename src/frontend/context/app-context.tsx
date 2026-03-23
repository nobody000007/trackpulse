"use client";
import { createContext, useContext, useState } from "react";

interface AppContextValue {
  // TODO: add global state as needed
}

const AppContext = createContext<AppContextValue>({});

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
