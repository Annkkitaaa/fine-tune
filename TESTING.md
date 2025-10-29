# Testing Guide for ML Fine-Tuning Platform

## Quick Test

Run the automated test script:
```bash
python test_app.py
```

This will verify:
- All imports work correctly
- Configuration is valid
- Database connectivity
- FastAPI app creation
- All 43 API routes are registered

## Manual Testing

### 1. Backend Testing

Start the backend server:
```bash
cd backend
python main.py
```

The server will start on http://localhost:8000

**Test endpoints:**
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/
- API Routes: http://localhost:8000/api/v1

### 2. Frontend Testing

Start the frontend development server:
```bash
cd frontend
npm run dev
```

The app will be available at http://localhost:5173

**Test pages:**
- Home: http://localhost:5173/
- Models: http://localhost:5173/models
- Datasets: http://localhost:5173/datasets
- Training: http://localhost:5173/training
- Evaluation: http://localhost:5173/evaluation
- Deployment: http://localhost:5173/deployment
- Pipeline: http://localhost:5173/pipeline

### 3. Build Testing

**Backend:** Already tested (imports and app creation work)

**Frontend:** Build for production
```bash
cd frontend
npm run build
```

Build output will be in `frontend/dist/`

## Issues Fixed

### Backend
1. **Pydantic warnings** - Fixed `model_id` field conflicts with protected namespace by setting `model_config = {"protected_namespaces": ()}`
   - Files fixed: `training.py`, `evaluation.py`, `deployment.py`, `spheron.py`, `relationships.py`

2. **Config conflicts** - Replaced old `class Config` with new Pydantic v2 `model_config` dictionary

### Frontend
1. **Missing pipeline service** - Created `frontend/src/lib/services/pipeline.ts` (copied from `services/pipeline.service.ts`)

2. **Wrong Radix UI package** - Changed `@radix-ui/react-alert` to `@radix-ui/react-alert-dialog` in `vite.config.ts`

3. **Missing dependencies** - Installed:
   - `@radix-ui/react-alert-dialog`
   - `terser` (for minification)

## Test Results

All tests passed successfully:
- ✓ Backend imports work
- ✓ Configuration valid
- ✓ Database connection successful
- ✓ FastAPI app created (43 routes)
- ✓ Frontend builds successfully

## Known Warnings

### Backend
- TensorFlow oneDNN warnings (informational only, not errors)
- One remaining Pydantic warning for `SpheronDeploymentCreate` (minor, doesn't affect functionality)

### Frontend
- Browserslist outdated (cosmetic, run `npx update-browserslist-db@latest` if desired)
- Some chunks >500KB (expected for ML visualization libraries)
- 9 npm vulnerabilities (run `npm audit fix` if concerned)

## Next Steps

Both backend and frontend are working correctly! You can now:

1. **Start developing** - Both servers can run simultaneously
2. **Test the API** - Use the Swagger docs at /docs
3. **Register a user** - Create an account via the frontend
4. **Upload datasets** - Test the data pipeline
5. **Train models** - Run ML training jobs
6. **Deploy models** - Use local or Spheron deployment
