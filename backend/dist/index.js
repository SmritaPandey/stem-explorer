"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("./routes/auth");
const programs_1 = require("./routes/programs");
const bookings_1 = require("./routes/bookings");
const users_1 = require("./routes/users");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
const passport_2 = require("./config/passport");
const config_1 = __importDefault(require("./config"));
// Initialize Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(config_1.default.cors));
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.security.rateLimitWindowMs,
    max: config_1.default.security.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);
// Request parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Logging middleware
app.use((0, morgan_1.default)(config_1.default.server.nodeEnv === 'production' ? 'combined' : 'dev'));
// Initialize Passport
app.use(passport_1.default.initialize());
(0, passport_2.configurePassport)();
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Public API routes
app.use('/api/auth', auth_1.authRouter);
// Semi-public routes (some endpoints are public, some are protected)
app.use('/api/programs', programs_1.programsRouter); // Programs listing is public
// Protected routes
app.use('/api/bookings', auth_2.authenticateJWT, bookings_1.bookingsRouter);
app.use('/api/users', auth_2.authenticateJWT, users_1.usersRouter);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
const port = config_1.default.server.port;
app.listen(port, () => {
    console.log(`Server running on port ${port} in ${config_1.default.server.nodeEnv} mode`);
    console.log(`API available at http://localhost:${port}/api`);
});
