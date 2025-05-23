import { supabase } from "./supabase"
import { Atom, BookOpen, Code, Rocket, LucideIcon } from "lucide-react"

// Mapping for icons based on category or title
const iconMap: { [key: string]: LucideIcon } = {
  default: Code,
  robotics: Rocket,
  coding: Code,
  science: Atom,
  math: BookOpen,
  engineering: Rocket,
}

const getIcon = (category?: string, title?: string): LucideIcon => {
  if (category) {
    const categoryLower = category.toLowerCase()
    if (iconMap[categoryLower]) {
      return iconMap[categoryLower]
    }
  }
  if (title) {
    const titleLower = title.toLowerCase()
    for (const key in iconMap) {
      if (titleLower.includes(key)) {
        return iconMap[key]
      }
    }
  }
  return iconMap.default
}

export type Program = {
  id: string // Changed from number to string to match Supabase UUID
  title: string
  description: string
  category: string
  level: string // This field might not be directly available from the 'programs' table
  duration: string // Will be formatted from integer (minutes) to string (e.g., "2 hours")
  date: string // This will likely need to come from program_sessions
  time: string // This will likely need to come from program_sessions
  location?: string
  instructor?: string // This would need a join with profiles table
  seats: number // Corresponds to max_capacity
  price: string // Will be formatted from decimal to string (e.g., "$25")
  icon: LucideIcon // Changed any to LucideIcon
  ageGroup?: string // Corresponds to age_range
  format?: string // This field might not be directly available from the 'programs' table
  requirements?: string[] // This might be a JSONB field or derived
  topics?: string[] // This might be a JSONB field or derived
  longDescription?: string // Assumed to be the same as description for now
}

export type Booking = {
  id: string // Changed from number to string to match Supabase UUID
  program: string // This will be program title
  date: string
  time: string
  location: string
  status: "Confirmed" | "Pending" | "Cancelled" // This should match the 'status' field in bookings table
  icon: LucideIcon // Changed any to LucideIcon
}

// Filter programs based on search and filter criteria
export type FilterOptions = {
  search?: string
  category?: string
  level?: string
  ageGroup?: string
  format?: string
  dateRange?: string
  priceRange?: string
}

// Extended Program type to include sessions
export type ProgramWithSessions = Program & {
  sessions: ProgramSession[]
  instructorName?: string // Added instructor name
}

export type ProgramSession = {
  id: string
  startTime: string
  endTime: string
  currentCapacity: number
  isCancelled: boolean
}

export async function getFilteredPrograms(options: FilterOptions): Promise<Program[]> {
  let query = supabase.from("programs").select(`
    id,
    title,
    description,
    category,
    age_range,
    price,
    duration,
    max_capacity,
    location,
    image_url
    // instructor_id (Need to join with profiles to get instructor name for the list view if required)
    // level and format are not direct columns in 'programs' table.
    // date and time for a program list might be the earliest upcoming session or a general schedule
  `)

  // Apply search filter
  if (options.search) {
    const searchLower = `%${options.search.toLowerCase()}%`
    query = query.or(`title.ilike.${searchLower},description.ilike.${searchLower}`)
  }

  // Apply category filter
  if (options.category && options.category !== "all") {
    query = query.eq("category", options.category)
  }

  // Apply age group filter
  if (options.ageGroup && options.ageGroup !== "all") {
    query = query.eq("age_range", options.ageGroup)
  }

  // Apply level filter - Not directly available in 'programs' table. Ignoring for now.
  if (options.level && options.level !== "all") {
    // console.warn("Filtering by 'level' is not yet implemented for Supabase.")
  }

  // Apply format filter - Not directly available in 'programs' table. Ignoring for now.
  if (options.format && options.format !== "all") {
    // console.warn("Filtering by 'format' is not yet implemented for Supabase.")
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching programs:", error)
    throw error
  }

  // Map Supabase data to Program type
  return data
    ? data.map((program) => {
        let durationStr = ""
        if (program.duration) {
          if (program.duration >= 60) {
            const hours = Math.floor(program.duration / 60)
            const minutes = program.duration % 60
            durationStr = `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} minutes` : ""}`
          } else {
            durationStr = `${program.duration} minutes`
          }
        }

        return {
          id: program.id,
          title: program.title,
          description: program.description,
          longDescription: program.description,
          category: program.category,
          level: "N/A", // Placeholder
          duration: durationStr,
          date: "TBD", // Placeholder - determined by sessions for individual program view
          time: "TBD", // Placeholder - determined by sessions for individual program view
          location: program.location,
          seats: program.max_capacity,
          price: program.price ? `$${program.price}` : "N/A",
          icon: getIcon(program.category, program.title),
          ageGroup: program.age_range,
          format: "N/A", // Placeholder
          requirements: [], // Placeholder
          topics: [], // Placeholder
        }
      })
    : []
}

// Get a single program by ID, including its sessions and instructor details
export async function getProgramById(id: string): Promise<ProgramWithSessions | undefined> {
  const { data, error } = await supabase
    .from("programs")
    .select(
      `
      *, 
      instructor:profiles (first_name, last_name),
      program_sessions (*)
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching program with id ${id}:`, error)
    return undefined
  }

  if (!data) {
    return undefined
  }

  let durationStr = ""
  if (data.duration) {
    if (data.duration >= 60) {
      const hours = Math.floor(data.duration / 60)
      const minutes = data.duration % 60
      durationStr = `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} minutes` : ""}`
    } else {
      durationStr = `${data.duration} minutes`
    }
  }

  // Assuming 'date' and 'time' for the Program type should represent the first session's details
  // This might need adjustment based on specific UI requirements.
  let programDate = "TBD"
  let programTime = "TBD"
  if (data.program_sessions && data.program_sessions.length > 0) {
    const firstSession = data.program_sessions.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0]
    if (firstSession) {
      const startTime = new Date(firstSession.start_time)
      programDate = startTime.toLocaleDateString()
      programTime = startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  }
  
  const instructorName = data.instructor ? `${data.instructor.first_name} ${data.instructor.last_name}`.trim() : "N/A";


  return {
    id: data.id,
    title: data.title,
    description: data.description,
    longDescription: data.description, // Potentially map to a different field if available
    category: data.category,
    level: "N/A", // Placeholder - consider adding 'level' to programs table
    duration: durationStr,
    date: programDate,
    time: programTime,
    location: data.location,
    seats: data.max_capacity,
    price: data.price ? `$${data.price}` : "N/A",
    icon: getIcon(data.category, data.title),
    ageGroup: data.age_range,
    format: "N/A", // Placeholder - consider adding 'format' to programs table
    requirements: [], // Placeholder - consider adding 'requirements' (e.g., JSONB) to programs table
    topics: [], // Placeholder - consider adding 'topics' (e.g., JSONB) to programs table
    instructor: instructorName, // Mapped instructor name
    instructorName: instructorName, // Added for ProgramWithSessions
    sessions: data.program_sessions
      ? data.program_sessions.map((session: any) => ({
          id: session.id,
          startTime: new Date(session.start_time).toLocaleString(),
          endTime: new Date(session.end_time).toLocaleString(),
          currentCapacity: session.current_capacity,
          isCancelled: session.is_cancelled,
        }))
      : [],
  }
}


// Type for User Bookings, extending the base Booking to include program and session details
export type UserBooking = Booking & {
  programTitle: string
  programCategory: string
  sessionStartTime: string
  sessionEndTime: string
  // Add other fields from program or session as needed
}

// Get bookings for a specific user, joining with program and session details
export async function getUserBookings(userId: string): Promise<UserBooking[]> {
  if (!userId) {
    console.warn("User ID not provided for getUserBookings")
    return []
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      payment_status,
      amount_paid,
      booking_date,
      session:program_sessions (
        start_time,
        end_time,
        program:programs (
          title,
          category,
          location,
          image_url
        )
      )
    `
    )
    .eq("user_id", userId)

  if (error) {
    console.error(`Error fetching bookings for user ${userId}:`, error)
    throw error
  }

  return data
    ? data.map((booking: any) => {
        const program = booking.session?.program
        const session = booking.session
        
        let bookingStatus: "Confirmed" | "Pending" | "Cancelled" = "Pending" // Default
        if (booking.status === 'confirmed') bookingStatus = "Confirmed"
        if (booking.status === 'cancelled') bookingStatus = "Cancelled"

        return {
          id: booking.id,
          program: program?.title || "N/A", // Fallback if program title is not found
          date: session ? new Date(session.start_time).toLocaleDateString() : "TBD",
          time: session ? new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD",
          location: program?.location || "N/A",
          status: bookingStatus,
          icon: getIcon(program?.category, program?.title), // Get icon based on program category/title
          // UserBooking specific fields
          programTitle: program?.title || "N/A",
          programCategory: program?.category || "N/A",
          sessionStartTime: session ? new Date(session.start_time).toLocaleString() : "TBD",
          sessionEndTime: session ? new Date(session.end_time).toLocaleString() : "TBD",
          // payment_status: booking.payment_status, // uncomment if needed in Booking type
          // amount_paid: booking.amount_paid, // uncomment if needed in Booking type
          // booking_date: new Date(booking.booking_date).toLocaleString(), // uncomment if needed
        }
      })
    : []
}


// Get bookings with filtering (Placeholder - needs to be refactored for Supabase)
export type BookingFilterOptions = {
  search?: string
  status?: string
  dateRange?: string
}

export async function getFilteredBookings(options: BookingFilterOptions): Promise<Booking[]> {
  // This function needs a complete refactor to fetch from Supabase bookings table
  // and apply filters similar to getFilteredPrograms.
  // For now, it returns an empty array as mock data is removed.
  console.warn("getFilteredBookings is not yet refactored for Supabase and will return empty.")
  return []
}

