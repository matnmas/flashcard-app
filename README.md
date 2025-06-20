# Cobits Study - Flashcard Application

## Overview
Cobits Study is a comprehensive flashcard application designed to help users create, organize, and study flashcards efficiently. The application has been migrated from using localStorage to a robust AWS-backed architecture with DynamoDB for data persistence, Node.js backend API, and secure user authentication.

## Features
- User authentication with secure password hashing and JWT tokens
- Create, edit, and organize flashcard decks
- Group decks into folders for better organization
- Study flashcards with spaced repetition
- Responsive design that works on desktop and mobile devices

## Architecture
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: Node.js with Express.js
- **Database**: AWS DynamoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing

## Project Structure
```
/FLASHCARD_APP
  ├── backend/            # Node.js backend API
  │   ├── config/        # Configuration files
  │   ├── middleware/    # Express middleware
  │   ├── routes/        # API routes
  │   ├── .env           # Environment variables
  │   ├── package.json   # Backend dependencies
  │   └── server.js      # Main server file
  ├── js/                # Frontend JavaScript
  │   ├── api.js         # API client for backend communication
  │   ├── script.js      # Authentication handling
  │   └── ...           # Other frontend scripts
  ├── css/               # Stylesheets
  ├── *.html             # Frontend HTML pages
  └── README.md          # This documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- AWS Account with DynamoDB access
- AWS CLI configured (for local development)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd FLASHCARD_APP/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables by editing the `.env` file:
   ```
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key

   # JWT Secret for authentication
   JWT_SECRET=your_jwt_secret_key

   # Server configuration
   PORT=3000

   # CORS configuration (for development)
   CORS_ORIGIN=http://localhost:5500
   ```

4. Start the backend server:
   ```
   npm start
   ```
   The server will run on http://localhost:3000 by default.

### Frontend Setup
1. The frontend is static HTML/CSS/JS and can be served using any web server.
2. For development, you can use the Live Server extension in VS Code or any simple HTTP server.
3. Make sure the API URL in `js/api.js` points to your backend server.

## Deployment

### Backend Deployment Options
- **EC2**: Deploy as a Node.js application on an EC2 instance
- **Serverless**: Use AWS Lambda with API Gateway

### Frontend Deployment Options
- **S3**: Host static files on Amazon S3
- **CloudFront**: Use CloudFront as a CDN in front of S3

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/user` - Get current user data (requires authentication)

### Decks
- `GET /api/decks` - Get all decks for the current user
- `GET /api/decks/:id` - Get a specific deck
- `POST /api/decks` - Create a new deck
- `PUT /api/decks/:id` - Update a deck
- `DELETE /api/decks/:id` - Delete a deck

### Folders
- `GET /api/folders` - Get all folders for the current user
- `POST /api/folders` - Create a new folder
- `DELETE /api/folders/:name` - Delete a folder

## Security Considerations
- Passwords are hashed using bcrypt before storing in DynamoDB
- JWT tokens are used for stateless authentication
- API endpoints are protected by authentication middleware
- CORS is configured to restrict access to the API

## Future Enhancements
- Implement spaced repetition algorithm for better learning
- Add support for images and rich text in flashcards
- Implement sharing and collaboration features
- Add analytics to track study progress

## License
This project is licensed under the MIT License.
