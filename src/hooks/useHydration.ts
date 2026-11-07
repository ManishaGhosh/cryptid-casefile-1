import { useSyncExternalStore } from 'react'
import { isHydrated, subscribeHydration } from '@/store/hydration'

/** Returns true once the store has been hydrated from persisted state. */
export function useHydration(): boolean {
  return useSyncExternalStore(subscribeHydration, isHydrated, isHydrated)
}
