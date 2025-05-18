# STEM Explorer Platform Deployment Guide

This guide provides step-by-step instructions for deploying the STEM Explorer platform in a production environment.

## Prerequisites

- Node.js (v18 or higher)
- Supabase account (free tier available)
- Domain name (for production deployment)
- SSL certificate (automatically provided by most hosting platforms)
- Stripe account (for payment processing)
- Google/GitHub developer accounts (for OAuth)

## Deployment Steps

### 1. Prepare Your Environment

#### Clone the Repository

```bash
git clone https://github.com/yourusername/stem-explorer.git
cd stem-explorer
```

#### Set Up Environment Variables

1. Create frontend environment file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your production values:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration (if using the backend server)
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Stripe Configuration (if using Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

3. If using the backend server, create backend environment file:

```bash
cp backend/.env.example backend/.env
```

4. Edit `backend/.env` with your production values:

```
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration (for compatibility with existing code)
JWT_SECRET=your_secure_random_string_at_least_32_chars

# CORS Configuration
FRONTEND_URL=https://your-domain.com

# Stripe Configuration (if using Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 2. Set Up the Supabase Database

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Run the `schema.sql` script from the `supabase` directory:
   - Copy the contents of `supabase/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to create all tables and security policies
5. Optionally, run the `sample_data.sql` script to add sample data

### 3. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Under "Email Auth", ensure "Enable Email Signup" is turned on
3. Configure password requirements as needed
4. Set up redirect URLs (add your production domain)

#### Set Up OAuth Providers (Optional)

##### Google OAuth:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://[YOUR_SUPABASE_PROJECT].supabase.co/auth/v1/callback`
   - `https://[YOUR_DOMAIN]/auth/callback`
6. Copy the Client ID and Client Secret
7. In Supabase, go to Authentication > Providers > Google
8. Enable Google auth and paste your Client ID and Client Secret

##### GitHub OAuth:

1. Go to your GitHub account settings
2. Go to "Developer settings" > "OAuth Apps"
3. Create a new OAuth App
4. Add the callback URL: `https://[YOUR_SUPABASE_PROJECT].supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret
6. In Supabase, go to Authentication > Providers > GitHub
7. Enable GitHub auth and paste your Client ID and Client Secret

### 4. Build the Application

1. Install dependencies and build the frontend:

```bash
npm install
npm run build
```

2. If using the backend server, install dependencies and build it:

```bash
cd backend
npm install
npm run build
cd ..
```

### 5. Deployment Options

#### Option 1: Vercel Deployment (Recommended)

1. Push your code to a GitHub repository
2. Log in to [Vercel](https://vercel.com)
3. Click "New Project" and import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build` or `next build`
5. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
   NEXT_PUBLIC_API_URL=[YOUR_BACKEND_URL]/api (if using a backend)
   ```
6. Click "Deploy"

#### Option 2: Netlify Deployment

1. Push your code to a GitHub repository
2. Log in to [Netlify](https://netlify.com)
3. Click "New site from Git" and select your GitHub repository
4. Configure the build settings:
   - Build command: `npm run build` or `next build`
   - Publish directory: `.next`
5. Add environment variables in the "Advanced build settings"
6. Click "Deploy site"

#### Option 3: Backend Deployment (Optional)

If you're using the Express backend for additional functionality:

##### Deploying to Heroku

1. Create a new app on [Heroku](https://dashboard.heroku.com/)
2. Connect your GitHub repository or use the Heroku CLI to deploy
3. Set environment variables in the Settings tab:
   ```
   PORT=3001
   NODE_ENV=production
   SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
   SUPABASE_SERVICE_KEY=[YOUR_SUPABASE_SERVICE_KEY]
   JWT_SECRET=[YOUR_JWT_SECRET]
   ```
4. Deploy the application

##### Deploying to Railway

1. Create a new project on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add environment variables
4. Deploy the application

#### Option 4: Docker Deployment

1. Create a `Dockerfile` for the frontend:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

2. If using the backend, create a `Dockerfile` for it:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

3. Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
      - NEXT_PUBLIC_API_URL=http://backend:3001/api

  # Optional backend service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
      - SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
      - SUPABASE_SERVICE_KEY=[YOUR_SUPABASE_SERVICE_KEY]
      - JWT_SECRET=[YOUR_JWT_SECRET]
      - FRONTEND_URL=http://frontend:3000
```

### 6. Domain Configuration

#### Custom Domain on Vercel

1. Go to your Vercel project
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Follow the instructions to configure DNS settings

#### Custom Domain on Netlify

1. Go to your Netlify site
2. Navigate to "Settings" > "Domain management"
3. Click "Add custom domain"
4. Follow the instructions to configure DNS settings

### 7. Monitoring and Maintenance

1. Set up logging:
   - Use Supabase's built-in logging for database operations
   - For frontend, consider using a service like Sentry or LogRocket
   - For backend (if used), consider Logtail or Papertrail

2. Set up monitoring:
   - Use a service like UptimeRobot, New Relic, or Datadog
   - Monitor API response times and error rates
   - Set up alerts for critical issues

3. Regular maintenance:
   - Keep dependencies updated
   - Regularly backup your Supabase database
   - Monitor security advisories for your dependencies

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**:
   - Check Supabase URL and anon key
   - Verify that your Supabase project is active
   - Check network/firewall settings that might block connections

2. **Authentication Issues**:
   - Verify OAuth redirect URLs are correctly set up
   - Check that Supabase authentication settings are properly configured
   - Ensure your application is using the correct Supabase project

3. **Row Level Security (RLS) Issues**:
   - Check that RLS policies are correctly set up in Supabase
   - Verify that users have the appropriate permissions
   - Test queries directly in the Supabase SQL Editor

4. **CORS Issues**:
   - Ensure your frontend domain is allowed in Supabase settings
   - If using a backend, check that CORS is properly configured

## Security Best Practices

1. **Environment Variables**:
   - Never commit .env files to version control
   - Use strong, unique values for secrets
   - Rotate Supabase keys periodically

2. **Database Security**:
   - Implement proper Row Level Security (RLS) policies
   - Use prepared statements for all SQL queries
   - Regularly backup your Supabase database

3. **API Security**:
   - Implement rate limiting
   - Use HTTPS for all communications
   - Validate and sanitize all user inputs

4. **Authentication Security**:
   - Configure appropriate session timeouts in Supabase
   - Use multi-factor authentication for admin accounts
   - Regularly audit user accounts and permissions

## Post-Deployment Checklist

After deploying, verify:

1. User registration and login work correctly
2. OAuth providers (Google, GitHub) work if configured
3. Program listing and details pages load properly
4. Booking functionality works
5. Admin features are accessible to admin users
6. All forms submit correctly
7. Responsive design works on mobile devices
