# Speech to PDF Converter

A full-stack web application for converting audio files to PDF and Word documents with transcription using Deepgram API.

![Speech to PDF Interface](assets/interface.png)

## Features

- 🎤 Audio file upload (MP3, WAV, M4A, FLAC, AAC, OGG, MP4, WebM, etc.)
- 📝 Automatic transcription with speaker diarization
- 📄 Export to PDF, DOCX, and TXT formats
- 🔒 Secure authentication system
- 📁 File management with rename and delete capabilities
- ⚡ Real-time processing status updates
- 🎨 Clean, responsive UI

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Deepgram SDK
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT tokens

## Prerequisites

- Python 3.8+
- Node.js 16+
- Deepgram API key ([Get one here](https://deepgram.com))

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file from the example:
```bash
cp .env.example .env
```

5. Edit `.env` and add your Deepgram API key:
```env
DEEPGRAM_API_KEY=your-deepgram-api-key-here
SECRET_KEY=your-secret-key-here  # Generate a secure random key
```

6. Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file from the example:
```bash
cp .env.local.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Initial Setup

1. First, initialize the database with the default admin account:
```bash
cd backend
python init_db.py
```

This creates a default admin account:
- **Username**: admin
- **Password**: admin

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## Usage

1. Open the application at `http://localhost:3000`
2. Login with your credentials (default: admin/admin)
3. Admin users can:
   - Access the Admin panel from the navigation bar
   - Create new user accounts
   - Manage existing users (activate/deactivate, grant admin rights, reset passwords)
   - Delete user accounts
4. Regular users can:
   - Upload one or multiple audio files by dragging and dropping
   - Wait for processing to complete (status updates in real-time)
   - Download the converted files in PDF, DOCX, or TXT format
   - Rename files by clicking the edit icon
   - Delete their own conversions

## User Management

### Creating Users (Admin Only)
1. Login as an admin user
2. Click "Admin" in the navigation bar
3. Click "Create User" button
4. Fill in the user details:
   - Email address
   - Username
   - Password
   - Admin privileges (optional)
5. Click "Create User"

### Managing Users (Admin Only)
- **Edit User**: Click the pencil icon to modify user status or admin rights
- **Reset Password**: Click the key icon to set a new password for a user
- **Delete User**: Click the trash icon to remove a user (this also deletes their conversions)

**Note**: Public registration is disabled. Only administrators can create new user accounts.

## Deployment

### Backend Deployment (Render/Railway/Heroku)

1. Set up environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `DEEPGRAM_API_KEY`: Your Deepgram API key
   - `SECRET_KEY`: A secure random string
   - `CORS_ORIGINS`: Your frontend URL (comma-separated if multiple)

2. Deploy using your platform's deployment method

3. For PostgreSQL, update `DATABASE_URL` format:
```
postgresql://user:password@host:port/database
```

### Frontend Deployment (Vercel)

1. Push your code to GitHub

2. Import the project in Vercel

3. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

4. Deploy:
```bash
npm run build
```

Vercel will automatically deploy on push to main branch.

### Manual Deployment with PM2

Backend:
```bash
cd backend
pip install -r requirements.txt
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name speech-api
```

Frontend:
```bash
cd frontend
npm install
npm run build
pm2 start "npm start" --name speech-frontend
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
DEEPGRAM_API_KEY=your-deepgram-api-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Security Considerations

- Change the default `SECRET_KEY` in production
- Use HTTPS in production
- Keep your Deepgram API key secure
- Configure CORS properly for your domain
- Use PostgreSQL instead of SQLite in production
- Set up rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your frontend URL is in `CORS_ORIGINS`
2. **Upload fails**: Check `MAX_FILE_SIZE` and available disk space
3. **Transcription errors**: Verify your Deepgram API key is valid
4. **Database errors**: Ensure database migrations are run

### Database Migrations

If you modify the database models:

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## File Structure

```
speech_to_pdf/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── converter.py
│   │   └── routers/
│   │       ├── auth.py
│   │       └── conversions.py
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   ├── package.json
│   └── .env.local
├── convert.py  # Original conversion script (preserved)
└── README.md
```

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.