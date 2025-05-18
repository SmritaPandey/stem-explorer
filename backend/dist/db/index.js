"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const mockDb_1 = __importDefault(require("./mockDb"));
dotenv_1.default.config();
// Check if we should use the mock database
const useMockDb = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test';
// Create a real PostgreSQL pool if not using mock
let pool;
if (!useMockDb) {
    try {
        pool = new pg_1.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
        });
        console.log('Connected to PostgreSQL database');
    }
    catch (error) {
        console.error('Failed to connect to PostgreSQL, falling back to mock database:', error);
        pool = mockDb_1.default;
    }
}
else {
    console.log('Using mock database');
    pool = mockDb_1.default;
}
exports.default = pool;
