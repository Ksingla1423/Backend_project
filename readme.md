# VidVerse

VidVerse is a Node.js backend API for a video sharing platform, similar to YouTube. It supports user authentication, video uploads, comments, likes, playlists, subscriptions, and dashboard analytics. The backend is built with Express.js, MongoDB (via Mongoose), and integrates with Cloudinary for media storage.

---

## Features

- **User Authentication**: Register, login, and manage user profiles.
- **Video Management**: Upload, view, and delete videos.
- **Comments**: Add, view, and delete comments on videos.
- **Likes**: Like/unlike videos and view like counts.
- **Playlists**: Create and manage playlists.
- **Subscriptions**: Subscribe/unsubscribe to channels and view subscriber counts.
- **Dashboard**: Analytics and statistics for users and admins.
- **Cloudinary Integration**: Secure media uploads and deletions.
- **API Response Standardization**: Consistent API responses and error handling.

---

## Tech Stack

- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **Cloudinary** (for media storage)
- **JWT** (for authentication)
- **dotenv** (for environment variables)
- **Multer** (for file uploads)
- **CORS** (for cross-origin requests)

---

## Project Structure

```
Backend_Project/
│
├── public/                # Static files (e.g., images, temp uploads)
├── src/
│   ├── app.js             # Express app setup
│   ├── index.js           # Entry point
│   ├── constants.js       # App constants
│   ├── db/                # Database connection
│   ├── controllers/       # Route controllers (business logic)
│   ├── middlewares/       # Express middlewares (auth, multer, etc.)
│   ├── models/            # Mongoose models (User, Video, Comment, etc.)
│   ├── routes/            # Express route definitions
│   └── utils/             # Utility functions (API response, Cloudinary, etc.)
├── .env                   # Environment variables (not committed)
├── package.json
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/vibe-backend.git
cd VidVerse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add the following:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
REFRESH_TOKEN_EXPIRY=10d
```

### 4. Start the development server

```bash
npm run dev
```

The server will start on `http://localhost:8000`.

---

## API Endpoints

| Method | Endpoint                                 | Description                        |
|--------|------------------------------------------|------------------------------------|
| POST   | `/api/v1/users/register`                 | Register a new user                |
| POST   | `/api/v1/users/login`                    | User login                         |
| GET    | `/api/v1/video`                          | Get all videos                     |
| POST   | `/api/v1/video`                          | Upload a new video                 |
| POST   | `/api/v1/comments`                       | Add a comment                      |
| POST   | `/api/v1/likes`                          | Like a video                       |
| GET    | `/api/v1/likes/count`                    | Get like count for a video         |
| POST   | `/api/v1/subscriptions`                  | Subscribe to a channel             |
| GET    | `/api/v1/subscriber/subscribercount`     | Get subscriber count for a channel |
| ...    | ...                                      | ...                                |

> **Note:** For a full list of endpoints, see the `src/routes/` directory.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Cloudinary](https://cloudinary.com/)
- [Multer](https://github.com/expressjs/multer)
- [dotenv](https://github.com/motdotla/dotenv)

---

**Happy Coding!**

---

