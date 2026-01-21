'use client'

import '@/assets/tailwind.css'
import '@fontsource-variable/chivo-mono'
import '@fontsource-variable/merriweather'
import '@fontsource-variable/figtree'
import type { DialogPortalProps } from '@base-ui/react'
import { Logo } from '@read-for-speed/speed-reader/logo'
import { Button } from '@read-for-speed/ui/components/button'
import { BookOpen } from 'lucide-react'
import type { RefObject } from 'react'
import { cn } from '@/lib/utils'

export interface ContentDialogProps {
  children: React.ReactNode
  container: DialogPortalProps['container']
  controlsContainerRef: RefObject<HTMLDivElement | null>
  open: boolean
  onOpenChange: (open: boolean) => void
  showFloatingButton: boolean
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
  container,
  children,
  controlsContainerRef,
  open,
  onOpenChange,
  showFloatingButton,
}: ContentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogTrigger
        render={
          <Button>
            <BookOpen className='size-4' />
          </Button>
        }
        className={cn({ hidden: !showFloatingButton })}
      />
      <DialogPopup
        className='sm:max-w-5xl overflow-hidden'
        container={container}
        bottomStickOnMobile={true}
        keepMounted={true}
      >
        <DialogHeader>
          <DialogTitle>
            <div className='flex items-center gap-2'>
              <Logo className='size-4' />
              <span className='sm:text-lg/tight text-base/tight font-semibold'>Read For Speed</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogPanel>{children}</DialogPanel>
        <DialogFooter
          variant='bare'
          ref={controlsContainerRef}
          className='has-only:gap-0' // if only 1 child, gap is meaningless
        />
      </DialogPopup>
    </Dialog>
  )
}
