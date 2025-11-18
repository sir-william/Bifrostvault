#!/bin/bash
set -e

echo "🚀 Starting Bifrostvault..."

# Function to check if MySQL is ready
wait_for_mysql() {
  echo "⏳ Waiting for MySQL to be ready..."
  local max_attempts=30
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts: Checking MySQL connection..."
    
    # Try to run a simple drizzle-kit command to test connection
    if drizzle-kit push 2>&1 | tee /tmp/drizzle_output.log; then
      echo "✅ MySQL is ready! Migrations applied successfully."
      return 0
    fi
    
    # Check if the error is connection refused
    if grep -q "ECONNREFUSED\|ETIMEDOUT\|ENOTFOUND" /tmp/drizzle_output.log; then
      echo "⚠️  MySQL not ready yet. Waiting 2 seconds before retry..."
      sleep 2
      attempt=$((attempt + 1))
    else
      # If it's a different error, fail immediately
      echo "❌ Unexpected error occurred:"
      cat /tmp/drizzle_output.log
      return 1
    fi
  done
  
  echo "❌ Failed to connect to MySQL after $max_attempts attempts"
  return 1
}

# Wait for MySQL and run migrations
if wait_for_mysql; then
  echo "🎉 Database migrations completed successfully!"
  echo "🚀 Starting application server..."
  NODE_ENV=production node dist/index.js
else
  echo "❌ Failed to apply database migrations. Exiting."
  exit 1
fi
