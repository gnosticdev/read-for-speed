import type { NumberFieldRoot, PopoverPortalProps } from '@base-ui/react'
import { MobileSpeedControlTrigger } from '@read-for-speed/speed-reader/control-panel/mobile-control-popovers'
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from '@read-for-speed/ui/components/number-field'
import { useIsMobile } from '@read-for-speed/ui/hooks/use-mobile'
import { cn } from '@read-for-speed/ui/lib/utils'
import { useCallback } from 'react'
import type { ReaderSettings } from '../rsvp-reader'

export interface SpeedControlProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  className?: string
  container?: PopoverPortalProps['container']
}

export const SpeedControl = ({ settings, onSettingsChange, className }: SpeedControlProps) => {
  const isMobile = useIsMobile()
  /**
   * Adjust the reading speed by the given delta.
   */
  const adjustWpm = useCallback(
    (value: number | null) => {
      if (value === null) return
      onSettingsChange({
        ...settings,
        wpm: Math.max(50, Math.min(1000, value)),
      })
    },
    [onSettingsChange, settings],
  )

  if (isMobile) {
    return <MobileSpeedControlTrigger />
  }

  return (
    <NumberField
      id='speed-input'
      min={50}
      max={1000}
      step={5}
      value={settings.wpm}
      onValueChange={adjustWpm}
      aria-label='Words per minute control'
      className={cn(
        'flex-row text-muted-foreground items-center gap-3 max-w-fit text-sm',
        className,
      )}
    >
      <NumberFieldScrubArea label='WPM' />
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput className={'max-w-20'} />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}
