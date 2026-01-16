'use client'

import { Clipboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface ContentInputProps {
  pastedContent: string
  onContentChange: (content: string) => void
  onUsePageContent?: () => void
  onSelectPageContent?: () => void
  pageContentStatus?: 'idle' | 'loading' | 'error' | 'ready'
  pageContentTitle?: string | null
  pageContentError?: string | null
  /** @deprecated No longer displayed - full preview is shown instead */
  pageContentExcerpt?: string | null
  pageContent?: string
}

export function ContentInput({
  pastedContent,
  onContentChange,
  onUsePageContent,
  onSelectPageContent,
  pageContent = '',
}: ContentInputProps) {
  const [inputMode, setInputMode] = useState<'page' | 'paste'>(onUsePageContent ? 'page' : 'paste')

  useEffect(() => {
    if (!onUsePageContent && inputMode === 'page') {
      setInputMode('paste')
    }
  }, [onUsePageContent, inputMode])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onContentChange(text)
      }
    } catch {
      // Clipboard API not available or permission denied
    }
  }

  /**
   * Handle tab switching between page and paste modes.
   * Only calls onSelectPageContent to restore cached content - we do NOT
   * call onUsePageContent here because Readability mutates the docClone
   * and re-parsing would fail or return empty content.
   */
  const handleModeChange = (mode: typeof inputMode) => {
    setInputMode(mode)
    if (mode === 'page') {
      // Restore the reader with the already-parsed page content from cache.
      onSelectPageContent?.()
    }
  }

  const wordCount = pageContent.split(/\s+/).filter((w) => w.length > 0).length
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
          value={inputMode}
          onValueChange={handleModeChange}
        >
          {/* Keep both panels mounted to preserve text state when switching tabs. */}
          <TabsList className='mx-auto'>
            <TabsTrigger value='page'>Page</TabsTrigger>
            <TabsTrigger value='paste'>Paste</TabsTrigger>
          </TabsList>

          <TabsContent
            value='page'
            keepMounted
          >
            <div className='space-y-4 text-center p-1'>
              <p className='text-xs text-muted-foreground'>{pageWordCount} words detected</p>
              <ScrollArea
                data-page-content
                className='w-full h-48 p-4 bg-background border border-border rounded-xl'
              >
                <pre className='text-left text-sm text-foreground whitespace-pre-wrap'>
                  {pageContent}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent
            value='paste'
            keepMounted
          >
            <div className='space-y-4'>
              <Textarea
                rows={10}
                value={pastedContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder='Paste your text here...'
                className='w-full'
              />
              <div className='flex justify-between items-center'>
                <Button
                  type='button'
                  onClick={handlePaste}
                  variant='outline'
                  size='sm'
                >
                  <Clipboard />
                  Paste
                </Button>
                <span className='text-sm text-muted-foreground'>{wordCount} words</span>
              </div>
            </div>
          </TabsContent>
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
