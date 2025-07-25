#!/bin/bash

echo "🚀 Starting Markup Tools Testing with Playwright Docker..."

# Ensure playwright output directory exists
mkdir -p playwright-output

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Start the Playwright container
echo "📦 Starting Playwright Docker container..."
docker-compose -f docker-compose.playwright.yml up -d

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check if the Sprkz application is running
echo "🔍 Checking if Sprkz application is running on port 7779..."
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:7779 | grep -q "200\|404"; then
    echo "⚠️  Sprkz application doesn't seem to be running on port 7779."
    echo "📝 Please start the Sprkz application first:"
    echo "   cd sprkz && npm start"
    echo ""
    echo "🔄 Or if using PM2:"
    echo "   cd sprkz && pm2 start ecosystem.config.js"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

# Run the comprehensive markup tools test
echo ""
echo "🧪 Running comprehensive markup tools test..."
docker-compose -f docker-compose.playwright.yml exec -T playwright node /workspace/test-markup-tools.js

# Wait a moment between tests
sleep 2

# Run the detailed interactions test
echo ""
echo "🧪 Running detailed markup interactions test..."
docker-compose -f docker-compose.playwright.yml exec -T playwright node /workspace/test-markup-interactions.js

# Copy any screenshots from container to host
echo ""
echo "📸 Copying screenshots from container..."
docker cp sprkz-playwright:/workspace/playwright-output/. ./playwright-output/ 2>/dev/null || echo "📝 No additional screenshots to copy from container"

# Display results
echo ""
echo "📊 Test Results Summary:"
echo "======================="

# Check if screenshots were created
if [ -d "playwright-output" ] && [ "$(ls -A playwright-output)" ]; then
    echo "✅ Screenshots captured in playwright-output/ directory:"
    ls -la playwright-output/
else
    echo "⚠️  No screenshots found in playwright-output/ directory"
fi

# Show container logs if there were errors
echo ""
echo "📋 Container logs (last 20 lines):"
docker-compose -f docker-compose.playwright.yml logs --tail=20 playwright

# Cleanup option
echo ""
read -p "🧹 Would you like to stop the Playwright container? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose -f docker-compose.playwright.yml down
    echo "✅ Playwright container stopped"
else
    echo "📝 Playwright container is still running. Use 'docker-compose -f docker-compose.playwright.yml down' to stop it."
fi

echo ""
echo "🎉 Markup tools testing completed!"
echo "📁 Check the playwright-output/ directory for screenshots and results."