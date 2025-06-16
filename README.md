# Express.js Boilerplate

A minimal Express.js boilerplate with essential middleware and security features.

## Features

- Express.js latest version
- CORS enabled
- Helmet for security headers
- Morgan for HTTP request logging
- Environment variables support
- Error handling middleware
- Development mode with nodemon

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=3000
NODE_ENV=development
```

3. Start the server:
- Development mode: `npm run dev`
- Production mode: `npm start`

## API Endpoints

- `GET /`: Welcome message

## Project Structure

```
.
├── src/
│   └── index.js
├── .env
├── package.json
└── README.md
```
