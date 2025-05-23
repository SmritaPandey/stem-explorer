"use client"

import { useState, useEffect, useCallback } from "react" // Added useEffect, useCallback
import Link from "next/link"
// Added Atom, Brain, Star. Removed LucideIcon type import as it's not directly used in component props anymore.
import { ArrowUpDown, Calendar, Check, Clock, Code, Download, MapPin, MoreHorizontal, Rocket, Search, X, Atom, Brain, Star } from "lucide-react"
import type { LucideIcon } from "lucide-react"; // Keep for IconMap value type

import { useAuth } from "@/lib/auth-context" // Import useAuth
// Import new booking functions and types from lib/data
import { type Booking, type BookingFilterOptions, getBookingsForUser, getAllBookings, cancelBooking } from "@/lib/data"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProgramCardSkeleton } from "@/components/program-card-skeleton" // For loading state

// Icon mapping for bookings
const BookingIconMap: Record<string, LucideIcon> = {
  Rocket: Rocket,
  Code: Code,
  Atom: Atom,
  Brain: Brain,
  Calendar: Calendar, // Default if program.icon is not set
  Clock: Clock, // Alternative default
  // Add other icons that might be used by programs
};

const getBookingIconComponent = (iconName?: string | null): React.ReactElement => {
  const IconComponent = iconName ? BookingIconMap[iconName] : Calendar; // Default to Calendar icon
  return <IconComponent className="h-4 w-4 text-primary" />;
};


export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth()
  // Simplified isAdmin check - replace with actual role management if available
  const isAdmin = user?.email === 'admin@kidqubit.com'; 

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage program registrations and bookings</p>
        </div>
        <ProgramCardSkeleton count={3} /> 
      </div>
    )
  }

  if (!user) {
     return (
        <div className="space-y-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground">Please log in to view your bookings.</p>
            <Button asChild><Link href="/login">Log In</Link></Button>
        </div>
     )
  }
  
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
            <TabsTrigger value="all-bookings">All Bookings (Admin)</TabsTrigger>
          </TabsList>
          <TabsContent value="my-bookings" className="space-y-4">
            <BookingsTable userId={user.id} isAdminView={false} />
          </TabsContent>
          <TabsContent value="all-bookings" className="space-y-4">
            <BookingsTable isAdminView={true} />
          </TabsContent>
        </Tabs>
      ) : (
        <BookingsTable userId={user.id} isAdminView={false} />
      )}
    </div>
  )
}

interface BookingsTableProps {
  userId?: string; // Required if not admin view
  isAdminView: boolean;
}

function BookingsTable({ userId, isAdminView }: BookingsTableProps) {
  const { toast } = useToast()
  const { user } = useAuth() // For cancelBooking user ID
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Booking['status'] | 'all'>("all")
  const [dateFilter, setDateFilter] = useState<string>("all") // Keep as string for select options
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filterOptions: BookingFilterOptions = {
        search: searchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        // dateRange: dateFilter === "all" ? undefined : dateFilter, // Implement dateRange in lib/data if needed
      };

      let fetchedBookings: Booking[];
      if (isAdminView) {
        fetchedBookings = await getAllBookings(filterOptions);
      } else if (userId) {
        fetchedBookings = await getBookingsForUser(userId, filterOptions);
      } else {
        setError("User ID is missing for fetching bookings.")
        fetchedBookings = [];
      }
      setBookings(fetchedBookings);
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
      setError("Could not load bookings. Please try again later.");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAdminView, searchQuery, statusFilter /*, dateFilter */]); // Add dateFilter if used in API

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);


  // Filtering logic (client-side for now, can be moved server-side via API options)
   const filteredBookings = bookings.filter(booking => {
    // Client-side search filter (API also filters, this is an additional local refinement if needed)
    const matchesSearch = !searchQuery || 
                          (booking.program?.title && booking.program.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Date filtering logic 
    let matchesDate = true;
    if (dateFilter !== "all" && booking.session?.start_time) {
        try {
            const bookingDate = new Date(booking.session.start_time);
            const today = new Date();
            today.setHours(0,0,0,0); // Normalize today to start of day
            
            if (dateFilter === "upcoming" && bookingDate < today) matchesDate = false;
            if (dateFilter === "past" && bookingDate >= today) matchesDate = false;
            // More complex date filters like "this-month" would need more logic here
        } catch (e) {
            console.error("Error parsing booking date for client filter:", e);
            matchesDate = false; // Exclude if date is invalid
        }
    }
    return matchesSearch && matchesDate;
  });


  const handleDownloadTicket = async (bookingId: number) => {
    // Placeholder
    toast({ title: "Ticket Downloaded", description: "Your ticket has been downloaded successfully." })
  }

  const handleAddToCalendar = async (booking: Booking) => {
     // Placeholder
    // Ensure session times are available before trying to format them
    const startTime = booking.session?.start_time ? new Date(booking.session.start_time).toLocaleTimeString() : 'N/A';
    const endTime = booking.session?.end_time ? new Date(booking.session.end_time).toLocaleTimeString() : 'N/A';
    toast({ title: "Added to Calendar", description: `${booking.program.title} (${startTime} - ${endTime}) has been added to your calendar.` })
  }

  const handleReschedule = async (bookingId: number) => {
    // Placeholder
    toast({ title: "Reschedule Requested", description: "A reschedule request has been sent." })
  }

  const handleCancelBooking = async (bookingId: number) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to cancel a booking.", variant: "destructive" });
        return;
    }
    // Simplified isAdmin check for cancel, actual role should be used from useAuth if available
    const canAdminCancel = user.email === 'admin@kidqubit.com';

    try {
      const success = await cancelBooking(bookingId, user.id, canAdminCancel);
      if (success) {
        toast({
          title: "Booking Cancelled",
          description: "The booking has been cancelled successfully.",
        });
        fetchBookings(); // Refresh the list
      } else {
        toast({ title: "Cancellation Failed", description: "Could not cancel the booking. It might not exist, not belong to you, or an error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" });
    }
  };
  

  if (isLoading) {
    return <ProgramCardSkeleton count={3} />; // Show skeletons while loading
  }

  if (error) {
    return <div className="text-destructive text-center py-10">{error}</div>;
  }
  

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="Search bookings..." 
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Directly update state
          />
          <Button type="button" size="icon" variant="secondary" onClick={fetchBookings}> 
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Booking['status'] | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              {/* More specific date ranges can be added if API supports them */}
              {/* <SelectItem value="this-month">This Month</SelectItem> */}
              {/* <SelectItem value="next-month">Next Month</SelectItem> */}
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
              {isAdminView && ( // Only show User column for admin
                <TableHead>User</TableHead>
              )}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 && !isLoading ? (
                <TableRow>
                    <TableCell colSpan={isAdminView ? 6 : 5} className="h-24 text-center">
                    No bookings found.
                    </TableCell>
                </TableRow>
            ) : (
              filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-1 border">
                       {getBookingIconComponent(booking.program?.icon)}
                    </div>
                    <span>{booking.program?.title || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>{booking.session?.start_time ? new Date(booking.session.start_time).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  {booking.session?.start_time ? new Date(booking.session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  {booking.session?.end_time ? ` - ${new Date(booking.session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{booking.program?.location || "N/A"}</span>
                  </div>
                </TableCell>
                {isAdminView && (
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{booking.user_id}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant={
                      booking.status === "Confirmed" ? "success" :
                      booking.status === "Pending" ? "warning" :
                      booking.status === "completed" ? "default" : 
                      "destructive" // For "Cancelled" or "Failed"
                    }
                    className={
                      booking.status === "Confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      booking.status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      booking.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }
                  >
                    {booking.status === "Confirmed" && <Check className="mr-1 h-3 w-3" />}
                    {booking.status === "Pending" && <Clock className="mr-1 h-3 w-3" />}
                    {booking.status === "Cancelled" && <X className="mr-1 h-3 w-3" />}
                    {booking.status === "completed" && <Check className="mr-1 h-3 w-3" />}
                    {booking.status === "Failed" && <X className="mr-1 h-3 w-3" />}
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
                        {/* Link to a detailed booking view if it exists, otherwise disabled/removed */}
                        <Link href={`/dashboard/bookings/${booking.id}`} className="pointer-events-none text-muted-foreground">
                          <Search className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {booking.status === "Confirmed" && (
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
                      {(booking.status === "Confirmed" || booking.status === "Pending") && (
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

