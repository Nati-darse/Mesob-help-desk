# 🎯 MESOB Help Desk System

A comprehensive IT support ticket management system built for multi-tenant organizations.

## 🌟 Features

### 👥 **Multi-Role Support**
- **System Admin** - Global system management and oversight
- **Super Admin** - Organization-wide administration
- **Team Lead** - Team management and ticket assignment
- **Technician** - Ticket resolution and field work
- **Employee** - Ticket creation and tracking

### 🎨 **Modern UI/UX**
- Clean, responsive Material-UI design
- Role-based dashboards and navigation
- Real-time updates with Socket.IO
- Dark/Light mode support

### 🔧 **Core Functionality**
- Multi-tenant ticket management
- Real-time notifications
- Advanced analytics and reporting
- User management and role assignment
- Company directory management
- Maintenance mode controls

## 🏗️ **Tech Stack**

### **Frontend**
- **React 19** - Modern UI library
- **Material-UI (MUI)** - Component library
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Chart.js** - Data visualization

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📁 **Project Structure**

```
Mesob_Help_Desk/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-based modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── admin/      # Admin features
│   │   │   ├── technician/ # Technician features
│   │   │   └── employee/   # Employee features
│   │   ├── pages/          # Main pages
│   │   ├── utils/          # Utility functions
│   │   └── constants/      # App constants
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── config/         # Configuration files
│   └── package.json
└── README.md
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- MongoDB Atlas account
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/jaHxii/Mesob_Help_Desk.git
cd Mesob_Help_Desk
```

2. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
npm run dev
```

3. **Setup Frontend**
```bash
cd ../client
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🔐 **Default Credentials**

### **System Admin**
- Email: `sysadmin@mesob.com`
- Password: `sysadmin123`

### **Super Admin**
- Email: `admin@mesob.com`
- Password: `admin123`

### **Technician**
- Email: `tech@mesob.com`
- Password: `tech123`

### **Team Lead**
- Email: `lead@mesob.com`
- Password: `lead123`

## 🌐 **Deployment**

### **Frontend (Vercel)**
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

### **Backend (Render)**
1. Connect your GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

### **Database (MongoDB Atlas)**
1. Create a new cluster
2. Setup database user and network access
3. Get connection string
4. Update MONGODB_URI in environment variables

## 📊 **Key Features**

### **Dashboard Analytics**
- Real-time ticket statistics
- Priority-based visualizations
- Performance metrics
- Company-wide insights

### **Ticket Management**
- Multi-priority ticket system
- SLA tracking and alerts
- Assignment workflows
- Status tracking

### **User Management**
- Role-based access control
- Multi-company support
- Profile management
- Activity tracking

### **Real-time Features**
- Live notifications
- Status updates
- Chat functionality
- System alerts

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 **License**

This project is licensed under the MIT License.

## 📞 **Support**

For support and questions:
- Create an issue on GitHub
- Contact: support@mesob.com

---

**Built with ❤️ by the MESOB Team**