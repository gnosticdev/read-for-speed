'use client'

import { BookOpen } from 'lucide-react'
import '@/assets/tailwind.css'

import type { DialogRootActions } from '@base-ui/react'
import { Readability } from '@mozilla/readability'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { RSVPReader } from '@/packages/speed-reader/components/rsvp-reader'

type PageContentStatus = 'idle' | 'loading' | 'error' | 'ready'

export default function ContentApp({
  docClone,
  anchor,
}: {
  docClone: Document
  anchor: HTMLElement
}) {
  const [open, setOpen] = useState(false)
  const [pageContent, setPageContent] = useState<string | undefined>()
  const [pageExcerpt, setPageExcerpt] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState<PageContentStatus>('idle')

  const actionsRef = useRef<DialogRootActions>({
    unmount: () => void 0,
    close: () => void 0,
  })

  const controlsContainerRef = useRef<HTMLDivElement>(null)

  const handleUsePageContent = useCallback(() => {
    setStatus('loading')
    setPageError(null)

    const article = new Readability(docClone).parse()
    if (!article) {
      setPageError('No readable text found on this page.')
      setStatus('error')
      return
    }

    const articleText = article.textContent ?? ''
    const excerptText =
      article.excerpt?.trim() ||
      (articleText.length > 0 ? `${articleText.slice(0, 240).trim()}...` : null)

    // Store full content + excerpt for the reader UI.
    setPageContent(articleText)
    setPageExcerpt(excerptText)
    setPageTitle(article.title ?? docClone.title)
    setStatus('ready')
  }, [docClone])

  useEffect(() => {
    // Auto-load page content for the extension experience.
    if (status === 'idle') {
      handleUsePageContent()
    }
  }, [handleUsePageContent, status])

  return (
    <div className='flex flex-col items-end gap-3'>
      {/* Launcher button rendered in the overlay container. */}
      <Button
        type='button'
        variant='default'
        onClick={() => setOpen(true)}
      >
        <span className='sr-only'>Open Read For Speed</span>
        <BookOpen className='w-4 h-4' />
      </Button>

      <Dialog
        actionsRef={actionsRef}
        open={open}
        onOpenChange={setOpen}
      >
        <DialogPopup
          className='sm:max-w-3xl'
          container={anchor}
        >
          <DialogHeader>
            <DialogTitle>
              <div className='flex items-center gap-2'>
                <BookOpen className='w-4 h-4' />
                <span className='text-lg/tight font-semibold'>Read For Speed</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <DialogPanel className='p-0'>
            <RSVPReader
              initialContent={pageContent}
              onUsePageContent={handleUsePageContent}
              pageContentStatus={status}
              pageContentTitle={pageTitle}
              pageContentError={pageError}
              pageContentExcerpt={pageExcerpt}
              containerClassName='h-full'
              controlsContainer={controlsContainerRef.current}
              controlPanelClassName='border-t-0 bg-transparent'
            />
          </DialogPanel>
          <DialogFooter className='p-0'>
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
