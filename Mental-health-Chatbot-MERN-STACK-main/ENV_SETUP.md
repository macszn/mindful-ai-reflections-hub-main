# Environment Variables Setup

This document explains how to set up environment variables for the Mental Health Chatbot MERN Stack application.

## Backend Environment Variables

Create a `.env` file in the `Backend` directory with the following variables:

```
# MongoDB Connection String
MONGODB_URI=mongodb+srv://yourMongoUsername:yourMongoPassword@yourCluster.mongodb.net/healthbot

# Google Generative AI API Key (Gemini)
API_KEY=your_gemini_api_key

# JWT Secret for Authentication
JWT_SECRET=your_jwt_secret

# Port for Backend Server
PORT=4000
```

### Variable Descriptions:

- **MONGODB_URI**: Your MongoDB connection string. You can get this from MongoDB Atlas or your MongoDB hosting provider.
- **API_KEY**: Gemini AI API key from Google's Generative AI service. Get this at [Google AI Studio](https://makersuite.google.com/app/apikey).
- **JWT_SECRET**: A secret key used for signing and verifying JSON Web Tokens for authentication. This can be any random string, but it's recommended to use a long, complex string for security purposes.
- **PORT**: The port on which the backend server will run.

## Frontend Environment Variables

Create a `.env` file in the `chatbot` directory with the following variables:

```
# Backend API URL
REACT_APP_API_URL=http://localhost:4000

# Firebase Config (if needed in the future)
# REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
# REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
# REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
# REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
# REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

### Variable Descriptions:

- **REACT_APP_API_URL**: The URL where your backend server is running. In development, this will typically be `http://localhost:4000`.
- **Firebase Config**: These variables are commented out as they're not currently used but may be needed if Firebase is integrated in the future.

## Important Notes

1. Never commit your `.env` files to version control systems like Git. They contain sensitive information.
2. Ensure the `.env` files are included in your `.gitignore` file.
3. When deploying to production, set these environment variables in your hosting platform's configuration rather than relying on `.env` files.
4. For local development, you need to restart the server after changing environment variables.

## Getting API Keys

- **MongoDB**: Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- **Google Generative AI**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey) 