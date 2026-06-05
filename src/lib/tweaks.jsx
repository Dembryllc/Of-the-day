import { useCallback, useState } from "react";

export function useTweaks(defaults) {
  const [values, setValues] = useState(defaults);
  const setValue = useCallback((key, value) => {
    setValues(current => ({ ...current, [key]: value }));
  }, []);
  return [values, setValue];
}

export function TweaksPanel({ children }) {
  return null;
}

export function TweakSection({ children }) {
  return null;
}

export function TweakText() {
  return null;
}

export function TweakSelect() {
  return null;
}
