'use client'

import '@/assets/tailwind.css'

import { Readability } from '@mozilla/readability'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { RSVPReader } from '@/packages/speed-reader/components/rsvp-reader'

type PageContentStatus = 'idle' | 'loading' | 'error' | 'ready'

type Article = NonNullable<ReturnType<(typeof Readability)['prototype']['parse']>>

export default function ContentApp({
  article,
  anchor,
}: {
  article: Article

  anchor: HTMLElement
}) {
  const [open, setOpen] = useState(false)
  const [pageContent, setPageContent] = useState<string | undefined>()
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState<PageContentStatus>('idle')

  const controlsContainerRef = useRef<HTMLDivElement>(null)

  const handleUsePageContent = useCallback(() => {
    setStatus('loading')
    setPageError(null)

    let text = ''
    let title = article.title ?? null

    text = article.textContent ?? ''
    title = article.title ?? title

    if (!text.trim()) {
      setPageError('No readable text found on this page.')
      setStatus('error')
      return
    }

    setPageContent(text)
    setPageTitle(title)
    setStatus('ready')
  }, [article.textContent, article.title])

  return (
    <div className='flex flex-col items-end gap-3'>
      {/* Launcher button rendered in the overlay container. */}
      <Button
        type='button'
        variant='default'
        onClick={() => setOpen(true)}
      >
        Open Speed Reader
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogPopup
          className='sm:max-w-3xl'
          container={anchor}
        >
          <DialogHeader>
            <DialogTitle>{pageTitle}</DialogTitle>
          </DialogHeader>
          <DialogPanel className='p-0'>
            <RSVPReader
              initialContent={pageContent}
              onUsePageContent={handleUsePageContent}
              pageContentStatus={status}
              pageContentTitle={pageTitle}
              pageContentError={pageError}
              containerClassName='h-full'
              controlsContainer={controlsContainerRef.current}
              controlPanelClassName='border-t-0 bg-transparent'
            />
          </DialogPanel>
          <DialogFooter
            variant='bare'
            className='p-0'
          >
            {/* Portal target for RSVP controls. */}
            <div
              ref={controlsContainerRef}
              className='w-full'
            />
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
