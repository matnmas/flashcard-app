const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dynamoDB } = require('../config/db');

// @route   GET api/decks
// @desc    Get all decks for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const params = {
      TableName: 'CobitsDecks',
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': req.user.id
      }
    };

    const result = await dynamoDB.query(params).promise();
    res.json(result.Items);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/decks/:id
// @desc    Get deck by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const params = {
      TableName: 'CobitsDecks',
      Key: {
        deckId: req.params.id
      }
    };

    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ msg: 'Deck not found' });
    }

    // Check if the deck belongs to the user
    if (result.Item.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(result.Item);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/decks
// @desc    Create a new deck
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, folderName, flashcards } = req.body;

  try {
    const deckId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    const params = {
      TableName: 'CobitsDecks',
      Item: {
        deckId,
        userId: req.user.id,
        title: title || 'Untitled Deck',
        folderName: folderName || null,
        flashcards: flashcards || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    await dynamoDB.put(params).promise();
    res.json(params.Item);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT api/decks/:id
// @desc    Update a deck
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, folderName, flashcards } = req.body;

  try {
    // Check if deck exists and belongs to user
    const getParams = {
      TableName: 'CobitsDecks',
      Key: {
        deckId: req.params.id
      }
    };

    const result = await dynamoDB.get(getParams).promise();
    
    if (!result.Item) {
      return res.status(404).json({ msg: 'Deck not found' });
    }

    if (result.Item.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update the deck
    const updateParams = {
      TableName: 'CobitsDecks',
      Key: {
        deckId: req.params.id
      },
      UpdateExpression: 'set title = :title, folderName = :folderName, flashcards = :flashcards, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': title || result.Item.title,
        ':folderName': folderName !== undefined ? folderName : result.Item.folderName,
        ':flashcards': flashcards || result.Item.flashcards,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const updateResult = await dynamoDB.update(updateParams).promise();
    res.json(updateResult.Attributes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE api/decks/:id
// @desc    Delete a deck
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if deck exists and belongs to user
    const getParams = {
      TableName: 'CobitsDecks',
      Key: {
        deckId: req.params.id
      }
    };

    const result = await dynamoDB.get(getParams).promise();
    
    if (!result.Item) {
      return res.status(404).json({ msg: 'Deck not found' });
    }

    if (result.Item.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete the deck
    const deleteParams = {
      TableName: 'CobitsDecks',
      Key: {
        deckId: req.params.id
      }
    };

    await dynamoDB.delete(deleteParams).promise();
    res.json({ msg: 'Deck removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
