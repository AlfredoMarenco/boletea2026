import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  activeTab: string;
  onTabChange: (value: string) => void;
} | null>(null);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
};

const Tabs = ({ children, className, defaultValue, value, onValueChange, ...props }: any) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue)

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  const handleTabChange = (val: string) => {
    if (value === undefined) {
      setActiveTab(val)
    }
    if (onValueChange) {
      onValueChange(val)
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ children, className, ...props }: any) => {
  return (
    <div
      className={cn(
        "inline-flex h-12 items-center justify-start rounded-xl bg-gray-100 p-1 text-gray-500 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const TabsTrigger = ({ children, className, value, hasError, ...props }: any) => {
  const { activeTab, onTabChange } = useTabs();
  const isActive = activeTab === value

  return (
    <button
      type="button"
      onClick={() => onTabChange(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-[#c90000] shadow-sm dark:bg-[#c90000] dark:text-white"
          : "hover:bg-white/50 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200",
        className
      )}
      {...props}
    >
      {children}
      {hasError && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  )
}

const TabsContent = ({ children, className, value, ...props }: any) => {
  const { activeTab } = useTabs();
  
  if (activeTab !== value) return null

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
