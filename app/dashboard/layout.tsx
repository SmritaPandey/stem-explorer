"use client"

import { useState, useEffect } from "react"
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
import {
  Atom, BookOpen, Calendar, ChevronDown, Home, LogOut,
  Settings, User, Rocket, Sparkles, Star
} from 'lucide-react'
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAdmin } = useAuth()
  const { toast } = useToast()

  // Make toast available globally for the logout function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.toast = toast;
    }
  }, [toast]);

  const navigation = [
    {
      name: "My Dashboard",
      href: "/dashboard",
      icon: Home,
      items: []
    },
    {
      name: "Adventures",
      href: "/dashboard/programs",
      icon: Rocket,
      items: [
        { name: "All Adventures", href: "/dashboard/programs" },
        { name: "Featured", href: "/dashboard/programs/featured" },
        { name: "Categories", href: "/dashboard/programs/categories" },
      ]
    },
    { name: "My Calendar", href: "/dashboard/calendar", icon: Calendar, items: [] },
    { name: "My Achievements", href: "/dashboard/achievements", icon: Star, items: [] },
    { name: "My Profile", href: "/dashboard/profile", icon: User, items: [] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, items: [] },
  ]

  // Add admin option if user is admin
  if (isAdmin) {
    navigation.push({
      name: "Admin Panel",
      href: "/dashboard/admin",
      icon: Settings,
      items: []
    });
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-[#D6EBFF] bg-white shadow-sm">
        <div className="flex h-20 items-center px-6">
          <div
            className="flex items-center gap-2 font-bold text-xl cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="relative">
              <Atom className="h-7 w-7 text-[#0078FF] wiggling" />
              <Sparkles className="h-4 w-4 text-[#FFC800] absolute -top-1 -right-1" />
            </div>
            <span className="text-black">
              Kid Qubit
            </span>
          </div>

          <nav className="flex items-center gap-4 ml-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.items.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
                          pathname === item.href ? 'bg-[#F0F8FF] text-[#0078FF]' : 'hover:bg-[#F0F8FF] text-black'
                        }`}
                      >
                        <div className={`${pathname === item.href ? 'text-[#0078FF]' : 'text-[#555555]'}`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                        <ChevronDown className="h-4 w-4 text-[#0078FF]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl border-2 border-[#D6EBFF] p-2 min-w-[200px] bg-white shadow-md">
                      {item.items.map((subItem) => (
                        <DropdownMenuItem
                          key={subItem.name}
                          onClick={() => handleNavigation(subItem.href)}
                          className="rounded-lg cursor-pointer hover:bg-[#F0F8FF] py-2 text-black"
                        >
                          {subItem.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
                      pathname === item.href
                        ? 'bg-[#F0F8FF] text-[#0078FF]'
                        : 'hover:bg-[#F0F8FF] text-black'
                    }`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className={`${pathname === item.href ? 'text-[#0078FF]' : 'text-[#555555]'}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Button>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Button
              className="rounded-xl border-2 border-[#D6EBFF] bg-white text-[#0078FF] hover:bg-[#F0F8FF] hover:border-[#0078FF]"
              asChild
            >
              <a href="/dashboard/programs">Find New Adventures</a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-xl hover:bg-[#F0F8FF]">
                  <Avatar className="h-8 w-8 border-2 border-[#D6EBFF]">
                    {user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} alt={user?.firstName || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-[#0078FF] to-[#7B00FF] text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0] || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium text-black">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Explorer'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#0078FF]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-2 border-[#D6EBFF] p-2 bg-white shadow-md">
                <div className="flex flex-col items-center justify-center py-2 mb-2 border-b border-[#D6EBFF]">
                  <Avatar className="h-16 w-16 mb-2 border-2 border-[#D6EBFF]">
                    {user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} alt={user?.firstName || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-[#0078FF] to-[#7B00FF] text-white text-xl">
                        {user?.firstName?.[0]}{user?.lastName?.[0] || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="font-bold text-black">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Explorer'}
                  </p>
                  <p className="text-sm text-[#555555]">{user?.email || ''}</p>
                </div>

                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/profile')}
                  className="rounded-lg cursor-pointer hover:bg-[#F0F8FF] py-2"
                >
                  <User className="mr-2 h-4 w-4 text-[#0078FF]" />
                  <span className="text-black">My Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/achievements')}
                  className="rounded-lg cursor-pointer hover:bg-[#F0F8FF] py-2"
                >
                  <Star className="mr-2 h-4 w-4 text-[#FFC800]" />
                  <span className="text-black">My Achievements</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/settings')}
                  className="rounded-lg cursor-pointer hover:bg-[#F0F8FF] py-2"
                >
                  <Settings className="mr-2 h-4 w-4 text-[#7B00FF]" />
                  <span className="text-black">Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-[#D6EBFF]" />

                <DropdownMenuItem
                  onClick={() => logout()}
                  className="rounded-lg cursor-pointer hover:bg-[#FFF0F0] py-2"
                >
                  <LogOut className="mr-2 h-4 w-4 text-[#FF0000]" />
                  <span className="text-[#FF0000]">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 bg-white text-black">
        {children}
      </main>
    </div>
  )
}

