# RedBus Clone MEAN Stack — Vercel Deployment Guide

This guide details how to host and deploy the RedBus Clone platform (Angular frontend + Express backend) on Vercel.

---

## ⚡ Deployment Options

### Option A: Separate Vercel Projects (Recommended)
Deploying the frontend and backend as two separate projects is the most common and robust approach on Vercel.

#### 📦 1. Deploy the Backend API
1. Import your repository on Vercel.
2. In the configuration step, set the **Root Directory** to `backend`.
3. Add the following **Environment Variables** in the Vercel dashboard:
   - `MONGODB_URI_SRV` = `mongodb+srv://kaushal21092003kumar_db_user:acDdd08uiqCqvuXX@redbus.4nr9bxo.mongodb.net/?appName=Redbus`
   - `MONGODB_URI` = `mongodb://kaushal21092003kumar_db_user:acDdd08uiqCqvuXX@ac-a1bjrel-shard-00-00.4nr9bxo.mongodb.net:27017,ac-a1bjrel-shard-00-01.4nr9bxo.mongodb.net:27017,ac-a1bjrel-shard-00-02.4nr9bxo.mongodb.net:27017/?ssl=true&replicaSet=atlas-8n9xjl-shard-0&authSource=admin&appName=Redbus`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `(your jwt secret phrase)`
   - `SMTP_USER` = `kaushal21092003kumar@gmail.com`
   - `SMTP_PASSWORD` = `vspo kgsa pnhw ydtm`
   - `CORS_ORIGIN` = `*` (or your frontend deployment domain URL)
4. Click **Deploy**. Vercel will build the backend using `backend/vercel.json` and generate a backend URL (e.g. `https://redbus-backend.vercel.app`).

#### 🎨 2. Configure & Deploy the Frontend
1. Open the [frontend/vercel.json](file:///a:/newNullClass/REDBUS-CLONE-MEAN/frontend/vercel.json) file.
2. Update the `destination` property in the rewrites to point to your new backend API URL:
   ```json
   {
     "version": 2,
     "cleanUrls": true,
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://<your-backend-api-url>.vercel.app/api/:path*"
       },
       {
         "source": "/health",
         "destination": "https://<your-backend-api-url>.vercel.app/health"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Import your repository on Vercel as a second project.
4. Set the **Root Directory** to `frontend`.
5. Set the Framework Preset to **Angular**. Vercel will automatically configure the build command as `npm run build` and output directory as `dist/frontend`.
6. Click **Deploy**.

---

### Option B: Single Vercel Project (Monorepo)
You can deploy both frontend and backend as a single Vercel project using a root configuration.

1. Add a [vercel.json](file:///a:/newNullClass/REDBUS-CLONE-MEAN/vercel.json) in the root directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist/frontend"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/index.js"
       },
       {
         "src": "/health",
         "dest": "backend/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "frontend/$1"
       }
     ]
   }
   ```
2. Import the root repository on Vercel.
3. Configure the backend Environment Variables in the project settings.
4. Click **Deploy**.

---

## 🛠️ Local vs. Production Code Routing
The client-side API url in [frontend/src/app/config/index.ts](file:///a:/newNullClass/REDBUS-CLONE-MEAN/frontend/src/app/config/index.ts) is configured to automatically detect the environment:
- If the app runs on `localhost` (development), it points to `http://localhost:5000/`.
- If the app is hosted online (production), it uses a relative path `/` that seamlessly routes requests to Vercel's edge network, utilizing the proxy configurations defined in `vercel.json` without CORS issues.
