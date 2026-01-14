// GIF Search Controller - Uses Giphy API
// Get a free API key from https://developers.giphy.com/

export const searchGifs = async (req, res) => {
    try {
        const { query, limit = 12 } = req.query;
        
        if (!query || !query.trim()) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Get Giphy API key from environment variable
        const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'YOUR_GIPHY_API_KEY';
        
        if (GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') {
            // If no API key, return instructions
            return res.status(503).json({ 
                message: 'GIF search requires Giphy API key. Please add GIPHY_API_KEY to your .env file.',
                instruction: 'Get a free API key from https://developers.giphy.com/'
            });
        }

        const response = await fetch(
            `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`
        );

        if (!response.ok) {
            throw new Error('Giphy API request failed');
        }

        const data = await response.json();
        res.json(data.data || []);
    } catch (error) {
        console.error('GIF search error:', error);
        res.status(500).json({ message: error.message || 'Failed to search GIFs' });
    }
};

export const getTrendingGifs = async (req, res) => {
    try {
        const { limit = 12 } = req.query;
        
        const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'YOUR_GIPHY_API_KEY';
        
        if (GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') {
            return res.status(503).json({ 
                message: 'GIF search requires Giphy API key. Please add GIPHY_API_KEY to your .env file.'
            });
        }

        const response = await fetch(
            `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
        );

        if (!response.ok) {
            throw new Error('Giphy API request failed');
        }

        const data = await response.json();
        res.json(data.data || []);
    } catch (error) {
        console.error('Trending GIFs error:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch trending GIFs' });
    }
};
