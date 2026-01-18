import type { SpeedControlProps } from '@read-for-speed/speed-reader/control-panel/speed-control'
import { Button } from '@read-for-speed/ui/components/button'
import { Slider, SliderValue } from '@read-for-speed/ui/components/slider'
import { WholeWord, Zap } from 'lucide-react'
import {
  Popover,
  PopoverCreateHandle,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from '../ui/anchored-popover'

const mobileControlHandle = PopoverCreateHandle<
  typeof MobileSpeedControlPanel | typeof MobileChunkSizeControlPanel
>()

const MobileChunkSizeControlPanel = ({
  settings,
  onSettingsChange,
}: Pick<SpeedControlProps, 'settings' | 'onSettingsChange'>) => {
  return (
    <div className='*:justify-center *:flex *:flex-col-reverse *:items-center *:gap-3'>
      <PopoverTitle className='text-center text-sm mb-4'>Chunk Size</PopoverTitle>
      <Slider
        min={1}
        max={3}
        step={1}
        value={settings.chunkSize}
        onValueChange={(value) => onSettingsChange({ ...settings, chunkSize: value as 1 | 2 | 3 })}
        orientation='vertical'
        aria-label='Chunk size control'
        className='flex items-center justify-center flex-col-reverse'
      >
        <div className='flex items-center justify-center min-w-24'>
          <SliderValue />
          <span className='text-sm text-muted-foreground'>Words</span>
        </div>
      </Slider>
    </div>
  )
}

const MobileSpeedControlPanel = ({
  settings,
  onSettingsChange,
}: Pick<SpeedControlProps, 'settings' | 'onSettingsChange'>) => {
  return (
    <div className='*:justify-center *:flex *:flex-col-reverse *:items-center *:gap-3'>
      <PopoverTitle className='text-center text-sm mb-4'>Speed (WPM)</PopoverTitle>
      <Slider
        min={50}
        max={1000}
        step={25}
        value={settings.wpm}
        className='flex items-center justify-center flex-col-reverse'
        aria-label='Words per minute control'
        orientation='vertical'
        onValueChange={(value) => onSettingsChange({ ...settings, wpm: value as number })}
      >
        <div className='flex items-center justify-center min-w-24'>
          <SliderValue />
          <span className='text-sm text-muted-foreground'>WPM</span>
        </div>
      </Slider>
    </div>
  )
}

/**
 * Trigger for the mobile speed control panel.
 */
export const MobileSpeedControlTrigger = () => (
  <PopoverTrigger
    handle={
      mobileControlHandle as ReturnType<typeof PopoverCreateHandle<typeof MobileSpeedControlPanel>>
    }
    payload={MobileSpeedControlPanel}
    render={
      <Button
        size='icon'
        variant='outline'
      />
    }
  >
    <Zap />
  </PopoverTrigger>
)

export const MobileChunkSizeControlTrigger = () => (
  <PopoverTrigger
    handle={
      mobileControlHandle as ReturnType<
        typeof PopoverCreateHandle<typeof MobileChunkSizeControlPanel>
      >
    }
    payload={MobileChunkSizeControlPanel}
    render={
      <Button
        size='icon'
        variant='outline'
      />
    }
  >
    <WholeWord />
  </PopoverTrigger>
)

/**
 * Single popover for the mobile speed and chunk size controls.
 * Add the respective triggers where needed and this will handle rendering the correct panel
 */
export function MobileControlPopover({ container, onSettingsChange, settings }: SpeedControlProps) {
  return (
    <Popover handle={mobileControlHandle}>
      {({ payload: Payload }) => (
        <>
          <PopoverPopup portalContainer={container}>
            {Payload !== undefined && (
              <Payload
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            )}
          </PopoverPopup>
        </>
      )}
    </Popover>
  )
}
