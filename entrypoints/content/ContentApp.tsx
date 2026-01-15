'use client'

import '@/assets/tailwind.css'
import '@fontsource-variable/chivo-mono'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/figtree'

import type { DialogRootActions } from '@base-ui/react'
import { Readability } from '@mozilla/readability'
import { BookOpen } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { browser } from 'wxt/browser'
import { Button } from '@/components/ui/button'
import {
  Dialog,
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
  settingsStorageArea = 'local',
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
  const [pageExcerpt, setPageExcerpt] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState<PageContentStatus>('idle')
  const [usePageAction, setUsePageAction] = useState(false)
  const selectedContent = selectionText?.trim()
  const selectionExcerpt = selectedContent ? buildExcerpt(selectedContent) : null

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

  const normalizeStoredUsePageAction = useCallback((value: unknown) => {
    if (!value || typeof value !== 'object') return false
    const stored = value as Record<string, unknown>
    return typeof stored.usePageAction === 'boolean' ? stored.usePageAction : false
  }, [])

  useEffect(() => {
    if (!settingsStorageKey) return
    const storage = browser?.storage?.[settingsStorageArea]
    if (!storage) return
    let isMounted = true

    // Keep the launcher mode in sync with stored reader settings.
    storage
      .get(settingsStorageKey)
      .then((stored) => {
        if (!isMounted) return
        setUsePageAction(normalizeStoredUsePageAction(stored?.[settingsStorageKey]))
      })
      .catch((error) => {
        console.warn('Failed to load reader settings for the launcher UI.', error)
      })

    const handleStorageChange = (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== settingsStorageArea) return
      const change = changes[settingsStorageKey]
      if (!change) return
      setUsePageAction(normalizeStoredUsePageAction(change.newValue))
    }

    browser.storage.onChanged.addListener(handleStorageChange)
    return () => {
      isMounted = false
      browser.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [normalizeStoredUsePageAction, settingsStorageArea, settingsStorageKey])

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
    if (!usePageAction) {
      onPageActionHandled?.()
      return
    }
    setOpen(true)
    onPageActionHandled?.()
  }, [onPageActionHandled, openOnPageAction, usePageAction])

  return (
    <Dialog
      actionsRef={actionsRef}
      open={open}
      onOpenChange={setOpen}
    >
      {!usePageAction && (
        <DialogTrigger
          render={
            <Button variant='default'>
              <span className='sr-only'>Open Read For Speed</span>
              <BookOpen className='w-4 h-4' />
            </Button>
          }
        />
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
            initialContent={selectedContent || pageContent}
            onUsePageContent={handleUsePageContent}
            pageContentStatus={status}
            pageContentTitle={pageTitle}
            pageContentError={pageError}
            pageContentExcerpt={selectionExcerpt || pageExcerpt}
            containerClassName='h-full'
            controlsContainer={controlsContainer}
            controlPanelClassName='w-full'
            settingsStorageKey={settingsStorageKey}
            settingsStorageArea={settingsStorageArea}
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
