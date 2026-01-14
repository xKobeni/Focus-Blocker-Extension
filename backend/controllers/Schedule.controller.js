import Schedule from '../models/Schedule.model.js';

// Get all schedules for a user
export const getUserSchedules = async (req, res) => {
    try {
        const { userId } = req.params;
        const schedules = await Schedule.find({ userId })
            .populate('siteIds')
            .sort({ createdAt: -1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get active schedules for a user
export const getActiveSchedules = async (req, res) => {
    try {
        const { userId } = req.params;
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
        const schedules = await Schedule.find({
            userId,
            isActive: true,
            daysOfWeek: currentDay
        }).populate('siteIds');
        
        // Filter by time range
        const activeSchedules = schedules.filter(schedule => {
            return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
        });
        
        res.json(activeSchedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single schedule
export const getScheduleById = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id).populate('siteIds');
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new schedule
export const createSchedule = async (req, res) => {
    try {
        const schedule = new Schedule(req.body);
        await schedule.save();
        res.status(201).json(schedule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a schedule
export const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('siteIds');
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json(schedule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a schedule
export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
