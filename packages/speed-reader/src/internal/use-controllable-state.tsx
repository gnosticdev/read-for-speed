import { useCallback, useState } from 'react'

type ControllableStateProps<T> = {
  value?: T // controlled value
  defaultValue: T // uncontrolled initial value
  onChange?: (next: T) => void
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateProps<T>) {
  const isControlled = value !== undefined
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue)

  const state = isControlled ? (value as T) : uncontrolled

  const setState = useCallback(
    (next: T | ((prev: T) => T)) => {
      const computed = typeof next === 'function' ? (next as (p: T) => T)(state) : next

      if (!isControlled) setUncontrolled(computed)
      onChange?.(computed)
    },
    [isControlled, onChange, state],
  )

  return [state, setState] as const
}
