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
const adminReportRoutes = require('./routes/adminReportRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// ===== CORS CONFIGURATION =====
const allowedOrigins = [
    'https://mesob-help-desk.vercel.app',
    'https://mesob-helpdesk-backend.onrender.com',
    'http://localhost:5173',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

app.set('io', io);

// Middleware
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('tiny'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/admin/reports', checkMaint, adminReportRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    const h = socket.handshake.headers['x-tenant-id'];
    const a = socket.handshake.auth && socket.handshake.auth.companyId;
    const n = Number(h || a);
    const companyId = Number.isNaN(n) ? (h || a) : n;

    if (companyId) {
        socket.join(`company:${companyId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined company room: ${companyId}`);
    }

    socket.on('join_company', (cid) => {
        if (cid) {
            socket.join(`company:${cid}`);
            console.log(`[Socket.IO] Client ${socket.id} manually joined company: ${cid}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
        console.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
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
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Socket.IO initialized and ready`);
    console.log(`✅ Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io, server };
