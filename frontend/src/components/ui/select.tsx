import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = ({ className = '', ...props }: SelectPrimitive.SelectTriggerProps) => (
  <SelectPrimitive.Trigger className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-white px-3 text-sm ${className}`} {...props}>
    <SelectPrimitive.Value />
    <SelectPrimitive.Icon>
      <ChevronDown className='h-4 w-4 text-muted' />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)

export const SelectContent = ({ children, className = '', ...props }: SelectPrimitive.SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content className={`z-50 overflow-hidden rounded-md border border-border bg-white shadow-sm ${className}`} {...props}>
      <SelectPrimitive.Viewport className='p-1'>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

export const SelectItem = ({ children, className = '', ...props }: SelectPrimitive.SelectItemProps) => (
  <SelectPrimitive.Item className={`relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-slate-100 ${className}`} {...props}>
    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
      <SelectPrimitive.ItemIndicator>
        <Check className='h-4 w-4' />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)
