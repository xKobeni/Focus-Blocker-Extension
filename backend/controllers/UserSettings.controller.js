import UserSettings from '../models/UserSettings.model.js';

// Get all user settings
export const getAllUserSettings = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const userSettings = await UserSettings.find(query).populate('userId', 'name email');
        res.json(userSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single user setting by ID
export const getUserSettingsById = async (req, res) => {
    try {
        const userSetting = await UserSettings.findById(req.params.id)
            .populate('userId', 'name email');
        if (!userSetting) {
            return res.status(404).json({ message: 'User settings not found' });
        }
        res.json(userSetting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user settings by user ID
export const getUserSettingsByUserId = async (req, res) => {
    try {
        const userSettings = await UserSettings.findOne({ userId: req.params.userId });
        if (!userSettings) {
            return res.status(404).json({ message: 'User settings not found for this user' });
        }
        res.json(userSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new user settings
export const createUserSettings = async (req, res) => {
    try {
        const userSettings = new UserSettings(req.body);
        const savedUserSettings = await userSettings.save();
        res.status(201).json(savedUserSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update user settings
export const updateUserSettings = async (req, res) => {
    try {
        const userSettings = await UserSettings.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!userSettings) {
            return res.status(404).json({ message: 'User settings not found' });
        }
        res.json(userSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Partially update user settings
export const patchUserSettings = async (req, res) => {
    try {
        const userSettings = await UserSettings.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!userSettings) {
            return res.status(404).json({ message: 'User settings not found' });
        }
        res.json(userSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Upsert user settings by user ID
export const upsertUserSettingsByUserId = async (req, res) => {
    try {
        const userSettings = await UserSettings.findOneAndUpdate(
            { userId: req.params.userId },
            req.body,
            { new: true, upsert: true, runValidators: true }
        );
        res.json(userSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete user settings
export const deleteUserSettings = async (req, res) => {
    try {
        const userSettings = await UserSettings.findByIdAndDelete(req.params.id);
        if (!userSettings) {
            return res.status(404).json({ message: 'User settings not found' });
        }
        res.json({ message: 'User settings deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
