'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Readability } from '@mozilla/readability'
import { BookOpen, Clipboard, FileText, Link } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [inputMode, setInputMode] = useState<'page' | 'paste' | 'url'>(
    onUsePageContent ? 'page' : 'paste',
  )
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showReaderPreview, setShowReaderPreview] = useState(false)

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

  const handleUrlFetch = async () => {
    if (!url) return
    setIsLoading(true)
    try {
      const htmlContent = await fetch(url).then((res) => res.text())
      const html = new DOMParser().parseFromString(htmlContent, 'text/html')
      const article = new Readability(html).parse()
      const content = article?.textContent?.trim() ?? ''
      onContentChange(content)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }

    setTimeout(() => {
      onContentChange(
        `Content fetched from: ${url}\n\nIn a Safari extension, this would extract the main article content from the webpage using readability algorithms to strip navigation, ads, and other non-essential elements.`,
      )
      setIsLoading(false)
    }, 1000)
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
            Paste text or enter a URL to begin reading at lightning speed
          </p>
        </div>

        {/* Mode toggle */}
        <div className='flex justify-center gap-2'>
          {onUsePageContent && (
            <Button
              onClick={() => handleModeChange('page')}
              variant={inputMode === 'page' ? 'default' : 'secondary'}
            >
              <BookOpen />
              On This Page
            </Button>
          )}
          <Button
            onClick={() => handleModeChange('paste')}
            variant={inputMode === 'paste' ? 'default' : 'secondary'}
          >
            <FileText />
            Paste Text
          </Button>
          <Button
            type='button'
            onClick={() => handleModeChange('url')}
            variant={inputMode === 'url' ? 'default' : 'secondary'}
          >
            <Link className='w-4 h-4' />
            Enter URL
          </Button>
        </div>

        {inputMode === 'page' && onUsePageContent ? (
          <div className='space-y-4 text-center'>
            <p className='text-sm text-muted-foreground'>
              {pageContentStatus === 'loading' && 'Loading page content...'}
              {pageContentStatus === 'ready' && 'Using the current page content.'}
              {pageContentStatus === 'idle' && 'Page content will load automatically.'}
              {pageContentStatus === 'error' && 'Unable to read content from this page.'}
            </p>
            {pageContentTitle && <p className='text-sm font-medium'>Using: {pageContentTitle}</p>}
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
        ) : inputMode === 'paste' ? (
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
        ) : (
          <div className='space-y-4'>
            <div className='flex gap-2'>
              <input
                type='url'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='https://example.com/article'
                className='flex-1 px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground'
              />
              <button
                type='button'
                onClick={handleUrlFetch}
                disabled={isLoading || !url}
                className='px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50'
              >
                {isLoading ? 'Loading...' : 'Fetch'}
              </button>
            </div>
            <p className='text-sm text-muted-foreground text-center'>
              The extension will extract the main article content automatically
            </p>
          </div>
        )}

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
