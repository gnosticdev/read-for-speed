'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface ContentInputProps {
  /** Content for the paste tab (user-provided text). */
  pastedContent: string
  /** Callback when the pasted content changes. */
  onPastedContentChange: (content: string) => void
  /** Handler to trigger page content extraction (optional). */
  onUsePageContent?: () => void
  /** Callback when user switches to the page tab. */
  onSelectPageContent?: () => void
  pageContentStatus?: 'idle' | 'loading' | 'error' | 'ready'
  pageContentTitle?: string | null
  pageContentError?: string | null
  /** Full page content (read-only display). */
  pageContent?: string
  /** Currently active input mode (controlled by parent). */
  activeMode: 'page' | 'paste'
  /** Callback when the input mode changes. */
  onModeChange: (mode: 'page' | 'paste') => void
}

export function ContentInput({
  pastedContent,
  onPastedContentChange,
  onUsePageContent: _onUsePageContent,
  onSelectPageContent,
  pageContent = '',
  activeMode,
  onModeChange,
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
    <div className='flex-1 flex flex-col items-center justify-center px-6 py-8'>
      <div className='w-full max-w-2xl space-y-6'>
        <div className='text-center space-y-2'>
          <h2 className='text-2xl font-semibold'>Speed Read Any Content</h2>
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
            <div className='space-y-4'>
              <ScrollArea
                data-page-content
                className='w-full h-48'
              >
                <pre className='text-left text-xs text-foreground whitespace-pre-line wrap-break-word dark:bg-input/30 px-4 py-2 bg-input'>
                  {pageContent}
                </pre>
              </ScrollArea>
              <span className='text-xs text-right text-muted-foreground'>
                {pageWordCount} words
              </span>
            </div>
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
                className='w-full h-48 resize-none!'
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
