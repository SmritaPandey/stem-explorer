# STEM Explorer Platform

A comprehensive web platform for STEM education programs, allowing students to browse, book, and attend STEM classes.

## Features

- **User Authentication**: Secure login with email/password and social login options (Google)
- **Program Browsing**: Browse available STEM programs with filtering options
- **Booking System**: Book and manage class registrations
- **Admin Panel**: Manage programs, bookings, and users
- **Payment Processing**: Secure payment integration
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQL (PostgreSQL)
- **Authentication**: JWT, Passport.js
- **Styling**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL (optional, can use mock database for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stem-platform.git
   cd stem-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:3001
   
   # Backend
   JWT_SECRET=your_jwt_secret
   DATABASE_URL=your_database_url
   ```

4. Start the development server:
   ```bash
   # Start the frontend
   npm run dev
   # or
   pnpm dev
   
   # Start the backend (in a separate terminal)
   cd backend
   npm run dev
   # or
   pnpm dev
   ```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
