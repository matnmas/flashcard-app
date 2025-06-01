// api.js - Central file for all API calls to the backend

// Environment configuration
const ENV = {
  development: {
    API_URL: 'http://localhost:3000/api'
  },
  production: {
    // Update this URL when deploying to production
    API_URL: 'https://your-api-domain.com/api'
  }
};

// Set current environment - change to 'production' when deploying
const CURRENT_ENV = 'development';

// Base API URL - automatically selected based on environment
const API_URL = ENV[CURRENT_ENV].API_URL;

// Helper function for making API requests
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  const config = {
    method,
    headers
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`Making API request to ${endpoint}`, { method, data });
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Try to parse as JSON, but handle text responses too
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { error: text };
    }
    
    console.log(`Response from ${endpoint}:`, responseData);
    
    if (!response.ok) {
      console.error(`API error (${response.status}): ${JSON.stringify(responseData)}`);
      
      throw responseData;
    }

    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

const auth = {
  // Register a new user
  register: async (username, password) => {
    return apiRequest('/auth/register', 'POST', { username, password });
  },

  // Login a user
  login: async (username, password) => {
    return apiRequest('/auth/login', 'POST', { username, password });
  },

  // Get current user data
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      return await apiRequest('/auth/user', 'GET', null, token);
    } catch (error) {
      localStorage.removeItem('token');
      return null;
    }
  }
};

const decks = {
  getAllDecks: async () => {
    const token = localStorage.getItem('token');
    return apiRequest('/decks', 'GET', null, token);
  },

  // Get a specific deck by ID
  getDeck: async (deckId) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/decks/${deckId}`, 'GET', null, token);
  },

  // Create a new deck
  createDeck: async (deckData) => {
    const token = localStorage.getItem('token');
    return apiRequest('/decks', 'POST', deckData, token);
  },

  // Update an existing deck
  updateDeck: async (deckId, deckData) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/decks/${deckId}`, 'PUT', deckData, token);
  },

  // Delete a deck
  deleteDeck: async (deckId) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/decks/${deckId}`, 'DELETE', null, token);
  }
};

const folders = {
  // Get all folders
  getAllFolders: async () => {
    const token = localStorage.getItem('token');
    return apiRequest('/folders', 'GET', null, token);
  },

  // Create a new folder
  createFolder: async (folderName) => {
    const token = localStorage.getItem('token');
    return apiRequest('/folders', 'POST', { folderName }, token);
  },

  // Delete a folder
  deleteFolder: async (folderName) => {
    const token = localStorage.getItem('token');
    return apiRequest(`/folders/${encodeURIComponent(folderName)}`, 'DELETE', null, token);
  }
};

const api = {
  auth,
  decks,
  folders
};

window.api = api;
