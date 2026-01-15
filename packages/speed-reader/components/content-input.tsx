'use client'

import { Clipboard, FileText, Link } from 'lucide-react'
import { useState } from 'react'

interface ContentInputProps {
  content: string
  onContentChange: (content: string) => void
  onUsePageContent?: () => void
  pageContentStatus?: 'idle' | 'loading' | 'error' | 'ready'
  pageContentTitle?: string | null
  pageContentError?: string | null
}

export function ContentInput({
  content,
  onContentChange,
  onUsePageContent,
  pageContentStatus = 'idle',
  pageContentTitle,
  pageContentError,
}: ContentInputProps) {
  const [inputMode, setInputMode] = useState<'paste' | 'url'>('paste')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
    // In a real extension, this would fetch and parse the URL content
    // For the demo, we'll show a message
    setTimeout(() => {
      onContentChange(
        `Content fetched from: ${url}\n\nIn a Safari extension, this would extract the main article content from the webpage using readability algorithms to strip navigation, ads, and other non-essential elements.`,
      )
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className='flex-1 flex flex-col items-center justify-center px-6 py-8'>
      <div className='w-full max-w-2xl space-y-6'>
        <div className='text-center space-y-2'>
          <h2 className='text-2xl font-semibold'>Speed Read Any Content</h2>
          <p className='text-muted-foreground'>
            Paste text or enter a URL to begin reading at lightning speed
          </p>
        </div>

        {onUsePageContent && (
          <div className='flex flex-col items-center gap-2'>
            <button
              type='button'
              onClick={onUsePageContent}
              disabled={pageContentStatus === 'loading'}
              className='px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60'
            >
              {pageContentStatus === 'loading' ? 'Loading page...' : 'Use current page content'}
            </button>
            {pageContentStatus === 'ready' && pageContentTitle && (
              <p className='text-xs text-muted-foreground'>Using: {pageContentTitle}</p>
            )}
            {pageContentStatus === 'error' && pageContentError && (
              <p className='text-xs text-destructive'>{pageContentError}</p>
            )}
          </div>
        )}

        {/* Mode toggle */}
        <div className='flex justify-center gap-2'>
          <button
            type='button'
            onClick={() => setInputMode('paste')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${inputMode === 'paste' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}
            `}
          >
            <FileText className='w-4 h-4' />
            Paste Text
          </button>
          <button
            type='button'
            onClick={() => setInputMode('url')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${inputMode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}
            `}
          >
            <Link className='w-4 h-4' />
            Enter URL
          </button>
        </div>

        {inputMode === 'paste' ? (
          <div className='space-y-4'>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder='Paste your text here...'
              className='w-full h-64 p-4 bg-secondary/50 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground'
            />
            <div className='flex justify-between items-center'>
              <button
                type='button'
                onClick={handlePaste}
                className='flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm'
              >
                <Clipboard className='w-4 h-4' />
                Paste from Clipboard
              </button>
              <span className='text-sm text-muted-foreground'>
                {content.split(/\s+/).filter((w) => w.length > 0).length} words
              </span>
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
