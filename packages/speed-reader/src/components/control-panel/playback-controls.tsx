import { Button } from '@read-for-speed/ui/components/button'
import { cn } from '@read-for-speed/ui/lib/utils'
import { Pause, Play, RefreshCcw, SkipBack, SkipForward, Square } from 'lucide-react'

interface PlaybackControlsProps {
  isPlaying: boolean
  onPause: () => void
  onPlay: () => void
  skipBack: () => void
  skipForward: () => void
  onStop: () => void
  onReset: () => void
  className?: string
}

export const PlaybackControls = ({
  isPlaying,
  onPause,
  onPlay,
  skipBack,
  skipForward,
  onStop,
  onReset,
  className,
}: PlaybackControlsProps) => {
  return (
    <div className={cn('flex items-center gap-2 grow justify-center', className)}>
      <Button
        size='icon'
        variant='outline'
        onClick={onReset}
        aria-label='Reset'
      >
        <RefreshCcw />
      </Button>
      <Button
        size='icon'
        variant='outline'
        onClick={skipBack}
        aria-label='Skip back'
      >
        <SkipBack />
      </Button>

      {/* Play/Pause button */}
      {isPlaying ? (
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
        aria-label='Skip forward'
      >
        <SkipForward />
      </Button>

      <Button
        size='icon'
        variant={isPlaying ? 'destructive-outline' : 'outline'}
        onClick={onStop}
        aria-label='Stop reader'
      >
        <Square />
      </Button>
    </div>
  )
}
