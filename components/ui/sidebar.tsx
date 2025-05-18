"use client"

import * as React from "react"
import {
  useSidebarState,
  SidebarProvider as Root,
  Sidebar as Container,
  SidebarTrigger as Trigger,
  SidebarHeader as Header,
  SidebarContent as Content,
  SidebarFooter as Footer,
  SidebarGroup as Group,
  SidebarGroupLabel as GroupLabel,
  SidebarGroupContent as GroupContent,
  SidebarMenu as Menu,
  SidebarMenuItem as MenuItem,
  SidebarMenuButton as MenuButton,
  useSidebar as useRootSidebar,
} from "./use-sidebar"

const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Container
        ref={ref}
        className={
          "fixed left-0 top-0 z-50 h-full w-72 flex-col bg-sidebar border-sidebar border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0" +
          (className ? " " + className : "")
        }
        {...props}
      />
    )
  },
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { isOpen, onOpenChange } = useRootSidebar()
    return <Trigger ref={ref} className={className} onClick={() => onOpenChange(!isOpen)} {...props} />
  },
)
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Header
        ref={ref}
        className={"flex h-16 items-center justify-between px-4 " + (className ? " " + className : "")}
        {...props}
      />
    )
  },
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Content
        ref={ref}
        className={"flex flex-1 flex-col gap-2 p-4 pt-0 overflow-y-auto" + (className ? " " + className : "")}
        {...props}
      />
    )
  },
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <Footer ref={ref} className={"px-4 py-3 " + (className ? " " + className : "")} {...props} />
  },
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <Group ref={ref} className={"space-y-1 " + (className ? " " + className : "")} {...props} />
  },
)
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <GroupLabel
        ref={ref}
        className={"px-4 py-1 text-sm font-semibold text-muted-foreground " + (className ? " " + className : "")}
        {...props}
      />
    )
  },
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <GroupContent ref={ref} className={"space-y-1 " + (className ? " " + className : "")} {...props} />
  },
)
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => {
    return <Menu ref={ref} className={"grid gap-1 " + (className ? " " + className : "")} {...props} />
  },
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => {
    return <MenuItem ref={ref} className={className} {...props} />
  },
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLAnchorElement,
  { isActive?: boolean; tooltip?: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, isActive, tooltip, ...props }, ref) => {
  return (
    <MenuButton
      ref={ref}
      className={
        "group relative flex h-10 items-center gap-2 rounded-md px-3.5 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground " +
        (isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "") +
        (className ? " " + className : "")
      }
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Root as SidebarProvider,
  useSidebarState as useSidebar,
}

export type Side = "left" | "right"

