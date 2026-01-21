const dotenv = require('dotenv');
dotenv.config();

if (
    !process.env.MONGODB_URI ||
    !process.env.PORT ||
    !process.env.JWT_SECRET ||
    !process.env.JWT_REFRESH_SECRET
) {
    throw new Error('Missing required environment variables');
}
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const systemAdminRoutes = require('./routes/systemAdminRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'], // Allow both transports
    pingTimeout: 60000,
    pingInterval: 25000
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('tiny'));
}
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use((req, res, next) => {
    const h = req.headers['x-tenant-id'];
    if (h) {
        const n = Number(h);
        req.tenantId = Number.isNaN(n) ? h : n;
    }
    next();
});

const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');

// Routes
// Note: We apply maintenance check globally, but after auth routes to ensure login works if needed
// However, our middleware explicitly allows /api/auth, so we can place it here.
// But valid user is needed for bypassing.
// Strategy: Middleware can check token itself or rely on previous auth middleware.
// Better approach: We need `req.user` populated for the bypass check.
// So we should verify token logic. 
// BUT: `checkMaintenance` needs `req.user`. Standard `protect` middleware populates `req.user`.
// So we can't easily apply it globally without running `protect` globally, which might break public routes.
// FIX: We will apply it to specific routes or handle token verification inside it if we want global lockout.
// SIMPLER FIX: Let's apply it to the main API routes, and we need to ensure `req.user` is present if a token exists.
// For now, let's insert a "soft" auth middleware that tries to decode token but doesn't error if missing.

const { protect } = require('./middleware/authMiddleware');

// Routes
app.use('/api/auth', authRoutes); // Auth is always public
// For other routes, we want to check maintenance
// We use a middleware chain: [optionalAuth, checkMaintenance]
// Since `protect` enforces auth, we can just use `protect` then `checkMaintenance` for protected routes.
// But maintenance mode should block even if you HAVE a token (unless you are admin).

// So, for protected routes:
const checkMaint = [protect, maintenanceMiddleware];

app.use('/api/tickets', checkMaint, ticketRoutes);
app.use('/api/users', checkMaint, userRoutes);
app.use('/api/dashboard', checkMaint, dashboardRoutes);
app.use('/api/technician', checkMaint, technicianRoutes);
app.use('/api/settings', checkMaint, settingsRoutes);
app.use('/api/notifications', checkMaint, require('./routes/notificationRoutes'));
app.use('/api/system-admin', checkMaint, systemAdminRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    const h = socket.handshake.headers['x-tenant-id'];
    const a = socket.handshake.auth && socket.handshake.auth.companyId;
    const n = Number(h || a);
    const companyId = Number.isNaN(n) ? (h || a) : n;
    
    if (companyId) {
        socket.join(`company:${companyId}`);
        console.log(`Socket ${socket.id} joined company:${companyId}`);
    }
    
    socket.on('join_company', (cid) => {
        if (cid) {
            socket.join(`company:${cid}`);
            console.log(`Socket ${socket.id} joined company:${cid}`);
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mesob API is running' });
});

// Root route for easy verification
app.get('/', (req, res) => {
    res.send('Mesob Help Desk API is running 🚀');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, server };
