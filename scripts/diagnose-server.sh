#!/bin/bash

echo "--- Server Diagnostics ---"
echo "1. Checking for processes on port 3000..."
sudo lsof -i :3000 || echo "No process found on port 3000."

echo -e "\n2. Checking memory usage..."
free -h

echo -e "\n3. Checking PM2 status..."
pm2 status

echo -e "\n4. Checking for .next directory..."
if [ -d ".next" ]; then
  echo ".next directory exists."
  ls -lh .next | head -n 5
else
  echo "ERROR: .next directory NOT found. Did you run 'npm run build'?"
fi

echo -e "\n5. Checking environment variables (sanitized)..."
echo "AUTH_URL: $AUTH_URL"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "NODE_ENV: $NODE_ENV"

echo -e "\n6. Attempting to start Next.js manually to see error..."
# We use a timeout to prevent it from hanging if it actually works
timeout 10s npm run start || echo -e "\nManual start failed or timed out (which is expected if it works)."
