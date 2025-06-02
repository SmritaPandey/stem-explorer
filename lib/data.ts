/**
 * Static data for the Kid Qubit platform
 * Replaces dynamic data fetching with static data
 */

import type { LucideIcon } from 'lucide-react';

// Core Program Type
export type Program = {
  id: string; 
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  date: string;
  time: string;
  location?: string | null;
  instructor?: string | null;
  seats: number;
  price: string;
  icon?: string | null;
  age_group?: string | null;
  format?: string | null;
  requirements?: string[] | null;
  topics?: string[] | null;
  long_description?: string | null;
};

// Program Session Type
export type ProgramSession = {
  id: string;
  program_id: string;
  start_time: string;
  end_time: string;
  current_capacity: number;
  max_capacity: number;
  is_cancelled: boolean;
  programs?: { max_capacity: number };
};

// Booking Types
export type ProgramForBooking = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  icon?: string | null;
  image_url?: string | null;
};

export type SessionForBooking = {
  id: string;
  start_time: string;
  end_time: string;
  is_cancelled?: boolean;
};

export type Booking = {
  id: string;
  user_id: string;
  status: "Confirmed" | "Pending" | "Cancelled" | "completed" | "Failed";
  payment_status?: string | null;
  amount_paid?: number | null;
  booking_date?: string | null;
  created_at?: string | null;
  program: ProgramForBooking;
  session: SessionForBooking;
};

// Filter Options
export type FilterOptions = {
  search?: string;
  category?: string;
  level?: string;
  ageGroup?: string;
  format?: string;
};

// Static sample programs data
const STATIC_PROGRAMS: Program[] = [
  {
    id: "1",
    title: "Robotics Workshop",
    description: "Build your own robot and learn about mechanics, electronics, and programming in this hands-on workshop.",
    category: "Engineering",
    level: "Beginner",
    duration: "2 hours",
    date: "2025-06-15",
    time: "10:00 AM - 12:00 PM",
    location: "STEM Innovation Center",
    instructor: "Dr. Sarah Johnson",
    seats: 15,
    price: "$49.99",
    icon: "Rocket",
    age_group: "8-12",
    format: "In-person",
    requirements: ["No prior experience required", "Curiosity and enthusiasm"],
    topics: ["Basic robotics principles", "Simple circuits", "Intro to coding", "Problem solving"],
    long_description: "Get ready for an exciting journey into the world of robotics! In this beginner-friendly workshop, students will build their own simple robots while learning fundamental concepts in mechanics, electronics, and programming. Through hands-on activities and guided exploration, participants will discover how robots work, how to design and construct basic mechanical systems, and how to program their creations to perform tasks. This workshop fosters creativity, critical thinking, and teamwork while introducing STEM concepts in an engaging, fun environment. All materials are provided, and no prior experience is necessary - just bring your imagination and enthusiasm!"
  },
  {
    id: "2",
    title: "Coding Bootcamp",
    description: "Learn the basics of programming and create your own interactive games and animations in this fun-filled coding adventure.",
    category: "Computer Science",
    level: "Beginner",
    duration: "3 hours",
    date: "2025-06-20",
    time: "2:00 PM - 5:00 PM",
    location: "Tech Hub, Room 101",
    instructor: "Alex Chen",
    seats: 20,
    price: "$39.99",
    icon: "Code",
    age_group: "10-14",
    format: "In-person",
    requirements: ["Basic computer skills", "No coding experience needed"],
    topics: ["Programming fundamentals", "Variables and functions", "Loops and conditions", "Game development basics"],
    long_description: "Dive into the exciting world of coding! This beginner-friendly bootcamp introduces young learners to the fundamentals of programming through interactive, project-based learning. Students will use child-friendly coding platforms to create their own games, animations, and digital stories while developing computational thinking skills. The curriculum is designed to make coding accessible and fun, with colorful interfaces and immediate visual feedback. By the end of the session, participants will understand core programming concepts like sequences, loops, variables, and conditionals, and will have created several digital projects to share with friends and family. This bootcamp builds confidence and problem-solving skills while fostering creativity in a collaborative environment."
  },
  {
    id: "3",
    title: "Science Exploration",
    description: "Conduct exciting experiments and discover the wonders of chemistry, physics, and biology in this hands-on science program.",
    category: "Science",
    level: "Intermediate",
    duration: "2 hours",
    date: "2025-06-25",
    time: "1:00 PM - 3:00 PM",
    location: "Science Center",
    instructor: "Dr. Maya Patel",
    seats: 16,
    price: "$45.99",
    icon: "Atom",
    age_group: "9-13",
    format: "In-person",
    requirements: ["Basic science knowledge", "Curiosity about the natural world"],
    topics: ["Chemical reactions", "Forces and motion", "Ecosystem exploration", "Scientific method"],
    long_description: "Embark on an amazing journey through the world of science! This exploration program lets young scientists conduct fascinating experiments across various scientific disciplines. Participants will mix chemicals to create colorful reactions, build and test simple machines to learn about physics, and explore living systems to understand biology concepts. Each session includes multiple hands-on activities designed to inspire wonder and develop scientific thinking. Students will learn to form hypotheses, conduct experiments, collect data, and draw conclusions - just like real scientists! The program emphasizes safety while encouraging curiosity and discovery. All necessary materials and safety equipment are provided, and students will take home information sheets to continue their scientific exploration at home."
  },
  {
    id: "4",
    title: "Math Challenge",
    description: "Tackle fun math problems and puzzles to develop problem-solving skills and mathematical thinking.",
    category: "Mathematics",
    level: "Advanced",
    duration: "2 hours",
    date: "2025-06-30",
    time: "3:00 PM - 5:00 PM",
    location: "Learning Center, Room 203",
    instructor: "Prof. Robert Lee",
    seats: 12,
    price: "$42.99",
    icon: "Brain",
    age_group: "12-16",
    format: "In-person",
    requirements: ["Grade-level math skills", "Interest in problem-solving"],
    topics: ["Number theory", "Geometry puzzles", "Logic problems", "Mathematical games"],
    long_description: "Challenge your mathematical mind with our Math Challenge program! This exciting course takes math beyond the classroom, presenting students with intriguing puzzles, games, and problems that develop critical thinking and logical reasoning. Participants will explore fascinating mathematical concepts through hands-on activities, collaborative challenges, and friendly competitions. From geometric puzzles and number theory to probability games and logic problems, students will discover the beauty and power of mathematics in real-world contexts. The course is designed to build confidence and resilience in problem-solving while fostering a genuine appreciation for mathematical thinking. Whether preparing for math competitions or simply looking to enhance mathematical abilities, this program offers engaging challenges that make learning math a truly enjoyable experience."
  },
  {
    id: "5",
    title: "Engineering Challenge",
    description: "Design and build structures to solve real-world engineering problems using simple materials.",
    category: "Engineering",
    level: "Intermediate",
    duration: "2.5 hours",
    date: "2025-07-05",
    time: "9:30 AM - 12:00 PM",
    location: "Maker Space",
    instructor: "Emma Rodriguez",
    seats: 18,
    price: "$47.99",
    icon: "Rocket",
    age_group: "11-15",
    format: "In-person",
    requirements: ["Basic understanding of physics concepts", "Creative thinking"],
    topics: ["Structural engineering", "Design process", "Material properties", "Problem-solving methodology"],
    long_description: "Put your engineering skills to the test! In this hands-on challenge program, young engineers tackle a series of design problems using everyday materials. Students will learn about structural principles, material properties, and the engineering design process as they create solutions to realistic scenarios. From building bridges that can hold weight to designing devices that can protect an egg from a fall, participants will apply science and math concepts to real-world engineering challenges. The program emphasizes teamwork, creativity, and iterative design - essential skills for future engineers. Students document their process, test their designs, and refine their solutions based on results. This practical approach to engineering builds problem-solving abilities and resilience while showcasing the exciting possibilities of engineering careers."
  },
];

// Static program sessions
const STATIC_SESSIONS: ProgramSession[] = [
  {
    id: "s1",
    program_id: "1",
    start_time: "2025-06-15T10:00:00Z",
    end_time: "2025-06-15T12:00:00Z",
    current_capacity: 5,
    max_capacity: 15,
    is_cancelled: false
  },
  {
    id: "s2",
    program_id: "1",
    start_time: "2025-06-22T10:00:00Z",
    end_time: "2025-06-22T12:00:00Z",
    current_capacity: 3,
    max_capacity: 15,
    is_cancelled: false
  },
  {
    id: "s3",
    program_id: "2",
    start_time: "2025-06-20T14:00:00Z",
    end_time: "2025-06-20T17:00:00Z",
    current_capacity: 8,
    max_capacity: 20,
    is_cancelled: false
  },
  {
    id: "s4",
    program_id: "3",
    start_time: "2025-06-25T13:00:00Z",
    end_time: "2025-06-25T15:00:00Z",
    current_capacity: 6,
    max_capacity: 16,
    is_cancelled: false
  },
  {
    id: "s5",
    program_id: "4",
    start_time: "2025-06-30T15:00:00Z",
    end_time: "2025-06-30T17:00:00Z",
    current_capacity: 4,
    max_capacity: 12,
    is_cancelled: false
  },
];

// Static bookings data
const STATIC_BOOKINGS: Booking[] = [
  {
    id: "b1",
    user_id: "user1",
    status: "Confirmed",
    payment_status: "paid",
    amount_paid: 49.99,
    booking_date: "2025-06-01T10:30:00Z",
    created_at: "2025-06-01T10:30:00Z",
    program: {
      id: "1",
      title: "Robotics Workshop",
      location: "STEM Innovation Center",
      icon: "Rocket"
    },
    session: {
      id: "s1",
      start_time: "2025-06-15T10:00:00Z",
      end_time: "2025-06-15T12:00:00Z"
    }
  },
  {
    id: "b2",
    user_id: "user1",
    status: "Pending",
    payment_status: "pending",
    amount_paid: 39.99,
    booking_date: "2025-06-02T15:45:00Z",
    created_at: "2025-06-02T15:45:00Z",
    program: {
      id: "2",
      title: "Coding Bootcamp",
      location: "Tech Hub, Room 101",
      icon: "Code"
    },
    session: {
      id: "s3",
      start_time: "2025-06-20T14:00:00Z",
      end_time: "2025-06-20T17:00:00Z"
    }
  }
];

// Static materials
export interface Material {
  id: string;
  program_id: string;
  title: string;
  description?: string | null;
  file_url: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string | null;
}

const STATIC_MATERIALS: Material[] = [
  {
    id: "m1",
    program_id: "1",
    title: "Robotics Workshop Guide",
    description: "Complete guide with diagrams and instructions",
    file_url: "/sample-materials/robotics-guide.pdf",
    storage_path: "robotics-guide.pdf",
    file_name: "robotics-guide.pdf",
    file_type: "application/pdf",
    file_size: 2500000,
    is_public: true,
    created_at: "2025-05-15T10:00:00Z"
  },
  {
    id: "m2",
    program_id: "2",
    title: "Coding Projects Workbook",
    description: "Workbook with coding exercises and solutions",
    file_url: "/sample-materials/coding-workbook.pdf",
    storage_path: "coding-workbook.pdf",
    file_name: "coding-workbook.pdf",
    file_type: "application/pdf",
    file_size: 1800000,
    is_public: true,
    created_at: "2025-05-18T14:30:00Z"
  }
];

// Program Functions
export async function getPrograms(options?: FilterOptions): Promise<Program[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredPrograms = [...STATIC_PROGRAMS];
  
  if (options?.search) {
    const searchTerm = options.search.toLowerCase();
    filteredPrograms = filteredPrograms.filter(program => 
      program.title.toLowerCase().includes(searchTerm) || 
      program.description.toLowerCase().includes(searchTerm)
    );
  }
  
  if (options?.category && options.category !== "all") {
    filteredPrograms = filteredPrograms.filter(program => 
      program.category === options.category
    );
  }
  
  if (options?.level && options.level !== "all") {
    filteredPrograms = filteredPrograms.filter(program => 
      program.level === options.level
    );
  }
  
  if (options?.ageGroup && options.ageGroup !== "all") {
    filteredPrograms = filteredPrograms.filter(program => 
      program.age_group?.includes(options.ageGroup || "")
    );
  }
  
  if (options?.format && options.format !== "all") {
    filteredPrograms = filteredPrograms.filter(program => 
      program.format === options.format
    );
  }
  
  return filteredPrograms;
}

export async function getProgramById(id: string | number): Promise<Program | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return STATIC_PROGRAMS.find(program => program.id === id.toString()) || null;
}

export async function getProgramSessions(programId: string | number): Promise<ProgramSession[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return STATIC_SESSIONS.filter(session => session.program_id === programId.toString());
}

// Booking Functions
export type BookingFilterOptions = {
  search?: string;
  status?: Booking['status'] | 'all';
};

export async function getBookingsForUser(userId: string, options?: BookingFilterOptions): Promise<Booking[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let filteredBookings = STATIC_BOOKINGS.filter(booking => booking.user_id === userId);
  
  if (options?.search) {
    const searchTerm = options.search.toLowerCase();
    filteredBookings = filteredBookings.filter(booking => 
      booking.program.title.toLowerCase().includes(searchTerm)
    );
  }
  
  if (options?.status && options.status !== 'all') {
    filteredBookings = filteredBookings.filter(booking => 
      booking.status === options.status
    );
  }
  
  return filteredBookings;
}

export async function getAllBookings(options?: BookingFilterOptions): Promise<Booking[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let filteredBookings = [...STATIC_BOOKINGS];
  
  if (options?.search) {
    const searchTerm = options.search.toLowerCase();
    filteredBookings = filteredBookings.filter(booking => 
      booking.program.title.toLowerCase().includes(searchTerm)
    );
  }
  
  if (options?.status && options.status !== 'all') {
    filteredBookings = filteredBookings.filter(booking => 
      booking.status === options.status
    );
  }
  
  return filteredBookings;
}

export async function createBooking(bookingData: {
  program_session_id: string;
  paymentStatus?: string;
  amountPaid?: number;
}): Promise<Booking | null> {
  // In a static site, we'll just simulate this and return a mock booking
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const session = STATIC_SESSIONS.find(s => s.id === bookingData.program_session_id);
  if (!session) return null;
  
  const program = STATIC_PROGRAMS.find(p => p.id === session.program_id);
  if (!program) return null;
  
  // In a real app, we would create a new booking and return it
  const mockBooking: Booking = {
    id: `b${Math.floor(Math.random() * 1000)}`,
    user_id: "user1", // Assume current user
    status: "Pending",
    payment_status: bookingData.paymentStatus || "pending",
    amount_paid: bookingData.amountPaid || parseFloat(program.price.replace('$', '')),
    booking_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    program: {
      id: program.id,
      title: program.title,
      location: program.location,
      icon: program.icon
    },
    session: {
      id: session.id,
      start_time: session.start_time,
      end_time: session.end_time
    }
  };
  
  return mockBooking;
}

export async function cancelBooking(bookingId: number, userId: string, isAdmin: boolean = false): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In a static site, we'll just return true to simulate success
  return true;
}

// Mock payment functions
export interface StripeCheckoutSessionResponse {
  sessionId: string;
  url: string;
  bookingId: string;
}

export async function createStripeCheckoutSession(
  programId: string | number,
  programSessionId: string | null
): Promise<StripeCheckoutSessionResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  // For a static site, redirect to a success page directly
  return {
    sessionId: `mock_session_${Date.now()}`,
    url: `/dashboard/bookings/success?booking_id=mock${Date.now()}`,
    bookingId: `mock${Date.now()}`
  };
}

// Material Functions
export async function getMaterialsForProgram(programId: string | number): Promise<Material[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return STATIC_MATERIALS.filter(material => material.program_id === programId.toString());
}

export async function getMaterialDownloadUrlClient(materialId: string | number): Promise<{ downloadUrl: string, fileName: string } | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const material = STATIC_MATERIALS.find(m => m.id === materialId.toString());
  if (!material) return null;
  
  return {
    downloadUrl: material.file_url,
    fileName: material.file_name
  };
}