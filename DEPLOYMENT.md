# STEM Explorer Platform Deployment Guide

This guide provides step-by-step instructions for deploying the STEM Explorer platform in a production environment.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Domain name (for production deployment)
- SSL certificate (recommended for production)
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

1. Create backend environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your production values:

```
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=stem_explorer
DB_PASSWORD=your_secure_password
DB_PORT=5432
USE_MOCK_DB=false

# JWT Configuration
JWT_SECRET=your_secure_random_string_at_least_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=stem-explorer
JWT_AUDIENCE=stem-explorer-client

# CORS Configuration
FRONTEND_URL=https://your-domain.com

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-domain.com/api/auth/github/callback

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID_PREFIX=price_

# Security
BCRYPT_SALT_ROUNDS=12
```

3. Create frontend environment file:

```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your production values:

```
# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 2. Set Up the Database

1. Create a PostgreSQL database:

```bash
createdb stem_explorer
```

2. Run migrations:

```bash
cd backend
npm run migrate
```

### 3. Build the Application

1. Install dependencies and build the backend:

```bash
cd backend
npm install
npm run build
cd ..
```

2. Install dependencies and build the frontend:

```bash
npm install
npm run build
```

### 4. Deployment Options

#### Option 1: Traditional Server Deployment

1. Set up a web server (Nginx or Apache) to serve the frontend and proxy API requests to the backend.

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        root /path/to/stem-explorer/.next/;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Use a process manager like PM2 to keep the application running:

```bash
# Install PM2
npm install -g pm2

# Start the backend
cd backend
pm2 start dist/index.js --name stem-explorer-backend

# Start the frontend (if not using Nginx/Apache for static files)
cd ..
pm2 start npm --name stem-explorer-frontend -- start
```

#### Option 2: Docker Deployment

1. Create a `Dockerfile` for the backend:

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

2. Create a `Dockerfile` for the frontend:

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

3. Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=stem_explorer
      - DB_PORT=5432
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=http://frontend:3000
    depends_on:
      - db

  db:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=stem_explorer
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Option 3: Cloud Platform Deployment

1. **Vercel** (for frontend):
   - Connect your GitHub repository to Vercel
   - Configure environment variables in the Vercel dashboard
   - Deploy with automatic CI/CD

2. **Heroku** (for backend):
   - Create a new Heroku app
   - Add PostgreSQL add-on
   - Configure environment variables in the Heroku dashboard
   - Deploy with Git or GitHub integration

### 5. SSL Configuration

For production, always use HTTPS:

1. Obtain an SSL certificate (Let's Encrypt is free)
2. Configure your web server to use SSL
3. Update all callback URLs and environment variables to use HTTPS

### 6. Monitoring and Maintenance

1. Set up logging:
   - Use a service like Logtail, Papertrail, or ELK stack
   - Configure application logging to capture errors and important events

2. Set up monitoring:
   - Use a service like UptimeRobot, New Relic, or Datadog
   - Monitor server health, response times, and error rates

3. Regular maintenance:
   - Keep dependencies updated
   - Regularly backup the database
   - Monitor security advisories for your dependencies

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check database credentials
   - Ensure the database server is running and accessible
   - Check network/firewall settings

2. **Authentication Issues**:
   - Verify JWT_SECRET is set correctly
   - Check OAuth credentials and callback URLs
   - Ensure cookies are being set with the correct domain

3. **CORS Issues**:
   - Ensure FRONTEND_URL is set correctly
   - Check that the backend CORS configuration matches your frontend domain

4. **SSL/HTTPS Issues**:
   - Verify SSL certificate is valid and properly installed
   - Ensure all URLs use HTTPS in production

## Security Best Practices

1. **Environment Variables**:
   - Never commit .env files to version control
   - Use strong, unique values for secrets
   - Rotate secrets periodically

2. **Database Security**:
   - Use a strong password for the database
   - Limit database access to necessary IP addresses
   - Regularly backup the database

3. **API Security**:
   - Implement rate limiting
   - Use HTTPS for all communications
   - Validate and sanitize all user inputs

4. **Authentication Security**:
   - Use HTTP-only cookies for refresh tokens
   - Implement token rotation
   - Set appropriate token expiration times
