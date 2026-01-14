import FocusGoal from '../models/FocusGoal.model.js';

// Get all focus goals
export const getAllFocusGoals = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const focusGoals = await FocusGoal.find(query).populate('userId', 'name email');
        res.json(focusGoals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single focus goal by ID
export const getFocusGoalById = async (req, res) => {
    try {
        const focusGoal = await FocusGoal.findById(req.params.id).populate('userId', 'name email');
        if (!focusGoal) {
            return res.status(404).json({ message: 'Focus goal not found' });
        }
        res.json(focusGoal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get focus goals by user ID
export const getFocusGoalsByUserId = async (req, res) => {
    try {
        const focusGoals = await FocusGoal.find({ userId: req.params.userId });
        res.json(focusGoals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new focus goal
export const createFocusGoal = async (req, res) => {
    try {
        const focusGoal = new FocusGoal(req.body);
        const savedFocusGoal = await focusGoal.save();
        res.status(201).json(savedFocusGoal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a focus goal
export const updateFocusGoal = async (req, res) => {
    try {
        const focusGoal = await FocusGoal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!focusGoal) {
            return res.status(404).json({ message: 'Focus goal not found' });
        }
        res.json(focusGoal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Partially update a focus goal
export const patchFocusGoal = async (req, res) => {
    try {
        const focusGoal = await FocusGoal.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!focusGoal) {
            return res.status(404).json({ message: 'Focus goal not found' });
        }
        res.json(focusGoal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a focus goal
export const deleteFocusGoal = async (req, res) => {
    try {
        const focusGoal = await FocusGoal.findByIdAndDelete(req.params.id);
        if (!focusGoal) {
            return res.status(404).json({ message: 'Focus goal not found' });
        }
        res.json({ message: 'Focus goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
