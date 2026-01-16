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

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io connection
io.on('connection', (socket) => {
    const h = socket.handshake.headers['x-tenant-id'];
    const a = socket.handshake.auth && socket.handshake.auth.companyId;
    const n = Number(h || a);
    const companyId = Number.isNaN(n) ? (h || a) : n;
    if (companyId) {
        socket.join(`company:${companyId}`);
    }
    socket.on('join_company', (cid) => {
        if (cid) {
            socket.join(`company:${cid}`);
        }
    });

    socket.on('disconnect', () => {
        return;
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Mesob API is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, server };
