import AIInsight from '../models/AIInsight.model.js';

// Get all AI insights
export const getAllAIInsights = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const aiInsights = await AIInsight.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(aiInsights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single AI insight by ID
export const getAIInsightById = async (req, res) => {
    try {
        const aiInsight = await AIInsight.findById(req.params.id)
            .populate('userId', 'name email');
        if (!aiInsight) {
            return res.status(404).json({ message: 'AI insight not found' });
        }
        res.json(aiInsight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get AI insights by user ID
export const getAIInsightsByUserId = async (req, res) => {
    try {
        const aiInsights = await AIInsight.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(aiInsights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get latest AI insight for a user
export const getLatestAIInsight = async (req, res) => {
    try {
        const latestInsight = await AIInsight.findOne({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        if (!latestInsight) {
            return res.status(404).json({ message: 'No AI insights found for this user' });
        }
        res.json(latestInsight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new AI insight
export const createAIInsight = async (req, res) => {
    try {
        const aiInsight = new AIInsight(req.body);
        const savedAIInsight = await aiInsight.save();
        res.status(201).json(savedAIInsight);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update an AI insight
export const updateAIInsight = async (req, res) => {
    try {
        const aiInsight = await AIInsight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!aiInsight) {
            return res.status(404).json({ message: 'AI insight not found' });
        }
        res.json(aiInsight);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Partially update an AI insight
export const patchAIInsight = async (req, res) => {
    try {
        const aiInsight = await AIInsight.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!aiInsight) {
            return res.status(404).json({ message: 'AI insight not found' });
        }
        res.json(aiInsight);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an AI insight
export const deleteAIInsight = async (req, res) => {
    try {
        const aiInsight = await AIInsight.findByIdAndDelete(req.params.id);
        if (!aiInsight) {
            return res.status(404).json({ message: 'AI insight not found' });
        }
        res.json({ message: 'AI insight deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
