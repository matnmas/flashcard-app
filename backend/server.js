const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initializeTables } = require('./config/db');

// Cobits Study Flashcard App
// Handles for DynamoDB

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

console.log('AWS Configuration:', {
  region: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Cobits Study API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/decks', require('./routes/decks'));
app.use('/api/folders', require('./routes/folders'));

app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Initialize DynamoDB
initializeTables()
  .then(() => {
    console.log('DynamoDB tables initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize DynamoDB tables:', err);
    process.exit(1);
  });
