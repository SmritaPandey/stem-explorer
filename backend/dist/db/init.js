"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./index"));
async function initializeDatabase() {
    try {
        console.log('Starting database initialization...');
        // Read the schema SQL file
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Execute the schema SQL
        await index_1.default.query(schemaSql);
        console.log('Database schema created successfully');
        // Check if we need to seed the database with initial data
        const seedPath = path_1.default.join(__dirname, 'seed.sql');
        if (fs_1.default.existsSync(seedPath)) {
            const seedSql = fs_1.default.readFileSync(seedPath, 'utf8');
            await index_1.default.query(seedSql);
            console.log('Database seeded with initial data');
        }
        console.log('Database initialization completed successfully');
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
    finally {
        // Close the pool
        await index_1.default.end();
    }
}
// Run the initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase();
}
exports.default = initializeDatabase;
