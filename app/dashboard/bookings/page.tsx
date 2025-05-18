"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpDown, Calendar, Check, Clock, Code, Download, MapPin, MoreHorizontal, Rocket, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

interface Booking {
  id: number
  program: string
  date: string
  time: string
  location: string
  status: BookingStatus
  icon: LucideIcon
}

interface BookingWithUser extends Booking {
  user: {
    id: string;
    name: string;
    email: string;
  }
}

export default function BookingsPage() {
  const [isAdmin] = useState(true) // TODO: Replace with actual auth check
  const [currentUserId] = useState("1") // TODO: Replace with actual user ID

  // Mock data for bookings
  const bookings: Booking[] = [
    {
      id: 1,
      program: "Robotics Workshop",
      date: "June 15, 2023",
      time: "10:00 AM - 12:00 PM",
      location: "STEM Innovation Center",
      status: "confirmed",
      icon: Rocket,
    },
    {
      id: 2,
      program: "Coding Bootcamp",
      date: "June 20, 2023",
      time: "2:00 PM - 5:00 PM",
      location: "Tech Hub, Room 101",
      status: "pending",
      icon: Code,
    },
    {
      id: 3,
      program: "Science Exploration",
      date: "June 25, 2023",
      time: "1:00 PM - 3:00 PM",
      location: "Science Center",
      status: "confirmed",
      icon: Calendar,
    },
    {
      id: 4,
      program: "Math Challenge",
      date: "June 30, 2023",
      time: "3:00 PM - 5:00 PM",
      location: "Learning Center, Room 203",
      status: "cancelled",
      icon: Clock,
    },
  ]

  const mockAllBookings: BookingWithUser[] = bookings.map(booking => ({
    ...booking,
    user: {
      id: booking.id === 1 || booking.id === 3 ? "1" : "2",
      name: booking.id === 1 || booking.id === 3 ? "Current User" : "Other User",
      email: booking.id === 1 || booking.id === 3 ? "current@example.com" : "other@example.com"
    }
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">Manage program registrations and bookings</p>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="my-bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="all-bookings">All Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="my-bookings" className="space-y-4">
            <BookingsTable initialBookings={mockAllBookings} currentUserId={currentUserId} />
          </TabsContent>
          <TabsContent value="all-bookings" className="space-y-4">
            <BookingsTable initialBookings={mockAllBookings} showUser />
          </TabsContent>
        </Tabs>
      ) : (
        <BookingsTable initialBookings={mockAllBookings} currentUserId={currentUserId} />
      )}
    </div>
  )
}

interface BookingsTableProps {
  initialBookings: BookingWithUser[]
  showUser?: boolean
  currentUserId?: string
}

function BookingsTable({ initialBookings, showUser, currentUserId }: BookingsTableProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [bookings, setBookings] = useState(initialBookings)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.program.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    const matchesUser = !currentUserId || booking.user.id === currentUserId

    try {
      const bookingDate = new Date(booking.date)
      const today = new Date()
      const matchesDate = dateFilter === "all" 
        || (dateFilter === "upcoming" && bookingDate >= today)
        || (dateFilter === "past" && bookingDate < today)
        || (dateFilter === "this-month" && bookingDate.getMonth() === today.getMonth())
        || (dateFilter === "next-month" && bookingDate.getMonth() === (today.getMonth() + 1) % 12)

      return matchesSearch && matchesStatus && matchesDate && matchesUser
    } catch (error) {
      console.error("Error parsing date:", error)
      return false
    }
  })

  const handleDownloadTicket = async (bookingId: number) => {
    try {
      // TODO: Implement actual download logic
      toast({ title: "Ticket Downloaded", description: "Your ticket has been downloaded successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to download ticket", variant: "destructive" })
    }
  }

  const handleAddToCalendar = async (booking: BookingWithUser) => {
    try {
      const event = {
        title: booking.program,
        location: booking.location,
        startTime: booking.date + ' ' + booking.time.split(' - ')[0],
        endTime: booking.date + ' ' + booking.time.split(' - ')[1],
      }
      // TODO: Implement actual calendar integration
      toast({ title: "Added to Calendar", description: `${booking.program} has been added to your calendar.` })
    } catch (error) {
      toast({ title: "Error", description: "Failed to add to calendar", variant: "destructive" })
    }
  }

  const handleReschedule = async (bookingId: number) => {
    try {
      // TODO: Implement actual reschedule logic
      toast({ title: "Reschedule Requested", description: "A reschedule request has been sent." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to request reschedule", variant: "destructive" })
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    try {
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as BookingStatus }
            : booking
        )
      )
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      })
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel booking", variant: "destructive" })
    }
  }

  return (
    <>
      {/* Move the filters and search section here */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="Search bookings..." 
            className="w-full"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="next-month">Next Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  <span>Program</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 hover:bg-transparent">
                  <span>Date</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Location</TableHead>
              {showUser && (
                <TableHead>User</TableHead>
              )}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1">
                      <booking.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span>{booking.program}</span>
                  </div>
                </TableCell>
                <TableCell>{booking.date}</TableCell>
                <TableCell>{booking.time}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{booking.location}</span>
                  </div>
                </TableCell>
                {showUser && (
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{booking.user.name}</span>
                      <span className="text-sm text-muted-foreground">{booking.user.email}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "success"
                        : booking.status === "pending"
                          ? "warning"
                          : "destructive"
                    }
                    className={
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {booking.status === "confirmed" && <Check className="mr-1 h-3 w-3" />}
                    {booking.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {booking.status === "cancelled" && <X className="mr-1 h-3 w-3" />}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Search className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {booking.status === "confirmed" && (
                        <>
                          <DropdownMenuItem onSelect={() => handleDownloadTicket(booking.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAddToCalendar(booking)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Add to Calendar
                          </DropdownMenuItem>
                        </>
                      )}
                      {booking.status !== "cancelled" && (
                        <>
                          <DropdownMenuItem onSelect={() => handleReschedule(booking.id)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Reschedule
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Booking
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this booking? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>
                                  Cancel Booking
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

