# URL Shortener

A modern URL shortener application built with Node.js, Express.js, and MySQL, featuring user authentication, social login, and a responsive web interface.

<img src="https://github.com/user-attachments/assets/4e10f539-4701-46d3-b97a-df13b606a6af" width="179" alt="download" />

## Features

### 🔗 URL Shortening
- Create short URLs with custom or auto-generated codes
- View and manage all your shortened links
- Edit existing URLs and short codes
- Delete unwanted links
- Pagination for large link collections

### 📱 QR Code Generation
- Generate QR codes for any URL or text
- Returns base64 encoded data URLs
- High error correction level for better readability
- JSON response format for easy integration
- Simple and lightweight implementation

### 🔐 Authentication & User Management
- **Local Authentication**: Register/login with email and password
- **Social Login**: Sign in with Google or GitHub OAuth
- **Email Verification**: Secure email verification system
- **Password Management**: Change password, reset forgotten passwords
- **Profile Management**: Update name and profile picture

### 🎨 User Interface
- Responsive design with modern styling
- Profile cards with user statistics
- Developer showcase page
- Mobile-friendly navigation
- Flash messages for user feedback

### 🛡️ Security Features
- JWT-based authentication with access and refresh tokens
- Password hashing with Argon2
- Session management
- Input validation with Zod
- Secure cookie handling
- CSRF protection

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Drizzle ORM
- **Authentication**: JWT, OAuth (Google/GitHub)
- **Password Hashing**: Argon2
- **Validation**: Zod
- **Email**: Nodemailer with MJML templates

### Frontend
- **Template Engine**: EJS
- **Styling**: Custom CSS with responsive design
- **Icons**: SVG icons
- **JavaScript**: Vanilla JS for interactivity

### Development Tools
- **Database Migrations**: Drizzle migrations
- **File Uploads**: Multer
- **Environment Management**: dotenv
- **Development**: Auto-reload with development scripts
- **QR Code Generation**: QRCode library for generating QR codes

## Project Structure

```
url-shortener/
├── auth_styles/          # Authentication page styles
├── config/               # Configuration files
│   ├── constants.js
│   ├── db.js
│   └── env.js
├── controllers/          # Route controllers
│   ├── auth.controller.js
│   └── postshortener.controller.js
├── drizzle/             # Database schema and migrations
├── lib/                 # Utility libraries
├── middlewares/         # Express middlewares
├── models/              # Data access layer
├── public/              # Static assets (CSS, images, uploads)
├── routes/              # Route definitions
├── validators/          # Input validation schemas
├── views/               # EJS templates
│   ├── auth/           # Authentication pages
│   └── partials/       # Reusable template parts
└── server.js           # Application entry point
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd url-shortener
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env-example .env
   ```
   
   Configure the following variables in `.env`:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=url_shortener
   
   # JWT
   JWT_SECRET=your_jwt_secret
   SECRET=your_session_secret
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # Email (for verification)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Optional: Seed with sample data
   npm run db:seed
   ```

5. **Create required directories**
   ```bash
   mkdir -p public/uploads/avatar
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

<b>LIVE LINK : </b> The application is available at `http://mayankrajtools.me`

## API Endpoints

### Authentication Routes
- `GET/POST /register` - User registration
- `GET/POST /login` - User login
- `GET /logout` - User logout
- `GET /profile` - User profile page
- `POST /change-name` - Update user name
- `GET/POST /change-profile` - Update profile with avatar
- `GET/POST /change-password` - Change password
- `GET/POST /forgot-password` - Password reset
- `GET /verify-email` - Email verification

### OAuth Routes
- `GET /google` - Google OAuth login
- `GET /google/callback` - Google OAuth callback
- `GET /github` - GitHub OAuth login
- `GET /github/callback` - GitHub OAuth callback

### URL Shortener Routes
- `GET /` - Homepage with URL form and links
- `POST /` - Create new short URL
- `GET /:shortCode` - Redirect to original URL
- `PATCH /edit/:id` - Edit existing short URL
- `DELETE /delete/:id` - Delete short URL
- `GET /dev` - Developers showcase page

### QR Code Generation Routes
- `GET /generate-qr` - Generate QR code and return as base64 data URL
  - **Parameters**:
    - `text` (required) - Content to encode in QR code
  - **Response**: JSON object with success status and base64 QR code data URL

## Database Schema

The application uses the following main tables:

### Users Table (`usersTable`)
- User authentication and profile information
- Supports both local and OAuth accounts

### Short Links Table (`short_link`)
- Stores URL mappings and user associations
- Tracks creation and update timestamps

### Sessions Table (`sessionsTable`)
- Manages user sessions with IP and user agent tracking

### OAuth Accounts Table (`oauthAccountsTable`)
- Links users with their OAuth provider accounts

## Key Features Implementation

### Authentication System
- **JWT Tokens**: Uses both access and refresh tokens for security
- **Session Management**: Tracks user sessions with automatic cleanup
- **Social Login**: Integrated Google and GitHub OAuth
- **Email Verification**: Secure email verification with token expiration

### URL Shortening Logic
- **Custom Codes**: Users can specify custom short codes
- **Auto-generation**: Automatic short code generation using crypto
- **Validation**: Input validation with `shortCodeSchema`
- **User Association**: Each short URL is tied to the creating user

### File Upload System
- **Avatar Upload**: Profile picture upload with image validation
- **File Management**: Automatic cleanup of old avatar files
- **Storage**: Uses `multer` for file handling

### Email System
- **MJML Templates**: Professional email templates
- **Verification**: Email verification for new accounts
- **Password Reset**: Secure password reset via email

## QR Code API Usage

### Basic QR Code Generation
```bash
GET /generate-qr?text=Hello%20World
```

### Example Response
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbM..."
}
```

### Usage in Frontend
```javascript
// Fetch QR code
fetch('/generate-qr?text=Hello%20World')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Use the base64 data URL directly in an img tag
      document.getElementById('qr-image').src = data.qrCode;
    }
  });
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | required | Content to encode in QR code |

### Response Format
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if QR generation was successful |
| `qrCode` | string | Base64 encoded data URL of the QR code image |
| `error` | string | Error message (only present when success is false) |

## Security Considerations

- **Password Security**: Argon2 hashing with salt
- **Token Security**: Short-lived access tokens with refresh mechanism
- **Input Validation**: Comprehensive validation using Zod schemas
- **File Upload Security**: Image type validation and size limits
- **Session Security**: IP and user agent tracking

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Author

**Mayank Raj** - Node.js/Express.js Developer

---

For more information about specific components, check the individual files in the project structure.