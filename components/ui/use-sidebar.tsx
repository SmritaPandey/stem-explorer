"use client"

import * as React from "react"

interface SidebarContextType {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

// Change the function name from useSidebar to useSidebarState and export both names
export function useSidebarState() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarProvider")
  }
  return context
}

// Add this alias for compatibility with both naming conventions
export const useSidebar = useSidebarState

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  onOpenChange: onOpenChangeProp,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [isMobile, setIsMobile] = React.useState(false)

  // Check if we're on mobile on mount and when window resizes
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // If we're on mobile, close the sidebar by default
      if (window.innerWidth < 768 && defaultOpen) {
        setOpen(false)
      }
    }

    // Check on mount
    checkIsMobile()

    // Add resize listener
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [defaultOpen])

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (onOpenChangeProp) {
        onOpenChangeProp(open)
      } else {
        setOpen(open)
      }
    },
    [onOpenChangeProp],
  )

  return <SidebarContext.Provider value={{ isOpen: open, onOpenChange, isMobile }}>{children}</SidebarContext.Provider>
}

// Component primitives
export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isOpen, isMobile } = useSidebarState()

    // Apply transform for mobile sidebar
    const style = isMobile ? { transform: isOpen ? "translateX(0)" : "translateX(-100%)" } : undefined

    return <div ref={ref} style={style} data-state={isOpen ? "open" : "closed"} {...props} />
  },
)
Sidebar.displayName = "Sidebar"

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ ...props }, ref) => {
    return <button ref={ref} type="button" {...props} />
  },
)
SidebarTrigger.displayName = "SidebarTrigger"

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  },
)
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  },
)
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  },
)
SidebarFooter.displayName = "SidebarFooter"

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  },
)
SidebarGroup.displayName = "SidebarGroup"

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  },
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  },
)
SidebarGroupContent.displayName = "SidebarGroupContent"

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ ...props }, ref) => {
    return <ul ref={ref} {...props} />
  },
)
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ ...props }, ref) => {
    return <li ref={ref} {...props} />
  },
)
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ ...props }, ref) => {
    return <a ref={ref} {...props} />
  },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

