// Quote Controller - Fetches random motivational quotes from local JSON file
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load quotes from JSON file
let quotesData = null;

const loadQuotes = async () => {
    if (!quotesData) {
        try {
            const quotesPath = join(__dirname, '../data/quotes.json');
            const fileContent = await readFile(quotesPath, 'utf-8');
            quotesData = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error loading quotes.json:', error);
            // Fallback quotes if file can't be loaded
            quotesData = {
                quotes: [
                    {
                        quote: "Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.",
                        author: "Unknown"
                    },
                    {
                        quote: "The way to get started is to quit talking and begin doing.",
                        author: "Walt Disney"
                    },
                    {
                        quote: "Don't watch the clock; do what it does. Keep going.",
                        author: "Sam Levenson"
                    },
                    {
                        quote: "The only way to do great work is to love what you do.",
                        author: "Steve Jobs"
                    }
                ]
            };
        }
    }
    return quotesData;
};

export const getRandomQuote = async (req, res) => {
    try {
        const data = await loadQuotes();
        const quotes = data.quotes || [];
        
        if (quotes.length === 0) {
            throw new Error('No quotes available');
        }
        
        // Get a random quote
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];
        
        res.json({ 
            quote: randomQuote.quote,
            author: randomQuote.author || 'Unknown'
        });
    } catch (error) {
        console.error('Quote fetch error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch random quote',
            quote: "Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.",
            author: 'Unknown'
        });
    }
};

export const getQuoteByCategory = async (req, res) => {
    try {
        const data = await loadQuotes();
        const quotes = data.quotes || [];
        
        if (quotes.length === 0) {
            throw new Error('No quotes available');
        }
        
        // Get a random quote (category filtering can be added later if needed)
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];
        
        res.json({ 
            quote: randomQuote.quote,
            author: randomQuote.author || 'Unknown'
        });
    } catch (error) {
        console.error('Quote fetch error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch quote',
            quote: "Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.",
            author: 'Unknown'
        });
    }
};
