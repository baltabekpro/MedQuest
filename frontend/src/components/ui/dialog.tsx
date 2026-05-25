import * as DialogPrimitive from '@radix-ui/react-dialog'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export const DialogContent = ({ className = '', ...props }: DialogPrimitive.DialogContentProps) => (
  <DialogPortal>
    <DialogPrimitive.Overlay className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm' />
    <DialogPrimitive.Content
      className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-white p-4 shadow-lg sm:p-6 ${className}`}
      {...props}
    />
  </DialogPortal>
)
