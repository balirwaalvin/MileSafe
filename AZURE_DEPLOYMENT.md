# Azure Deployment Guide for Mile Safe

## Prerequisites
1. Azure account (free tier available)
2. GitHub repository with your code
3. Azure CLI (optional, for advanced setup)

## Step 1: Create Azure App Service (Web App)

**Important:** Choose **"Web App"** NOT "Static Web App" because Mile Safe has a Node.js backend server.

### Option A: Using Azure Portal (Recommended)
1. **Go to [Azure Portal](https://portal.azure.com)**
2. **Click "Create a resource"**
3. **Search for "App Service" and click "Create"** 
   - ⚠️ **Make sure you select "App Service" (Web App), NOT "Static Web App"**
4. **Fill in the details:**
   - **Subscription:** Your Azure subscription
   - **Resource Group:** Create new "milesafe-rg"
   - **Name:** `milesafe-app` (must be globally unique)
   - **Publish:** **Code** (not Docker Container)
   - **Runtime stack:** **Node 20 LTS** (recommended) or **Node 22 LTS**
   - **Operating System:** **Linux**
   - **Region:** East US (or closest to you)
   - **Pricing tier:** **F1 (Free)** for testing, **B1 (Basic)** for production

5. **Click "Review + Create"**

### Option B: Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name milesafe-rg --location eastus

# Create App Service plan
az appservice plan create --name milesafe-plan --resource-group milesafe-rg --sku F1 --is-linux

# Create web app
az webapp create --resource-group milesafe-rg --plan milesafe-plan --name milesafe-app --runtime "NODE|20-lts"
```

## Step 2: Configure Environment Variables

In Azure Portal:
1. **Go to your App Service**
2. **Click "Configuration" in the left menu**
3. **Click "New application setting"** and add:

```
NODE_ENV=production
PORT=8080
JWT_SECRET=MileSafe2024SuperSecureJWTSecretKeyForProduction32Chars
DB_HOST=your-database-host
DB_USER=milesafe_user
DB_PASS=MileSafe2024!SecurePassword
DB_NAME=milesafe
DB_PORT=3306
WEBSITE_NODE_DEFAULT_VERSION=20.17.0
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

## Step 3: Set up GitHub Actions Deployment

1. **In Azure Portal, go to your App Service**
2. **Click "Deployment Center"**
3. **Choose "GitHub" as source**
4. **Authorize Azure to access your GitHub**
5. **Select your repository: `balirwaalvin/MileSafe`**
6. **Select branch: `main`**
7. **Azure will automatically create GitHub Actions workflow**

OR manually add these secrets to your GitHub repository:

### GitHub Secrets to Add:
1. **Go to your GitHub repository**
2. **Click Settings > Secrets and variables > Actions**
3. **Add these secrets:**

```
AZURE_APP_NAME=milesafe-app
AZURE_APP_URL=https://milesafe-app.azurewebsites.net
AZURE_PUBLISH_PROFILE=[Download from Azure Portal]
```

To get the publish profile:
1. **In Azure Portal, go to your App Service**
2. **Click "Get publish profile" at the top**
3. **Copy the entire XML content**
4. **Add it as `AZURE_PUBLISH_PROFILE` secret in GitHub**

## Step 4: Database Setup (Choose One Option)

Your app is currently running in **mock mode** (no database). Choose one of these options to add persistent data storage:

### **Option A: Azure Database for MySQL - Recommended with Student Credits** ⭐

**Why Azure Database for MySQL?**
- ✅ **Student credits cover the cost** - Free with your Azure for Students
- ✅ **Fully integrated** with your App Service
- ✅ **High performance** and reliability
- ✅ **Automatic backups** and security
- ✅ **No external dependencies**

**Setup Steps:**

1. **Create MySQL Flexible Server in Azure Portal:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource"
   - Search for "Azure Database for MySQL flexible server"
   - Click "Create"

2. **Configure the database server:**
   ```
   Subscription: Your student subscription
   Resource Group: milesafe-rg (same as your app)
   Server name: milesafe-mysql (must be globally unique)
   Region: East US (same as your app service)
   MySQL version: 8.0
   Workload type: Development (cheapest option)
   Compute + Storage: Burstable, B1ms (1 vCore, 2GB RAM)
   Admin username: milesafe_admin
   Password: [Create strong password - save this!]
   ```

3. **Configure networking:**
   - **Connectivity method:** Public access (selected IP addresses)
   - **Firewall rules:** 
     - ✅ Add current client IP address
     - ✅ Allow public access from any Azure service within Azure

4. **Click "Review + Create" then "Create"**
   - This will take 5-10 minutes to deploy

5. **Create the database:**
   - Once deployed, go to your MySQL server
   - Click "Databases" in the left menu
   - Click "+ Add" 
   - Database name: `milesafe`
   - Click "Save"

6. **Create the users table:**
   - In Azure Portal, go to your MySQL server
   - Click "Connect" in the left menu
   - Use Azure Cloud Shell or connect with MySQL Workbench
   - Run this SQL:
   ```sql
   USE milesafe;
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     username VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role ENUM('user', 'admin') DEFAULT 'user',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

7. **Update Azure App Service environment variables:**
   - Go to your App Service → Configuration
   - Update these settings:
   ```
   DB_HOST=milesafe-mysql.mysql.database.azure.com
   DB_USER=milesafe_admin
   DB_PASS=[Your MySQL password]
   DB_NAME=milesafe
   DB_PORT=3306
   ENABLE_DATABASE=true
   ENABLE_MOCK_MODE=false
   ```
   - Click "Save" and restart your app

### **Option B: PlanetScale (MySQL) - Free Tier Limited** 

Note: PlanetScale now requires payment for some features, but has a limited free tier.

**Setup Steps:**
1. **Go to [PlanetScale](https://planetscale.com) and sign up**
2. **Create a new database** (limited free tier available)
3. **Get connection details and create users table**
4. **Update Azure environment variables**

### **Option C: Supabase (PostgreSQL) - Free Alternative**

**Setup Steps:**
1. **Go to [Supabase](https://supabase.com) and sign up**
2. **Create new project:**
   - Name: `mile-safe`
   - Database password: Create strong password
   - Region: Choose closest to Azure

3. **Create users table:**
   - Go to SQL Editor
   - Run this SQL:
   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role VARCHAR(50) DEFAULT 'user',
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Get connection details:**
   - Go to Settings → Database
   - Copy connection details

5. **Update your backend code** (you'll need to modify db.js for PostgreSQL):
   ```javascript
   // Install: npm install pg
   const { Pool } = require('pg');
   
   const pool = new Pool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASS,
     database: process.env.DB_NAME,
     port: process.env.DB_PORT || 5432,
     ssl: { rejectUnauthorized: false }
   });
   ```

## **Database Connection Test**

After setting up any database option:

1. **Check your app's health endpoint:**
   - Visit: `https://your-app-name.azurewebsites.net/health`
   - Should show database connection status

2. **Test authentication:**
   - Try registering a new user
   - Try logging in
   - Check Azure logs for any errors

3. **Monitor logs:**
   - Azure Portal → Your App Service → Log stream
   - Look for "Database connected successfully" message

## **If You Get Database Errors:**

1. **Check environment variables are saved**
2. **Restart your App Service** (very important!)
3. **Check firewall settings** (for Azure Database)
4. **Verify connection string format**

**Most Common Issue:** Forgetting to restart the App Service after updating environment variables!

---

## Step 5: Custom Domain (Optional)

1. **In Azure Portal, go to your App Service**
2. **Click "Custom domains"**
3. **Click "Add custom domain"**
4. **Follow the DNS configuration steps**

## ⚡ Quick Decision Guide: Web App vs Static Web App

### **Choose Web App (App Service)** ✅ - **This is what you need!**
**For applications with:**
- ✅ Backend server (Node.js, Python, .NET, etc.)
- ✅ API endpoints
- ✅ Database connections
- ✅ Server-side authentication
- ✅ File uploads
- ✅ Real-time features

**Mile Safe uses:** Node.js server, API routes, authentication, SOS alerts → **Web App**

### **Static Web App** ❌ - **Not for Mile Safe**
**For applications with:**
- ❌ Frontend only (React, Vue, Angular SPA)
- ❌ No backend server
- ❌ Only static HTML/CSS/JS files
- ❌ Serverless functions only (Azure Functions)

**Examples:** Portfolio sites, documentation, simple landing pages

---

## Deployment Commands

After setting up, deployment is automatic on every push to main branch.

Manual deployment:
```bash
# If you have Azure CLI configured
az webapp deploy --resource-group milesafe-rg --name milesafe-app --src-path .
```

## Monitoring and Logs

1. **Application Insights:** Enable for monitoring
2. **Log Stream:** View real-time logs in Azure Portal
3. **Metrics:** Monitor performance and usage

## Troubleshooting

### Common Issues:

1. **"Application Error"**
   - Check Application Logs in Azure Portal
   - Verify environment variables are set correctly
   - Ensure Node.js version matches (20.x or 22.x)

2. **Static files not loading**
   - Verify web.config is properly configured
   - Check file paths in server.js

3. **Database connection issues**
   - Verify database credentials in environment variables
   - Check firewall rules for Azure Database

### Useful URLs:
- **App URL:** `https://your-app-name.azurewebsites.net`
- **Health Check:** `https://your-app-name.azurewebsites.net/health`
- **Logs:** Azure Portal > Your App Service > Log stream

## Cost Optimization

- **Free Tier:** F1 (60 CPU minutes/day)
- **Basic Tier:** B1 ($13.14/month, always on)
- **Standard Tier:** S1 ($74.40/month, auto-scaling)

For development/testing, F1 is sufficient.
For production, use at least B1 tier.

## Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Verify health check works
3. ✅ Set up monitoring alerts
4. ✅ Configure custom domain (if needed)
5. ✅ Set up database (if using one)
6. ✅ Enable Application Insights for monitoring
