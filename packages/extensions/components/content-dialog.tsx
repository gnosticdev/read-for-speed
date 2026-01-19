'use client'

import '@/assets/tailwind.css'
import '@fontsource-variable/chivo-mono'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/figtree'
import { Logo } from '@read-for-speed/speed-reader/logo'
import { Button } from '@read-for-speed/ui/components/button'
import { BookOpen } from 'lucide-react'
import type React from 'react'
import type { RefObject } from 'react'
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

/**
 * Floating button to trigger dialog if the setting is enabled.
 */
export const TriggerButton = () => (
  <DialogTrigger
    handle={contentDialogHandle}
    render={(props) => (
      <Button
        variant='default'
        size='icon'
        {...props}
      >
        <BookOpen />
      </Button>
    )}
  />
)

export interface ContentDialogProps {
  uiContainer: HTMLElement
  children: React.ReactNode
  controlsContainerRef: RefObject<HTMLDivElement | null>
  open: boolean
  onOpenChange: (open: boolean) => void
}
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
export default function ContentDialog({
  uiContainer,
  children,
  controlsContainerRef,
  open,
  onOpenChange,
}: ContentDialogProps) {
  return (
    <Dialog
      open={open}
      handle={contentDialogHandle}
      onOpenChange={onOpenChange}
    >
      <DialogPopup
        className='sm:max-w-3xl overflow-hidden'
        portalContainer={uiContainer}
        keepMounted={true}
      >
        <DialogHeader>
          <DialogTitle>
            <div className='flex items-center gap-2'>
              <Logo className='size-4' />
              <span className='text-lg/tight font-semibold'>Read For Speed</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogPanel>{children}</DialogPanel>
        <DialogFooter
          variant='bare'
          ref={controlsContainerRef}
        />
      </DialogPopup>
    </Dialog>
  )
}
