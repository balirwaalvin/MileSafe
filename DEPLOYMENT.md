# Mile Safe - DigitalOcean Deployment Guide

This guide will help you deploy the Mile Safe application to DigitalOcean.

## Prerequisites

- DigitalOcean account
- GitHub account with your Mile Safe repository
- Domain name (optional but recommended)
- Basic knowledge of Linux/Ubuntu
- SSH key configured in your GitHub account (for private repositories)

## Quick Deployment

### 1. Push Your Code to GitHub

First, create a repository on GitHub and push your code:

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit - Mile Safe application"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/mile-safe.git
git branch -M main
git push -u origin main
```

### 2. Create a DigitalOcean Droplet

1. Log into your DigitalOcean account
2. Create a new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month minimum recommended)
   - **CPU**: 2 vCPUs, 2GB RAM, 50GB SSD
   - **Datacenter**: Choose closest to your users
   - **SSH Keys**: Add your SSH key for secure access

### 2. Create a DigitalOcean Droplet

1. Log into your DigitalOcean account
2. Create a new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month minimum recommended)
   - **CPU**: 2 vCPUs, 2GB RAM, 50GB SSD
   - **Datacenter**: Choose closest to your users
   - **SSH Keys**: Add your SSH key for secure access

### 3. Connect to Your Server

```bash
ssh root@your_server_ip
```

### 4. Run the Deployment Script

The deployment script will automatically clone your repository from GitHub:

```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/yourusername/mile-safe/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

When prompted, enter your GitHub repository URL:
```
GitHub Repository URL: https://github.com/yourusername/mile-safe.git
Branch name (default: main): main
```

### 5. Configure Environment Variables

Edit the production environment file:
```bash
nano .env
```

Update these critical values:
```env
# Database Configuration
DB_PASS=your_very_secure_database_password
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
```

### 6. Restart Services

```bash
docker-compose down
docker-compose up -d
```

### 7. Set Up SSL (Optional but Recommended)

If you have a domain name:
```bash
# Point your domain DNS to your server IP first
sudo certbot --nginx -d yourdomain.com
```

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Set Up Application

```bash
# Create app directory
mkdir -p /opt/milesafe
cd /opt/milesafe

# Copy your files here
# Configure environment variables
cp .env.production .env
nano .env
```

### 3. Start Services

```bash
docker-compose up -d
```

## Application Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│     Nginx       │────│   Backend API   │────│    MySQL DB     │
│  (Port 80/443)  │    │   (Port 3000)   │    │   (Port 3306)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Configuration Files

- `docker-compose.yml` - Container orchestration
- `nginx.conf` - Web server configuration
- `.env` - Environment variables
- `database/init.sql` - Database schema
- `backend/Dockerfile` - Backend container definition

## Monitoring and Maintenance

### Check Service Status
```bash
docker-compose ps
docker-compose logs -f
```

### View Application Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Update Application
```bash
./update.sh
# Or specify a different branch
./update.sh develop
# Or update manually
git pull origin main && docker-compose up -d --build
```

### Backup Database
```bash
./backup.sh
```

### Monitor Resources
```bash
htop
df -h
docker stats
```

## Automated Deployments with GitHub Actions

This setup includes GitHub Actions for automated deployments. To enable:

### 1. Set up GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, then add:

- `DO_HOST`: Your DigitalOcean droplet IP address
- `DO_USERNAME`: SSH username (usually 'root' or your created user)
- `DO_SSH_KEY`: Your private SSH key content
- `DO_PORT`: SSH port (usually 22)

### 2. Enable GitHub Actions

The workflow file `.github/workflows/deploy.yml` will automatically:
- Run tests on every push
- Build Docker images
- Deploy to your DigitalOcean server
- Perform health checks
- Notify on success/failure

### 3. Trigger Deployments

Deployments are triggered by:
- Pushing to `main` branch (automatic)
- Pushing to `production` branch (automatic)
- Manual trigger from GitHub Actions tab

## Repository Structure for GitHub

Your GitHub repository should include:

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── backend/
│   ├── Dockerfile             # Backend container
│   ├── package.json
│   └── ... (backend files)
├── database/
│   └── init.sql              # Database schema
├── docker-compose.yml        # Container orchestration
├── nginx.conf               # Web server config
├── deploy.sh               # Deployment script
├── update.sh              # Update script
├── .env.production       # Production environment template
├── .gitignore           # Git ignore rules
└── ... (frontend files)
```

### Monitor Resources
```bash
htop
df -h
docker stats
```

## Security Considerations

1. **Change Default Passwords**: Update all passwords in `.env`
2. **Enable Firewall**: UFW is configured automatically
3. **SSL Certificates**: Use Certbot for HTTPS
4. **Regular Updates**: Keep system and containers updated
5. **Database Security**: Use strong passwords and limit access
6. **Monitoring**: Set up log monitoring and alerts

## Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   docker-compose logs
   ```

2. **Database connection errors**
   - Check database credentials in `.env`
   - Ensure database container is running
   - Check network connectivity

3. **Frontend not loading**
   - Check Nginx configuration
   - Verify file permissions
   - Check browser console for errors

4. **SSL issues**
   - Ensure domain DNS is pointing to server
   - Check Certbot logs: `sudo certbot certificates`

### Getting Help

- Check application logs: `docker-compose logs -f`
- Monitor system resources: `htop`, `df -h`
- Test API endpoints: `curl http://localhost:3000/health`
- Database access: `docker exec -it milesafe-database mysql -u root -p`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database hostname | `milesafe-database` |
| `DB_USER` | Database username | `milesafe_user` |
| `DB_PASS` | Database password | `secure_password_123` |
| `DB_NAME` | Database name | `milesafe` |
| `DB_PORT` | Database port | `3306` |
| `JWT_SECRET` | JWT signing secret | `your_32_char_secret` |
| `PORT` | Backend port | `3000` |
| `NODE_ENV` | Environment | `production` |

## Cost Estimation

### DigitalOcean Droplet Costs (Monthly)
- Basic: $12/month (2GB RAM, 50GB SSD)
- Standard: $24/month (4GB RAM, 80GB SSD)
- Premium: $48/month (8GB RAM, 160GB SSD)

### Additional Services (Optional)
- Managed Database: $15/month
- Load Balancer: $12/month
- Backup: $1/month per 20GB

## Support

For deployment issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Consult DigitalOcean documentation
4. Contact your development team
