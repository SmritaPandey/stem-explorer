"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Atom, BookOpen, Calendar, ChevronRight, Clock, Code, Loader2,
  Rocket, Users, Sparkles, Brain, Beaker, Puzzle, Lightbulb, Star
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookings, getPrograms, getUserProfile } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth-context"
import supabase from "@/lib/supabase"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<string[]>([
    "Completed first program",
    "Joined the STEM Explorer community",
    "Attended a Robotics workshop"
  ])
  const [points, setPoints] = useState<number>(125)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get real user data from Supabase if available
        if (user?.id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileData && !profileError) {
            setUserProfile(profileData)

            // If we have real points data, use it
            if (profileData.points) {
              setPoints(profileData.points)
            }

            // If we have real achievements data, use it
            if (profileData.achievements && profileData.achievements.length > 0) {
              setAchievements(profileData.achievements)
            }
          }
        }

        // Fetch user's bookings
        const bookingsResponse = await getBookings()

        if (bookingsResponse.success) {
          setBookings(bookingsResponse.data || [])
        } else if (bookingsResponse.error) {
          console.warn("Booking fetch error:", bookingsResponse.error)
          // Use sample data if API fails
          setBookings([
            {
              id: 1,
              program_title: "Robot Builders Club",
              program_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              program_time: "3:00 PM - 5:00 PM",
              status: "Confirmed"
            },
            {
              id: 2,
              program_title: "Science Explorers",
              program_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              program_time: "10:00 AM - 12:00 PM",
              status: "Pending"
            }
          ])
        }

        // Fetch recommended programs
        const programsResponse = await getPrograms({ limit: 3 })

        if (programsResponse.success) {
          setPrograms(programsResponse.data || [])
        } else if (programsResponse.error) {
          console.warn("Programs fetch error:", programsResponse.error)
          // Use sample data if API fails
          setPrograms([
            {
              id: 1,
              title: "Robot Builders Club",
              description: "Build your own robot friend and teach it to do cool tricks!",
              seats: 8,
              booked_seats: 2
            },
            {
              id: 2,
              title: "Code Wizards",
              description: "Create your own games and animations with fun coding!",
              seats: 10,
              booked_seats: 4
            },
            {
              id: 3,
              title: "Science Explorers",
              description: "Mix potions, launch rockets, and discover the secrets of nature!",
              seats: 12,
              booked_seats: 6
            }
          ])
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setError(
          error.message ||
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
    if (lowerName.includes('science')) return Beaker
    if (lowerName.includes('math')) return Brain
    if (lowerName.includes('wizard')) return Sparkles
    if (lowerName.includes('puzzle') || lowerName.includes('game')) return Puzzle
    if (lowerName.includes('explor')) return Lightbulb
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
          <div className="stem-card bg-white p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#F0F8FF] p-3 rounded-full border border-[#D6EBFF]">
                <div className="text-4xl">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user?.firstName || 'Student'}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    '👩‍🔬'
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-black">
                  Hello, {user?.firstName || 'Explorer'}!
                </h1>
                <p className="text-black text-lg">Welcome to your STEM adventure dashboard! 🚀</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Star className="h-5 w-5 text-[#FFC800]" />
              <p className="text-black font-medium">You have {points} explorer points!</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="stem-card overflow-hidden p-0">
              <div className="bg-[#0078FF] h-2"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-black">Available Programs</CardTitle>
                <div className="rounded-full bg-[#0078FF]/20 p-2">
                  <BookOpen className="h-5 w-5 text-[#0078FF]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0078FF]">{programs.length}</div>
                <p className="text-sm text-black">Cool programs to join!</p>
              </CardContent>
            </Card>

            <Card className="stem-card overflow-hidden p-0">
              <div className="bg-[#00B300] h-2"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-black">My Adventures</CardTitle>
                <div className="rounded-full bg-[#00B300]/20 p-2">
                  <Calendar className="h-5 w-5 text-[#00B300]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#00B300]">{bookings.length}</div>
                <p className="text-sm text-black">Programs you've joined</p>
              </CardContent>
            </Card>

            <Card className="stem-card overflow-hidden p-0">
              <div className="bg-[#7B00FF] h-2"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-black">Coming Soon</CardTitle>
                <div className="rounded-full bg-[#7B00FF]/20 p-2">
                  <Clock className="h-5 w-5 text-[#7B00FF]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#7B00FF]">{upcomingBookings.length}</div>
                <p className="text-sm text-black">Your upcoming adventures</p>
              </CardContent>
            </Card>

            <Card className="stem-card overflow-hidden p-0">
              <div className="bg-[#FFC800] h-2"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-black">{isAdmin ? "Admin Powers" : "Achievements"}</CardTitle>
                <div className="rounded-full bg-[#FFC800]/20 p-2">
                  {isAdmin ? (
                    <Users className="h-5 w-5 text-[#FFC800]" />
                  ) : (
                    <Star className="h-5 w-5 text-[#FFC800]" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <>
                    <div className="text-3xl font-bold text-[#FFC800]">Admin</div>
                    <p className="text-sm text-black">
                      <Link href="/dashboard/admin" className="text-[#0078FF] hover:underline">
                        Go to Admin Dashboard
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[#FFC800]">
                      {achievements.length}
                    </div>
                    <p className="text-sm text-black">Badges earned so far</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Achievements section */}
          {!isAdmin && (
            <Card className="stem-card mt-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FFC800]" />
                  <CardTitle className="text-black">Your Achievements</CardTitle>
                </div>
                <CardDescription className="text-black">Badges and rewards you've earned on your STEM journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="bg-[#FFFCF0] rounded-lg p-4 flex items-center gap-3 border border-[#FFEDB3]">
                      <div className="rounded-full bg-[#FFC800]/20 p-2">
                        <Star className="h-5 w-5 text-[#FFC800]" />
                      </div>
                      <div className="font-medium text-black">{achievement}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <Card className="stem-card col-span-1 overflow-hidden p-0">
              <div className="bg-[#7B00FF] h-2"></div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#7B00FF]" />
                  <CardTitle className="text-black">Your Upcoming Adventures</CardTitle>
                </div>
                <CardDescription className="text-black">Get ready for these exciting programs!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBookings.length > 0 ? (
                    upcomingBookings.map((program) => (
                      <div key={program.id} className="flex items-center space-x-4 bg-[#F8F0FF] p-4 rounded-xl border border-[#E6D6FF]">
                        <div className="rounded-full bg-white p-3 border border-[#E6D6FF]">
                          <program.icon className="h-6 w-6 text-[#7B00FF]" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-lg text-black">{program.title}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#555555]" />
                            <p className="text-sm text-black">
                              {program.date} • {program.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                              program.status === "Confirmed"
                                ? "bg-[#F0FFF0] text-[#00B300] border border-[#D6FFD6]"
                                : "bg-[#FFFCF0] text-[#FFC800] border border-[#FFEDB3]"
                            }`}
                          >
                            {program.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-[#F8F0FF] rounded-xl">
                      <div className="text-5xl mb-2">🔍</div>
                      <p className="text-black font-medium">No upcoming adventures yet</p>
                      <p className="text-sm text-[#555555] mt-1">Check out our programs to join one!</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="btn-purple w-full" asChild>
                  <Link href="/dashboard/bookings">
                    See All My Adventures
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="stem-card col-span-1 overflow-hidden p-0">
              <div className="bg-[#0078FF] h-2"></div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#0078FF]" />
                  <CardTitle className="text-black">Recommended For You</CardTitle>
                </div>
                <CardDescription className="text-black">Cool programs we think you'll love!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedPrograms.length > 0 ? (
                    recommendedPrograms.map((program) => (
                      <div key={program.id} className="bg-[#F0F8FF] p-4 rounded-xl border border-[#D6EBFF]">
                        <div className="flex items-start space-x-4">
                          <div className="rounded-full bg-white p-3 border border-[#D6EBFF]">
                            <program.icon className="h-6 w-6 text-[#0078FF]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg text-black">{program.title}</p>
                            <p className="text-black mt-1">{program.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Users className="h-4 w-4 text-[#555555]" />
                              <p className="text-sm text-black">{program.seats} spots left</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button className="btn-primary w-full" asChild>
                            <Link href={`/dashboard/programs/${program.id}`}>
                              Join This Adventure
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-[#F0F8FF] rounded-xl">
                      <div className="text-5xl mb-2">🔭</div>
                      <p className="text-black font-medium">No programs available right now</p>
                      <p className="text-sm text-[#555555] mt-1">Check back soon for new adventures!</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="btn-outline w-full" asChild>
                  <Link href="/dashboard/programs">
                    Explore All Programs
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

