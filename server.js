const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static HTML
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>FixYourCV</title>
            </head>
            <body>
                <h1>Welcome to FixYourCV</h1>
                <p>This is the main page.</p>
            </body>
        </html>
    `);
});

// API endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Hello from the API!',
        status: 'success',
        timestamp: new Date(),
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
