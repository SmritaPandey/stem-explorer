const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Mock data
const programs = [
  {
    id: 1,
    title: "Robotics Workshop",
    description: "Learn to build and program robots with hands-on activities.",
    long_description: "In this hands-on workshop, participants will learn the fundamentals of robotics engineering.",
    category: "Engineering",
    level: "Beginner",
    duration: "2 hours",
    date: "2025-06-15",
    time: "10:00 AM - 12:00 PM",
    location: "STEM Innovation Center",
    instructor: "Dr. Jane Smith",
    seats: 15,
    price: 25.00,
    booked_seats: 3,
    age_group: "10-14",
    format: "In-person",
    requirements: ["No prior experience required", "All materials provided"],
    topics: ["Introduction to robotics", "Programming with block-based code"]
  },
  {
    id: 2,
    title: "Coding Bootcamp",
    description: "Intensive coding program for beginners.",
    long_description: "This bootcamp will teach you the fundamentals of programming in a fun and interactive way.",
    category: "Programming",
    level: "Beginner",
    duration: "3 hours",
    date: "2025-06-20",
    time: "2:00 PM - 5:00 PM",
    location: "Tech Hub, Room 101",
    instructor: "Alex Johnson",
    seats: 20,
    price: 30.00,
    booked_seats: 5,
    age_group: "12-16",
    format: "In-person",
    requirements: ["Laptop required", "Basic computer skills"],
    topics: ["Introduction to programming", "JavaScript basics", "Building a simple web app"]
  },
  {
    id: 3,
    title: "Science Exploration",
    description: "Discover scientific principles through experiments and research.",
    long_description: "Explore the wonders of science through hands-on experiments and engaging activities.",
    category: "Science",
    level: "Intermediate",
    duration: "2 hours",
    date: "2025-06-25",
    time: "1:00 PM - 3:00 PM",
    location: "Science Center",
    instructor: "Dr. Michael Brown",
    seats: 15,
    price: 25.00,
    booked_seats: 2,
    age_group: "8-12",
    format: "In-person",
    requirements: ["No prior experience required", "All materials provided"],
    topics: ["Physics experiments", "Chemistry demonstrations", "Biology activities"]
  }
];

const bookings = [
  {
    id: 1,
    user_id: 1,
    program_id: 1,
    program_title: "Robotics Workshop",
    program_date: "2025-06-15",
    program_time: "10:00 AM - 12:00 PM",
    program_location: "STEM Innovation Center",
    status: "Confirmed",
    created_at: "2025-04-01T10:00:00Z"
  },
  {
    id: 2,
    user_id: 1,
    program_id: 2,
    program_title: "Coding Bootcamp",
    program_date: "2025-06-20",
    program_time: "2:00 PM - 5:00 PM",
    program_location: "Tech Hub, Room 101",
    status: "Pending",
    created_at: "2025-04-05T14:30:00Z"
  }
];

const users = [
  {
    id: 1,
    email: "user@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "user"
  },
  {
    id: 2,
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    role: "admin"
  }
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock authentication
  if (email === "user@example.com" && password === "password") {
    res.json({
      success: true,
      data: {
        accessToken: "mock_access_token",
        user: users[0]
      }
    });
  } else if (email === "admin@example.com" && password === "password") {
    res.json({
      success: true,
      data: {
        accessToken: "mock_access_token_admin",
        user: users[1]
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: "Invalid credentials"
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  res.status(201).json({
    success: true,
    data: {
      accessToken: "mock_access_token",
      user: {
        id: 3,
        email,
        firstName,
        lastName,
        role: "user"
      }
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  // Check authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (token === "mock_access_token") {
      res.json({
        success: true,
        data: {
          user: users[0]
        }
      });
    } else if (token === "mock_access_token_admin") {
      res.json({
        success: true,
        data: {
          user: users[1]
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Invalid token"
      });
    }
  } else {
    res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }
});

// Programs routes
app.get('/api/programs', (req, res) => {
  res.json({
    success: true,
    data: programs
  });
});

app.get('/api/programs/:id', (req, res) => {
  const program = programs.find(p => p.id === parseInt(req.params.id));
  
  if (program) {
    res.json({
      success: true,
      data: program
    });
  } else {
    res.status(404).json({
      success: false,
      error: "Program not found"
    });
  }
});

// Bookings routes
app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    data: bookings
  });
});

app.post('/api/bookings', (req, res) => {
  const { programId } = req.body;
  const program = programs.find(p => p.id === programId);
  
  if (!program) {
    return res.status(404).json({
      success: false,
      error: "Program not found"
    });
  }
  
  const newBooking = {
    id: bookings.length + 1,
    user_id: 1,
    program_id: programId,
    program_title: program.title,
    program_date: program.date,
    program_time: program.time,
    program_location: program.location,
    status: "Pending",
    created_at: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  
  res.status(201).json({
    success: true,
    data: newBooking
  });
});

// Payments routes
app.post('/api/payments/create-intent', (req, res) => {
  const { programId, bookingId } = req.body;
  
  res.json({
    success: true,
    data: {
      clientSecret: "mock_client_secret",
      bookingId: bookingId || bookings.length
    }
  });
});

app.post('/api/payments/create-checkout', (req, res) => {
  const { programId } = req.body;
  
  res.json({
    success: true,
    data: {
      sessionId: "mock_session_id",
      url: `http://localhost:3000/dashboard/bookings/success?booking_id=${bookings.length + 1}`
    }
  });
});

// Admin routes
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 10,
        totalPrograms: programs.length,
        totalBookings: bookings.length,
        totalRevenue: 250.00
      },
      recentBookings: bookings,
      upcomingPrograms: programs
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
