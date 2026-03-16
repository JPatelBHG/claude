# SelectQuote Interactive RFP Response Webpage

A professional, full-stack web application for vendors to respond to the SelectQuote RFP with 114 questions across 5 sections. Features user authentication, real-time answer persistence, progress tracking, and export functionality to PDF/Excel.

## Features

- **User Authentication**: Register and login with email/password
- **Multi-Section RFP**: 5 sections with 114 total questions
- **Progress Tracking**: Visual progress indicators for overall and per-section completion
- **Real-time Auto-save**: Answers save automatically as you type
- **Priority Badges**: Questions labeled as CRITICAL, HIGH, or MEDIUM
- **Export Functionality**:
  - Export to PDF with formatted questions and answers
  - Export to Excel with multiple sheets (one per section)
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React 18 + Vite
- **Database**: SQLite3
- **Authentication**: JWT + bcryptjs
- **Styling**: Tailwind CSS
- **Export**: pdfkit, exceljs

## Project Structure

```
├── server.js                 # Express server entry point
├── package.json              # Root dependencies
├── .env                      # Environment variables
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Login/register endpoints
│   ├── rfp.js               # RFP data endpoints
│   └── export.js            # PDF/Excel export endpoints
├── db/
│   ├── init.js              # Database initialization
│   └── rfp_data.json        # RFP questions data
└── client/                   # React frontend
    ├── package.json          # Frontend dependencies
    ├── vite.config.js        # Vite configuration
    ├── tailwind.config.js    # Tailwind configuration
    ├── index.html            # HTML entry point
    └── src/
        ├── main.jsx          # React entry point
        ├── App.jsx           # Main app component
        ├── index.css         # Global styles
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── DashboardPage.jsx
        ├── components/
        │   ├── SectionView.jsx
        │   └── QuestionForm.jsx
        ├── context/
        │   └── AuthContext.jsx
        └── services/
            └── api.js        # API client
```

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. **Clone and navigate to repository**:
   ```bash
   cd /home/user/claude
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

   This installs:
   - Backend dependencies in the root directory
   - Frontend dependencies in the `client/` directory

### Configuration

1. **Backend Environment** (`.env` already created):
   ```
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   DATABASE_PATH=./db/rfp.db
   ```

   Change `JWT_SECRET` for production use.

### Running the Application

#### Option 1: Development Mode (Run both server and client)

```bash
npm run dev
```

This runs:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:3000`

#### Option 2: Run Separately

**Terminal 1 - Backend**:
```bash
npm start
```
Server will run on `http://localhost:5000`

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
```
Client will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### RFP Data
- `GET /api/rfp/sections` - Get all sections with progress
- `GET /api/rfp/sections/:sectionId/questions` - Get questions for a section
- `GET /api/rfp/answers` - Get user's answers
- `GET /api/rfp/progress` - Get overall progress
- `POST /api/rfp/answers` - Save/update an answer

### Export
- `POST /api/export/pdf` - Export responses as PDF
- `POST /api/export/excel` - Export responses as Excel

## Usage

1. **Register/Login**:
   - Go to http://localhost:3000
   - Create an account with email, password, and company name
   - Or login with existing credentials

2. **Navigate Sections**:
   - Select sections from the left sidebar
   - View overall and section-specific progress

3. **Answer Questions**:
   - Click into any question
   - Type your answer
   - Answer auto-saves after 1 second of inactivity or on blur
   - Click "Save" to force save immediately

4. **Export Responses**:
   - Click "Export as PDF" or "Export as Excel" in the sidebar
   - Files are downloaded with your responses

5. **Logout**:
   - Click "Logout" button in sidebar
   - You'll be redirected to login page

## Database

The application uses SQLite3 for data persistence. Database file is created at `./db/rfp.db`.

### Tables
- `users` - User accounts
- `rfp_sections` - RFP section definitions
- `rfp_questions` - Individual questions (114 total)
- `rfp_answers` - User responses

Database is automatically initialized on first run.

## Building for Production

```bash
cd client
npm run build
```

This creates an optimized build in `client/dist/`.

## Troubleshooting

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Set `npm run dev -- --port 3001`

### Database Issues
- Delete `db/rfp.db` and restart server to reinitialize
- Make sure `db/` directory has write permissions

### CORS Errors
- Ensure backend is running on port 5000
- Check Vite proxy configuration in `client/vite.config.js`

## Support

For issues or questions, check:
- Server console output for backend errors
- Browser console for frontend errors
- Database file exists at `./db/rfp.db`

## License

Proprietary - SelectQuote
