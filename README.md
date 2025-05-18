# STEM Explorer Platform

A comprehensive web platform for STEM education programs, allowing students to browse, book, and attend STEM classes.

## Features

- **User Authentication**: Secure login with email/password and social login options (Google, GitHub)
- **Program Browsing**: Browse available STEM programs with filtering options
- **Booking System**: Book and manage class registrations
- **Admin Panel**: Manage programs, bookings, and users
- **Payment Processing**: Secure payment integration
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier available)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SmritaPandey/stem-explorer.git
   cd stem-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your Supabase URL and anon key from the project settings
   - Run the SQL scripts in the `supabase` directory to set up your database schema

4. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # API Configuration (if using the backend server)
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

5. Start the development server:
   ```bash
   # Start the frontend
   npm run dev
   # or
   yarn dev

   # Start the backend (optional, in a separate terminal)
   cd backend
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Setup

The application uses Supabase as its database and authentication provider. The database schema includes:

- **profiles**: User profiles linked to Supabase Auth
- **programs**: STEM programs/courses offered
- **program_sessions**: Specific instances of programs with dates and times
- **bookings**: User bookings for program sessions
- **reviews**: User reviews of programs

To set up the database:
1. Go to the SQL Editor in your Supabase dashboard
2. Run the `schema.sql` script from the `supabase` directory
3. Optionally, run the `sample_data.sql` script to add sample data

## Deployment

For deployment:

1. Deploy the frontend to Vercel or Netlify:
   - Connect your GitHub repository
   - Set the environment variables in the hosting provider
   - Deploy the application

2. For the backend (optional):
   - Deploy to a service like Heroku, Railway, or Render
   - Set the environment variables in the hosting provider
   - Update the `NEXT_PUBLIC_API_URL` in your frontend deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.
