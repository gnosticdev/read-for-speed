'use client'

import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from '@read-for-speed/ui/lib/utils'

const SliderThumb = ({ className, ...props }: SliderPrimitive.Thumb.Props) => {
  return (
    <SliderPrimitive.Thumb
      className={cn(
        'block size-5 shrink-0 select-none rounded-full border border-input bg-white not-dark:bg-clip-padding shadow-xs/5 outline-none transition-[box-shadow,scale] before:absolute before:inset-0 before:rounded-full before:shadow-[0_1px_--theme(--color-black/6%)] focus-visible:ring-[3px] focus-visible:ring-ring/24 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 data-dragging:scale-120 data-dragging:ring-[3px] data-dragging:ring-ring/24 sm:size-4 dark:border-background dark:data-dragging:ring-ring/48 dark:focus-visible:ring-ring/48 [:focus-visible,[data-dragging]]:shadow-none',
        className,
      )}
      data-slot='slider-thumb'
      {...props}
    />
  )
}

const SliderTrack = ({ children, ...props }: SliderPrimitive.Track.Props) => {
  return (
    <SliderPrimitive.Track
      className='relative grow select-none before:absolute before:rounded-full before:bg-input data-[orientation=horizontal]:h-1 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1 data-[orientation=horizontal]:before:inset-x-0.5 data-[orientation=vertical]:before:inset-x-0 data-[orientation=horizontal]:before:inset-y-0 data-[orientation=vertical]:before:inset-y-0.5'
      data-slot='slider-track'
      {...props}
    >
      {children}
    </SliderPrimitive.Track>
  )
}

const SliderIndicator = ({ ...props }: SliderPrimitive.Indicator.Props) => {
  return (
    <SliderPrimitive.Indicator
      className='select-none rounded-full bg-primary data-[orientation=horizontal]:ms-0.5 data-[orientation=vertical]:mb-0.5'
      data-slot='slider-indicator'
      {...props}
    />
  )
}

const SliderControl = ({ children, className, ...props }: SliderPrimitive.Control.Props) => {
  return (
    <SliderPrimitive.Control
      className={cn(
        'flex touch-none select-none data-disabled:pointer-events-none data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:min-w-44 data-[orientation=vertical]:flex-col data-disabled:opacity-64',
        className,
      )}
      data-slot='slider-control'
      {...props}
    >
      {children}
    </SliderPrimitive.Control>
  )
}
/**
 * Composable slider
 *
 * @example
 *
 * ```tsx
 * <SliderRoot>
 *   {children}
 *   <SliderControl>
 *     <SliderTrack>
 *       <SliderIndicator />
 *       <SliderThumb />
 *     </SliderTrack>
 *   </SliderTrack>
 *     <SliderValue />
 *   </SliderControl>
 * </SliderRoot>
 * ```
 */
function SliderRoot({
  className,
  children,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      className='data-[orientation=horizontal]:w-full'
      defaultValue={defaultValue}
      max={max}
      min={min}
      thumbAlignment='edge'
      value={value}
      {...props}
    >
      {children}
    </SliderPrimitive.Root>
  )
}

function SliderValue({ className, ...props }: SliderPrimitive.Value.Props) {
  return (
    <SliderPrimitive.Value
      className={cn('flex justify-end text-sm', className)}
      data-slot='slider-value'
      {...props}
    />
  )
}

export { SliderRoot, SliderValue, SliderThumb, SliderTrack, SliderIndicator, SliderControl }
