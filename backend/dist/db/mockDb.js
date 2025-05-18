"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
// Mock database for development without PostgreSQL
class MockDatabase {
    constructor() {
        this.data = {
            users: [],
            programs: [],
            bookings: []
        };
        this.idCounters = {
            users: 0,
            programs: 0,
            bookings: 0
        };
        this.events = new events_1.EventEmitter();
        // Initialize with seed data
        this.seedDatabase();
    }
    // Seed the database with initial data
    seedDatabase() {
        // Add users
        this.data.users.push({
            id: ++this.idCounters.users,
            email: 'john.doe@example.com',
            password_hash: '$2a$10$6KVlm1GQVtx5XS1sRJIHUOgkY0/LS9Ykk8B.UXJDlnqLNGcWYxKSe', // password123
            first_name: 'John',
            last_name: 'Doe',
            bio: 'Aspiring young engineer',
            age: 12,
            grade: '7th Grade',
            interests: ['Robotics', 'Coding', 'Math'],
            created_at: new Date()
        }, {
            id: ++this.idCounters.users,
            email: 'jane.smith@example.com',
            password_hash: '$2a$10$6KVlm1GQVtx5XS1sRJIHUOgkY0/LS9Ykk8B.UXJDlnqLNGcWYxKSe', // password123
            first_name: 'Jane',
            last_name: 'Smith',
            bio: 'Science enthusiast',
            age: 14,
            grade: '9th Grade',
            interests: ['Chemistry', 'Biology', 'Physics'],
            created_at: new Date()
        });
        // Add programs
        this.data.programs.push({
            id: ++this.idCounters.programs,
            title: 'Robotics Workshop',
            description: 'Learn to build and program robots with hands-on activities.',
            long_description: 'In this hands-on workshop, participants will learn the fundamentals of robotics engineering.',
            category: 'Engineering',
            level: 'Beginner',
            duration: '2 hours',
            date: '2023-06-15',
            time: '10:00 AM - 12:00 PM',
            location: 'STEM Center, Room 101',
            instructor: 'Dr. Robert Chen',
            seats: 20,
            price: 45.00,
            age_group: '10-14',
            format: 'In-person',
            requirements: ['None'],
            topics: ['Robotics', 'Programming', 'Engineering'],
            created_at: new Date()
        }, {
            id: ++this.idCounters.programs,
            title: 'Coding for Kids',
            description: 'Introduction to programming concepts through fun, interactive games.',
            long_description: 'This program introduces young learners to the world of coding through engaging, game-based activities.',
            category: 'Computer Science',
            level: 'Beginner',
            duration: '1.5 hours',
            date: '2023-06-20',
            time: '4:00 PM - 5:30 PM',
            location: 'Virtual',
            instructor: 'Ms. Sarah Johnson',
            seats: 30,
            price: 35.00,
            age_group: '8-12',
            format: 'Online',
            requirements: ['Computer with internet access'],
            topics: ['Coding', 'Game Development', 'Logic'],
            created_at: new Date()
        });
        // Add bookings
        this.data.bookings.push({
            id: ++this.idCounters.bookings,
            user_id: 1,
            program_id: 1,
            status: 'Confirmed',
            created_at: new Date()
        }, {
            id: ++this.idCounters.bookings,
            user_id: 2,
            program_id: 2,
            status: 'Confirmed',
            created_at: new Date()
        });
    }
    // Mock query method
    async query(text, params = []) {
        console.log('Mock DB Query:', text, params);
        // Handle different query types
        if (text.toLowerCase().includes('select')) {
            return this.handleSelect(text, params);
        }
        else if (text.toLowerCase().includes('insert')) {
            return this.handleInsert(text, params);
        }
        else if (text.toLowerCase().includes('update')) {
            return this.handleUpdate(text, params);
        }
        else if (text.toLowerCase().includes('delete')) {
            return this.handleDelete(text, params);
        }
        else if (text.toLowerCase().includes('begin') ||
            text.toLowerCase().includes('commit') ||
            text.toLowerCase().includes('rollback')) {
            // Transaction commands - just return empty result
            return { rows: [], rowCount: 0 };
        }
        // Default empty response
        return { rows: [], rowCount: 0 };
    }
    // Handle SELECT queries
    handleSelect(text, params) {
        // Extract table name from query (very simplified)
        const tableMatch = text.match(/from\s+(\w+)/i);
        if (!tableMatch)
            return { rows: [], rowCount: 0 };
        const tableName = tableMatch[1].toLowerCase();
        let results = [...this.data[tableName] || []];
        // Handle WHERE conditions (very simplified)
        if (text.toLowerCase().includes('where')) {
            // Check for id condition
            const idMatch = text.match(/where\s+(\w+)\.?(\w+)?\s*=\s*\$(\d+)/i);
            if (idMatch) {
                const paramIndex = parseInt(idMatch[3]) - 1;
                const field = idMatch[2] || idMatch[1];
                const value = params[paramIndex];
                results = results.filter(row => row[field] == value);
            }
            // Check for email condition (for login)
            const emailMatch = text.match(/where\s+email\s*=\s*\$(\d+)/i);
            if (emailMatch) {
                const paramIndex = parseInt(emailMatch[1]) - 1;
                const email = params[paramIndex];
                results = results.filter(row => row.email === email);
            }
        }
        // Handle JOIN (very simplified)
        if (text.toLowerCase().includes('join')) {
            const joinMatch = text.match(/join\s+(\w+)/i);
            if (joinMatch) {
                const joinTable = joinMatch[1].toLowerCase();
                const joinData = this.data[joinTable] || [];
                // Very simplified join logic
                results = results.map(row => {
                    const joinRow = joinData.find(jr => jr.id === row[`${joinTable.slice(0, -1)}_id`]);
                    return { ...row, ...joinRow };
                });
            }
        }
        return { rows: results, rowCount: results.length };
    }
    // Handle INSERT queries
    handleInsert(text, params) {
        // Extract table name from query (very simplified)
        const tableMatch = text.match(/into\s+(\w+)/i);
        if (!tableMatch)
            return { rows: [], rowCount: 0 };
        const tableName = tableMatch[1].toLowerCase();
        const table = this.data[tableName] || [];
        // Create new record with incremented ID
        const id = ++this.idCounters[tableName];
        const newRecord = { id, created_at: new Date() };
        // Extract column names from query
        const columnsMatch = text.match(/\(([^)]+)\)/);
        if (columnsMatch) {
            const columns = columnsMatch[1].split(',').map(col => col.trim());
            // Assign values from params to columns
            columns.forEach((col, index) => {
                newRecord[col] = params[index];
            });
        }
        // Add record to table
        table.push(newRecord);
        this.data[tableName] = table;
        // Emit event for subscribers
        this.events.emit(`${tableName}:insert`, newRecord);
        return { rows: [newRecord], rowCount: 1 };
    }
    // Handle UPDATE queries
    handleUpdate(text, params) {
        // Extract table name from query (very simplified)
        const tableMatch = text.match(/update\s+(\w+)/i);
        if (!tableMatch)
            return { rows: [], rowCount: 0 };
        const tableName = tableMatch[1].toLowerCase();
        const table = this.data[tableName] || [];
        // Extract SET clause
        const setMatch = text.match(/set\s+([^where]+)/i);
        if (!setMatch)
            return { rows: [], rowCount: 0 };
        // Extract WHERE clause
        const whereMatch = text.match(/where\s+(\w+)\s*=\s*\$(\d+)/i);
        if (!whereMatch)
            return { rows: [], rowCount: 0 };
        const whereField = whereMatch[1];
        const whereParamIndex = parseInt(whereMatch[2]) - 1;
        const whereValue = params[whereParamIndex];
        // Find records to update
        const recordsToUpdate = table.filter(row => row[whereField] == whereValue);
        // Update records
        recordsToUpdate.forEach(record => {
            // Very simplified SET clause parsing
            const setClauses = setMatch[1].split(',').map(clause => clause.trim());
            setClauses.forEach(clause => {
                const fieldMatch = clause.match(/(\w+)\s*=\s*\$(\d+)/);
                if (fieldMatch) {
                    const field = fieldMatch[1];
                    const paramIndex = parseInt(fieldMatch[2]) - 1;
                    record[field] = params[paramIndex];
                }
            });
        });
        // Emit event for subscribers
        recordsToUpdate.forEach(record => {
            this.events.emit(`${tableName}:update`, record);
        });
        return { rows: recordsToUpdate, rowCount: recordsToUpdate.length };
    }
    // Handle DELETE queries
    handleDelete(text, params) {
        // Extract table name from query (very simplified)
        const tableMatch = text.match(/from\s+(\w+)/i);
        if (!tableMatch)
            return { rows: [], rowCount: 0 };
        const tableName = tableMatch[1].toLowerCase();
        let table = this.data[tableName] || [];
        // Extract WHERE clause
        const whereMatch = text.match(/where\s+(\w+)\s*=\s*\$(\d+)/i);
        if (!whereMatch)
            return { rows: [], rowCount: 0 };
        const whereField = whereMatch[1];
        const whereParamIndex = parseInt(whereMatch[2]) - 1;
        const whereValue = params[whereParamIndex];
        // Find records to delete
        const recordsToDelete = table.filter(row => row[whereField] == whereValue);
        // Delete records
        this.data[tableName] = table.filter(row => row[whereField] != whereValue);
        // Emit event for subscribers
        recordsToDelete.forEach(record => {
            this.events.emit(`${tableName}:delete`, record);
        });
        return { rows: recordsToDelete, rowCount: recordsToDelete.length };
    }
    // Mock end method
    async end() {
        // Do nothing
    }
}
exports.default = new MockDatabase();
