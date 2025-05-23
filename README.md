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
   - Run the SQL scripts in the `supabase` directory to set up your database schema. See `supabase/README.md` for more details if available.

4. Set up environment variables:

   **For the Frontend (Next.js):**
   - Copy the `.env.local.example` file in the root directory to a new file named `.env.local`.
   - Update `.env.local` with your actual Supabase project details and other frontend configurations:
     ```
     # Supabase Configuration (Frontend - accessible in the browser)
     NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
     NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

     # API Configuration (if using the backend server)
     NEXT_PUBLIC_API_URL="http://localhost:3001/api" # Adjust if your backend runs elsewhere

     # Other frontend variables like Stripe public key
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
     NEXT_PUBLIC_SITE_URL="http://localhost:3000"
     ```
   - You can find your Supabase URL and `anon` key in your Supabase project dashboard under Project Settings > API.

   **For the Backend (Express):**
   - Navigate to the `backend` directory: `cd backend`
   - Copy the `backend/.env.example` file to a new file named `backend/.env`.
   - Update `backend/.env` with your actual Supabase project details:
     ```
     # Supabase Configuration (Backend - keep these secret)
     SUPABASE_URL="your_supabase_url"
     SUPABASE_ANON_KEY="your_supabase_anon_key" # Used by the default backend client
     SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key" # For admin tasks or bypassing RLS
     
     # Supabase Storage Configuration
     SUPABASE_STORAGE_MATERIALS_BUCKET="course_materials_bucket" # Ensure this bucket exists in your Supabase project Storage

     # Other backend variables (PORT, NODE_ENV, Stripe secrets, etc.)
     # These might also be in the root .env.example or .env file depending on your setup.
     # Ensure they are available to the backend environment.
     # Example:
     # PORT=3001
     # STRIPE_SECRET_KEY="your_stripe_secret_key"
     # STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
     ```
   - You can find your Supabase URL, `anon` key, and `service_role` key in your Supabase project dashboard under Project Settings > API.
   - The `SUPABASE_STORAGE_MATERIALS_BUCKET` should match the name of the bucket you create in Supabase Storage for course materials.

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
