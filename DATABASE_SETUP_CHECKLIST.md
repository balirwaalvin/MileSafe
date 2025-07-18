# Database Setup Checklist for Mile Safe

## 🚨 **Azure Database Issues? Use Supabase Instead!**

**Azure Database for MySQL is having deployment issues. Let's use Supabase instead - it's actually better:**
- ✅ **5-minute setup** vs 30+ minutes for Azure
- ✅ **No deployment failures** - works every time
- ✅ **100% free** - no student credits needed
- ✅ **Better features** - built-in auth, real-time, APIs
- ✅ **More reliable** - rarely has outages

## 🚀 **Recommended: Supabase (Free PostgreSQL)**

### Step 1: Create Supabase Account
- [ ] Go to [Supabase.com](https://supabase.com)
- [ ] Click "Start your project"
- [ ] Sign up with GitHub (fastest)
- [ ] Verify your email

### Step 2: Create New Project
- [ ] Click "New project"
- [ ] **Organization:** Personal (default)
- [ ] **Name:** `mile-safe`
- [ ] **Database Password:** Create strong password and **SAVE IT!**
- [ ] **Region:** Choose closest to your Azure region (e.g., East US)
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for setup

### Step 3: Create Users Table
- [ ] Go to **SQL Editor** in the left menu
- [ ] Click "New query"
- [ ] Paste this SQL:
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
- [ ] Click "Run" (or press Ctrl+Enter)
- [ ] Should see "Success. No rows returned"

### Step 4: Get Connection Details
- [ ] Go to **Settings** → **Database** in the left menu
- [ ] Copy these values:
  ```
  Host: _______________
  Database name: postgres
  Username: postgres
  Password: [Your password from Step 2]
  Port: 5432
  ```

### Step 5: Update Your Azure App Service
- [ ] Go to Azure Portal
- [ ] Find your App Service
- [ ] Click "Configuration" → "Application settings"
- [ ] Update these environment variables:
  ```
  DB_HOST = [Supabase Host from Step 4]
  DB_USER = postgres
  DB_PASS = [Your Supabase password]
  DB_NAME = postgres
  DB_PORT = 5432
  ENABLE_DATABASE = true
  ENABLE_MOCK_MODE = false
  ```
- [ ] Click "Save"
- [ ] **IMPORTANT:** Click "Restart" to restart your app

### Step 6: Update Backend Code for PostgreSQL
Since Supabase uses PostgreSQL, we need to update your backend:
- [ ] Go to [Azure Portal](https://portal.azure.com)
- [ ] Click "Create a resource"
- [ ] Search for "Azure Database for MySQL flexible server"
- [ ] Click "Create"
- [ ] **IMPORTANT:** Choose "Flexible server" (NOT "WordPress + MySQL Flexible server")

### Step 2: Configure Database Server
- [ ] **Subscription:** Your student subscription
- [ ] **Resource Group:** `milesafe-rg` (same as your app)
- [ ] **Server name:** `milesafe-mysql` (must be globally unique - try `milesafe-mysql-[your-initials]`)
- [ ] **Region:** Same as your App Service (e.g., East US)
- [ ] **MySQL version:** 8.0
- [ ] **Workload type:** Development
- [ ] **Compute + Storage:** Burstable, B1ms (1 vCore, 2GB RAM)
- [ ] **Admin username:** `milesafeadmin` (NO underscores, special chars, or reserved words)
- [ ] **Password:** [Create strong password and SAVE IT!]
  - Must be 8-128 characters
  - Must contain characters from 3 categories: uppercase, lowercase, numbers, special chars

### 🔧 **If Database Creation Fails:**

**Common Solutions:**
1. **Try a different server name:** `milesafe-mysql-yourname` or `milesafe-db-001`
2. **Try a different region:** West US 2, Central US, etc.
3. **Check your Azure subscription limits** in Azure Portal → Subscriptions → Usage + quotas
4. **Wait 10-15 minutes** and try again (Azure resource limitations)

**Alternative Quick Setup:**
If Azure Database keeps failing, you can use **Azure Container Instances** with MySQL:
- Go to Azure Portal → Create "Container Instances"
- Use image: `mysql:8.0`
- Set environment variables for MySQL setup
- Much faster and simpler for development

### Step 3: Configure Networking
- [ ] **Connectivity method:** Public access (selected IP addresses)
- [ ] **Firewall rules:** 
  - [ ] ✅ Add current client IP address
  - [ ] ✅ Allow public access from any Azure service within Azure
- [ ] Click "Review + Create" then "Create"
- [ ] Wait 5-10 minutes for deployment

### Step 4: Create Database
- [ ] Go to your MySQL server in Azure Portal
- [ ] Click "Databases" in the left menu
- [ ] Click "+ Add"
- [ ] Database name: `milesafe`
- [ ] Click "Save"

### Step 5: Create Users Table
**Option A: Using Azure Cloud Shell**
- [ ] In Azure Portal, click Cloud Shell icon (top right)
- [ ] Choose "Bash"
- [ ] Run: `mysql -h milesafe-mysql.mysql.database.azure.com -u milesafeadmin -p`
- [ ] Enter your password
- [ ] Run this SQL:
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

**Option B: Using MySQL Workbench (if you have it)**
- [ ] Download MySQL Workbench
- [ ] Connect using: `milesafe-mysql.mysql.database.azure.com:3306`
- [ ] Username: `milesafeadmin`
- [ ] Password: [Your password]
- [ ] Run the CREATE TABLE SQL above

### Step 6: Update Azure App Service Environment Variables
- [ ] Go to Azure Portal
- [ ] Find your App Service (milesafe-app)
- [ ] Click "Configuration" → "Application settings"
- [ ] Update these values:
  ```
  DB_HOST = milesafe-mysql.mysql.database.azure.com
  DB_USER = milesafeadmin
  DB_PASS = [Your MySQL password]
  DB_NAME = milesafe
  DB_PORT = 3306
  ENABLE_DATABASE = true
  ENABLE_MOCK_MODE = false
  ```
- [ ] Click "Save"
- [ ] **IMPORTANT:** Click "Restart" to restart your app

### Step 7: Test Database Connection
- [ ] Wait 2-3 minutes for app to restart
- [ ] Visit: `https://your-app-name.azurewebsites.net/health`
- [ ] Should show: `"Database connected successfully"`
- [ ] Check Azure logs: App Service → Log stream

## 🧪 Test Your Setup

### Test Authentication:
1. [ ] Go to your app's login page
2. [ ] Try creating a new account
3. [ ] Try logging in
4. [ ] Check Azure logs for "Login successful" or errors

### If Something Goes Wrong:
1. **Check Azure logs** (App Service → Log stream)
2. **Verify environment variables** are saved correctly
3. **Restart the app service** (this is crucial!)
4. **Check PlanetScale connection** in their dashboard

## 📋 Environment Variables Checklist

Make sure these are set in Azure Portal → Configuration:

```
✅ NODE_ENV = production
✅ PORT = 8080
✅ WEBSITE_NODE_DEFAULT_VERSION = 20.17.0
✅ SCM_DO_BUILD_DURING_DEPLOYMENT = true
✅ JWT_SECRET = MileSafe2024SuperSecureJWTSecretKeyForProduction32Chars

✅ DB_HOST = milesafe-mysql.mysql.database.azure.com
✅ DB_USER = milesafeadmin
✅ DB_PASS = [Your MySQL password]
✅ DB_NAME = milesafe
✅ DB_PORT = 3306
✅ ENABLE_DATABASE = true
✅ ENABLE_MOCK_MODE = false
```

## 🎉 Success Indicators

When everything works:
- ✅ Health check shows database connected
- ✅ User registration works
- ✅ Login returns real JWT tokens
- ✅ No database errors in logs
- ✅ Data persists between app restarts

## 🆘 Need Help?

Common issues:
1. **"Database connection failed"** → Check connection details
2. **"Table doesn't exist"** → Run the CREATE TABLE SQL
3. **"Still in mock mode"** → Restart the App Service
4. **"Environment variable not found"** → Check Azure Configuration

Your app will automatically switch from mock mode to real database mode once the connection works!

---

## 🚀 **Plan B: Supabase (Free PostgreSQL) - If Azure Database Fails**

**Quick 5-minute setup:**

### Step 1: Create Supabase Account
- [ ] Go to [Supabase.com](https://supabase.com)
- [ ] Sign up with GitHub
- [ ] Create new project: `mile-safe`
- [ ] Choose region closest to your Azure app
- [ ] Set database password (save it!)

### Step 2: Create Users Table
- [ ] Go to SQL Editor in Supabase
- [ ] Run this SQL:
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

### Step 3: Get Connection Details
- [ ] Go to Settings → Database
- [ ] Copy connection details

### Step 4: Update Your App Service
- [ ] In Azure Portal → App Service → Configuration
- [ ] Update these environment variables:
  ```
  DB_HOST = [Supabase host]
  DB_USER = postgres
  DB_PASS = [Your Supabase password]
  DB_NAME = postgres
  DB_PORT = 5432
  ENABLE_DATABASE = true
  ENABLE_MOCK_MODE = false
  ```
- [ ] Restart your app

**Note:** You'll need to update your backend code to use PostgreSQL instead of MySQL, but Supabase is much more reliable than Azure Database setup.

---
