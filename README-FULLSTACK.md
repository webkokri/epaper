# Material Dashboard 2 - Full Stack (Node.js + MySQL)

This is a full-stack conversion of the Material Dashboard 2 React application with a Node.js/Express backend and MySQL database.

## 🚀 Features

- **Authentication**: JWT-based authentication with login and registration
- **Dashboard**: Real-time statistics from MySQL database
- **Tables**: Authors and Projects with full CRUD operations
- **API**: RESTful API with Express.js
- **Database**: MySQL with connection pooling
- **Security**: Password hashing, JWT tokens, input validation

## 📁 Project Structure

```
material-dashboard-react/
├── server/                    # Backend Node.js/Express
│   ├── config/
│   │   └── database.js        # MySQL connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── authorController.js
│   │   ├── dashboardController.js
│   │   └── projectController.js
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── migrations/
│   │   ├── init.sql           # Database schema
│   │   └── run.js             # Migration runner
│   ├── routes/
│   │   ├── auth.js
│   │   ├── authors.js
│   │   ├── dashboard.js
│   │   └── projects.js
│   ├── .env                   # Environment variables
│   ├── index.js               # Server entry
│   └── package.json
├── src/
│   ├── context/
│   │   └── AuthContext.js     # React auth context
│   ├── layouts/
│   │   ├── authentication/    # Login/Register pages
│   │   ├── dashboard/         # Dashboard with real data
│   │   └── tables/            # Tables with API data
│   └── services/
│       └── api.js             # API service layer
├── .env                       # Frontend environment
└── package.json
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run server:install
```

### 2. Configure Environment Variables

The database is already configured in `server/.env`:
```env
DB_HOST=srv902.hstgr.io
DB_PORT=3306
DB_USER=u206708889_epaper
DB_PASSWORD=Manav@786786
DB_NAME=u206708889_epaper
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
```

### 3. Run Database Migrations

```bash
npm run migrate
```

This will create all necessary tables and insert sample data.

### 4. Start Development Servers

**Option A: Run both frontend and backend together**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm start
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `POST /api/dashboard/stats` - Update statistics (protected)

### Authors
- `GET /api/authors` - Get all authors
- `GET /api/authors/:id` - Get author by ID
- `POST /api/authors` - Create author (protected)
- `PUT /api/authors/:id` - Update author (protected)
- `DELETE /api/authors/:id` - Delete author (protected)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project (protected)
- `PUT /api/projects/:id` - Update project (protected)
- `DELETE /api/projects/:id` - Delete project (protected)

## 🗄️ Database Schema

### Users Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- role (VARCHAR, DEFAULT 'user')
- created_at (TIMESTAMP)
```

### Dashboard Stats Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- bookings (INT)
- users_count (INT)
- revenue (VARCHAR)
- followers (VARCHAR)
- date (DATE)
```

### Authors Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- name (VARCHAR)
- email (VARCHAR)
- image (VARCHAR)
- job_title (VARCHAR)
- job_description (VARCHAR)
- status (ENUM: 'online', 'offline')
- employed_date (DATE)
```

### Projects Table
```sql
- id (INT, PK, AUTO_INCREMENT)
- name (VARCHAR)
- description (TEXT)
- budget (VARCHAR)
- completion (INT)
- status (VARCHAR)
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: 24-hour expiration tokens
- **Input Validation**: express-validator
- **CORS**: Configured for cross-origin requests
- **SQL Injection Protection**: Parameterized queries

## 🚀 Deployment

### Deploy to Genezio

```bash
genezio deploy
```

The `genezio.yaml` is already configured for full-stack deployment with:
- Backend on serverless functions
- Frontend on CDN
- Automatic environment variable injection

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start React development server |
| `npm run server` | Start Node.js backend server |
| `npm run dev` | Start both frontend and backend |
| `npm run server:install` | Install backend dependencies |
| `npm run migrate` | Run database migrations |
| `npm run build` | Build React for production |
| `npm run install:clean` | Clean install all dependencies |

## 🔧 Troubleshooting

### Database Connection Issues
1. Check if MySQL server is running
2. Verify credentials in `server/.env`
3. Ensure database exists: `u206708889_epaper`

### CORS Errors
- Backend CORS is configured to allow all origins in development
- In production, update `server/index.js` with specific origins

### JWT Token Issues
- Check `JWT_SECRET` is set in `server/.env`
- Token expires after 24 hours - user needs to re-login

## 📞 Support

For issues or questions:
1. Check the [Material Dashboard React documentation]( https://siman.ca/learning-lab/react/overview/material-dashboard/)
2. Review the [Express.js documentation](https://expressjs.com/)
3. Check [MySQL documentation](https://dev.mysql.com/doc/)

## 📄 License

See license in  https://siman.ca/license
