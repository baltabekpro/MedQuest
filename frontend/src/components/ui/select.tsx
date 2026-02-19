import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export const Select = SelectPrimitive.Root
export const SelectValue = ({ className = '', ...props }: SelectPrimitive.SelectValueProps) => (
  <SelectPrimitive.Value className={`data-[placeholder]:text-muted-foreground ${className}`} {...props} />
)

export const SelectTrigger = ({ className = '', children, ...props }: SelectPrimitive.SelectTriggerProps) => (
  <SelectPrimitive.Trigger
    className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-white px-3 text-sm transition-colors hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/30 ${className}`}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className='h-4 w-4 shrink-0 text-muted transition-transform duration-200 data-[state=open]:rotate-180' />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)

export const SelectContent = ({ children, className = '', ...props }: SelectPrimitive.SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      position='popper'
      sideOffset={4}
      className={`z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-white shadow-md ${className}`}
      {...props}
    >
      <SelectPrimitive.Viewport className='p-1'>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

export const SelectItem = ({ children, className = '', ...props }: SelectPrimitive.SelectItemProps) => (
  <SelectPrimitive.Item
    className={`relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:font-medium ${className}`}
    {...props}
  >
    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
      <SelectPrimitive.ItemIndicator>
        <Check className='h-4 w-4 text-primary' />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)
