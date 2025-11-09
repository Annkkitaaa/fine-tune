# 🤖 ML Model Fine-Tuning Platform

A full-stack machine learning platform for training, evaluating, and deploying ML models with an intuitive web interface. Built with FastAPI and React.

## Features

###  Core Functionality
- **Dataset Management** - Upload, preview, and manage datasets (CSV, JSON, Parquet, Excel)
- **ML Model Training** - Train models using PyTorch, TensorFlow, or Scikit-learn
- **Automated Pipelines** - Data preprocessing, augmentation, and feature engineering
- **Model Evaluation** - Comprehensive metrics and performance analysis
- **Model Deployment** - Deploy locally or to decentralized infrastructure (Spheron)
- **Authentication** - Secure JWT-based authentication system

###  Data Processing
- Missing value handling (mean, median, mode, drop)
- Outlier detection and removal (Z-score, IQR)
- Data scaling and normalization
- SMOTE for class balancing
- Feature engineering
- Correlation analysis

###  Model Training
- Support for multiple frameworks (PyTorch, TensorFlow, Scikit-learn)
- Hyperparameter optimization (Grid Search, Random Search, Bayesian)
- Background training jobs
- Real-time training metrics
- Model versioning and backups

###  Evaluation & Monitoring
- Accuracy, Precision, Recall, F1-Score
- Confusion matrix visualization
- ROC-AUC curves
- Model comparison
- Resource usage tracking (CPU, Memory, GPU)

##  Tech Stack

### Backend
- **Framework**: FastAPI (Python async web framework)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT tokens with OAuth2
- **ML Frameworks**: PyTorch, TensorFlow, Scikit-learn
- **Data Processing**: Pandas, NumPy, Scipy
- **Server**: Uvicorn with auto-reload

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: Radix UI, Headless UI, shadcn/ui
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios

##  Installation

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fine-tune
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates database)
alembic upgrade head
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

##  Running the Application

### Start Backend Server
```bash
cd backend
python main.py
```

The backend will start on **http://localhost:8000**

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:5173**

## 📚 API Documentation

FastAPI provides interactive API documentation out of the box:

### Swagger UI (Interactive)
```
http://localhost:8000/docs
```
- ✨ Interactive API testing
- 📝 Request/response schemas
- 🔐 Built-in authentication

### ReDoc (Alternative)
```
http://localhost:8000/redoc
```
- 📖 Clean, readable documentation
- 📋 Organized by tags

### OpenAPI Schema
```
http://localhost:8000/api/v1/openapi.json
```

## 🔐 Authentication

### Default Admin Credentials
```
Email: admin@example.com
Password: Admin@123
```

⚠️ **IMPORTANT**: Change the default password immediately in production!

### How Authentication Works
1. **Login** - POST `/api/v1/auth/login` with email/password
2. **Receive Token** - Get JWT access token (valid for 8 days)
3. **Use Token** - Include in `Authorization: Bearer <token>` header
4. **Protected Routes** - All data/model/training endpoints require authentication

### API Authentication in Swagger
1. Go to http://localhost:8000/docs
2. Click the **🔓 "Authorize"** button
3. Enter credentials:
   - Username: `admin@example.com`
   - Password: `Admin@123`
4. Click "Authorize"
5. Now you can test all protected endpoints!

## 📁 Project Structure

```
fine-tune/
├── backend/                    # FastAPI backend
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── api/v1/           # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── data.py       # Dataset management
│   │   │   ├── models.py     # ML models
│   │   │   ├── training.py   # Training jobs
│   │   │   ├── evaluation.py # Model evaluation
│   │   │   ├── deployment.py # Deployment
│   │   │   └── pipeline.py   # ML pipelines
│   │   ├── core/             # Core functionality
│   │   ├── crud/             # Database operations
│   │   ├── db/               # Database setup
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── main.py               # FastAPI app entry
│   └── requirements.txt      # Python dependencies
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Libraries
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── store/            # Zustand stores
│   │   └── types/            # TypeScript types
│   ├── package.json          # NPM dependencies
│   └── vite.config.ts        # Vite configuration
│
├── uploads/                   # Uploaded datasets
├── models/                    # Trained models
├── model_backups/            # Model version backups
└── README.md                 # This file
```

## 🔧 Configuration

### Backend Configuration
Edit `backend/app/core/config.py` to customize:
- Database URL
- JWT secret key and expiration
- CORS settings
- File upload limits
- ML framework settings
- Deployment settings

### Frontend Configuration
Create `frontend/.env` for environment variables:
```env
VITE_API_URL=http://localhost:8000
```

## 🧪 Testing

### Quick Backend Test
```bash
python test_app.py
```

This verifies:
- ✅ All imports work
- ✅ Database connection
- ✅ App creation
- ✅ 43 API routes loaded

### Manual Testing
See `TESTING.md` for comprehensive manual testing guide.

## 📊 API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user info

### Data Management (`/api/v1/data`)
- `POST /data/upload` - Upload dataset
- `GET /data/list` - List all datasets
- `GET /data/{id}` - Get dataset details
- `GET /data/{id}/sample` - Preview dataset
- `POST /data/{id}/preprocess` - Preprocess dataset
- `DELETE /data/{id}` - Delete dataset

### Models (`/api/v1/models`)
- `POST /models/create` - Create ML model
- `GET /models/list` - List all models
- `GET /models/{id}` - Get model details
- `DELETE /models/{id}` - Delete model

### Training (`/api/v1/trainings`)
- `POST /trainings/create` - Start training job
- `GET /trainings/list` - List training jobs
- `GET /trainings/{id}` - Get training status
- `POST /trainings/{id}/cancel` - Cancel training

### Evaluation (`/api/v1/evaluation`)
- `POST /evaluation/evaluate` - Evaluate model
- `GET /evaluation/list` - List evaluations
- `GET /evaluation/{id}` - Get evaluation results

### Deployment (`/api/v1/deployment`)
- `POST /deployment/deploy` - Deploy model
- `POST /deployment/spheron` - Deploy to Spheron
- `GET /deployment/list` - List deployments
- `POST /deployment/{id}/restart` - Restart deployment

### Pipeline (`/api/v1/pipeline`)
- `POST /pipeline/process` - Run ML pipeline
- `GET /pipeline/list` - List pipeline runs
- `GET /pipeline/{id}` - Get pipeline results

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt for password security
- **CORS Protection** - Configurable CORS settings
- **SQL Injection Prevention** - SQLAlchemy ORM
- **Input Validation** - Pydantic schemas
- **File Upload Validation** - Type and size restrictions

## 🎯 Recent Improvements

### Authentication System Overhaul
- ✅ Unified authentication across all endpoints
- ✅ Removed complex bypass logic
- ✅ Consistent `get_current_user_or_default` dependency
- ✅ Automatic default user creation on startup
- ✅ Simplified frontend auth (removed 180+ lines of code)

### Code Quality
- ✅ Fixed all 18 files for consistent auth
- ✅ Removed hardcoded user IDs and mock users
- ✅ Added proper database initialization
- ✅ Fixed frontend API path issues (added `/api/v1` prefix)

### Files Modified
**Backend (12 files):**
- Database initialization with default user
- Unified auth dependencies
- All API endpoints use consistent auth
- Removed dev_config complexity

**Frontend (6 files):**
- Simplified auth hooks and API client
- Fixed all service API paths
- Removed bypass auth logic

## 🚧 Known Issues

### Non-Critical Warnings
1. **Pydantic warning** about `model_id` field - Cosmetic only, doesn't affect functionality
2. **Bcrypt version warning** - Deprecated attribute access, works fine

## 🔮 Future Enhancements

- [ ] User management UI
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Rate limiting for API endpoints
- [ ] Refresh tokens
- [ ] Multi-tenancy support
- [ ] Advanced model versioning
- [ ] Integration with cloud storage (S3, Azure Blob)
- [ ] Real-time training progress websockets
- [ ] Model marketplace

## 📝 License

This project is proprietary. All rights reserved.

## 👥 Contributing

This is a private project. For questions or support, please contact the development team.

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is available
# On Windows:
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID <PID> /F
```

### Frontend 404 errors
- Ensure backend is running on port 8000
- Check that all API calls include `/api/v1` prefix
- Verify CORS settings in backend config

### Database errors
```bash
# Reset database
cd backend
rm fine_tune.db
alembic upgrade head
```

### Authentication issues
- Check that JWT secret is set in config
- Verify token hasn't expired (8 day default)
- Clear localStorage and re-login

## 📞 Support

For issues, questions, or feature requests:
1. Check the Swagger documentation: http://localhost:8000/docs
2. Review the `TESTING.md` file
3. Check the troubleshooting section above

---

**Made with ❤️ using FastAPI and React**
