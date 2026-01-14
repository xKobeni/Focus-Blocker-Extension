import BlockedSite from '../models/BlockedSite.model.js';

// Get all blocked sites
export const getAllBlockedSites = async (req, res) => {
    try {
        const { userId } = req.query;
        // If userId is provided in query, use it; otherwise use authenticated user's ID
        const targetUserId = userId || (req.user && req.user.userId);
        const query = { isActive: true };
        if (targetUserId) {
            query.userId = targetUserId;
        }
        const blockedSites = await BlockedSite.find(query).populate('userId', 'name email');
        res.json(blockedSites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single blocked site by ID
export const getBlockedSiteById = async (req, res) => {
    try {
        const blockedSite = await BlockedSite.findById(req.params.id).populate('userId', 'name email');
        if (!blockedSite) {
            return res.status(404).json({ message: 'Blocked site not found' });
        }
        res.json(blockedSite);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get blocked sites by user ID
export const getBlockedSitesByUserId = async (req, res) => {
    try {
        const blockedSites = await BlockedSite.find({ 
            userId: req.params.userId,
            isActive: true 
        });
        res.json(blockedSites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new blocked site
export const createBlockedSite = async (req, res) => {
    try {
        const blockedSite = new BlockedSite(req.body);
        const savedBlockedSite = await blockedSite.save();
        res.status(201).json(savedBlockedSite);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a blocked site
export const updateBlockedSite = async (req, res) => {
    try {
        const blockedSite = await BlockedSite.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!blockedSite) {
            return res.status(404).json({ message: 'Blocked site not found' });
        }
        res.json(blockedSite);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Partially update a blocked site
export const patchBlockedSite = async (req, res) => {
    try {
        const blockedSite = await BlockedSite.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!blockedSite) {
            return res.status(404).json({ message: 'Blocked site not found' });
        }
        res.json(blockedSite);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a blocked site
export const deleteBlockedSite = async (req, res) => {
    try {
        const blockedSite = await BlockedSite.findByIdAndDelete(req.params.id);
        if (!blockedSite) {
            return res.status(404).json({ message: 'Blocked site not found' });
        }
        res.json({ message: 'Blocked site deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
