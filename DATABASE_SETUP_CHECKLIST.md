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
- [ ] **For EACH variable below, click "New application setting":**

**Create these 6 NEW application settings:**

1. **Name:** `DB_HOST` **Value:** `db.vfhsehzppysycxmrwpdx.supabase.co`
2. **Name:** `DB_USER` **Value:** `postgres`  
3. **Name:** `DB_PASS` **Value:** `Balirwa@123`
4. **Name:** `DB_NAME` **Value:** `postgres`
5. **Name:** `DB_PORT` **Value:** `5432`
6. **Name:** `ENABLE_DATABASE` **Value:** `true`
7. **Name:** `ENABLE_MOCK_MODE` **Value:** `false`

- [ ] Click "Save" after adding ALL variables
- [ ] **IMPORTANT:** Click "Restart" to restart your app

### Step 6: Test Database Connection
- [ ] Wait 2-3 minutes for app to restart
- [ ] Visit: `https://your-app-name.azurewebsites.net/health`
- [ ] Should show: `"PostgreSQL/Supabase connected successfully"`
- [ ] Check Azure logs: App Service → Log stream

## ✅ **Your Supabase Connection Details**

Based on your connection string, use these **exact values** in Azure App Service:

```
DB_HOST = db.vfhsehzppysycxmrwpdx.supabase.co
DB_USER = postgres
DB_PASS = Balirwa@123
DB_NAME = postgres
DB_PORT = 5432
ENABLE_DATABASE = true
ENABLE_MOCK_MODE = false
```

## 📋 **Complete Environment Variables for Azure**

Go to Azure Portal → Your App Service → Configuration → Application settings:

```
✅ NODE_ENV = production
✅ PORT = 8080
✅ WEBSITE_NODE_DEFAULT_VERSION = 20.17.0
✅ SCM_DO_BUILD_DURING_DEPLOYMENT = true
✅ JWT_SECRET = MileSafe2024SuperSecureJWTSecretKeyForProduction32Chars

✅ DB_HOST = db.vfhsehzppysycxmrwpdx.supabase.co
✅ DB_USER = postgres
✅ DB_PASS = Balirwa@123
✅ DB_NAME = postgres
✅ DB_PORT = 5432
✅ ENABLE_DATABASE = true
✅ ENABLE_MOCK_MODE = false
```

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
