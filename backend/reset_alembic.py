# reset_alembic.py
from sqlalchemy import create_engine, text

connection_string = "postgresql://finetunedatabase_user:F95IV93bx9E8qvJPZnel8ucaINtndvIr@dpg-cvldjkggjchc73bmgnv0-a.oregon-postgres.render.com/finetunedatabase"

engine = create_engine(connection_string)
with engine.connect() as conn:
    try:
        # Use text() for SQL statements in newer SQLAlchemy versions
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        conn.commit()  # Important to commit the transaction
        print("Successfully dropped alembic_version table")
    except Exception as e:
        print(f"Error: {e}")