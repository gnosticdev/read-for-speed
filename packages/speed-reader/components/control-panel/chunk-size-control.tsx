import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ReaderSettings } from '../rsvp-reader'

interface ChunkSizeControlProps {
  settings: ReaderSettings
  onSettingsChange: (settings: ReaderSettings) => void
}

export const ChunkSizeControl = ({ settings, onSettingsChange }: ChunkSizeControlProps) => {
  return (
    <div className='flex items-center gap-3 @max-md/control-panel:order-2'>
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
