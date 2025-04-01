# reset_db.py
import psycopg2
from sqlalchemy import create_engine, text

# Update these with your actual database credentials
DATABASE_URL = "postgresql://fine_ml_user:iI8IB5o8vowc8yRoROZn78FONpSGwjwT@dpg-cvm2tceuk2gs738j5p40-a.oregon-postgres.render.com/fine_ml"

def reset_database():
    print("Connecting to database...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Drop alembic_version table
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        
        # Drop all of your application tables
        conn.execute(text("DROP TABLE IF EXISTS evaluations"))
        conn.execute(text("DROP TABLE IF EXISTS trainings"))
        conn.execute(text("DROP TABLE IF EXISTS deployments"))
        conn.execute(text("DROP TABLE IF EXISTS pipelines"))
        conn.execute(text("DROP TABLE IF EXISTS models"))
        conn.execute(text("DROP TABLE IF EXISTS datasets"))
        conn.execute(text("DROP TABLE IF EXISTS projects"))
        conn.execute(text("DROP TABLE IF EXISTS users"))
        
        # Commit the transaction
        conn.commit()
    
    print("Database reset complete!")

if __name__ == "__main__":
    reset_database()