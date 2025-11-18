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
    
    # Try to run drizzle-kit push and capture both output and exit code
    set +e  # Temporarily disable exit on error
    drizzle-kit migrate > /tmp/drizzle_output.log 2>&1
    local exit_code=$?
    set -e  # Re-enable exit on error
    
    # Check if the error is connection refused
    if grep -q "ECONNREFUSED\|ETIMEDOUT\|ENOTFOUND" /tmp/drizzle_output.log; then
      echo "⚠️  MySQL not ready yet (connection error). Waiting 2 seconds before retry..."
      sleep 2
      attempt=$((attempt + 1))
      continue
    fi
    
    # If no connection error, check the exit code
    if [ $exit_code -eq 0 ]; then
      echo "✅ MySQL is ready! Migrations applied successfully."
      cat /tmp/drizzle_output.log
      return 0
    else
      # Check if it's just "No schema changes" which is actually success
      if grep -q "No schema changes" /tmp/drizzle_output.log; then
        echo "✅ MySQL is ready! No schema changes needed."
        cat /tmp/drizzle_output.log
        return 0
      else
        # Unexpected error
        echo "❌ Unexpected error occurred:"
        cat /tmp/drizzle_output.log
        return 1
      fi
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
