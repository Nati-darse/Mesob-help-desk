markdown
# 🖥️ Mesob IT Help Desk System 

A comprehensive digital help desk solution for internal IT support, built with the MERN stack (MongoDB, Express.js, React, Node.js).

## ✨ Features Included 

### 👥 **User Roles & Authentication**
- **Four distinct roles**: Worker, Technician, Team Lead, Admin
- **Secure JWT-based authentication** with refresh tokens
- **Department-based user organization**

### 🎫 **Ticket Management**
- **Create tickets** with categories, priorities, and attachments
- **Ticket lifecycle tracking**: New → Assigned → In Progress → Resolved → Closed
- **Real-time updates** using Socket.io
- **Priority levels**: Low, Medium, High, Critical
- **File attachments** support (images, documents, logs)

### 👨‍💼 **Assignment System**
- **Team Lead manual assignment** of tickets to technicians
- **Technician availability management**
- **Ticket reassignment capability**
- **Workload balancing** visibility

### 📢 **Notification System**
- **Email notifications** for all ticket updates
- **SMS alerts** for critical priority tickets (Twilio integration)
- **In-app notifications** with real-time updates
- **Customizable notification preferences**

### 📊 **Dashboard & Analytics**
- **Real-time dashboard** with key metrics
- **Ticket statistics** by department, category, and priority
- **Technician performance tracking**
- **SLA (Service Level Agreement) monitoring**
- **Response and resolution time analytics**

### 💬 **Communication Features**
- **Integrated comment system** within tickets
- **@mention functionality** for users
- **Audit trail** of all ticket activities
- **Resolution documentation**

### ⭐ **Feedback & Evaluation**
- **Post-resolution rating system** (1-5 stars)
- **Feedback collection** from requesters
- **Technician performance metrics**
- **Service quality improvement insights**

## 🏗️ **Tech Stack**

### **Frontend**
- **React 18** with Vite for fast development
- **Material-UI** for modern UI components
- **React Router DOM** for navigation
- **Socket.io Client** for real-time features
- **Chart.js** for data visualization
- **Formik & Yup** for form handling

### **Backend**
- **Node.js** with **Express.js** framework
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Socket.io** for WebSocket communication
- **Nodemailer** for email notifications
- **Twilio** for SMS notifications
- **Multer** for file uploads

### **Dev Tools**
- **Vite** for fast builds and HMR
- **Nodemon** for automatic server restarts
- **Git** for version control
- **Postman/Insomnia** for API testing

## 📁 **Project Structure**
mernit-helpdesk/
├── client/ # React Vite Frontend
│ ├── src/
│ │ ├── components/ # Reusable components
│ │ ├── pages/ # Page components
│ │ ├── hooks/ # Custom React hooks
│ │ ├── context/ # React context providers
│ │ ├── services/ # API services
│ │ ├── utils/ # Utility functions
│ │ └── styles/ # Global styles
│ ├── public/ # Static assets
│ └── package.json
├── server/ # Express.js Backend
│ ├── src/
│ │ ├── config/ # Configuration files
│ │ ├── controllers/ # Route controllers
│ │ ├── middleware/ # Custom middleware
│ │ ├── models/ # Mongoose models
│ │ ├── routes/ # API routes
│ │ ├── services/ # Business logic
│ │ ├── utils/ # Helper functions
│ │ └── socket/ # Socket.io handlers
│ ├── uploads/ # File uploads directory
│ └── package.json
└── README.md

text

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+ and npm/yarn
- MongoDB 4.4+
- Git

### **Setup Instructions**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mernit-helpdesk
Setup Backend

bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
Setup Frontend

bash
cd ../client
npm install
Configure Environment Variables

Server (.env):

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/helpdesk_db
JWT_SECRET=your_super_secret_jwt_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
Start MongoDB

bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows (Run as Administrator)
net start MongoDB
Run the Application

Terminal 1 - Backend:

bash
cd server
npm run dev
Terminal 2 - Frontend:

bash
cd client
npm run dev
Access the Application

Frontend: http://localhost:5173

Backend API: http://localhost:5000

### 👤 Testing the System
Since the database starts empty, the **first user you register will automatically be given the Admin role**. 

1. **Register** a new account at `http://localhost:5173/register`
2. **Login** with that account.
3. You will have full access to create tickets, assign them, and view the dashboard.
📡 API Documentation
Authentication
POST /api/auth/register - Register new user

POST /api/auth/login - User login

POST /api/auth/refresh - Refresh access token

GET /api/auth/me - Get current user

Tickets
GET /api/tickets - Get all tickets (with filters)

POST /api/tickets - Create new ticket

GET /api/tickets/:id - Get ticket details

PUT /api/tickets/:id - Update ticket

PUT /api/tickets/:id/assign - Assign ticket to technician

PUT /api/tickets/:id/resolve - Resolve ticket

POST /api/tickets/:id/comment - Add comment

Users
GET /api/users - Get all users (admin only)

GET /api/users/technicians - Get available technicians

PUT /api/users/:id - Update user profile

PUT /api/users/:id/availability - Toggle technician availability

Dashboard
GET /api/dashboard/stats - Get dashboard statistics

GET /api/dashboard/analytics - Get analytical data

🔐 Security Features
JWT-based authentication with refresh tokens

Role-based access control (RBAC)

Password hashing with bcrypt

Input validation and sanitization

Rate limiting on authentication endpoints

CORS configuration for frontend access

Helmet.js for security headers

📧 Email Templates
The system sends automated emails for:

Ticket creation confirmation

Ticket assignment notifications

Resolution notifications

Feedback requests

Critical alerts

📱 Responsive Design
Mobile-first approach

Responsive layouts for all screen sizes

Touch-friendly interfaces

Progressive Web App capabilities

🧪 Testing
Run tests with:

bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
🐳 Docker Support
Coming soon: Docker and Docker Compose configurations for easy deployment.

📈 Future Enhancements
Knowledge Base - Self-service solution articles

Mobile Application - React Native app

Advanced Analytics - Predictive insights

Chatbot Integration - AI-powered first-line support

Calendar Integration - Schedule onsite visits

Multi-language Support - Internationalization

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Material-UI for the component library

Vite team for the amazing build tool

MongoDB for the database

All contributors and testers

📞 Support
For support, email: it-helpdesk@mesob.com or create an issue in the GitHub repository.

Built with ❤️ for Mesob Company - Simplifying IT Support

text

## 🚀 **Initialization Commands**

Here are the exact commands to initialize your project:

```bash
# 1. Create project directory and initialize git
mkdir mernit-helpdesk
cd mernit-helpdesk
git init

# 2. Create backend directory and initialize
mkdir server
cd server
npm init -y

# 3. Install backend dependencies
npm install express mongoose cors dotenv bcryptjs jsonwebtoken multer socket.io nodemailer twilio
npm install -D nodemon

# 4. Create frontend with Vite
cd ..
npm create vite@latest client -- --template react
cd client
npm install

# 5. Install frontend dependencies
npm install axios socket.io-client react-router-dom formik yup chart.js react-chartjs-2
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install @mui/x-data-grid date-fns react-query lucide-react
npm install -D @types/socket.io-client

# 6. Create basic folder structure
# For server:
cd ../server
mkdir -p src/{config,controllers,middleware,models,routes,services,utils,socket}
mkdir uploads

# For client:
cd ../client
mkdir -p src/{components,pages,hooks,context,services,utils,styles}
