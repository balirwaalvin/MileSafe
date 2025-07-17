#!/bin/bash

# Mile Safe - DigitalOcean Deployment Script
# This script automates the deployment process on a DigitalOcean droplet

set -e  # Exit on any error

echo "🚀 Starting Mile Safe deployment..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    print_status "Docker is already installed"
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    print_status "Docker Compose is already installed"
fi

# Install Nginx (as backup/reverse proxy)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
else
    print_status "Nginx is already installed"
fi

# Install Certbot for SSL certificates
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot for SSL certificates..."
    sudo apt-get install -y certbot python3-certbot-nginx
else
    print_status "Certbot is already installed"
fi

# GitHub repository configuration
GITHUB_REPO="https://github.com/yourusername/mile-safe.git"
GITHUB_BRANCH="main"
APP_DIR="/opt/milesafe"

# Prompt for GitHub repository URL if not set
if [ "$GITHUB_REPO" = "https://github.com/yourusername/mile-safe.git" ]; then
    print_warning "Please enter your GitHub repository URL:"
    read -p "GitHub Repository URL: " GITHUB_REPO
    read -p "Branch name (default: main): " GITHUB_BRANCH
    GITHUB_BRANCH=${GITHUB_BRANCH:-main}
fi

# Install Git if not already installed
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo apt-get install -y git
else
    print_status "Git is already installed"
fi

# Create application directory
print_status "Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone application from GitHub
print_status "Cloning application from GitHub repository..."
if [ -d "$APP_DIR/.git" ]; then
    print_status "Repository already exists, pulling latest changes..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$GITHUB_BRANCH
    git pull origin $GITHUB_BRANCH
else
    print_status "Cloning repository from $GITHUB_REPO..."
    git clone -b $GITHUB_BRANCH $GITHUB_REPO $APP_DIR
    cd $APP_DIR
fi

# Set up environment variables
if [ ! -f .env ]; then
    print_status "Setting up environment variables..."
    cp .env.production .env
    print_warning "Please edit .env file with your production values before continuing!"
    print_warning "Press Enter when you have updated the .env file..."
    read
fi

# Create necessary directories
mkdir -p logs ssl backup

# Set proper permissions
chmod 600 .env
chmod +x deploy.sh

# Build and start services
print_status "Building and starting Docker services..."
docker-compose down --remove-orphans || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "Services are running successfully!"
else
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend port for debugging (remove in production)

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
# Mile Safe Backup Script
BACKUP_DIR="/opt/milesafe/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec milesafe-database mysqldump -u root -p$DB_PASS milesafe > $BACKUP_DIR/database_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/milesafe --exclude=/opt/milesafe/backup

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Setup cron job for daily backups
print_status "Setting up daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/milesafe && ./backup.sh >> logs/backup.log 2>&1") | crontab -

# Final instructions
print_status "Deployment completed successfully! 🎉"
echo ""
echo "GitHub Repository: $GITHUB_REPO"
echo "Branch: $GITHUB_BRANCH"
echo ""
echo "Next steps:"
echo "1. Set up your domain DNS to point to this server's IP"
echo "2. Run SSL certificate setup: sudo certbot --nginx -d yourdomain.com"
echo "3. Update .env file with production database credentials"
echo "4. Monitor logs: docker-compose logs -f"
echo "5. Access your application at: http://$(curl -s ifconfig.me)"
echo ""
echo "Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- Restart services: docker-compose restart"
echo "- Update from GitHub: git pull origin $GITHUB_BRANCH && docker-compose up -d --build"
echo "- Backup database: ./backup.sh"
echo ""
print_warning "Remember to:"
print_warning "- Change default passwords in .env file"
print_warning "- Set up SSL certificates for HTTPS"
print_warning "- Configure monitoring and alerting"
print_warning "- Regular security updates"
print_warning "- Push any local changes to your GitHub repository"
