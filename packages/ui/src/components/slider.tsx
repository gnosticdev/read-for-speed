'use client'

import type * as React from 'react'

import { cn } from '../lib/utils'

type SliderProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange' | 'value'
> & {
  value: number
  onValueChange?: (value: number) => void
}

function Slider({ value, onValueChange, className, ...props }: SliderProps) {
  // Range input wrapper to keep slider styling consistent.
  return (
    <input
      type='range'
      value={value}
      onChange={(event) => onValueChange?.(Number(event.target.value))}
      className={cn(
        'w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary',
        className,
      )}
      {...props}
    />
  )
}

export { Slider, type SliderProps }
