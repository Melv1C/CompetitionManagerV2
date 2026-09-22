import { createContext, useContext } from "react";

export type PrototypeSessionContextValue = {
  signedIn: boolean;
  setSignedIn: (value: boolean) => void;
};

export const PrototypeSessionContext = createContext<PrototypeSessionContextValue | null>(null);

export function usePrototypeSession() {
  const value = useContext(PrototypeSessionContext);
  if (!value) throw new Error("MockSessionProvider is missing");
  return value;
}
