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

  // Helper to get filtered bookings for the selected date and status
  const filteredBookingsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    let bookingsForDate = bookingsByDate[dateKey] || []
    if (statusFilter !== 'all') {
      bookingsForDate = bookingsForDate.filter(b => b.status === statusFilter)
    }
    return bookingsForDate
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="stem-card p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => setDate(d && isValid(d) ? d : undefined)}
          className="rounded-md border border-[#D6EBFF]"
          components={{
            DayContent: ({ date: dayDate }) => {
              const dateStr = format(dayDate, 'yyyy-MM-dd')
              const hasBookings = dateStr in bookingsByDate
              return (
                <div className="relative">
                  <div className="text-black">{format(dayDate, 'd')}</div>
                  {hasBookings && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0078FF] rounded-full" />
                  )}
                </div>
              )
            }
          }}
        />
      </div>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black">
            {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
          </h2>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as BookingStatus | 'all')}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Bookings</SelectItem>
              <SelectItem value="confirmed" className="text-black">Confirmed</SelectItem>
              <SelectItem value="pending" className="text-black">Pending</SelectItem>
              <SelectItem value="cancelled" className="text-black">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {date ? (
          <div className="space-y-4">
            {filteredBookingsForDate(date).length > 0 ? filteredBookingsForDate(date).map((booking) => {
              // Get category-specific elements
              let categoryColor = "";
              let categoryBg = "";
              let categoryEmoji = "";

              switch(booking.program.toLowerCase()) {
                case "robotics workshop":
                  categoryColor = "text-[#0078FF]";
                  categoryBg = "bg-[#F0F8FF]";
                  categoryEmoji = "🤖";
                  break;
                case "coding bootcamp":
                  categoryColor = "text-[#00B300]";
                  categoryBg = "bg-[#F0FFF0]";
                  categoryEmoji = "💻";
                  break;
                case "science exploration":
                  categoryColor = "text-[#7B00FF]";
                  categoryBg = "bg-[#F8F0FF]";
                  categoryEmoji = "🔬";
                  break;
                case "math challenge":
                  categoryColor = "text-[#FFC800]";
                  categoryBg = "bg-[#FFFCF0]";
                  categoryEmoji = "🧮";
                  break;
                default:
                  categoryColor = "text-[#0078FF]";
                  categoryBg = "bg-[#F0F8FF]";
                  categoryEmoji = "🚀";
              }

              return (
                <div
                  key={booking.id}
                  className={`stem-card p-4 ${categoryBg} border-[#D6EBFF] hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-white p-2 border border-[#D6EBFF]">
                        <booking.icon className={`h-5 w-5 ${categoryColor} wiggling`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{booking.program}</h3>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#555555]" />
                            <span className="text-black">{booking.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#555555]" />
                            <span className="text-black">{booking.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl">{categoryEmoji}</div>
                      <Badge
                        className={
                          booking.status === "confirmed"
                            ? "bg-[#F0FFF0] text-[#00B300] border border-[#D6FFD6]"
                            : booking.status === "pending"
                              ? "bg-[#FFFCF0] text-[#FFC800] border border-[#FFEDB3]"
                              : "bg-[#FFF0F0] text-[#FF0000] border border-[#FFD6D6]"
                        }
                      >
                        {booking.status === "confirmed" && <Check className="mr-1 h-3 w-3" />}
                        {booking.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {booking.status === "cancelled" && <X className="mr-1 h-3 w-3" />}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button className="btn-outline" size="sm" asChild>
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        <Search className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>

                    {booking.status === "confirmed" && (
                      <Button className="btn-primary" size="sm" onClick={() => {}}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Add to Calendar
                      </Button>
                    )}

                    {booking.status !== "cancelled" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
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
                            <AlertDialogAction onClick={() => {}}>
                              Cancel Booking
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 bg-[#F0F8FF] rounded-lg border border-[#D6EBFF]">
                <CalendarIcon className="h-12 w-12 text-[#0078FF] mx-auto mb-2 opacity-50" />
                <p className="text-black font-medium">No bookings for this date</p>
                <p className="text-[#555555] text-sm mt-1">Select another date to view bookings</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-[#F0F8FF] rounded-lg border border-[#D6EBFF]">
            <CalendarIcon className="h-12 w-12 text-[#0078FF] mx-auto mb-2 opacity-50" />
            <p className="text-black font-medium">No date selected</p>
            <p className="text-[#555555] text-sm mt-1">Please select a date to view bookings</p>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-[2.5rem] font-bold text-black">Bookings Calendar</h1>
        <p className="text-black">View and manage your program bookings</p>
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
            className="w-full border-[#D6EBFF] text-black"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Button type="submit" size="icon" className="bg-[#0078FF] text-white">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as BookingStatus | 'all')}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Statuses</SelectItem>
              <SelectItem value="confirmed" className="text-black">Confirmed</SelectItem>
              <SelectItem value="pending" className="text-black">Pending</SelectItem>
              <SelectItem value="cancelled" className="text-black">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px] border-[#D6EBFF] text-black">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D6EBFF]">
              <SelectItem value="all" className="text-black">All Dates</SelectItem>
              <SelectItem value="upcoming" className="text-black">Upcoming</SelectItem>
              <SelectItem value="past" className="text-black">Past</SelectItem>
              <SelectItem value="this-month" className="text-black">This Month</SelectItem>
              <SelectItem value="next-month" className="text-black">Next Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-[#D6EBFF] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F0F8FF]">
            <TableRow>
              <TableHead className="w-[250px] text-black">
                <Button variant="ghost" className="p-0 hover:bg-transparent text-black">
                  <span>Program</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-black">
                <Button variant="ghost" className="p-0 hover:bg-transparent text-black">
                  <span>Date</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-black">Time</TableHead>
              <TableHead className="text-black">Location</TableHead>
              {showUser && (
                <TableHead className="text-black">User</TableHead>
              )}
              <TableHead className="text-black">Status</TableHead>
              <TableHead className="text-right text-black">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => {
              // Get category-specific elements
              let categoryColor = "";
              let categoryBg = "";
              let categoryEmoji = "";

              switch(booking.program.toLowerCase()) {
                case "robotics workshop":
                  categoryColor = "text-[#0078FF]";
                  categoryBg = "bg-[#F0F8FF]";
                  categoryEmoji = "🤖";
                  break;
                case "coding bootcamp":
                  categoryColor = "text-[#00B300]";
                  categoryBg = "bg-[#F0FFF0]";
                  categoryEmoji = "💻";
                  break;
                case "science exploration":
                  categoryColor = "text-[#7B00FF]";
                  categoryBg = "bg-[#F8F0FF]";
                  categoryEmoji = "🔬";
                  break;
                case "math challenge":
                  categoryColor = "text-[#FFC800]";
                  categoryBg = "bg-[#FFFCF0]";
                  categoryEmoji = "🧮";
                  break;
                default:
                  categoryColor = "text-[#0078FF]";
                  categoryBg = "bg-[#F0F8FF]";
                  categoryEmoji = "🚀";
              }

              return (
                <TableRow key={booking.id} className="hover:bg-[#F8FBFF]">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-white p-1 border border-[#D6EBFF]">
                        <booking.icon className={`h-4 w-4 ${categoryColor} wiggling`} />
                      </div>
                      <span className="text-black">{booking.program}</span>
                      <span className="text-lg">{categoryEmoji}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black">{formatDisplayDate(booking.date)}</TableCell>
                  <TableCell className="text-black">{booking.time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#555555]" />
                      <span className="text-black">{booking.location}</span>
                    </div>
                  </TableCell>
                  {showUser && (
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-black">{booking.user.name}</span>
                        <span className="text-sm text-[#555555]">{booking.user.email}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      className={
                        booking.status === "confirmed"
                          ? "bg-[#F0FFF0] text-[#00B300] border border-[#D6FFD6]"
                          : booking.status === "pending"
                            ? "bg-[#FFFCF0] text-[#FFC800] border border-[#FFEDB3]"
                            : "bg-[#FFF0F0] text-[#FF0000] border border-[#FFD6D6]"
                      }
                    >
                      {booking.status === "confirmed" && <Check className="mr-1 h-3 w-3" />}
                      {booking.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                      {booking.status === "cancelled" && <X className="mr-1 h-3 w-3" />}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button className="btn-outline" size="sm" asChild>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Search className="h-4 w-4" />
                        </Link>
                      </Button>

                      {booking.status === "confirmed" && (
                        <Button className="btn-primary" size="sm" onClick={() => {}}>
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      )}

                      {booking.status !== "cancelled" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
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
                              <AlertDialogAction onClick={() => {}}>
                                Cancel Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

