"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Atom, BookOpen, Calendar, ChevronDown, Home, LogOut, Settings, User } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const navigation = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home,
      items: [] 
    },
    { 
      name: "Programs", 
      href: "/dashboard/programs", 
      icon: BookOpen,
      items: [
        { name: "All Programs", href: "/dashboard/programs" },
        { name: "Featured", href: "/dashboard/programs/featured" },
        { name: "Categories", href: "/dashboard/programs/categories" },
      ]
    },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar, items: [] },
    { name: "Profile", href: "/dashboard/profile", icon: User, items: [] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, items: [] },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => router.push('/')}>
            <Atom className="h-6 w-6 text-primary" />
            <span>STEM Explorer</span>
          </div>
          
          <nav className="flex items-center gap-6 ml-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.items.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {item.items.map((subItem) => (
                        <DropdownMenuItem 
                          key={subItem.name}
                          onClick={() => handleNavigation(subItem.href)}
                        >
                          {subItem.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 ${pathname === item.href ? 'bg-muted' : ''}`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" asChild>
              <a href="/dashboard/programs">Browse Programs</a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span>John Doe</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/auth/signout')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}

