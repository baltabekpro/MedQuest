import * as DialogPrimitive from '@radix-ui/react-dialog'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export const DialogContent = ({ className = '', ...props }: DialogPrimitive.DialogContentProps) => (
  <DialogPortal>
    <DialogPrimitive.Overlay className='fixed inset-0 z-40 bg-black/40' />
    <DialogPrimitive.Content
      className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-6 shadow-sm ${className}`}
      {...props}
    />
  </DialogPortal>
)
