# Azure Deployment Guide for Mile Safe

## Prerequisites
1. Azure account (free tier available)
2. GitHub repository with your code
3. Azure CLI (optional, for advanced setup)

## Step 1: Create Azure App Service

### Option A: Using Azure Portal (Recommended)
1. **Go to [Azure Portal](https://portal.azure.com)**
2. **Click "Create a resource"**
3. **Search for "App Service" and click "Create"**
4. **Fill in the details:**
   - **Subscription:** Your Azure subscription
   - **Resource Group:** Create new "milesafe-rg"
   - **Name:** `milesafe-app` (must be globally unique)
   - **Publish:** Code
   - **Runtime stack:** Node 18 LTS
   - **Operating System:** Linux
   - **Region:** East US (or closest to you)
   - **Pricing tier:** F1 (Free) for testing, B1 (Basic) for production

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
az webapp create --resource-group milesafe-rg --plan milesafe-plan --name milesafe-app --runtime "NODE|18-lts"
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
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
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

## Step 4: Database Setup (Optional)

### Option A: Azure Database for MySQL
```bash
# Create MySQL server
az mysql server create --resource-group milesafe-rg --name milesafe-db --admin-user milesafe_admin --admin-password YourPassword123! --sku-name B_Gen5_1
```

### Option B: Use external database service
- **PlanetScale** (recommended for MySQL)
- **Supabase** (PostgreSQL)
- **MongoDB Atlas**

## Step 5: Custom Domain (Optional)

1. **In Azure Portal, go to your App Service**
2. **Click "Custom domains"**
3. **Click "Add custom domain"**
4. **Follow the DNS configuration steps**

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
   - Ensure Node.js version matches (18.x)

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
