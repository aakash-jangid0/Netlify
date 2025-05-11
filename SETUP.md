npm install react@18.3.1 react-dom@18.3.1 react-router-dom@6.28.0 framer-motion@11.11.17 lucide-react@0.344.0 react-hot-toast@2.4.1 zod@3.23.8 socket.io-client@4.7.4 file-saver@2.0.5 jszip@3.10.1 qrcode.react@3.2.0 recharts@2.13.3 express@4.21.1 cors@2.8.5 mongoose@8.8.2 jsonwebtoken@9.0.2 bcryptjs@2.4.3 dotenv@16.4.5 razorpay@2.9.5 && npm install -D typescript@5.5.3 @types/react@18.3.5 @types/react-dom@18.3.0 @types/node@20.17.7 @types/file-saver@2.0.7 vite@5.4.2 @vitejs/plugin-react@4.3.1 tailwindcss@3.4.15 postcss@8.4.49 autoprefixer@10.4.20 nodemon@3.1.7


# TastyBites - Local Development Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- VS Code
- Git

## Step 1: Clone and Setup Project Structure

1. Create a new directory and initialize the project:
```bash
mkdir tastybites
cd tastybites
```

2. Initialize a new Node.js project:
```bash
npm init -y
```

## Step 2: Frontend Setup

1. Create a new Vite project with React and TypeScript:
```bash
npm create vite@latest client -- --template react-ts
cd client
```

2. Install frontend dependencies:
```bash
npm install react-router-dom@6 
npm install lucide-react
npm install framer-motion
npm install react-hot-toast
npm install qrcode.react
npm install jszip file-saver
npm install @types/file-saver -D
```

3. Install and configure Tailwind CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## Step 3: Backend Setup

1. Create a server directory and initialize:
```bash
cd ..
mkdir server
cd server
npm init -y
```

2. Install backend dependencies:
```bash
npm install express
npm install mongoose
npm install cors
npm install dotenv
npm install jsonwebtoken
npm install bcryptjs
npm install socket.io
npm install razorpay
npm install zod
```

3. Install development dependencies:
```bash
npm install -D nodemon
npm install -D @types/node
```

## Step 4: Environment Setup

1. Create `.env` file in the server directory:
```env
MONGODB_URI=mongodb://localhost:27017/tastybites
JWT_SECRET=your-super-secret-key-change-this-in-production
PORT=5000
RAZORPAY_KEY_ID=rzp_test_dummy_key_id
RAZORPAY_KEY_SECRET=rzp_test_dummy_key_secret
```

## Step 5: Database Setup

1. Start MongoDB service on your machine
2. Create a new database named 'tastybites':
```bash
mongosh
use tastybites
```

## Step 6: Running the Application

1. Start the backend server:
```bash
# In the server directory
npm run dev
```

2. Start the frontend development server:
```bash
# In the client directory
npm run dev
```

## Project Structure

```
tastybites/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context providers
│   │   ├── types/        # TypeScript type definitions
│   │   └── App.tsx       # Main application component
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── index.js          # Server entry point
│
└── package.json
```

## VS Code Extensions

Install these recommended VS Code extensions for better development experience:

1. ESLint
2. Prettier
3. Tailwind CSS IntelliSense
4. ES7+ React/Redux/React-Native snippets
5. MongoDB for VS Code

## Development Tips

1. **Hot Reloading**: Both frontend and backend servers support hot reloading. Changes will automatically refresh.

2. **MongoDB Connection**: Ensure MongoDB is running before starting the backend server.

3. **Environment Variables**: 
   - Never commit `.env` files to version control
   - Create `.env.example` with dummy values for reference

4. **API Testing**: 
   - Use Thunder Client or Postman to test API endpoints
   - Backend runs on `http://localhost:5000`
   - Frontend runs on `http://localhost:5173`

5. **Debugging**:
   - Use Chrome DevTools for frontend debugging
   - Use VS Code's built-in debugger for backend
   - MongoDB Compass for database visualization

## Common Issues and Solutions

1. **MongoDB Connection Error**:
   - Ensure MongoDB service is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Port Conflicts**:
   - Change PORT in `.env` if 5000 is in use
   - Kill existing processes using the ports

3. **Node Module Issues**:
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **TypeScript Errors**:
   - Run `npm run build` to check for type errors
   - Ensure all required types are properly defined

## Testing

1. Run frontend tests:
```bash
cd client
npm test
```

2. Run backend tests:
```bash
cd server
npm test
```

## Building for Production

1. Build frontend:
```bash
cd client
npm run build
```

2. Build backend:
```bash
cd server
npm run build
```

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Express.js Documentation](https://expressjs.com)
- [Socket.IO Documentation](https://socket.io/docs/v4)
- [Razorpay Documentation](https://razorpay.com/docs)

## Support

For any issues:
1. Check the documentation
2. Search existing GitHub issues
3. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details