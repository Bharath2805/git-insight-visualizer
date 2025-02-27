const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Import routes
const githubRoutes = require('./routes/github');
const openaiRoutes = require('./routes/openai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(compression()); // Add compression for better performance
app.use(express.json());

// Serve static files with caching
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d',  // Cache static files for 1 day
    setHeaders: function (res, path) {
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Routes
app.use('/api/github', githubRoutes);
app.use('/api/openai', openaiRoutes);

// Catch-all route to serve the index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
    });
});