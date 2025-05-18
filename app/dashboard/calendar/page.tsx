"use client"

import { useState } from "react"
import { format, parseISO, isValid } from "date-fns"
import Link from "next/link"
import { ArrowUpDown, Calendar as CalendarIcon, Check, Clock, Code, Download, MapPin, MoreHorizontal, Rocket, Search, X, LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type BookingStatus = 'confirmed' | 'pending' | 'cancelled'

interface Booking {
  id: number
  program: string
  date: string
  time: string
  location: string
  status: BookingStatus
  icon: typeof Calendar | typeof Code | typeof Rocket | typeof Clock
}

interface BookingWithUser extends Booking {
  user: {
    id: string;
    name: string;
    email: string;
  }
}

const formatDisplayDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return isValid(date) ? format(date, 'MMMM d, yyyy') : dateStr
  } catch {
    return dateStr
  }
}

const parseAndFormatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return isValid(date) ? format(date, 'yyyy-MM-dd') : dateStr
  } catch {
    return dateStr
  }
}

function BookingsCalendar({ bookings, onActionComplete }: { 
  bookings: BookingWithUser[], 
  onActionComplete?: () => void 
}) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const { toast } = useToast()

  const bookingsByDate = bookings.reduce((acc, booking) => {
    try {
      const dateStr = parseAndFormatDate(booking.date)
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(booking)
    } catch (error) {
      console.error("Error processing booking date:", error)
    }
    return acc
  }, {} as Record<string, BookingWithUser[]>)

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="border rounded-lg p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          components={{
            DayContent: ({ date: dayDate }) => {
              const dateStr = format(dayDate, 'yyyy-MM-dd')
              const hasBookings = dateStr in bookingsByDate
              return (
                <div className="relative">
                  <div>{format(dayDate, 'd')}</div>
                  {hasBookings && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
              )
            }
          }}
        />
      </div>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
          </h2>
          <Select defaultValue="all" onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {date && (
          <div className="space-y-4">
            {bookingsByDate[format(date, 'yyyy-MM-dd')]?.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <booking.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{booking.program}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {booking.location}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "success"
                        : booking.status === "pending"
                          ? "warning"
                          : "destructive"
                    }
                    className={cn(
                      booking.status === "confirmed" && "bg-green-100 text-green-800",
                      booking.status === "pending" && "bg-yellow-100 text-yellow-800",
                      booking.status === "cancelled" && "bg-red-100 text-red-800"
                    )}
                  >
                    {booking.status === "confirmed" && <Check className="mr-1 h-3 w-3" />}
                    {booking.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {booking.status === "cancelled" && <X className="mr-1 h-3 w-3" />}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>

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
                            <CalendarIcon className="mr-2 h-4 w-4" />
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
                </div>
              </div>
            ))}
            {!bookingsByDate[format(date, 'yyyy-MM-dd')] && (
              <div className="text-center py-8 text-muted-foreground">
                No bookings for this date
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const [isAdmin] = useState(true)
  const [currentUserId] = useState("1")

  // Mock data for bookings
  const bookings: Booking[] = [
    {
      id: 1,
      program: "Robotics Workshop",
      date: "2023-06-15", // Changed to ISO format
      time: "10:00 AM - 12:00 PM",
      location: "STEM Innovation Center",
      status: "confirmed",
      icon: Rocket,
    },
    {
      id: 2,
      program: "Coding Bootcamp",
      date: "2023-06-20", // Changed to ISO format
      time: "2:00 PM - 5:00 PM",
      location: "Tech Hub, Room 101",
      status: "pending",
      icon: Code,
    },
    {
      id: 3,
      program: "Science Exploration",
      date: "2023-06-25", // Changed to ISO format
      time: "1:00 PM - 3:00 PM",
      location: "Science Center",
      status: "confirmed",
      icon: CalendarIcon,
    },
    {
      id: 4,
      program: "Math Challenge",
      date: "2023-06-30", // Changed to ISO format
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
        <h1 className="text-3xl font-bold tracking-tight">Bookings Calendar</h1>
        <p className="text-muted-foreground">View and manage your program bookings</p>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="my-bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-bookings">My Calendar</TabsTrigger>
            <TabsTrigger value="all-bookings">All Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="my-bookings" className="space-y-4">
            <BookingsCalendar 
              bookings={mockAllBookings.filter(b => b.user.id === currentUserId)} 
            />
          </TabsContent>
          <TabsContent value="all-bookings" className="space-y-4">
            <BookingsTable initialBookings={mockAllBookings} showUser />
          </TabsContent>
        </Tabs>
      ) : (
        <BookingsCalendar 
          bookings={mockAllBookings.filter(b => b.user.id === currentUserId)} 
        />
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
      if (!isValid(bookingDate)) return false

      const today = new Date()
      const matchesDate = dateFilter === "all" 
        || (dateFilter === "upcoming" && bookingDate >= today)
        || (dateFilter === "past" && bookingDate < today)
        || (dateFilter === "this-month" && bookingDate.getMonth() === today.getMonth())
        || (dateFilter === "next-month" && bookingDate.getMonth() === (today.getMonth() + 1) % 12)

      return matchesSearch && matchesStatus && matchesDate && matchesUser
    } catch (error) {
      console.error("Error filtering booking:", error)
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
                <TableCell>{formatDisplayDate(booking.date)}</TableCell>
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
                            <CalendarIcon className="mr-2 h-4 w-4" />
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

