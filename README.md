
# BookSwap Marketplace - MERN Stack

A complete book exchange platform where users can post books, request books from others, and manage their book inventory.

## 🚀 Features

- **Email OTP Authentication**: Secure signup process with email verification
- **JWT Authentication**: Access and refresh tokens for secure API access
- **Book Management**: Post, edit, delete books with image uploads
- **Request System**: Request books from other users with approval workflow
- **User Dashboard**: View all available books and manage personal inventory
- **Real-time Notifications**: Toast notifications for all user actions

## 📋 Tech Stack

**Frontend:**
- React.js (Functional Components + Hooks)
- Tailwind CSS
- React Hot Toast
- Axios for API calls

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (Email OTP)
- Winston (Logging)
- Multer (File uploads)


## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and complete signup
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Books
- `GET /api/books` - Get all books (except user's own)
- `GET /api/books/my-books` - Get user's books
- `POST /api/books` - Create new book
- `PUT /api/books/:id` - Update book (owner only)
- `DELETE /api/books/:id` - Delete book (owner only)

### Requests
- `POST /api/requests` - Create book request
- `GET /api/requests/sent` - Get sent requests
- `GET /api/requests/received` - Get received requests
- `PUT /api/requests/:id` - Update request status
- `DELETE /api/requests/:id` - Cancel request



## 📝 Usage Flow

1. **Signup**: Enter email → Receive OTP → Verify OTP → Set password
2. **Login**: Email + password → Access dashboard
3. **Post Books**: Add books with title, author, condition, and image
4. **Browse Books**: View all available books from other users
5. **Request Books**: Send request to book owners
6. **Manage Requests**: Accept/decline requests for your books
7. **Track Status**: Monitor sent requests and their statuses

## 🐛 Troubleshooting

## 🧪 Testing

The application includes comprehensive error handling and logging. Check the `logs/` directory for application logs.

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File upload restrictions
- Rate limiting on sensitive endpoints
- CORS configuration
- Environment variable protection

## 📞 Support

For issues or questions, please check the logs in the `backend/logs/` directory for detailed error information.