"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Define configuration object
const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 3001,
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    // Database configuration
    database: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'stem_explorer',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
        useMock: process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test',
    },
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'default_jwt_secret_for_development_only',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'stem-explorer',
        audience: process.env.JWT_AUDIENCE || 'stem-explorer-client',
    },
    // CORS configuration
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    // OAuth configuration
    oauth: {
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
        },
        github: {
            clientID: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
        },
    },
    // Security configuration
    security: {
        bcryptSaltRounds: 12,
        rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100, // limit each IP to 100 requests per windowMs
    },
    // Cookie configuration
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
};
exports.default = config;
