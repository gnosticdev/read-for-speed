'use client'

import { Readability } from '@mozilla/readability'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { CustomMessages } from '@/lib/message-types'

/**
 * Status of page content extraction.
 */
export type PageContentStatus = 'idle' | 'loading' | 'error' | 'ready'

/**
 * Context value provided by ContentScriptProvider.
 */
export interface ContentScriptContextValue {
  /** Cloned document for content extraction. */
  docClone: Document | null
  /** Anchor element for dialogs/portals. */
  anchor: HTMLElement | null
  /** Text selected by the user (e.g., from context menu). */
  selectionText: string | null
  /** Whether the dialog should open due to text selection. */
  openOnSelection: boolean
  /** Whether the dialog should open due to page action (toolbar click). */
  openOnPageAction: boolean
  /** Extracted page content text. */
  pageContent: string | undefined
  /** Title of the extracted page content. */
  pageTitle: string | null
  /** Error message if page content extraction failed. */
  pageError: string | null
  /** Status of page content extraction. */
  pageContentStatus: PageContentStatus
  /** Storage key for persisting reader settings. */
  settingsStorageKey: 'read-for-speed:settings'
  /** Callback to mark selection as handled (resets openOnSelection). */
  onSelectionHandled: () => void
  /** Callback to mark page action as handled (resets openOnPageAction). */
  onPageActionHandled: () => void
  /** Callback to clear selection text. */
  onClearSelection: () => void
  /** Callback to trigger page content extraction. */
  loadPageContent: () => void
}

const ContentScriptContext = createContext<ContentScriptContextValue | null>(null)

/**
 * Hook to access the ContentScript context.
 * Must be used within a ContentScriptProvider.
 *
 * @throws {Error} If used outside of ContentScriptProvider.
 */
export function useContentScriptContext(): ContentScriptContextValue {
  const context = useContext(ContentScriptContext)
  if (!context) {
    throw new Error('useContentScriptContext must be used within a ContentScriptProvider')
  }
  return context
}

/**
 * Props for the ContentScriptProvider component.
 */
export interface ContentScriptProviderProps {
  children: ReactNode
  /** Cloned document for content extraction. */
  docClone: Document
  /** Anchor element for dialogs/portals. */
  anchor: HTMLElement
}

/**
 * Builds a short excerpt from text content.
 */
const buildExcerpt = (text: string, maxLength = 240) => {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trim()}...`
}

/**
 * Provider component that manages the content script state for the browser extension.
 *
 * This provider handles:
 * - Browser extension message listening (selection text, page action)
 * - Page content extraction using Readability
 * - State management for the reader UI
 *
 * @example
 * ```tsx
 * <ContentScriptProvider docClone={docClone} anchor={anchor}>
 *   <ContentApp />
 * </ContentScriptProvider>
 * ```
 */
export function ContentScriptProvider({ children, docClone, anchor }: ContentScriptProviderProps) {
  // Selection state
  const [selectionText, setSelectionText] = useState<string | null>(null)
  const [openOnSelection, setOpenOnSelection] = useState(false)
  const [openOnPageAction, setOpenOnPageAction] = useState(false)

  // Page content state
  // const [pageContent, setPageContent] = useState<string | undefined>()
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [pageContentStatus, setPageContentStatus] = useState<PageContentStatus>('idle')

  const pageContent = useRef<string | undefined>(undefined)

  const settingsStorageKey = 'read-for-speed:settings' as const

  /**
   * Handles incoming browser extension messages.
   */
  const handleSelectionMessage = useCallback((message: CustomMessages) => {
    if (!message) return

    if (message.type === 'RSVP_GET_SELECTION_TEXT') {
      const nextSelection = message.payload?.trim() ?? ''
      if (!nextSelection) return

      // Use the highlighted selection for the reader and open the UI.
      setSelectionText(nextSelection)
      setOpenOnSelection(true)
      return
    }

    if (message.type === 'RSVP_MOUNT_UI') {
      // Open the dialog when the toolbar action is clicked.
      setOpenOnPageAction(true)
    }
  }, [])

  /**
   * Set up browser extension message listener.
   */
  useEffect(() => {
    browser.runtime.onMessage.addListener(handleSelectionMessage)

    return () => browser.runtime.onMessage.removeListener(handleSelectionMessage)
  }, [handleSelectionMessage])

  /**
   * Extracts content from the page using Readability JS library.
   */
  const loadPageContent = useCallback(() => {
    setPageContentStatus('loading')
    setPageError(null)

    const article = new Readability(docClone).parse()
    if (!article) {
      setPageError('No readable text found on this page.')
      setPageContentStatus('error')
      return
    }

    const articleText = article.textContent ?? ''
    // We compute excerpt but don't expose it directly - can be added if needed
    buildExcerpt(articleText)

    // Store full content + title for the reader UI.
    // setPageContent(articleText)
    pageContent.current = articleText
    setPageTitle(article.title ?? docClone.title)
    setPageContentStatus('ready')
  }, [docClone])

  /**
   * Callback to mark selection as handled.
   */
  const onSelectionHandled = useCallback(() => {
    setOpenOnSelection(false)
  }, [])

  /**
   * Callback to mark page action as handled.
   */
  const onPageActionHandled = useCallback(() => {
    setOpenOnPageAction(false)
  }, [])

  /**
   * Callback to clear selection text.
   */
  const onClearSelection = useCallback(() => {
    setSelectionText(null)
  }, [])

  /**
   * Auto-load page content on mount.
   */
  useEffect(() => {
    if (pageContentStatus === 'idle') {
      loadPageContent()
    }
  }, [loadPageContent, pageContentStatus])

  /**
   * Memoized context value to prevent unnecessary re-renders.
   */
  const contextValue = useMemo<ContentScriptContextValue>(
    () => ({
      docClone,
      anchor,
      selectionText,
      openOnSelection,
      openOnPageAction,
      pageContent: pageContent.current,
      pageTitle,
      pageError,
      pageContentStatus,
      settingsStorageKey,
      onSelectionHandled,
      onPageActionHandled,
      onClearSelection,
      loadPageContent,
    }),
    [
      docClone,
      anchor,
      selectionText,
      openOnSelection,
      openOnPageAction,
      pageTitle,
      pageError,
      pageContentStatus,
      settingsStorageKey,
      onSelectionHandled,
      onPageActionHandled,
      onClearSelection,
      loadPageContent,
    ],
  )

  return (
    <ContentScriptContext.Provider value={contextValue}>{children}</ContentScriptContext.Provider>
  )
}
