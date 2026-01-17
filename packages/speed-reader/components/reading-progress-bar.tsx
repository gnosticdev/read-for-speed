'use client'

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '@/components/ui/progress'

export function ReadingProgressBar({
  currentIndex,
  totalWords,
}: {
  currentIndex: number
  totalWords: number
}) {
  return (
    <Progress
      max={totalWords}
      value={currentIndex}
    >
      <div className='flex items-center justify-between gap-2'>
        <ProgressLabel className='text-xs text-muted-foreground'>Progress</ProgressLabel>
        <ProgressValue className='text-xs text-muted-foreground'>
          {(_formatted, value) =>
            `${value?.toLocaleString() ?? 0} / ${totalWords.toLocaleString()}`
          }
        </ProgressValue>
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  )
}
