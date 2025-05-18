"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Atom, BookOpen, Calendar, ChevronRight, Clock, Code, Loader2, Rocket, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookings } from "@/lib/dashboard-api"
import { getPrograms } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch user's bookings
        const bookingsResponse = await getBookings()

        if (bookingsResponse.success) {
          setBookings(bookingsResponse.data)
        }

        // Fetch recommended programs
        const programsResponse = await getPrograms({ limit: 3 })

        if (programsResponse.success) {
          setPrograms(programsResponse.data)
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setError(
          error.response?.data?.error ||
          "An error occurred while fetching dashboard data"
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Helper function to get icon based on program name
  function getIconForProgram(programName: string) {
    const lowerName = programName.toLowerCase()
    if (lowerName.includes('robot')) return Rocket
    if (lowerName.includes('cod') || lowerName.includes('program')) return Code
    if (lowerName.includes('science')) return Atom
    if (lowerName.includes('math')) return BookOpen
    return Rocket // Default icon
  }

  // Filter upcoming bookings (confirmed or pending)
  const upcomingBookings = bookings
    .filter(booking => booking.status !== "Cancelled")
    .sort((a, b) => new Date(a.program_date).getTime() - new Date(b.program_date).getTime())
    .slice(0, 2)
    .map(booking => ({
      id: booking.id,
      title: booking.program_title,
      date: new Date(booking.program_date).toLocaleDateString(),
      time: booking.program_time,
      status: booking.status,
      icon: getIconForProgram(booking.program_title)
    }))

  // Map recommended programs
  const recommendedPrograms = programs.slice(0, 3).map(program => ({
    id: program.id,
    title: program.title,
    description: program.description,
    seats: program.seats - (program.booked_seats || 0),
    icon: getIconForProgram(program.title)
  }))

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h1 className="text-2xl font-bold">Loading dashboard data...</h1>
        </div>
      ) : error ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard/programs")}>
            Browse Programs
          </Button>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.firstName || 'Student'}! Here's an overview of your STEM learning journey.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{programs.length}</div>
                <p className="text-xs text-muted-foreground">Programs available for registration</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <p className="text-xs text-muted-foreground">Programs you've registered for</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                <p className="text-xs text-muted-foreground">Programs in your schedule</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{isAdmin ? "Admin" : "Completed"}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <>
                    <div className="text-2xl font-bold">Access</div>
                    <p className="text-xs text-muted-foreground">
                      <Link href="/dashboard/admin" className="text-primary hover:underline">
                        Go to Admin Dashboard
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {bookings.filter(b => new Date(b.program_date) < new Date() && b.status === "Confirmed").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Programs you've completed</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">


        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Programs</CardTitle>
            <CardDescription>Your scheduled programs and workshops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((program) => (
                  <div key={program.id} className="flex items-center space-x-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <program.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{program.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {program.date} • {program.time}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          program.status === "Confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {program.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No upcoming bookings</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/bookings">
                View all bookings
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Programs that match your interests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedPrograms.length > 0 ? (
                recommendedPrograms.map((program) => (
                  <div key={program.id} className="flex items-start space-x-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <program.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{program.title}</p>
                      <p className="text-sm text-muted-foreground">{program.description}</p>
                      <p className="text-xs text-muted-foreground">{program.seats} seats available</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No programs available</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/programs">
                Browse all programs
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    </>
    )}
  )
}

