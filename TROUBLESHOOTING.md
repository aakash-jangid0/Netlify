# TastyBites Troubleshooting Guide

This guide will help you resolve common issues with the TastyBites application.

## Quick Start

1. Run diagnostics mode by adding `?diagnostics=true` to your URL
   Example: `http://localhost:5173/?diagnostics=true`

2. Check console for JavaScript errors (Press F12 in your browser)

3. Verify all services are running:
   - Frontend (Vite/React): Should be on port 5173
   - Backend (Node/Express): Should be on port 5000
   - MongoDB: Should be on port 27017
   - Supabase: Cloud service

## Common Issues and Solutions

### Frontend Issues

#### White Screen / App Not Loading
- **Check console for errors** (F12 in most browsers)
- **Verify environment variables** are set correctly in `.env`
- **Check if React is crashing** due to component errors
- **Try clearing browser cache** and local storage
- **Solution:** Run in diagnostics mode to identify specific issues

#### Styling/CSS Problems
- **Verify Tailwind is working** by checking if classes are applied
- **Check for PostCSS or bundling errors** in the console
- **Solution:** Try rebuilding with `npm run build`

#### API Connection Failed
- **Verify backend is running** on the expected port
- **Check CORS settings** in the backend
- **Verify API URL** in `.env` file
- **Solution:** Start backend server with `npm run dev` in server directory

### Backend Issues

#### Server Not Starting
- **Check for port conflicts** (something else using port 5000)
- **Look for Node.js errors** when starting the server
- **Verify all dependencies are installed** with `npm install`
- **Solution:** Try different port in `.env` if needed

#### Database Connection Issues
- **Verify MongoDB is running** locally or accessible remotely
- **Check connection string** in server's `.env`
- **Look for authentication errors** in server logs
- **Solution:** Start MongoDB service or use MongoDB Atlas

#### Authentication Problems
- **JWT secret** might be missing or incorrect
- **Session handling** could be failing
- **Solution:** Check server logs and verify JWT_SECRET in `.env`

### Environment Issues

#### Missing Environment Variables
- Verify you have all required variables in your `.env` files
- Frontend needs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- Backend needs: `MONGODB_URI`, `JWT_SECRET`, `PORT`, etc.
- **Solution:** Copy from `.env.example` and fill in your values

#### Wrong Environment Configuration
- Development vs. production settings might be confused
- Check if `.env` files are being loaded correctly
- **Solution:** Restart development servers after changing `.env`

## Advanced Troubleshooting

### Database Diagnostics
- Connect to MongoDB with Compass or shell to verify database structure
- Check if collections exist and contain expected data
- Run `show dbs` and `use tastybites` in mongo shell

### Network Diagnostics
- Test API endpoints with Postman or curl
- Check if services are accessible from other devices
- Verify firewall settings aren't blocking connections

### Rebuild Application
If problems persist:
1. Stop all servers
2. Delete `node_modules` folders in both frontend and backend
3. Run `npm install` in both directories
4. Restart servers with `npm run dev`

## Getting Help

If you're still experiencing issues:
1. Collect error logs from console
2. Take screenshots of diagnostics screen
3. Document exact steps to reproduce the issue
4. Contact support or create GitHub issue with these details
