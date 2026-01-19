import type { PopoverPortalProps } from '@base-ui/react'
import { MobileChunkSizeControlTrigger } from '@read-for-speed/speed-reader/control-panel/mobile-control-popovers'
import { Button } from '@read-for-speed/ui/components/button'
import { Slider } from '@read-for-speed/ui/components/slider'
import { ToggleGroup, ToggleGroupItem } from '@read-for-speed/ui/components/toggle-group'
import { useIsMobile } from '@read-for-speed/ui/hooks/use-mobile'
import { cn } from '@read-for-speed/ui/lib/utils'
import { WholeWord } from 'lucide-react'
import type { ReaderSettings } from '../rsvp-reader'

interface ChunkSizeControlProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
  className?: string
}

export const ChunkSizeControl = ({
  settings,
  onSettingsChange,
  className,
}: ChunkSizeControlProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileChunkSizeControlTrigger />
  }
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className='text-sm text-muted-foreground @max-md/control-panel:hidden'>Words</span>
      <ToggleGroup
        value={[settings.chunkSize.toString()]}
        onValueChange={(value) =>
          onSettingsChange({ ...settings, chunkSize: Number(value[0] ?? 1) as 1 | 2 | 3 })
        }
      >
        {[1, 2, 3].map((size) => (
          <ToggleGroupItem
            key={size}
            aria-label={`${size} words`}
            value={size.toString()}
          >
            {size}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
