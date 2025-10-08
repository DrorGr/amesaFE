const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the dist/demo directory
app.use(express.static(path.join(__dirname, 'dist/demo')));

// Handle Angular routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/demo/index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'amesa-frontend'
  });
});

app.listen(port, () => {
  console.log(`Amesa Frontend server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});


