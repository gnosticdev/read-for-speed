import { Button } from '@read-for-speed/ui/components/button'
import { Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react'
import { cn } from '@read-for-speed/ui/utils'
import type { ReaderState } from '../rsvp-reader'

interface PlaybackControlsProps {
  state: ReaderState
  onPause: () => void
  onPlay: () => void
  skipBack: () => void
  skipForward: () => void
  onStop: () => void
  className?: string
}

export const PlaybackControls = ({
  state,
  onPause,
  onPlay,
  skipBack,
  skipForward,
  onStop,
  className,
}: PlaybackControlsProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 @max-md/control-panel:order-3 grow justify-center',
        className,
      )}
    >
      <Button
        size='icon'
        variant='outline'
        onClick={skipBack}
        aria-label='Skip back'
      >
        <SkipBack />
      </Button>

      {/* Play/Pause button */}
      {state === 'playing' ? (
        <Button
          size='icon-xl'
          variant='default'
          onClick={onPause}
          aria-label='Pause'
          className='rounded-full'
        >
          <Pause />
        </Button>
      ) : (
        <Button
          size='icon-xl'
          variant='default'
          onClick={onPlay}
          aria-label='Play'
          className='rounded-full'
        >
          <Play />
        </Button>
      )}

      <Button
        size='icon'
        variant='outline'
        onClick={skipForward}
        aria-label='Stop'
      >
        <SkipForward />
      </Button>

      <Button
        size='icon'
        variant={state === 'playing' ? 'destructive-outline' : 'outline'}
        onClick={onStop}
        aria-label='Stop'
      >
        <Square />
      </Button>
    </div>
  )
}
