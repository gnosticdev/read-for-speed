'use client'

import '@/assets/tailwind.css'
import '@fontsource-variable/chivo-mono'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/figtree'

import type { DialogRootActions } from '@base-ui/react'
import {
  DEFAULT_READER_SETTINGS,
  type ReaderSettings,
  RSVPReader,
} from '@read-for-speed/speed-reader/rsvp-reader'
import { Button } from '@read-for-speed/ui/components/button'
import { BookOpen } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogCreateHandle,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog-with-portal'

const contentDialogHandle = DialogCreateHandle<React.ComponentType | null>()

const TriggerButton = ({ hide }: { hide?: boolean }) => (
  <DialogTrigger
    handle={contentDialogHandle}
    render={
      <Button
        variant='default'
        size='icon'
        className={hide ? 'hidden' : undefined}
      >
        <BookOpen />
      </Button>
    }
  />
)
/**
 * Main content app component that renders the speed reader dialog.
 *
 * This component is responsible for:
 * - Managing reader settings (load/save from browser storage)
 * - Handling dialog open/close triggers from the extension
 * - Passing props to the RSVPReader component
 *
 * Uses the ContentScriptProvider context for:
 * - Page content and title (extracted via Readability)
 * - Selection text from context menu
 * - Open/close triggers from browser extension messages
 */
export default function ReaderDialog() {
  const {
    anchor,
    selectionText,
    openOnSelection,
    openOnPageAction,
    pageContent,
    pageTitle,
    pageError,
    settingsStorageKey,
    onSelectionHandled,
    onPageActionHandled,
  } = useContentScriptContext()

  const [open, setOpen] = useState(() => openOnSelection || openOnPageAction)
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS)
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false)
  const selectedContent = selectionText?.trim()

  const actionsRef = useRef<DialogRootActions>({
    unmount: () => void 0,
    close: () => void 0,
  })

  const controlsContainer = useRef<HTMLDivElement>(null)

  /**
   * Load settings from browser storage on mount.
   */
  useEffect(() => {
    if (!settingsStorageKey) {
      setHasLoadedSettings(true)
      return
    }

    let isMounted = true

    const loadSettings = async () => {
      try {
        const stored = await storage.getItem<ReaderSettings>(`local:${settingsStorageKey}`)
        if (isMounted && stored) {
          setSettings({ ...DEFAULT_READER_SETTINGS, ...stored })
        }
      } catch (error) {
        console.warn('Failed to load reader settings from storage.', error)
      } finally {
        if (isMounted) {
          setHasLoadedSettings(true)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [settingsStorageKey])

  /**
   * Handle settings changes from RSVPReader.
   * Updates local state and persists to browser storage.
   */
  const handleSettingsChange = useCallback(
    (newSettings: ReaderSettings) => {
      setSettings(newSettings)

      // Persist to browser storage
      if (settingsStorageKey && hasLoadedSettings) {
        storage.setItem(`local:${settingsStorageKey}`, newSettings).catch((error) => {
          console.warn('Failed to save reader settings to storage.', error)
        })
      }
    },
    [settingsStorageKey, hasLoadedSettings],
  )

  /**
   * Open dialog when selection text is received.
   */
  useEffect(() => {
    if (!openOnSelection || !selectedContent) return
    setOpen(true)
    onSelectionHandled()
  }, [openOnSelection, onSelectionHandled, selectedContent])

  /**
   * Open dialog when page action is triggered (toolbar click).
   */
  useEffect(() => {
    if (!openOnPageAction) return
    if (!settings.usePageAction) {
      onPageActionHandled()
      return
    }
    setOpen(true)
    onPageActionHandled()
  }, [onPageActionHandled, openOnPageAction, settings.usePageAction])

  return (
    <Dialog
      actionsRef={actionsRef}
      open={open}
      handle={contentDialogHandle}
      onOpenChange={(open) => {
        setOpen(open)
      }}
    >
      <TriggerButton hide={openOnPageAction} />
      <DialogPopup
        className='sm:max-w-3xl overflow-hidden'
        portalContainer={anchor}
      >
        <DialogHeader>
          <DialogTitle>
            <div className='flex items-center gap-2'>
              <BookOpen className='size-4' />
              <span className='text-lg/tight font-semibold'>Read For Speed</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <RSVPReader
            pageContent={pageContent}
            pageContentTitle={pageTitle}
            pageContentError={pageError}
            initialPastedContent={selectedContent}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            classNames={{
              container: 'h-full',
            }}
            controlPanelRef={controlsContainer}
          />
        </DialogPanel>
        <DialogFooter
          // className='p-0'
          variant='bare'
          ref={controlsContainer}
        />
      </DialogPopup>
    </Dialog>
  )
}
