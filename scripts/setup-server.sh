#!/bin/bash
# ============================================
# Apex AI - First-Time Server Setup Script
# Run this on your Linux Mint laptop
# ============================================

set -e

echo "=========================================="
echo "  Apex AI - Server Setup (Linux Mint)"
echo "  Domain: apex.tabcrypt.in"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================
# Step 1: System Updates
# ============================================
echo -e "${YELLOW}[1/6] Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# ============================================
# Step 2: Install Docker
# ============================================
echo -e "${YELLOW}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed!${NC}"
else
    echo -e "${GREEN}Docker already installed.${NC}"
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    sudo apt install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed!${NC}"
else
    echo -e "${GREEN}Docker Compose already installed.${NC}"
fi

# ============================================
# Step 3: Install Git
# ============================================
echo -e "${YELLOW}[3/6] Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi
echo -e "${GREEN}Git ready.${NC}"

# ============================================
# Step 4: Clone Repository
# ============================================
echo -e "${YELLOW}[4/6] Setting up project...${NC}"
PROJECT_DIR="$HOME/apex-ai"

if [ ! -d "$PROJECT_DIR" ]; then
    git clone https://github.com/mehetab-01/apex-ai.git "$PROJECT_DIR"
    echo -e "${GREEN}Repository cloned!${NC}"
else
    echo -e "${GREEN}Repository already exists at $PROJECT_DIR${NC}"
    cd "$PROJECT_DIR"
    git pull origin main
fi

cd "$PROJECT_DIR"

# ============================================
# Step 5: Configure Environment Files
# ============================================
echo -e "${YELLOW}[5/6] Setting up environment files...${NC}"

# Root .env (for Cloudflare Tunnel token)
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${RED}IMPORTANT: Edit .env and add your CLOUDFLARE_TUNNEL_TOKEN${NC}"
    echo -e "  Run: nano $PROJECT_DIR/.env"
fi

# Backend .env.production
if [ ! -f apex_backend/.env.production ]; then
    cp apex_backend/.env.production.example apex_backend/.env.production
    
    # Generate a random Django secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || openssl rand -base64 50)
    sed -i "s|CHANGE-ME.*|$SECRET_KEY|" apex_backend/.env.production
    
    echo -e "${RED}IMPORTANT: Edit apex_backend/.env.production and add your API keys${NC}"
    echo -e "  Run: nano $PROJECT_DIR/apex_backend/.env.production"
fi

# ============================================
# Step 6: Setup auto-deploy cron job
# ============================================
echo -e "${YELLOW}[6/6] Setting up auto-deploy...${NC}"

# Make auto-deploy script executable
chmod +x scripts/auto-deploy.sh

# Add cron job to check for updates every 5 minutes
CRON_JOB="*/5 * * * * $PROJECT_DIR/scripts/auto-deploy.sh >> $PROJECT_DIR/logs/auto-deploy.log 2>&1"
(crontab -l 2>/dev/null | grep -v "auto-deploy.sh"; echo "$CRON_JOB") | crontab -
mkdir -p "$PROJECT_DIR/logs"

echo -e "${GREEN}Auto-deploy cron job set (every 5 minutes).${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Set up Cloudflare Tunnel (see DEPLOYMENT.md)"
echo "  2. Edit .env with your tunnel token"
echo "  3. Edit apex_backend/.env.production with API keys"
echo "  4. Run: cd $PROJECT_DIR && docker compose up -d --build"
echo ""
echo -e "${YELLOW}NOTE: If this is the first time installing Docker,${NC}"
echo -e "${YELLOW}log out and back in for docker group permissions.${NC}"
