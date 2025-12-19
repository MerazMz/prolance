# Prolance - Modern Freelancing Platform

A full-stack freelancing marketplace platform built with cutting-edge technologies including React 19, Node.js/Express, MongoDB, real-time chat, AI-powered features, and integrated payment processing.

![License](https://img.shields.io/badge/license-Proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.2.0-blue)

## 📋 Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Available Scripts](#-available-scripts)
- [API Documentation](#-api-documentation)
- [Development Workflow](#-development-workflow)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with OTP verification via Brevo
- 💬 **Real-time Chat** - Socket.io powered messaging with file sharing
- 💰 **Payment Integration** - Razorpay for secure transactions and escrow
- 🤖 **AI Features** - Google Gemini AI integration for smart suggestions
- 📁 **File Management** - Cloudinary integration for image/document uploads
- 🎨 **Dark Mode** - Full dark theme support across the platform
- 📊 **Project Management** - Complete project lifecycle management
- 📈 **Analytics Dashboard** - Track proposals, contracts, and earnings
- 🔔 **Real-time Notifications** - Stay updated with instant alerts
- 🌐 **Global Ready** - Timezone and country selection support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (v7 or higher) - Comes with Node.js
- **Git** - For version control
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)

### Required Third-Party Services

You'll need to create accounts and obtain API keys for:

1. **MongoDB Atlas** - Database hosting
2. **Cloudinary** - Media storage and management
3. **Razorpay** - Payment processing (India)
4. **Brevo (Sendinblue)** - Transactional emails
5. **Google AI Studio** - Gemini AI API
6. **Upstash Redis** - Caching and session management
7. **Firebase** - Push notifications (optional)

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | - | Runtime environment |
| **Express.js** | ^5.1.0 | Web application framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | ^8.19.4 | MongoDB ODM |
| **Socket.io** | ^4.8.1 | Real-time bidirectional communication |
| **JWT** | ^9.0.2 | Authentication tokens |
| **Bcrypt** | ^6.0.0 | Password hashing |
| **Joi** | ^18.0.1 | Input validation |
| **Multer** | ^2.0.2 | File upload handling |
| **Cloudinary** | ^2.8.0 | Cloud media management |
| **Razorpay** | ^2.9.6 | Payment gateway |
| **Brevo** | ^3.3.1 | Email service provider |
| **Google Gemini AI** | ^0.24.1 | AI-powered features |
| **Upstash Redis** | ^1.35.8 | In-memory data caching |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.2.0 | UI library |
| **Vite** | ^7.2.2 | Build tool and dev server |
| **React Router DOM** | ^7.9.6 | Client-side routing |
| **Axios** | ^1.13.2 | HTTP client |
| **TailwindCSS** | ^4.1.17 | Utility-first CSS framework |
| **Material-UI (MUI)** | ^7.3.6 | React component library |
| **Radix UI** | - | Headless UI primitives |
| **Socket.io Client** | ^4.8.1 | Real-time communication |
| **Motion (Framer Motion)** | ^12.23.25 | Animation library |
| **Three.js** | ^0.181.2 | 3D graphics |
| **GSAP** | ^3.13.0 | Advanced animations |
| **Lucide React** | ^0.553.0 | Icon library |
| **React Icons** | ^5.5.0 | Additional icons |
| **Zod** | - | Schema validation |
| **Particles** | ^3.9.1 | Interactive backgrounds |
| **HTML2Canvas** | ^1.4.1 | Screenshot generation |
| **jsPDF** | ^3.0.4 | PDF generation |

## 📁 Project Structure

```
prolance/
├── 📂 backend/
│   ├── 📂 Controllers/           # Request handlers and business logic
│   │   ├── AIController.js       # AI features (Gemini integration)
│   │   ├── AdminController.js    # Admin panel operations
│   │   ├── ApplicationController.js  # Project application handling
│   │   ├── AuthController.js     # Authentication & OTP
│   │   ├── ChatController.js     # Real-time messaging
│   │   ├── ContractController.js # Contract management
│   │   ├── NotificationController.js # Notification system
│   │   ├── PasswordResetController.js # Password recovery
│   │   ├── PaymentController.js  # Razorpay integration
│   │   ├── ProjectController.js  # Project CRUD operations
│   │   ├── SettingsController.js # User settings & profile
│   │   └── UserController.js     # User management
│   │
│   ├── 📂 Middlewares/           # Express middleware
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── errorHandler.js       # Global error handling
│   │   ├── rateLimiter.js        # API rate limiting
│   │   └── uploadMiddleware.js   # File upload processing
│   │
│   ├── 📂 Models/                # MongoDB schemas
│   │   ├── Application.js        # Freelancer applications
│   │   ├── Contract.js           # Project contracts
│   │   ├── Conversation.js       # Chat conversations
│   │   ├── Message.js            # Chat messages
│   │   ├── Payment.js            # Transaction records
│   │   ├── Project.js            # Project listings
│   │   ├── User.js               # User accounts
│   │   └── db.js                 # Database connection
│   │
│   ├── 📂 Routes/                # API route definitions
│   │   ├── authRoutes.js         # Authentication endpoints
│   │   ├── chatRoutes.js         # Chat endpoints
│   │   ├── contractRoutes.js     # Contract endpoints
│   │   ├── paymentRoutes.js      # Payment endpoints
│   │   ├── projectRoutes.js      # Project endpoints
│   │   ├── settingsRoutes.js     # Settings endpoints
│   │   └── userRoutes.js         # User endpoints
│   │
│   ├── 📂 config/                # Configuration files
│   │   ├── cloudinary.js         # Cloudinary setup
│   │   └── redis.js              # Redis connection
│   │
│   ├── 📂 services/              # External service integrations
│   │   ├── emailService.js       # Brevo email handling
│   │   └── paymentService.js     # Razorpay payment logic
│   │
│   ├── 📂 scripts/               # Utility scripts
│   ├── 📂 tests/                 # API tests
│   ├── .env.example              # Environment template
│   ├── .gitignore                # Git ignore rules
│   ├── index.js                  # Server entry point
│   ├── package.json              # Dependencies
│   ├── API_DOCUMENTATION.md      # API reference
│   └── vercel.json               # Vercel deployment config
│
├── 📂 frontend/
│   ├── 📂 public/                # Static assets
│   │   └── (favicons, logos, etc.)
│   │
│   ├── 📂 src/
│   │   ├── 📂 assets/            # Images, fonts, etc.
│   │   │
│   │   ├── 📂 components/        # Reusable React components
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── 📂 context/           # React Context providers
│   │   │   ├── AuthContext.jsx   # Authentication state
│   │   │   └── ThemeContext.jsx  # Dark mode theme
│   │   │
│   │   ├── 📂 pages/             # Route pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BrowseProjects.jsx
│   │   │   ├── MyProjects.jsx
│   │   │   ├── PostProject.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── ProjectWorkspace.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── ... (20+ pages)
│   │   │
│   │   ├── 📂 services/          # API service layers
│   │   │   ├── authApi.js
│   │   │   ├── projectApi.js
│   │   │   ├── chatApi.js
│   │   │   └── paymentApi.js
│   │   │
│   │   ├── 📂 hooks/             # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── useTheme.js
│   │   │
│   │   ├── 📂 lib/               # Utility libraries
│   │   │   └── utils.js          # Helper functions
│   │   │
│   │   ├── 📂 config/            # Configuration
│   │   │   └── firebase.js       # Firebase setup
│   │   │
│   │   ├── 📂 styles/            # Global styles
│   │   │   └── animations.css
│   │   │
│   │   ├── App.jsx               # Main app component
│   │   ├── App.css               # App-wide styles
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Global CSS + Tailwind
│   │
│   ├── .env.example              # Frontend environment template
│   ├── .gitignore                # Git ignore rules
│   ├── components.json           # shadcn/ui config
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # HTML template
│   ├── jsconfig.json             # JavaScript config
│   ├── package.json              # Dependencies
│   ├── vite.config.js            # Vite configuration
│   └── vercel.json               # Vercel deployment config
│
├── .gitignore                    # Root Git ignore
├── README.md                     # This file
└── start.sh                      # Quick start script

```

## 🚀 Quick Start

### Option 1: Automated Start (Recommended)

The easiest way to start the application:

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run the start script in bash terminal
./start.sh
```

This script will:
- ✅ Check Node.js installation
- ✅ Install dependencies if needed
- ✅ Start both backend and frontend servers
- ✅ Display server URLs

### Option 2: Manual Start

#### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

#### 2. Configure Environment Variables

See [Environment Setup](#-environment-setup) section below.

#### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:8080

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:5173
```

## 🔧 Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory (or copy from `.env.example`):

```env
# Server Configuration
PORT=8080
FRONTEND_URL=http://localhost:5173

# Database
MONGO_CONN=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Prolance Support

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AI Features (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Legacy Email (Optional - Brevo is preferred)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8080

# Firebase Configuration (Optional - for push notifications)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```


## 🔑 Available Scripts

### Backend Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend Scripts

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Build for production (outputs to /dist)
npm run preview    # Preview production build locally
npm run lint       # Run ESLint for code quality
```

## 📚 API Documentation

Full API documentation is available in [`backend/API_DOCUMENTATION.md`](backend/API_DOCUMENTATION.md).

### Quick API Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/signup` | POST | Register new user | ❌ |
| `/api/auth/login` | POST | Login user | ❌ |
| `/api/auth/verify-otp` | POST | Verify OTP code | ❌ |
| `/api/projects` | GET | List all projects | ✅ |
| `/api/projects` | POST | Create new project | ✅ |
| `/api/projects/:id` | GET | Get project details | ✅ |
| `/api/applications` | POST | Apply to project | ✅ |
| `/api/payments/create-order` | POST | Create payment order | ✅ |
| `/api/chat/conversations` | GET | Get user conversations | ✅ |
| `/api/settings/profile` | PUT | Update profile | ✅ |

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Development Workflow

### 1. Daily Development

```bash
# Start both servers
./start.sh

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
# API Health: http://localhost:8080/ping
```

### 2. Making Changes

- **Backend changes**: nodemon automatically restarts server
- **Frontend changes**: Vite hot-reloads instantly
- **Database changes**: Update models in `backend/Models/`

### 3. Testing

```bash
# Backend API testing
cd backend
npm test

# Check API documentation
# See backend/API_TESTING.md for test examples
```

### 4. Code Quality

```bash
# Lint frontend code
cd frontend
npm run lint

# Fix linting errors automatically
npm run lint -- --fix
```

## ⚠️ Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 8080 (Backend)
lsof -ti:8080 | xargs kill -9

# Find and kill process on port 5173 (Frontend)
lsof -ti:5173 | xargs kill -9
```

Or change ports:
- **Backend**: Edit `PORT` in `backend/.env`
- **Frontend**: Vite will auto-assign or edit `vite.config.js`

### Database Connection Failed

```plaintext
Error: MongooseServerSelectionError
```

**Solutions**:
1. ✅ Verify `MONGO_CONN` string in `backend/.env`
2. ✅ Check MongoDB Atlas dashboard - ensure cluster is running
3. ✅ Whitelist your IP: Atlas > Network Access > Add IP (use 0.0.0.0/0 for dev)
4. ✅ Verify database user credentials

### Module Not Found Errors

```bash
# Clear and reinstall backend dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Clear and reinstall frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors (Cross-Origin Request Blocked)

**Symptoms**: API calls fail with CORS policy errors

**Solutions**:
1. Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
2. Check `VITE_API_BASE_URL` in `frontend/.env` matches backend URL
3. Ensure backend CORS configuration includes frontend origin

### Socket.io Connection Failed

```plaintext
WebSocket connection error
```

**Solutions**:
1. Ensure backend server is running
2. Check firewall/antivirus blocking WebSocket connections
3. Verify `VITE_API_BASE_URL` doesn't have trailing slash

### Cloudinary Upload Fails

**Solutions**:
1. Verify Cloudinary credentials in `backend/.env`
2. Check Cloudinary dashboard for quota limits (free tier: 25 credits/month)
3. Ensure file size is within limits (free tier: 10MB per file)

### Razorpay Test Payments Failing

**Solutions**:
1. Use Test API keys (starting with `rzp_test_`)
2. Use test card: `4111 1111 1111 1111`, any future expiry, any CVV
3. Check Razorpay dashboard for webhook status
4. Verify `RAZORPAY_KEY_SECRET` is set correctly

### Email/OTP Not Sending

**Solutions**:
1. Check Brevo API key is valid (`BREVO_API_KEY`)
2. Verify sender email in Brevo dashboard
3. Check Brevo sending quota (free tier: 300 emails/day)
4. Look for errors in backend console logs

## 🚢 Deployment

### Backend Deployment (Vercel/Railway/Render)

#### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy backend:
```bash
cd backend
vercel
```

3. Set environment variables in Vercel dashboard

#### Environment Variables for Production

Set all variables from `.env.example` with production values:
- ✅ Use strong `JWT_SECRET` (random 64+ character string)
- ✅ Set `FRONTEND_URL` to your deployed frontend URL
- ✅ Use production MongoDB connection string
- ✅ Switch Razorpay to Live API keys
- ✅ Add production domain to MongoDB Atlas whitelist

### Frontend Deployment (Vercel/Netlify)

#### Vercel Deployment

```bash
cd frontend
npm run build
vercel --prod
```

#### Netlify Deployment

```bash
cd frontend
npm run build

# Deploy dist folder
netlify deploy --prod --dir=dist
```

#### Environment Variables

Set in deployment platform:
- `VITE_API_BASE_URL` → Your backend production URL

### Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Verify OTP emails are sending
- [ ] Test file uploads (Cloudinary)
- [ ] Test payment flow (use Razorpay test mode first)
- [ ] Check Socket.io real-time features
- [ ] Monitor error logs
- [ ] Set up SSL/HTTPS
- [ ] Configure custom domain (optional)

## 🔒 Security Best Practices

- ✅ Never commit `.env` files to Git
- ✅ Use strong, random `JWT_SECRET` in production
- ✅ Enable MongoDB IP whitelisting
- ✅ Use HTTPS in production
- ✅ Regularly update dependencies (`npm audit fix`)
- ✅ Implement rate limiting (already configured)
- ✅ Sanitize user inputs (Joi validation in place)
- ✅ Use environment variables for all secrets

## 📖 Additional Resources

- 📘 [Backend API Documentation](backend/API_DOCUMENTATION.md)
- 🧪 [API Testing Guide](backend/API_TESTING.md)
- 📊 [Database Schema Documentation](backend/Models/)
- 🎨 [Component Library](frontend/src/components/)

## 📄 License

This project is **private and proprietary**.  
© 2025 Meraz Haque. All rights reserved.

## 👤 Author

**Meraz Haque**

For questions or support, please contact the development team.

---

**Last Updated**: December 2025  
**Version**: 2.0.0  
**Status**: Active Development 🚀
