#!/bin/bash
# ============================================
# Apex AI - Auto Deploy Script
# Checks GitHub for new commits and rebuilds
# ============================================

set -e

PROJECT_DIR="$HOME/apex-ai"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

cd "$PROJECT_DIR"

# Fetch latest from remote
git fetch origin main --quiet

# Check if there are new commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "$LOG_PREFIX No changes detected."
    exit 0
fi

echo "$LOG_PREFIX New changes detected! Deploying..."
echo "$LOG_PREFIX Local:  $LOCAL"
echo "$LOG_PREFIX Remote: $REMOTE"

# Pull latest changes
git pull origin main

# Check what changed to decide what to rebuild
CHANGED_FILES=$(git diff --name-only $LOCAL $REMOTE)

REBUILD_BACKEND=false
REBUILD_FRONTEND=false
REBUILD_NGINX=false

if echo "$CHANGED_FILES" | grep -q "^apex_backend/"; then
    REBUILD_BACKEND=true
fi

if echo "$CHANGED_FILES" | grep -q "^apex_frontend/"; then
    REBUILD_FRONTEND=true
fi

if echo "$CHANGED_FILES" | grep -q "^nginx/"; then
    REBUILD_NGINX=true
fi

if echo "$CHANGED_FILES" | grep -q "^docker-compose"; then
    REBUILD_BACKEND=true
    REBUILD_FRONTEND=true
    REBUILD_NGINX=true
fi

# Rebuild only changed services
if [ "$REBUILD_BACKEND" = true ] && [ "$REBUILD_FRONTEND" = true ]; then
    echo "$LOG_PREFIX Rebuilding all services..."
    docker compose up -d --build backend frontend nginx
elif [ "$REBUILD_BACKEND" = true ]; then
    echo "$LOG_PREFIX Rebuilding backend..."
    docker compose up -d --build backend
    docker compose restart nginx
elif [ "$REBUILD_FRONTEND" = true ]; then
    echo "$LOG_PREFIX Rebuilding frontend..."
    docker compose up -d --build frontend
    docker compose restart nginx
elif [ "$REBUILD_NGINX" = true ]; then
    echo "$LOG_PREFIX Restarting nginx..."
    docker compose restart nginx
else
    echo "$LOG_PREFIX No service-specific changes, skipping rebuild."
fi

# Cleanup old Docker images
docker image prune -f --filter "until=48h" 2>/dev/null || true

echo "$LOG_PREFIX Deploy complete!"
