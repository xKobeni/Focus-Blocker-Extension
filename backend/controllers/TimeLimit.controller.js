import TimeLimit from '../models/TimeLimit.model.js';

// Get all time limits for a user
export const getUserTimeLimits = async (req, res) => {
    try {
        const { userId } = req.params;
        const timeLimits = await TimeLimit.find({ userId, isActive: true });
        res.json(timeLimits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single time limit
export const getTimeLimitById = async (req, res) => {
    try {
        const timeLimit = await TimeLimit.findById(req.params.id);
        if (!timeLimit) {
            return res.status(404).json({ message: 'Time limit not found' });
        }
        res.json(timeLimit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new time limit
export const createTimeLimit = async (req, res) => {
    try {
        const timeLimit = new TimeLimit(req.body);
        await timeLimit.save();
        res.status(201).json(timeLimit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a time limit
export const updateTimeLimit = async (req, res) => {
    try {
        const timeLimit = await TimeLimit.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!timeLimit) {
            return res.status(404).json({ message: 'Time limit not found' });
        }
        res.json(timeLimit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update time used for a time limit
export const updateTimeUsed = async (req, res) => {
    try {
        const { timeUsed } = req.body;
        const timeLimit = await TimeLimit.findById(req.params.id);
        
        if (!timeLimit) {
            return res.status(404).json({ message: 'Time limit not found' });
        }
        
        // Check if we need to reset (new day)
        const now = new Date();
        const lastReset = new Date(timeLimit.lastResetDate);
        const isNewDay = now.toDateString() !== lastReset.toDateString();
        
        if (isNewDay) {
            timeLimit.timeUsedToday = 0;
            timeLimit.lastResetDate = now;
        }
        
        timeLimit.timeUsedToday += timeUsed || 0;
        timeLimit.updatedAt = now;
        await timeLimit.save();
        
        res.json(timeLimit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a time limit
export const deleteTimeLimit = async (req, res) => {
    try {
        const timeLimit = await TimeLimit.findByIdAndDelete(req.params.id);
        if (!timeLimit) {
            return res.status(404).json({ message: 'Time limit not found' });
        }
        res.json({ message: 'Time limit deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reset all time limits for a user (daily reset)
export const resetTimeLimits = async (req, res) => {
    try {
        const { userId } = req.params;
        await TimeLimit.updateMany(
            { userId },
            { 
                timeUsedToday: 0,
                lastResetDate: new Date(),
                updatedAt: new Date()
            }
        );
        res.json({ message: 'Time limits reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
