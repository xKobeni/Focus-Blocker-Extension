import CustomBlockPage from '../models/CustomBlockPage.model.js';

// Get custom block page for a user
export const getCustomBlockPage = async (req, res) => {
    try {
        // Use authenticated user's ID from middleware (for /me endpoint)
        // Or from params (for /user/:userId endpoint)
        const userId = req.user?.userId || req.params.userId;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        let blockPage = await CustomBlockPage.findOne({ userId });
        
        if (!blockPage) {
            // Create default if doesn't exist
            blockPage = new CustomBlockPage({ userId });
            await blockPage.save();
        }
        
        // Only return if active (unless it's the default we just created)
        if (blockPage.isActive === false && blockPage.createdAt.getTime() !== blockPage.updatedAt.getTime()) {
            return res.json({
                ...blockPage.toObject(),
                isActive: false,
                message: 'Custom block page is inactive'
            });
        }
        
        res.json(blockPage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create or update custom block page
export const upsertCustomBlockPage = async (req, res) => {
    try {
        const { userId } = req.params;
        const blockPage = await CustomBlockPage.findOneAndUpdate(
            { userId },
            { ...req.body, updatedAt: new Date() },
            { new: true, upsert: true, runValidators: true }
        );
        res.json(blockPage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete custom block page
export const deleteCustomBlockPage = async (req, res) => {
    try {
        const { userId } = req.params;
        await CustomBlockPage.findOneAndDelete({ userId });
        res.json({ message: 'Custom block page deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
