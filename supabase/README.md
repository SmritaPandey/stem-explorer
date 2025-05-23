# Supabase Setup for Kid Qubit

This directory contains SQL scripts to set up your Supabase database for the Kid Qubit platform.

## Setup Instructions

1. **Log in to your Supabase Dashboard**:
   - Go to https://app.supabase.com and log in
   - Select your project: "Kid Qubit"

2. **Run the Schema SQL**:
   - Go to the SQL Editor in your Supabase dashboard
   - Click "New Query"
   - Copy and paste the contents of `schema.sql` into the editor
   - Click "Run" to create all the necessary tables and security policies

3. **Load Sample Data (Optional)**:
   - Create another new query
   - Copy and paste the contents of `sample_data.sql` into the editor
   - Click "Run" to insert sample programs and program sessions

4. **Set Up Authentication**:
   - Go to Authentication > Settings
   - Under "Email Auth", make sure "Enable Email Signup" is turned on
   - Under "External OAuth Providers", you can enable Google and GitHub login if desired

5. **Get Your API Keys**:
   - Go to Project Settings > API
   - Copy the URL and anon key
   - Update your `.env.local` and `backend/.env` files with these values

## Database Schema

The database includes the following tables:

- **profiles**: User profiles linked to Supabase Auth
- **programs**: STEM programs/courses offered
- **program_sessions**: Specific instances of programs with dates and times
- **bookings**: User bookings for program sessions
- **reviews**: User reviews of programs
- **health_check**: Simple table for API health checks

## Row Level Security (RLS)

Security policies have been set up to:

- Allow public access to view programs and sessions
- Restrict users to only view and modify their own bookings and profiles
- Give admin users special privileges to manage all content

## Troubleshooting

If you encounter any issues:

1. Check that all SQL scripts ran without errors
2. Verify that Row Level Security is properly enabled
3. Make sure your environment variables match the Supabase project settings
4. Check the Supabase logs for any authentication or database errors
