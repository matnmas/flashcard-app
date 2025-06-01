const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { dynamoDB } = require('../config/db');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user already exists
    const params = {
      TableName: 'CobitsUsers',
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    };

    const result = await dynamoDB.scan(params).promise();
    
    if (result.Items && result.Items.length > 0) {
      return res.status(400).json({ msg: 'Username already exists', field: 'username' });
    }

    // Create user ID
    const userId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in DynamoDB
    const userParams = {
      TableName: 'CobitsUsers',
      Item: {
        userId,
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }
    };

    await dynamoDB.put(userParams).promise();

    // Create and return JWT
    const payload = {
      user: {
        id: userId,
        username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'cobitssecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const params = {
      TableName: 'CobitsUsers',
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    };

    const result = await dynamoDB.scan(params).promise();
    
    if (!result.Items || result.Items.length === 0) {
      console.log('Login failed: No account with username', username);
      return res.status(400).json({ 
        msg: 'No account exists with this username', 
        field: 'username', 
        error: 'No account exists with this username' 
      });
    }

    const user = result.Items[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Login failed: Incorrect password for user', username);
      return res.status(400).json({ 
        msg: 'Password is incorrect', 
        field: 'password', 
        error: 'Password is incorrect' 
      });
    }

    // Create and return JWT
    const payload = {
      user: {
        id: user.userId,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'cobitssecret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, username: user.username });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const params = {
      TableName: 'CobitsUsers',
      Key: {
        userId: req.user.id
      },
      ProjectionExpression: 'userId, username, createdAt'
    };

    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(result.Item);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/auth/check-username/:username
// @desc    Check if a username exists
// @access  Public
router.get('/check-username/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // Check if user exists
    const params = {
      TableName: 'CobitsUsers',
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    };

    const result = await dynamoDB.scan(params).promise();
    
    res.json({
      exists: result.Items && result.Items.length > 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
