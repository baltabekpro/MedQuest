import * as TabsPrimitive from '@radix-ui/react-tabs'

export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export const TabsList = ({ className = '', ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List className={`inline-flex h-10 items-center rounded-md bg-slate-100 p-1 ${className}`} {...props} />
)

export const TabsTrigger = ({ className = '', ...props }: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm ${className}`}
    {...props}
  />
)
