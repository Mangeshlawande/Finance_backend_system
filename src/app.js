import express from 'express';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import authRoutes          from '#routes/auth.routes.js';
import userRoutes          from '#routes/user.routes.js';
import recordRoutes        from '#routes/records.routes.js';
import dashboardRoutes     from '#routes/dashboard.routes.js';
import organisationRoutes  from '#routes/organisations.routes.js';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import logger from '#config/logger.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
    credentials: true,
    methods:["GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"],
    allowedHeaders:["Content-Type", "Authorization"]
 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

app.get('/', (req, res) => res.status(200).send('The Finance Backend System!'));

app.get('/api/v1/health', (req, res) =>
    res.json(new ApiResponse(200, {
        status:    'OK',
        timestamp: new Date().toISOString(),
        uptime:    process.uptime(),
    }, 'Service is healthy'))
);

app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/records',       recordRoutes);
app.use('/api/v1/dashboard',     dashboardRoutes);
app.use('/api/v1/organisations', organisationRoutes);

app.use((req, res) => {
    res.status(404).json(new ApiError(404, 'Route not found'));
});

app.use((err, req, res, _next) => {
    logger.error(err.message, { stack: err.stack });
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success:    false,
            statusCode: err.statusCode,
            message:    err.message,
            details:    err.details,
        });
    }
    res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error', details: [] });
});

export default app;