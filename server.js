const express = require('express');
const app = express();
const PORT = 4000;

// Serve static files from the public folder
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});