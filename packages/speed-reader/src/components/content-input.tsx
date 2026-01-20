'use client'

import { Button } from '@read-for-speed/ui/components/button'
import { ScrollArea } from '@read-for-speed/ui/components/scroll-area'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@read-for-speed/ui/components/tabs'
import { Textarea } from '@read-for-speed/ui/components/textarea'
import { cn } from '@read-for-speed/ui/lib/utils'

interface ContentInputProps {
  /** Content for the paste tab (user-provided text). */
  pastedContent: string
  /** Callback when the pasted content changes. */
  onPastedContentChange: (content: string) => void
  /** Callback when user switches to the page tab. */
  onSelectPageContent?: () => void
  pageContentError?: string | null
  /** Full page content (read-only display). */
  pageContent?: string
  /** Currently active input mode (controlled by parent). */
  activeMode: 'page' | 'paste'
  /** Callback when the input mode changes. */
  onModeChange: (mode: 'page' | 'paste') => void
  /** CSS classes for the content input component */
  className?: string
  /** Callback when an error is presented and the user clicks the `Try Again` button. */
  onErrorResubmit?: () => void
}

export function ContentInput({
  className,
  pastedContent,
  onPastedContentChange,
  pageContentError,
  onSelectPageContent,
  pageContent = '',
  activeMode,
  onModeChange,
  onErrorResubmit,
}: ContentInputProps) {
  /**
   * Handle tab switching between page and paste modes.
   * Notifies parent so it knows which content source to use for reading.
   */
  const handleModeChange = (mode: 'page' | 'paste') => {
    onModeChange(mode)
    if (mode === 'page') {
      // Notify parent that page content is now the active source.
      onSelectPageContent?.()
    }
  }

  const pastedWordCount = pastedContent.split(/\s+/).filter((w) => w.length > 0).length
  const pageWordCount = Intl.NumberFormat('en-US').format(
    pageContent.split(/\s+/).filter((w) => w.length > 0).length,
  )

  return (
    <div className={cn('flex-1 flex flex-col items-center justify-center px-6 py-8', className)}>
      <div className='w-full max-w-2xl space-y-6'>
        <div className='text-center space-y-2'>
          <h2 className='text-2xl @max-md/reader-main:text-xl font-semibold'>
            Speed Read Any Content
          </h2>
          <p className='text-muted-foreground'>
            Paste text or use the current page to begin reading at lightning speed
          </p>
        </div>
        <Tabs
          value={activeMode}
          onValueChange={handleModeChange}
        >
          {/* Keep both panels mounted to preserve text state when switching tabs. */}
          <TabsList className='mx-auto'>
            <TabsTrigger value='page'>Page</TabsTrigger>
            <TabsTrigger value='paste'>Paste</TabsTrigger>
          </TabsList>

          <TabsPanel
            value='page'
            keepMounted
          >
            {pageContentError && onErrorResubmit ? (
              <div className='flex flex-col gap-4'>
                <div className='text-red-500 text-sm text-center'>{pageContentError}</div>
                <Button
                  variant='destructive-outline'
                  onClick={onErrorResubmit}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <ScrollArea
                  data-page-content
                  className='w-full h-48'
                >
                  <article className='text-left text-sm text-foreground whitespace-pre-line wrap-break-word dark:bg-input/30 px-4 py-2 bg-input h-fit min-h-full'>
                    {pageContent}
                  </article>
                </ScrollArea>
                <span className='text-xs text-right text-muted-foreground'>
                  {pageWordCount} words
                </span>
              </div>
            )}
          </TabsPanel>

          <TabsPanel
            value='paste'
            keepMounted
          >
            <div className='space-y-4'>
              <Textarea
                rows={10}
                value={pastedContent}
                onChange={(e) => onPastedContentChange(e.target.value)}
                placeholder='Paste your text here...'
                className='w-full h-48 resize-none! text-sm'
              />
              <span className='text-xs text-right text-muted-foreground'>
                {pastedWordCount} words
              </span>
            </div>
          </TabsPanel>
        </Tabs>

        {/* Instructions */}
        <div className='bg-secondary/30 rounded-xl p-4 space-y-2'>
          <h3 className='font-medium text-sm'>How RSVP Works</h3>
          <ul className='text-sm text-muted-foreground space-y-1 list-disc list-inside'>
            <li>Words appear one at a time in a fixed position</li>
            <li>
              The <span className='text-red-500 font-semibold'>red letter</span> marks the optimal
              recognition point
            </li>
            <li>Your eyes stay focused while words flow past</li>
            <li>Start at 250-300 WPM and gradually increase</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
