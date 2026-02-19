import * as PopoverPrimitive from '@radix-ui/react-popover'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export const PopoverContent = ({ className = '', sideOffset = 8, ...props }: PopoverPrimitive.PopoverContentProps) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      sideOffset={sideOffset}
      className={`z-50 w-96 rounded-xl border border-border bg-white p-3 shadow-lg outline-none ${className}`}
      {...props}
    />
  </PopoverPrimitive.Portal>
)
