import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// CRITICAL: Load environment variables FIRST before any dynamic imports
dotenv.config();

// Dynamic imports AFTER dotenv.config() to ensure env vars are loaded
const { default: connectDB } = await import('./config/db.config.js');
const { default: passport } = await import('./config/passport.config.js');
const { errorHandler, notFound } = await import('./middlewares/errorMiddleware.js');
const { apiRateLimit } = await import('./middlewares/rateLimitMiddleware.js');
const { default: authRoutes } = await import('./routes/Auth.routes.js');
const { default: userRoutes } = await import('./routes/user.routes.js');
const { default: blockedSiteRoutes } = await import('./routes/BlockedSite.routes.js');
const { default: focusSessionRoutes } = await import('./routes/FocusSession.routes.js');
const { default: focusGoalRoutes } = await import('./routes/FocusGoal.routes.js');
const { default: aiInsightRoutes } = await import('./routes/AIInsight.routes.js');
const { default: userSettingsRoutes } = await import('./routes/UserSettings.routes.js');
const { default: achievementRoutes } = await import('./routes/Achievement.routes.js');
const { default: usageMetricRoutes } = await import('./routes/UsageMetric.routes.js');
const { default: timeLimitRoutes } = await import('./routes/TimeLimit.routes.js');
const { default: scheduleRoutes } = await import('./routes/Schedule.routes.js');
const { default: customBlockPageRoutes } = await import('./routes/CustomBlockPage.routes.js');
const { default: gifSearchRoutes } = await import('./routes/GifSearch.routes.js');
const { default: quoteRoutes } = await import('./routes/Quote.routes.js');
const { default: challengeRoutes } = await import('./routes/Challenge.routes.js');
const { default: temporaryUnlockRoutes } = await import('./routes/TemporaryUnlock.routes.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Apply rate limiting to all API routes
app.use('/api', apiRateLimit);

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'AI-Powered Focus Blocker API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blocked-sites', blockedSiteRoutes);
app.use('/api/focus-sessions', focusSessionRoutes);
app.use('/api/focus-goals', focusGoalRoutes);
app.use('/api/ai-insights', aiInsightRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/usage-metrics', usageMetricRoutes);
app.use('/api/time-limits', timeLimitRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/custom-block-page', customBlockPageRoutes);
app.use('/api/gifs', gifSearchRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/temporary-unlocks', temporaryUnlockRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Connect to database
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

