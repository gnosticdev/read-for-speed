'use client'

import { BookOpen, Clipboard, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface ContentInputProps {
  content: string
  onContentChange: (content: string) => void
  onUsePageContent?: () => void
  onSelectPageContent?: () => void
  pageContentStatus?: 'idle' | 'loading' | 'error' | 'ready'
  pageContentTitle?: string | null
  pageContentError?: string | null
  pageContentExcerpt?: string | null
  pageContentFull?: string
}

export function ContentInput({
  content,
  onContentChange,
  onUsePageContent,
  onSelectPageContent,
  pageContentStatus = 'idle',
  pageContentTitle,
  pageContentError,
  pageContentExcerpt,
  pageContentFull = '',
}: ContentInputProps) {
  const [inputMode, setInputMode] = useState<'page' | 'paste'>(onUsePageContent ? 'page' : 'paste')
  const [showReaderPreview, setShowReaderPreview] = useState(false)
  const showPageTab = Boolean(onUsePageContent)

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

  const handleModeChange = (mode: typeof inputMode) => {
    setInputMode(mode)
    setShowReaderPreview(false)
    if (mode === 'page') {
      // Re-sync the reader with the latest parsed page content.
      onSelectPageContent?.()
      onUsePageContent?.()
    }
  }

  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length
  const pageWordCount = pageContentFull.split(/\s+/).filter((w) => w.length > 0).length
  const previewText = pageContentExcerpt?.trim()

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
          value={showPageTab ? inputMode : 'paste'}
          onValueChange={handleModeChange}
        >
          {/* Keep both panels mounted to preserve text state when switching tabs. */}
          <TabsList className='mx-auto'>
            {showPageTab && (
              <TabsTrigger value='page'>
                <BookOpen />
                On This Page
              </TabsTrigger>
            )}
            <TabsTrigger value='paste'>
              <FileText />
              Paste Text
            </TabsTrigger>
          </TabsList>

          {showPageTab && (
            <TabsContent
              value='page'
              keepMounted
            >
              <div className='space-y-4 text-center'>
                <p className='text-sm text-muted-foreground'>
                  {pageContentStatus === 'loading' && 'Loading page content...'}
                  {pageContentStatus === 'ready' && 'Using the current page content.'}
                  {pageContentStatus === 'idle' && 'Page content will load automatically.'}
                  {pageContentStatus === 'error' && 'Unable to read content from this page.'}
                </p>
                {pageContentTitle && (
                  <p className='text-sm font-medium'>Using: {pageContentTitle}</p>
                )}
                {pageContentStatus === 'error' && pageContentError && (
                  <p className='text-xs text-destructive'>{pageContentError}</p>
                )}
                {pageContentStatus === 'ready' && (
                  <p className='text-xs text-muted-foreground'>{pageWordCount} words detected</p>
                )}

                {pageContentStatus === 'ready' && previewText && (
                  <div className='rounded-xl border border-border bg-secondary/30 p-4 text-left'>
                    <p className='text-sm text-muted-foreground'>{previewText}</p>
                  </div>
                )}

                {pageContentStatus === 'ready' && (
                  <div className='flex items-center justify-center gap-2'>
                    <Button
                      onClick={() => setShowReaderPreview((prev) => !prev)}
                      disabled={!pageContentFull}
                      variant='outline'
                      size='sm'
                    >
                      {showReaderPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                )}

                {showReaderPreview && (
                  <ScrollArea className='w-full h-64 p-4 bg-secondary/50 border border-border rounded-xl'>
                    <pre className='text-left text-sm text-foreground whitespace-pre-wrap'>
                      {pageContentFull}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent
            value='paste'
            keepMounted
          >
            <div className='space-y-4'>
              <Textarea
                rows={10}
                value={content}
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
          <ul className='text-sm text-muted-foreground space-y-1'>
            <li>• Words appear one at a time in a fixed position</li>
            <li>
              • The <span className='text-red-500 font-semibold'>red letter</span> marks the optimal
              recognition point
            </li>
            <li>• Your eyes stay focused while words flow past</li>
            <li>• Start at 250-300 WPM and gradually increase</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
