import type { PopoverPortalProps } from '@base-ui/react'
import { MobileSpeedControlTrigger } from '@read-for-speed/speed-reader/control-panel/mobile-control-popovers'
import { Button } from '@read-for-speed/ui/components/button'
import { useIsMobile } from '@read-for-speed/ui/hooks/use-mobile'
import { cn } from '@read-for-speed/ui/lib/utils'
import { Minus, Plus } from 'lucide-react'
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
  const adjustWpm = (delta: number) => {
    onSettingsChange({
      ...settings,
      wpm: Math.max(50, Math.min(1000, settings.wpm + delta)),
    })
  }

  if (isMobile) {
    return <MobileSpeedControlTrigger />
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className='text-sm text-muted-foreground w-12 @max-md/control-panel:hidden'>WPM</span>
      <Button
        size='icon'
        variant='secondary'
        onClick={() => adjustWpm(-25)}
        aria-label='Decrease speed'
      >
        <Minus />
      </Button>
      <span className='w-12 text-center font-mono'>{settings.wpm}</span>
      <Button
        size='icon'
        variant={'secondary'}
        onClick={() => adjustWpm(25)}
        aria-label='Increase speed'
      >
        <Plus />
      </Button>
    </div>
  )
}
