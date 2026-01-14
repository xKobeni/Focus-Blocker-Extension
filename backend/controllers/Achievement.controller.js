import Achievement from '../models/Achievement.model.js';

// Get all achievements
export const getAllAchievements = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const achievements = await Achievement.find(query)
            .populate('userId', 'name email')
            .sort({ unlockedAt: -1 });
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single achievement by ID
export const getAchievementById = async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id)
            .populate('userId', 'name email');
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        res.json(achievement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get achievements by user ID
export const getAchievementsByUserId = async (req, res) => {
    try {
        const achievements = await Achievement.find({ userId: req.params.userId })
            .sort({ unlockedAt: -1 });
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new achievement
export const createAchievement = async (req, res) => {
    try {
        const achievement = new Achievement(req.body);
        const savedAchievement = await achievement.save();
        res.status(201).json(savedAchievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update an achievement
export const updateAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        res.json(achievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Partially update an achievement
export const patchAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        res.json(achievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an achievement
export const deleteAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findByIdAndDelete(req.params.id);
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }
        res.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
