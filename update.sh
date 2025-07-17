#!/bin/bash

# Mile Safe - GitHub Update Script
# This script pulls the latest changes from GitHub and updates the running application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_DIR="/opt/milesafe"
BRANCH="${1:-main}"
BACKUP_DB="${2:-true}"

print_status "🔄 Starting Mile Safe update from GitHub..."
print_status "Branch: $BRANCH"
print_status "Backup database: $BACKUP_DB"

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR not found!"
    exit 1
fi

cd $APP_DIR

# Check if it's a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository! Please run the initial deployment first."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "There are uncommitted changes in the repository."
    print_warning "These will be stashed and can be recovered later."
    git stash push -m "Auto-stash before update $(date)"
fi

# Backup database if requested
if [ "$BACKUP_DB" = "true" ]; then
    print_status "Creating database backup before update..."
    if [ -f "./backup.sh" ]; then
        ./backup.sh
    else
        print_warning "Backup script not found, skipping database backup"
    fi
fi

# Fetch latest changes
print_status "Fetching latest changes from GitHub..."
git fetch origin

# Get current commit hash for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
print_status "Current commit: $CURRENT_COMMIT"

# Check if there are updates available
LATEST_COMMIT=$(git rev-parse origin/$BRANCH)
if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    print_status "✅ Already up to date!"
    exit 0
fi

print_status "New commit available: $LATEST_COMMIT"

# Pull latest changes
print_status "Pulling latest changes..."
git reset --hard origin/$BRANCH
git pull origin $BRANCH

# Check if package.json has changed in backend
if git diff --name-only $CURRENT_COMMIT HEAD | grep -q "backend/package.json"; then
    print_status "Backend dependencies changed, rebuilding containers..."
    docker-compose down
    docker-compose build --no-cache backend
else
    print_status "No dependency changes detected"
fi

# Update the application
print_status "Updating application containers..."
docker-compose down
docker-compose up -d --build

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Health check
print_status "Performing health check..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "✅ Health check passed!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_warning "Health check failed, attempt $RETRY_COUNT/$MAX_RETRIES"
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            sleep 10
        fi
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "❌ Health check failed after $MAX_RETRIES attempts!"
    print_error "Rolling back to previous version..."
    
    # Rollback
    git reset --hard $CURRENT_COMMIT
    docker-compose down
    docker-compose up -d --build
    
    print_error "Rollback completed. Please check the logs:"
    print_error "docker-compose logs -f"
    exit 1
fi

# Clean up old Docker images
print_status "Cleaning up old Docker images..."
docker image prune -f

# Show deployment info
print_status "✅ Update completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "Previous commit: $CURRENT_COMMIT"
echo "Current commit:  $LATEST_COMMIT"
echo "Branch: $BRANCH"
echo "Timestamp: $(date)"
echo ""
echo "🔗 Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- Check status: docker-compose ps"
echo "- View changes: git log --oneline $CURRENT_COMMIT..HEAD"
echo ""

# Optional: Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Mile Safe updated successfully to commit $LATEST_COMMIT\"}" \
        $SLACK_WEBHOOK_URL > /dev/null 2>&1 || true
fi

print_status "🎉 Mile Safe is now running the latest version!"
