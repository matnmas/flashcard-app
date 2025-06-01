const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dynamoDB } = require('../config/db');

// @route   GET api/folders
// @desc    Get all folders for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const params = {
      TableName: 'CobitsFolders',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': req.user.id
      }
    };

    const result = await dynamoDB.query(params).promise();
    res.json(result.Items.map(item => item.folderName));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/folders
// @desc    Create a new folder
// @access  Private
router.post('/', auth, async (req, res) => {
  const { folderName } = req.body;

  if (!folderName || folderName.trim() === '') {
    return res.status(400).json({ msg: 'Folder name is required' });
  }

  try {
    // Check if folder already exists for this user
    const checkParams = {
      TableName: 'CobitsFolders',
      Key: {
        userId: req.user.id,
        folderName: folderName.trim()
      }
    };

    const existingFolder = await dynamoDB.get(checkParams).promise();
    
    if (existingFolder.Item) {
      return res.status(400).json({ msg: 'Folder with this name already exists' });
    }

    // Create the folder
    const params = {
      TableName: 'CobitsFolders',
      Item: {
        userId: req.user.id,
        folderName: folderName.trim(),
        createdAt: new Date().toISOString()
      }
    };

    await dynamoDB.put(params).promise();
    res.json({ folderName: folderName.trim() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE api/folders/:name
// @desc    Delete a folder
// @access  Private
router.delete('/:name', auth, async (req, res) => {
  try {
    // Check if folder exists
    const folderName = decodeURIComponent(req.params.name);
    
    const checkParams = {
      TableName: 'CobitsFolders',
      Key: {
        userId: req.user.id,
        folderName: folderName
      }
    };

    const existingFolder = await dynamoDB.get(checkParams).promise();
    
    if (!existingFolder.Item) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    // Delete the folder
    await dynamoDB.delete(checkParams).promise();

    // Update all decks in this folder to have no folder
    const decksParams = {
      TableName: 'CobitsDecks',
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'folderName = :folderName',
      ExpressionAttributeValues: {
        ':userId': req.user.id,
        ':folderName': folderName
      }
    };

    const decksResult = await dynamoDB.query(decksParams).promise();
    
    // Update each deck to remove the folder association
    const updatePromises = decksResult.Items.map(deck => {
      const updateParams = {
        TableName: 'CobitsDecks',
        Key: {
          deckId: deck.deckId
        },
        UpdateExpression: 'set folderName = :folderName, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':folderName': null,
          ':updatedAt': new Date().toISOString()
        }
      };
      return dynamoDB.update(updateParams).promise();
    });

    await Promise.all(updatePromises);
    
    res.json({ msg: 'Folder removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT api/folders/:name
// @desc    Rename a folder
// @access  Private
router.put('/:name', auth, async (req, res) => {
  try {
    const oldFolderName = decodeURIComponent(req.params.name);
    const { newFolderName } = req.body;

    if (!newFolderName || newFolderName.trim() === '') {
      return res.status(400).json({ msg: 'New folder name is required' });
    }

    // Check if old folder exists
    const checkOldParams = {
      TableName: 'CobitsFolders',
      Key: {
        userId: req.user.id,
        folderName: oldFolderName
      }
    };

    const existingFolder = await dynamoDB.get(checkOldParams).promise();
    
    if (!existingFolder.Item) {
      return res.status(404).json({ msg: 'Folder not found' });
    }

    // Check if new folder name already exists
    const checkNewParams = {
      TableName: 'CobitsFolders',
      Key: {
        userId: req.user.id,
        folderName: newFolderName.trim()
      }
    };

    const newFolderExists = await dynamoDB.get(checkNewParams).promise();
    
    if (newFolderExists.Item) {
      return res.status(400).json({ msg: 'A folder with this name already exists' });
    }

    // Create new folder with the new name
    const createParams = {
      TableName: 'CobitsFolders',
      Item: {
        userId: req.user.id,
        folderName: newFolderName.trim(),
        createdAt: existingFolder.Item.createdAt 
      }
    };

    await dynamoDB.put(createParams).promise();

    // Delete the old folder
    await dynamoDB.delete(checkOldParams).promise();

    // Update all decks in this folder to have the new folder name
    const decksParams = {
      TableName: 'CobitsDecks',
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'folderName = :folderName',
      ExpressionAttributeValues: {
        ':userId': req.user.id,
        ':folderName': oldFolderName
      }
    };

    const decksResult = await dynamoDB.query(decksParams).promise();
    
    // Update each deck to use the new folder name
    const updatePromises = decksResult.Items.map(deck => {
      const updateParams = {
        TableName: 'CobitsDecks',
        Key: {
          deckId: deck.deckId
        },
        UpdateExpression: 'set folderName = :newFolderName, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':newFolderName': newFolderName.trim(),
          ':updatedAt': new Date().toISOString()
        }
      };
      return dynamoDB.update(updateParams).promise();
    });

    await Promise.all(updatePromises);
    
    res.json({ oldFolderName, newFolderName: newFolderName.trim() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
