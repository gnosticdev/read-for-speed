import { Button } from '@read-for-speed/ui/components/button'
import { Minus, Plus } from 'lucide-react'
import type { ReaderSettings } from '../rsvp-reader'

interface SpeedControlProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
}

export const SpeedControl = ({ settings, onSettingsChange }: SpeedControlProps) => {
  /**
   * Adjust the reading speed by the given delta.
   */
  const adjustWpm = (delta: number) => {
    onSettingsChange({
      ...settings,
      wpm: Math.max(50, Math.min(1000, settings.wpm + delta)),
    })
  }

  return (
    <div className='flex items-center gap-3 order-1'>
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
