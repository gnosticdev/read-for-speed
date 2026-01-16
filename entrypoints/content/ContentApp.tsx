'use client'

import '@/assets/tailwind.css'
import '@fontsource-variable/chivo-mono'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/figtree'

import type { DialogRootActions } from '@base-ui/react'
import { Readability } from '@mozilla/readability'
import { BookOpen } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogCreateHandle,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { type ReaderSettings, RSVPReader } from '@/packages/speed-reader/components/rsvp-reader'

type PageContentStatus = 'idle' | 'loading' | 'error' | 'ready'

const buildExcerpt = (text: string, maxLength = 240) => {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trim()}...`
}

export const ContentAppTrigger = DialogCreateHandle()

export default function ContentApp({
  docClone,
  anchor,
  selectionText,
  openOnSelection,
  openOnPageAction,
  onSelectionHandled,
  onPageActionHandled,
  onClearSelection,
  settingsStorageKey = 'read-for-speed:settings',
  initialSettings,
}: {
  docClone: Document
  anchor: HTMLElement
  selectionText?: string | null
  openOnSelection?: boolean
  openOnPageAction?: boolean
  onSelectionHandled?: () => void
  onPageActionHandled?: () => void
  onClearSelection?: () => void
  settingsStorageKey?: string
  settingsStorageArea?: 'local' | 'sync'
  initialSettings?: Partial<ReaderSettings>
}) {
  const [open, setOpen] = useState(false)
  const [pageContent, setPageContent] = useState<string | undefined>()
  const [, setPageExcerpt] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState<PageContentStatus>('idle')
  const [isUsingPageAction, setIsUsingPageAction] = useState(true)
  const selectedContent = selectionText?.trim()

  const actionsRef = useRef<DialogRootActions>({
    unmount: () => void 0,
    close: () => void 0,
  })

  const controlsContainer = useRef<HTMLDivElement>(null)

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

  const loadStoredUsePageAction = useCallback(async () => {
    const storedSettings = await storage.getItem<ReaderSettings>(`local:${settingsStorageKey}`)
    if (!storedSettings) return
    setIsUsingPageAction(storedSettings.usePageAction)
  }, [settingsStorageKey])

  useEffect(() => {
    if (!settingsStorageKey) return

    // Keep the launcher mode in sync with stored reader settings.
    loadStoredUsePageAction()

    storage.watch<ReaderSettings>(`local:${settingsStorageKey}`, (value) => {
      setIsUsingPageAction(value?.usePageAction ?? false)
    })
    return () => {
      storage.unwatch()
    }
  }, [loadStoredUsePageAction, settingsStorageKey])

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

  useEffect(() => {
    if (!openOnPageAction) return
    if (!isUsingPageAction) {
      onPageActionHandled?.()
      return
    }
    setOpen(true)
    onPageActionHandled?.()
  }, [onPageActionHandled, openOnPageAction, isUsingPageAction])

  return (
    <Dialog
      actionsRef={actionsRef}
      open={open}
      onOpenChange={setOpen}
      // handle={ContentAppTrigger}
    >
      {!isUsingPageAction && (
        <DialogTrigger render={<Button variant='default' />}>
          <span className='sr-only'>Open Read For Speed</span>
          <BookOpen className='w-4 h-4' />
        </DialogTrigger>
      )}
      <DialogPopup
        className='sm:max-w-3xl max-h-[85vh] overflow-hidden'
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
        <DialogPanel className='p-0 flex-1 min-h-0'>
          <RSVPReader
            initialContent={pageContent}
            onUsePageContent={handleUsePageContent}
            pageContentFull={pageContent}
            pageContentTitle={pageTitle}
            pageContentError={pageError}
            initialPastedContent={selectedContent}
            containerClassName='h-full'
            controlsContainer={controlsContainer}
            controlPanelClassName='w-full'
            settingsStorageKey={settingsStorageKey}
            initialSettings={initialSettings}
          />
        </DialogPanel>
        <DialogFooter
          className='p-0 bg-background'
          variant='bare'
          ref={controlsContainer}
        ></DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
