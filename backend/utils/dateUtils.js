// Date utility functions

// Check if two dates are the same day
export const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

// Check if a date is yesterday
export const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date, yesterday);
};

// Check if a date is today
export const isToday = (date) => {
    return isSameDay(date, new Date());
};

// Get start of day
export const startOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Get end of day
export const endOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

// Get start of week (Monday)
export const startOfWeek = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return startOfDay(d);
};

// Get end of week (Sunday)
export const endOfWeek = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
    d.setDate(diff);
    return endOfDay(d);
};

// Get start of month
export const startOfMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setDate(1);
    return startOfDay(d);
};

// Get end of month
export const endOfMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return endOfDay(d);
};

// Format date to YYYY-MM-DD
export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format date to readable string
export const formatDateReadable = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Get days difference between two dates
export const getDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if date is within range
export const isDateInRange = (date, startDate, endDate) => {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
};

// Get date N days ago
export const getDaysAgo = (days, fromDate = new Date()) => {
    const date = new Date(fromDate);
    date.setDate(date.getDate() - days);
    return date;
};

// Get date N days from now
export const getDaysFromNow = (days, fromDate = new Date()) => {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + days);
    return date;
};
