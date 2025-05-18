"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = configurePassport;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const passport_jwt_1 = require("passport-jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const index_1 = __importDefault(require("./index"));
// Helper function to find or create a user from OAuth profile
async function findOrCreateUser(profile, provider) {
    try {
        // Check if user exists
        const existingUserResult = await db_1.default.query('SELECT * FROM users WHERE email = $1', [profile.email]);
        if (existingUserResult.rows.length > 0) {
            // User exists, return user
            return existingUserResult.rows[0];
        }
        // User doesn't exist, create new user
        const names = profile.displayName.split(' ');
        const firstName = names[0] || '';
        const lastName = names.length > 1 ? names[names.length - 1] : '';
        // Generate a random password for OAuth users
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcryptjs_1.default.hash(randomPassword, index_1.default.security.bcryptSaltRounds);
        // Insert new user
        const newUserResult = await db_1.default.query(`INSERT INTO users (
        email, password_hash, first_name, last_name, 
        oauth_provider, oauth_id, profile_picture
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
            profile.email,
            hashedPassword,
            firstName,
            lastName,
            provider,
            profile.id,
            profile.picture || null
        ]);
        return newUserResult.rows[0];
    }
    catch (error) {
        console.error('Error in findOrCreateUser:', error);
        throw error;
    }
}
function configurePassport() {
    // Google OAuth Strategy
    if (index_1.default.oauth.google.clientID && index_1.default.oauth.google.clientSecret) {
        passport_1.default.use(new passport_google_oauth20_1.Strategy({
            clientID: index_1.default.oauth.google.clientID,
            clientSecret: index_1.default.oauth.google.clientSecret,
            callbackURL: index_1.default.oauth.google.callbackURL,
            scope: ['profile', 'email']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
                if (!email) {
                    return done(new Error('Email not provided by Google'));
                }
                const userData = {
                    id: profile.id,
                    displayName: profile.displayName,
                    email: email,
                    picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                };
                const user = await findOrCreateUser(userData, 'google');
                return done(null, user);
            }
            catch (error) {
                return done(error);
            }
        }));
    }
    // GitHub OAuth Strategy
    if (index_1.default.oauth.github.clientID && index_1.default.oauth.github.clientSecret) {
        passport_1.default.use(new passport_github2_1.Strategy({
            clientID: index_1.default.oauth.github.clientID,
            clientSecret: index_1.default.oauth.github.clientSecret,
            callbackURL: index_1.default.oauth.github.callbackURL,
            scope: ['user:email']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
                if (!email) {
                    return done(new Error('Email not provided by GitHub'));
                }
                const userData = {
                    id: profile.id,
                    displayName: profile.displayName || profile.username || '',
                    email: email,
                    picture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                };
                const user = await findOrCreateUser(userData, 'github');
                return done(null, user);
            }
            catch (error) {
                return done(error);
            }
        }));
    }
    // JWT Strategy for API authentication
    passport_1.default.use(new passport_jwt_1.Strategy({
        jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
            passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            (req) => {
                if (req && req.cookies) {
                    return req.cookies['auth_token'];
                }
                return null;
            }
        ]),
        secretOrKey: index_1.default.jwt.secret,
        issuer: index_1.default.jwt.issuer,
        audience: index_1.default.jwt.audience
    }, async (payload, done) => {
        try {
            // Find user by ID from JWT payload
            const userResult = await db_1.default.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [payload.sub]);
            if (userResult.rows.length === 0) {
                return done(null, false);
            }
            return done(null, userResult.rows[0]);
        }
        catch (error) {
            return done(error, false);
        }
    }));
    // Serialize user to session
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    // Deserialize user from session
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const userResult = await db_1.default.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [id]);
            if (userResult.rows.length === 0) {
                return done(null, false);
            }
            return done(null, userResult.rows[0]);
        }
        catch (error) {
            return done(error, false);
        }
    });
    return passport_1.default;
}
