import { Atom, BookOpen, Code, Rocket } from "lucide-react"

export type Program = {
  id: number
  title: string
  description: string
  category: string
  level: string
  duration: string
  date: string
  time: string
  location?: string
  instructor?: string
  seats: number
  price: string
  icon: any
  ageGroup?: string
  format?: string
  requirements?: string[]
  topics?: string[]
  longDescription?: string
}

export type Booking = {
  id: number
  program: string
  date: string
  time: string
  location: string
  status: "Confirmed" | "Pending" | "Cancelled"
  icon: any
}

// Mock data for programs
export const programs: Program[] = [
  {
    id: 1,
    title: "Robotics Workshop",
    description: "Learn to build and program robots with hands-on activities.",
    longDescription:
      "In this hands-on workshop, participants will learn the fundamentals of robotics engineering. The program covers mechanical design principles, basic electronics, and programming concepts. Students will work in small teams to design, build, and program their own robots to complete specific challenges. All materials and tools will be provided. No prior experience is necessary, making this perfect for beginners interested in engineering and technology.",
    category: "Engineering",
    level: "Beginner",
    duration: "2 hours",
    date: "June 15, 2023",
    time: "10:00 AM - 12:00 PM",
    location: "STEM Innovation Center, 123 Science Way",
    instructor: "Dr. Jane Smith",
    seats: 15,
    price: "$25",
    icon: Rocket,
    ageGroup: "10-14",
    format: "In-person",
    requirements: [
      "No prior experience required",
      "Suitable for ages 10-14",
      "All materials provided",
      "Bring a notebook and pencil",
    ],
    topics: [
      "Introduction to robotics",
      "Mechanical design basics",
      "Electronics fundamentals",
      "Programming with block-based code",
      "Building a functional robot",
      "Testing and troubleshooting",
    ],
  },
  {
    id: 2,
    title: "Coding Bootcamp",
    description: "Master programming fundamentals through interactive projects.",
    category: "Computer Science",
    level: "Intermediate",
    duration: "3 hours",
    date: "June 20, 2023",
    time: "2:00 PM - 5:00 PM",
    location: "Tech Hub, Room 101",
    instructor: "Prof. Alex Johnson",
    seats: 12,
    price: "$30",
    icon: Code,
    ageGroup: "12-16",
    format: "Hybrid",
    requirements: [
      "Basic computer skills required",
      "Suitable for ages 12-16",
      "Laptop required",
      "Prior exposure to basic concepts helpful",
    ],
    topics: [
      "Programming fundamentals",
      "Variables and data types",
      "Control structures",
      "Functions and methods",
      "Building a simple game",
      "Web development basics",
    ],
  },
  {
    id: 3,
    title: "Science Exploration",
    description: "Discover scientific principles through experiments and research.",
    category: "Science",
    level: "Beginner",
    duration: "2 hours",
    date: "June 25, 2023",
    time: "1:00 PM - 3:00 PM",
    location: "Science Center",
    instructor: "Dr. Maria Garcia",
    seats: 20,
    price: "$20",
    icon: Atom,
    ageGroup: "8-12",
    format: "In-person",
    requirements: [
      "No prior experience required",
      "Suitable for ages 8-12",
      "All materials provided",
      "Bring a notebook",
    ],
    topics: [
      "Scientific method",
      "Chemistry basics",
      "Physics principles",
      "Biology fundamentals",
      "Conducting experiments",
      "Analyzing results",
    ],
  },
  {
    id: 4,
    title: "Math Challenge",
    description: "Enhance problem-solving skills through mathematical challenges.",
    category: "Mathematics",
    level: "Advanced",
    duration: "2 hours",
    date: "June 30, 2023",
    time: "3:00 PM - 5:00 PM",
    location: "Learning Center, Room 203",
    instructor: "Prof. David Kim",
    seats: 10,
    price: "$25",
    icon: BookOpen,
    ageGroup: "14-18",
    format: "Virtual",
    requirements: [
      "Strong math foundation required",
      "Suitable for ages 14-18",
      "Calculator and notebook required",
      "Prior experience with algebra recommended",
    ],
    topics: [
      "Advanced problem-solving",
      "Mathematical reasoning",
      "Algebra and geometry applications",
      "Number theory",
      "Competition math strategies",
      "Real-world math applications",
    ],
  },
  {
    id: 5,
    title: "Electronics Workshop",
    description: "Build electronic circuits and understand how they work.",
    category: "Engineering",
    level: "Intermediate",
    duration: "3 hours",
    date: "July 5, 2023",
    time: "10:00 AM - 1:00 PM",
    location: "Maker Space, 456 Tech Avenue",
    instructor: "Eng. Sarah Williams",
    seats: 8,
    price: "$35",
    icon: Rocket,
    ageGroup: "12-16",
    format: "In-person",
    requirements: [
      "Basic understanding of electricity recommended",
      "Suitable for ages 12-16",
      "All materials provided",
      "Safety goggles required (provided)",
    ],
    topics: [
      "Circuit design basics",
      "Components and their functions",
      "Reading schematics",
      "Soldering techniques",
      "Building a working electronic device",
      "Troubleshooting circuits",
    ],
  },
  {
    id: 6,
    title: "Python for Data Science",
    description: "Learn Python programming for data analysis and visualization.",
    category: "Computer Science",
    level: "Advanced",
    duration: "4 hours",
    date: "July 10, 2023",
    time: "1:00 PM - 5:00 PM",
    location: "Virtual Classroom",
    instructor: "Dr. James Wilson",
    seats: 15,
    price: "$40",
    icon: Code,
    ageGroup: "15-18",
    format: "Virtual",
    requirements: [
      "Basic programming knowledge required",
      "Suitable for ages 15-18",
      "Computer with Python installed required",
      "Understanding of basic math concepts",
    ],
    topics: [
      "Python fundamentals",
      "Data structures and algorithms",
      "Working with libraries (NumPy, Pandas)",
      "Data visualization with Matplotlib",
      "Basic statistical analysis",
      "Building a data science project",
    ],
  },
  {
    id: 7,
    title: "Chemistry Lab",
    description: "Conduct exciting chemistry experiments in a lab setting.",
    category: "Science",
    level: "Intermediate",
    duration: "2.5 hours",
    date: "July 15, 2023",
    time: "9:30 AM - 12:00 PM",
    location: "Science Center, Lab 3",
    instructor: "Prof. Emily Chen",
    seats: 12,
    price: "$30",
    icon: Atom,
    ageGroup: "12-16",
    format: "In-person",
    requirements: [
      "Basic science knowledge recommended",
      "Suitable for ages 12-16",
      "All lab materials provided",
      "Closed-toe shoes required",
    ],
    topics: [
      "Lab safety procedures",
      "Chemical reactions",
      "Acids and bases",
      "Solutions and mixtures",
      "Molecular structures",
      "Experimental design",
    ],
  },
  {
    id: 8,
    title: "Aerospace Engineering",
    description: "Explore principles of flight and spacecraft design.",
    category: "Engineering",
    level: "Advanced",
    duration: "3 hours",
    date: "July 20, 2023",
    time: "2:00 PM - 5:00 PM",
    location: "Aerospace Center, 789 Flight Way",
    instructor: "Eng. Robert Taylor",
    seats: 10,
    price: "$45",
    icon: Rocket,
    ageGroup: "14-18",
    format: "In-person",
    requirements: [
      "Physics knowledge recommended",
      "Suitable for ages 14-18",
      "All materials provided",
      "Calculator required",
    ],
    topics: [
      "Principles of flight",
      "Aerodynamics",
      "Rocket propulsion",
      "Spacecraft design",
      "Building and testing model aircraft",
      "Future of aerospace technology",
    ],
  },
]

// Mock data for bookings
export const bookings: Booking[] = [
  {
    id: 1,
    program: "Robotics Workshop",
    date: "June 15, 2023",
    time: "10:00 AM - 12:00 PM",
    location: "STEM Innovation Center",
    status: "Confirmed",
    icon: Rocket,
  },
  {
    id: 2,
    program: "Coding Bootcamp",
    date: "June 20, 2023",
    time: "2:00 PM - 5:00 PM",
    location: "Tech Hub, Room 101",
    status: "Pending",
    icon: Code,
  },
  {
    id: 3,
    program: "Science Exploration",
    date: "June 25, 2023",
    time: "1:00 PM - 3:00 PM",
    location: "Science Center",
    status: "Confirmed",
    icon: Atom,
  },
  {
    id: 4,
    program: "Math Challenge",
    date: "June 30, 2023",
    time: "3:00 PM - 5:00 PM",
    location: "Learning Center, Room 203",
    status: "Cancelled",
    icon: BookOpen,
  },
]

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

export async function getFilteredPrograms(options: FilterOptions): Promise<Program[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  let filtered = [...programs]

  // Apply search filter
  if (options.search) {
    const searchLower = options.search.toLowerCase()
    filtered = filtered.filter(
      (program) =>
        program.title.toLowerCase().includes(searchLower) || program.description.toLowerCase().includes(searchLower),
    )
  }

  // Apply category filter
  if (options.category && options.category !== "all") {
    filtered = filtered.filter((program) => program.category.toLowerCase() === options.category?.toLowerCase())
  }

  // Apply level filter
  if (options.level && options.level !== "all") {
    filtered = filtered.filter((program) => program.level.toLowerCase() === options.level?.toLowerCase())
  }

  // Apply age group filter
  if (options.ageGroup && options.ageGroup !== "all") {
    filtered = filtered.filter((program) => program.ageGroup?.includes(options.ageGroup || ""))
  }

  // Apply format filter
  if (options.format && options.format !== "all") {
    filtered = filtered.filter((program) => program.format?.toLowerCase() === options.format?.toLowerCase())
  }

  return filtered
}

// Get bookings with filtering
export type BookingFilterOptions = {
  search?: string
  status?: string
  dateRange?: string
}

export async function getFilteredBookings(options: BookingFilterOptions): Promise<Booking[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  let filtered = [...bookings]

  // Apply search filter
  if (options.search) {
    const searchLower = options.search.toLowerCase()
    filtered = filtered.filter(
      (booking) =>
        booking.program.toLowerCase().includes(searchLower) || booking.location.toLowerCase().includes(searchLower),
    )
  }

  // Apply status filter
  if (options.status && options.status !== "all") {
    filtered = filtered.filter((booking) => booking.status.toLowerCase() === options.status?.toLowerCase())
  }

  // Apply date range filter
  if (options.dateRange && options.dateRange !== "all") {
    // This would be more sophisticated in a real app
    if (options.dateRange === "upcoming") {
      // Filter for future dates
      filtered = filtered.filter((booking) => new Date(booking.date) > new Date())
    } else if (options.dateRange === "past") {
      // Filter for past dates
      filtered = filtered.filter((booking) => new Date(booking.date) < new Date())
    }
  }

  return filtered
}

// Get a single program by ID
export async function getProgramById(id: number): Promise<Program | undefined> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return programs.find((program) => program.id === id)
}

