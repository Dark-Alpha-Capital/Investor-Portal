
import { useEffect, useCallback, useState } from "react";
import {
  getCachedLocalStorage,
  setCachedLocalStorage,
  removeCachedLocalStorage,
} from "./use-local-storage-cache";

const STORAGE_KEY_INVESTOR_DATA = "onboarding_investor_data";
const STORAGE_KEY_STEP = "onboarding_current_step";

export function useOnboardingStorage<T>(
  key: string,
  initialValue: T,
  skipSave?: boolean
) {
  // Lazy state initialization (best practice 5.6)
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = getCachedLocalStorage(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Save to localStorage when value changes (skip if skipSave is true)
  useEffect(() => {
    if (skipSave || typeof window === "undefined") return;
    try {
      setCachedLocalStorage(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [value, key, skipSave]);

  // Functional setState to prevent stale closures (best practice 5.5)
  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
        return next;
      });
    },
    []
  );

  const clearValue = useCallback(() => {
    removeCachedLocalStorage(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setStoredValue, clearValue] as const;
}

export function useOnboardingStepStorage(currentStep: number, skipSave?: boolean) {
  const [step, setStep] = useOnboardingStorage(STORAGE_KEY_STEP, currentStep, skipSave);
  return [step, setStep] as const;
}

export function useOnboardingDataStorage<T>(
  initialData: T,
  skipSave?: boolean
) {
  return useOnboardingStorage(STORAGE_KEY_INVESTOR_DATA, initialData, skipSave);
}

export function clearOnboardingStorage() {
  removeCachedLocalStorage(STORAGE_KEY_INVESTOR_DATA);
  removeCachedLocalStorage(STORAGE_KEY_STEP);
}
