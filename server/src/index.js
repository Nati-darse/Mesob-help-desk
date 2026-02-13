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
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const systemAdminRoutes = require('./routes/systemAdminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { refreshSettings, getGlobalSettingsSync } = require('./utils/settingsCache');
const { startBackupScheduler } = require('./utils/backupScheduler');
const { seedCompanies } = require('./utils/companySeed');
const { recordRequest, setSocketCount } = require('./utils/metrics');

const app = express();
const server = http.createServer(app);

// ===== PROXY TRUST =====
app.enable('trust proxy');

// ===== CORS =====
const allowedOrigins = [
    'https://mesob-help-desk.vercel.app',
    'https://mesob-help-desk.onrender.com', // Self
    'http://localhost:5173',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            origin.includes('mesob-help-desk') ||
            origin.includes('vercel.app') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Origin restricted: ${origin}`);
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// DIAGNOSTICS
console.log('--- SYSTEM DIAGNOSTICS ---');
console.log(`[AUTH] JWT_SECRET present: ${!!process.env.JWT_SECRET} (len: ${process.env.JWT_SECRET?.length || 0})`);
console.log(`[AUTH] JWT_REFRESH_SECRET present: ${!!process.env.JWT_REFRESH_SECRET}`);
console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[ENV] MONGODB_URI present: ${!!process.env.MONGODB_URI}`);
console.log('--------------------------');

// Initialize Socket.io with permissive CORS
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            callback(null, true);
        },
        credentials: true
    }
});

app.set('io', io);

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Socket authentication failed'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentTokenVersion = Number(getGlobalSettingsSync()?.meta?.tokenVersion || 1);
        const tokenVersion = Number(decoded?.tv || 1);
        if (tokenVersion !== currentTokenVersion) {
            return next(new Error('Socket authentication failed'));
        }
        const user = await User.findById(decoded.id).select('_id role companyId');
        if (!user) {
            return next(new Error('Socket authentication failed'));
        }

        socket.data.user = {
            id: String(user._id),
            role: user.role,
            companyId: Number(user.companyId)
        };
        return next();
    } catch (error) {
        return next(new Error('Socket authentication failed'));
    }
});

// Middleware
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('tiny'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        recordRequest(Date.now() - start);
    });
    next();
});
app.use((req, res, next) => {
    const settings = getGlobalSettingsSync();
    if (settings.system?.debugMode) {
        console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
    }
    next();
});
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
const auditMiddleware = require('./middleware/auditMiddleware');

// Routes
app.use('/api/auth', authRoutes); // Auth is always public
// For other routes, we want to check maintenance
// We use a middleware chain: [optionalAuth, checkMaintenance]
// Since `protect` enforces auth, we can just use `protect` then `checkMaintenance` for protected routes.
// But maintenance mode should block even if you HAVE a token (unless you are admin).

// So, for protected routes:
const checkMaint = [protect, maintenanceMiddleware];

app.use('/api/tickets', checkMaint, apiLimiter, auditMiddleware, ticketRoutes);
app.use('/api/users', checkMaint, apiLimiter, auditMiddleware, userRoutes);
app.use('/api/dashboard', checkMaint, apiLimiter, auditMiddleware, dashboardRoutes);
app.use('/api/technician', checkMaint, apiLimiter, auditMiddleware, technicianRoutes);
app.use('/api/settings', checkMaint, apiLimiter, auditMiddleware, settingsRoutes);
app.use('/api/notifications', checkMaint, apiLimiter, auditMiddleware, require('./routes/notificationRoutes'));
app.use('/api/admin/reports', checkMaint, apiLimiter, auditMiddleware, adminReportRoutes);
app.use('/api/audit-logs', checkMaint, apiLimiter, auditMiddleware, auditLogRoutes);
app.use('/api/system-admin', checkMaint, apiLimiter, auditMiddleware, systemAdminRoutes);
app.use('/api/companies', checkMaint, apiLimiter, auditMiddleware, companyRoutes);

// Upload error handling (multer/image-only)
app.use((err, req, res, next) => {
    if (err && (err.name === 'MulterError' || err.message?.toLowerCase().includes('image') || err.message?.toLowerCase().includes('boundary'))) {
        return res.status(400).json({ message: err.message });
    }
    return next(err);
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    setSocketCount(io.engine.clientsCount);

    const authUser = socket.data.user || {};
    const companyId = Number(authUser.companyId);
    const role = authUser.role;
    const userId = authUser.id;

    if (companyId) {
        socket.join(`company:${companyId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined company room: ${companyId}`);
    }
    if (role) {
        socket.join(`role:${role}`);
        if (companyId) {
            socket.join(`company:${companyId}:role:${role}`);
        }
    }
    if (userId) {
        socket.join(`user:${userId}`);
    }

    socket.on('join_company', (cid) => {
        const requestedCompany = Number(cid);
        if (!Number.isNaN(requestedCompany) && requestedCompany === companyId) {
            socket.join(`company:${requestedCompany}`);
            console.log(`[Socket.IO] Client ${socket.id} manually joined company: ${requestedCompany}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        setSocketCount(io.engine.clientsCount);
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
    res.send('Mesob Help Desk API is running ðŸš€');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    mongoose.connection.on('connected', () => app.set('dbState', 'connected'));
    mongoose.connection.on('disconnected', () => app.set('dbState', 'disconnected'));
    mongoose.connection.on('error', () => app.set('dbState', 'error'));

    server.listen(PORT, () => {
        console.log(`âœ… Server running on port ${PORT}`);
        console.log(`âœ… Socket.IO initialized and ready`);
        console.log(`âœ… Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
        console.log(`ðŸ“Š Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    await refreshSettings();
    startBackupScheduler();
    await seedCompanies();

    setInterval(async () => {
        try {
            const stats = await mongoose.connection.db.command({ dbStats: 1 });
            app.set('dbStats', stats);
        } catch (error) {
            // ignore stats errors
        }
    }, 60000);
};

startServer().catch((error) => {
    console.error('[Startup] Failed to start server:', error.message);
    process.exit(1);
});
module.exports = { app, io, server };


