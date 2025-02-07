# Authentication API Project

A simple authentication API built with Express.js, JWT, and bcrypt.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Register a new user
- **POST** `/auth/register`
- Body: `{ "username": "user", "email": "user@example.com", "password": "password123" }`

### Login
- **POST** `/auth/login`
- Body: `{ "login": "user", "password": "password123" }`
- Note: The login field can be either username or email

### Get user profile (Protected route)
- **GET** `/auth/profile`
- Headers: `Authorization: Bearer <your_jwt_token>`

## Security Note
The JWT secret in `authRouter.js` should be changed to a secure value in production.
