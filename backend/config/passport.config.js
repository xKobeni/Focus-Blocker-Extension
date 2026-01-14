import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model.js';
import { generateToken } from '../utils/token.js';

// Configure Google OAuth Strategy
// Enable/disable with GOOGLE_OAUTH_ENABLED=true/false in .env
const isGoogleOAuthEnabled = process.env.GOOGLE_OAUTH_ENABLED === 'true';
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleOAuthEnabled && hasGoogleCredentials) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        // User exists, return user
                        return done(null, user);
                    }

                    // Check if user exists with this email
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // User exists with email but no Google ID, link the account
                        user.googleId = profile.id;
                        if (!user.name && profile.displayName) {
                            user.name = profile.displayName;
                        }
                        await user.save();
                        return done(null, user);
                    }

                    // Create new user
                    user = new User({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName || profile.emails[0].value.split('@')[0],
                        password: null, // No password for OAuth users
                        role: 'user'
                    });

                    await user.save();
                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
}

// Note: We're not using sessions, so serialize/deserialize are not needed
// But keeping them for compatibility in case you want to add sessions later

export default passport;
