# Mile Safe - GitHub Deployment Setup Guide

This guide will help you set up your Mile Safe application for deployment from GitHub to DigitalOcean.

## Step 1: Prepare Your GitHub Repository

### 1.1 Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon and select "New repository"
3. Name your repository (e.g., "mile-safe")
4. Choose visibility (Public or Private)
5. Initialize with README if desired
6. Click "Create repository"

### 1.2 Push Your Local Code to GitHub

From your local Mile Safe directory:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Mile Safe application"

# Add GitHub repository as remote
git remote add origin https://github.com/yourusername/mile-safe.git

# Set main branch and push
git branch -M main
git push -u origin main
```

### 1.3 Verify Repository Structure

Your GitHub repository should now contain:

```
├── .github/
│   └── workflows/
│       └── deploy.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── ...
├── database/
│   └── init.sql
├── images/
├── docker-compose.yml
├── nginx.conf
├── deploy.sh
├── update.sh
├── .env.production
├── .gitignore
├── DEPLOYMENT.md
├── PRODUCTION_CHECKLIST.md
├── index.html
├── style.css
├── script.js
└── ... (other frontend files)
```

## Step 2: Configure GitHub Actions (Optional but Recommended)

### 2.1 Set up Deployment Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** > **Actions**
4. Click **New repository secret** and add the following:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DO_HOST` | Your DigitalOcean droplet IP | `192.168.1.100` |
| `DO_USERNAME` | SSH username | `root` or `deploy` |
| `DO_SSH_KEY` | Your private SSH key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DO_PORT` | SSH port (optional) | `22` |

### 2.2 Generate SSH Key (if needed)

If you don't have an SSH key pair:

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key to your DigitalOcean droplet
ssh-copy-id root@your_droplet_ip

# Copy private key content for GitHub secret
cat ~/.ssh/id_rsa
```

## Step 3: Deploy to DigitalOcean

### 3.1 Create DigitalOcean Droplet

1. Log into DigitalOcean
2. Create new droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic plan, 2GB RAM minimum
   - **Authentication**: SSH keys (upload your public key)

### 3.2 Manual Deployment Method

Connect to your droplet and run:

```bash
# Connect to your droplet
ssh root@your_droplet_ip

# Download and run deployment script
wget https://raw.githubusercontent.com/yourusername/mile-safe/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

When prompted, enter your repository details:
- **GitHub Repository URL**: `https://github.com/yourusername/mile-safe.git`
- **Branch**: `main`

### 3.3 Automated Deployment Method

If you set up GitHub Actions:

1. Push changes to the `main` branch
2. GitHub Actions will automatically deploy to your DigitalOcean droplet
3. Monitor the deployment in the "Actions" tab of your repository

## Step 4: Configure Environment Variables

On your DigitalOcean server:

```bash
# Navigate to application directory
cd /opt/milesafe

# Copy production environment template
cp .env.production .env

# Edit environment variables
nano .env
```

Update these critical values:
```env
DB_PASS=your_secure_database_password
JWT_SECRET=your_very_secure_jwt_secret_32_characters_minimum
```

## Step 5: Start the Application

```bash
# Restart services with new environment
docker-compose down
docker-compose up -d

# Check if everything is running
docker-compose ps
```

## Step 6: Set up Domain and SSL (Optional)

### 6.1 Configure DNS

Point your domain's A record to your droplet's IP address.

### 6.2 Set up SSL Certificate

```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Updating Your Application

### Method 1: Using the Update Script
```bash
cd /opt/milesafe
./update.sh
```

### Method 2: Manual Git Pull
```bash
cd /opt/milesafe
git pull origin main
docker-compose up -d --build
```

### Method 3: Automatic via GitHub Actions
Simply push changes to the `main` branch, and GitHub Actions will deploy automatically.

## Monitoring and Maintenance

### Check Application Status
```bash
# Service status
docker-compose ps

# View logs
docker-compose logs -f

# System resources
htop
df -h
```

### Backup Database
```bash
./backup.sh
```

### View Recent Changes
```bash
git log --oneline -10
```

## Troubleshooting

### Common Issues

1. **GitHub clone fails**
   - Check repository URL
   - Verify SSH key access for private repositories
   - Ensure git is installed on the server

2. **Deployment script can't find repository**
   - Verify the repository URL is correct
   - Check internet connectivity on the droplet
   - Ensure the repository is accessible (public or proper SSH keys)

3. **GitHub Actions deployment fails**
   - Check GitHub secrets are correctly set
   - Verify SSH key has access to the droplet
   - Check droplet firewall settings

4. **Services won't start after update**
   - Check docker-compose logs: `docker-compose logs -f`
   - Verify environment variables: `cat .env`
   - Check disk space: `df -h`

### Emergency Rollback

If deployment fails:

```bash
# Check recent commits
git log --oneline -5

# Rollback to previous commit
git reset --hard <previous-commit-hash>
docker-compose down
docker-compose up -d --build
```

## Security Best Practices

1. **Never commit sensitive data**
   - Use `.env` files for secrets
   - Keep `.env` in `.gitignore`
   - Use GitHub secrets for CI/CD

2. **Secure your server**
   - Disable root login (create a deploy user)
   - Use SSH keys instead of passwords
   - Keep server updated: `sudo apt update && sudo apt upgrade`

3. **Monitor access**
   - Check SSH logs: `sudo tail -f /var/log/auth.log`
   - Monitor failed login attempts
   - Use tools like fail2ban

## Support

- **GitHub Repository**: https://github.com/yourusername/mile-safe
- **DigitalOcean Documentation**: https://docs.digitalocean.com/
- **Docker Documentation**: https://docs.docker.com/
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
