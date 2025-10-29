#!/usr/bin/env python
"""
Quick test script to verify the ML Fine-Tuning Platform is working correctly.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    try:
        from main import create_app
        from app.core.config import settings
        from app.models import User, Dataset, MLModel, Training
        print("  [OK] All imports successful")
        return True
    except Exception as e:
        print(f"  [FAIL] Import failed: {e}")
        return False

def test_app_creation():
    """Test that FastAPI app can be created."""
    print("\nTesting app creation...")
    try:
        from main import create_app
        app = create_app()
        print(f"  [OK] App created successfully")
        print(f"  [OK] API version: {app.version}")
        print(f"  [OK] Total routes: {len(app.routes)}")
        return True
    except Exception as e:
        print(f"  [FAIL] App creation failed: {e}")
        return False

def test_database():
    """Test database connectivity."""
    print("\nTesting database...")
    try:
        from sqlalchemy import create_engine, text
        from app.core.config import settings

        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("  [OK] Database connection successful")
        return True
    except Exception as e:
        print(f"  [FAIL] Database test failed: {e}")
        return False

def test_config():
    """Test configuration settings."""
    print("\nTesting configuration...")
    try:
        from app.core.config import settings
        print(f"  [OK] Project: {settings.PROJECT_NAME}")
        print(f"  [OK] API path: {settings.API_V1_STR}")
        print(f"  [OK] Database: {settings.DATABASE_URL[:20]}...")
        print(f"  [OK] Supported frameworks: {', '.join(settings.SUPPORTED_FRAMEWORKS)}")
        return True
    except Exception as e:
        print(f"  [FAIL] Config test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("ML Fine-Tuning Platform - Quick Test")
    print("=" * 60)

    results = []
    results.append(test_imports())
    results.append(test_config())
    results.append(test_database())
    results.append(test_app_creation())

    print("\n" + "=" * 60)
    if all(results):
        print("SUCCESS: All tests passed!")
        print("\nTo run the backend:")
        print("  cd backend && python main.py")
        print("\nTo run the frontend:")
        print("  cd frontend && npm run dev")
        print("=" * 60)
        return 0
    else:
        print("FAILURE: Some tests failed")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
