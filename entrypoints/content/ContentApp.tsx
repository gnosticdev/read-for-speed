'use client'

import { BookOpen } from 'lucide-react'
import '@/assets/tailwind.css'

import type { DialogRootActions } from '@base-ui/react'
import { Readability } from '@mozilla/readability'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const buildExcerpt = (text: string, maxLength = 240) => {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trim()}...`
}

export default function ContentApp({
  docClone,
  anchor,
  selectionText,
  openOnSelection,
  onSelectionHandled,
  onClearSelection,
}: {
  docClone: Document
  anchor: HTMLElement
  selectionText?: string | null
  openOnSelection?: boolean
  onSelectionHandled?: () => void
  onClearSelection?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pageContent, setPageContent] = useState<string | undefined>()
  const [pageExcerpt, setPageExcerpt] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState<PageContentStatus>('idle')
  const selectedContent = selectionText?.trim()
  const selectionExcerpt = selectedContent ? buildExcerpt(selectedContent) : null

  const actionsRef = useRef<DialogRootActions>({
    unmount: () => void 0,
    close: () => void 0,
  })

  const controlsContainerRef = useRef<HTMLDivElement>(null)

  const loadPageContent = useCallback(() => {
    setStatus('loading')
    setPageError(null)

    const article = new Readability(docClone).parse()
    if (!article) {
      setPageError('No readable text found on this page.')
      setStatus('error')
      return
    }

    const articleText = article.textContent ?? ''
    const excerptText = article.excerpt?.trim() || buildExcerpt(articleText)

    // Store full content + excerpt for the reader UI.
    setPageContent(articleText)
    setPageExcerpt(excerptText)
    setPageTitle(article.title ?? docClone.title)
    setStatus('ready')
  }, [docClone])

  const handleUsePageContent = useCallback(() => {
    loadPageContent()
    onClearSelection?.()
  }, [loadPageContent, onClearSelection])

  useEffect(() => {
    // Auto-load page content for the extension experience.
    if (status === 'idle') {
      loadPageContent()
    }
  }, [loadPageContent, status])

  useEffect(() => {
    if (!openOnSelection || !selectedContent) return
    setOpen(true)
    onSelectionHandled?.()
  }, [openOnSelection, onSelectionHandled, selectedContent])

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
              initialContent={selectedContent || pageContent}
              onUsePageContent={handleUsePageContent}
              pageContentStatus={status}
              pageContentTitle={pageTitle}
              pageContentError={pageError}
              pageContentExcerpt={selectionExcerpt || pageExcerpt}
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
