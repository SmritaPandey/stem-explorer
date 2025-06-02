#!/bin/bash
# Kid Qubit Platform Deployment Script

# Exit on error
set -e

echo "Starting Kid Qubit Platform deployment..."

# Check if .env files exist
if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Please create it from .env.example"
  exit 1
fi

if [ ! -f ".env.local" ]; then
  echo "Error: .env.local file not found. Please create it from .env.local.example"
  exit 1
fi

# Install dependencies with increased memory limit
echo "Installing frontend dependencies..."
export NODE_OPTIONS="--max_old_space_size=8192"
npm install
unset NODE_OPTIONS

echo "Installing backend dependencies..."
cd backend
export NODE_OPTIONS="--max_old_space_size=8192"
npm install
unset NODE_OPTIONS
cd ..

# Build the application
echo "Building backend..."
cd backend
npm run build
cd ..

echo "Building frontend..."
npm run build

# Database setup
echo "Setting up database..."
cd backend
# Check if database exists, if not create it
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
  echo "Checking if database exists..."
  # This assumes PostgreSQL is installed and configured
  if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Creating database $DB_NAME..."
    createdb "$DB_NAME"
  fi
fi

# Run migrations
echo "Running database migrations..."
npm run migrate

echo "Deployment completed successfully!"
echo "You can now start the application with:"
echo "  - Backend: cd backend && npm run start"
echo "  - Frontend: npm run start"