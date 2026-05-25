import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogAction = AlertDialogPrimitive.Action
export const AlertDialogCancel = AlertDialogPrimitive.Cancel
export const AlertDialogTitle = AlertDialogPrimitive.Title
export const AlertDialogDescription = AlertDialogPrimitive.Description

export const AlertDialogContent = ({ className = '', ...props }: AlertDialogPrimitive.AlertDialogContentProps) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm' />
    <AlertDialogPrimitive.Content
      className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-white p-4 shadow-lg sm:p-6 ${className}`}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
)
