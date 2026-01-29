const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');
const { protect } = require('./middleware/authMiddleware');

// ====== ENV CHECK ======
if (
    !process.env.MONGODB_URI ||
    !process.env.JWT_SECRET ||
    !process.env.JWT_REFRESH_SECRET
) {
    throw new Error('❌ Missing required environment variables');
}

// ====== DB ======
connectDB();

// ====== APP ======
const app = express();
const server = http.createServer(app);

// ====== ALLOWED ORIGINS ======
const allowedOrigins = [
    'https://mesob-help-desk.vercel.app',
    'http://localhost:5173'
];

// ====== CORS (THE ONLY ONE) ======
app.use(cors({
    origin: (origin, callback) => {
        // allow server-to-server or Postman
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

// Explicit OPTIONS handling (important for Render)
app.options('*', cors());

// ====== SOCKET.IO ======
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

app.set('io', io);

// ====== MIDDLEWARE ======
app.use(compression());
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('tiny'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tenant middleware
app.use((req, res, next) => {
    const h = req.headers['x-tenant-id'];
    if (h) {
        const n = Number(h);
        req.tenantId = Number.isNaN(n) ? h : n;
    }
    next();
});

// ====== ROUTES ======

// PUBLIC
app.use('/api/auth', authRoutes);

// PROTECTED + MAINTENANCE
const checkMaint = [protect, maintenanceMiddleware];

app.use('/api/tickets', checkMaint, ticketRoutes);
app.use('/api/users', checkMaint, userRoutes);
app.use('/api/dashboard', checkMaint, dashboardRoutes);
app.use('/api/technician', checkMaint, technicianRoutes);
app.use('/api/settings', checkMaint, settingsRoutes);
app.use('/api/notifications', checkMaint, require('./routes/notificationRoutes'));
app.use('/api/admin/reports', checkMaint, adminReportRoutes);

// ====== SOCKET EVENTS ======
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    const h = socket.handshake.headers['x-tenant-id'];
    const a = socket.handshake.auth?.companyId;
    const n = Number(h || a);
    const companyId = Number.isNaN(n) ? (h || a) : n;

    if (companyId) {
        socket.join(`company:${companyId}`);
    }

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Disconnected: ${socket.id}`);
    });
});

// ====== HEALTH ======
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mesob API is running' });
});

app.get('/', (req, res) => {
    res.send('Mesob Help Desk API is running 🚀');
});

// ====== START ======
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

module.exports = { app, io, server };
