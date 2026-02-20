# 📰 E-Paper Publishing Platform

A full-stack Node.js + React application for publishing interactive digital newspapers and magazines with advanced features like clickable area maps, smart crop & share, and advertisement management.

## ✨ Features

### Core Features
- **PDF to E-Paper Conversion**: Upload PDF files and automatically convert them to interactive web pages
- **Interactive Area Maps**: Create clickable hotspots on pages that link to:
  - External URLs
  - Other pages within the e-paper
  - Advertisements
- **Smart Crop & Share**: Select any portion of a page and generate a shareable link
- **Advertisement Management**: Upload ads, place them on pages, track impressions and clicks
- **Responsive Viewer**: Page navigation with thumbnail sidebar and zoom controls

### Technical Features
- **Full-Stack Architecture**: Node.js/Express backend + React frontend
- **MySQL Database**: Remote database for all data storage
- **JWT Authentication**: Secure user authentication
- **File Upload**: PDF and image upload with multer
- **Image Processing**: PDF to JPG conversion, thumbnail generation, image cropping
- **RESTful API**: Complete CRUD operations for all resources

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL database (remote or local)

### Installation

1. **Clone and navigate to the project**
```bash
cd e-paper
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Set up environment variables**
Create a `.env` file in the server directory:
```env
DB_HOST=srv902.hstgr.io
DB_USER=u206708889_epaper
DB_PASSWORD=Manav@786786
DB_NAME=u206708889_epaper
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

4. **Run database migrations**
```bash
npm run migrate
```

5. **Start the backend server**
```bash
npm start
```

6. **In a new terminal, start the frontend**
```bash
cd ..
npm start
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 📁 Project Structure

```
e-paper/
├── server/                    # Node.js backend
│   ├── config/
│   │   └── database.js       # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Authentication
│   │   ├── dashboardController.js # Dashboard stats
│   │   ├── authorController.js    # Authors CRUD
│   │   ├── projectController.js   # Projects CRUD
│   │   ├── epaperController.js    # E-paper management
│   │   ├── areaMapController.js   # Interactive areas
│   │   └── advertisementController.js # Ad management
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── migrations/
│   │   ├── init.sql          # Database schema
│   │   └── run.js            # Migration runner
│   ├── routes/
│   │   ├── auth.js           # Auth routes
│   │   ├── dashboard.js      # Dashboard routes
│   │   ├── authors.js        # Authors routes
│   │   ├── projects.js       # Projects routes
│   │   ├── epapers.js        # E-paper routes
│   │   ├── areamaps.js       # Area map routes
│   │   └── advertisements.js # Ad routes
│   ├── uploads/              # File storage
│   │   ├── papers/           # PDFs and converted images
│   │   ├── ads/              # Advertisement images
│   │   └── crops/            # Cropped share images
│   └── index.js              # Server entry point
├── src/                      # React frontend
│   ├── services/
│   │   └── api.js            # API client with axios
│   ├── context/
│   │   └── AuthContext.js    # Authentication context
│   ├── layouts/
│   │   ├── epapers/
│   │   │   ├── index.js      # E-papers list
│   │   │   ├── upload.js     # PDF upload
│   │   │   ├── viewer.js     # E-paper viewer
│   │   │   ├── area-editor.js # Area map editor
│   │   │   └── crop-share.js  # Crop and share
│   │   └── ...               # Other layouts
│   ├── routes.js             # Application routes
│   └── ...
├── .env                      # Environment variables
└── package.json              # Project dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### E-Papers
- `GET /api/epapers` - List all e-papers
- `GET /api/epapers/:id` - Get e-paper details
- `POST /api/epapers` - Upload new e-paper (protected)
- `PUT /api/epapers/:id` - Update e-paper (protected)
- `DELETE /api/epapers/:id` - Delete e-paper (protected)
- `POST /api/epapers/:id/publish` - Publish e-paper (protected)
- `POST /api/epapers/crop-share` - Crop and create share (protected)
- `GET /api/epapers/share/:token` - Access shared crop

### Area Maps
- `GET /api/areamaps/e-paper/:e_paper_id` - Get areas for e-paper
- `GET /api/areamaps/page/:page_id` - Get areas for page
- `POST /api/areamaps` - Create area (protected)
- `POST /api/areamaps/batch` - Create multiple areas (protected)
- `PUT /api/areamaps/:id` - Update area (protected)
- `DELETE /api/areamaps/:id` - Delete area (protected)
- `POST /api/areamaps/test-point/:page_id` - Test point in areas

### Advertisements
- `GET /api/advertisements` - List all ads
- `GET /api/advertisements/:id` - Get ad details
- `POST /api/advertisements` - Create ad (protected)
- `PUT /api/advertisements/:id` - Update ad (protected)
- `DELETE /api/advertisements/:id` - Delete ad (protected)
- `POST /api/advertisements/:id/impression` - Record impression
- `POST /api/advertisements/:id/click` - Record click
- `POST /api/advertisements/place` - Place ad on page (protected)

## 🎯 Usage Guide

### 1. Upload an E-Paper
1. Navigate to "Upload E-Paper" from the sidebar
2. Enter title and description
3. Select a PDF file (max 50MB)
4. Click "Upload E-Paper"
5. The PDF will be automatically converted to JPG images

### 2. View an E-Paper
1. Go to "E-Papers" in the sidebar
2. Click the visibility icon on any e-paper
3. Use the thumbnail sidebar to navigate pages
4. Use zoom controls to adjust view

### 3. Create Clickable Areas
1. Open an e-paper in the viewer
2. Click "Edit Areas" button
3. Click "Draw Area" to start
4. Click on the image to create polygon points
5. Select area type (link, page navigation, or ad)
6. Fill in the details
7. Click "Save Area"

### 4. Crop and Share
1. Open an e-paper
2. Click "Crop & Share" button
3. Click and drag to select an area
4. Add title and description
5. Click "Crop & Generate Share Link"
6. Copy the share URL to clipboard

### 5. Manage Advertisements
1. Use the Advertisements API endpoints
2. Upload ad images
3. Place ads on specific pages
4. Track impressions and clicks

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **pdf2pic** - PDF to image conversion
- **sharp** - Image processing
- **cors** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Chart.js** - Charts and graphs

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- File upload validation
- SQL injection prevention (parameterized queries)
- CORS configuration

## 📊 Database Schema

### Tables
- **users** - User accounts
- **e_papers** - E-paper metadata
- **e_paper_pages** - Individual pages
- **area_maps** - Clickable areas
- **advertisements** - Ad content
- **ad_placements** - Ad positioning
- **cropped_shares** - Shared crops

## 🚀 Deployment

### Using Genezio
The project includes `genezio.yaml` for easy deployment:

```bash
# Install Genezio CLI
npm install -g genezio

# Deploy
genezio deploy
```

### Manual Deployment
1. Set up environment variables on your server
2. Run database migrations
3. Build the React app: `npm run build`
4. Start the Node.js server
5. Configure your web server (nginx/Apache) to serve the build folder

## 📝 License

This project is built on top of Material Dashboard 2 React by Creative Tim.

## 🤝 Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Happy Publishing!** 📰✨
