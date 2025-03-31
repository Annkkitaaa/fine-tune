# check_tables.py
from sqlalchemy import create_engine, text, inspect

connection_string = "postgresql://finetunedatabase_user:F95IV93bx9E8qvJPZnel8ucaINtndvIr@dpg-cvldjkggjchc73bmgnv0-a.oregon-postgres.render.com/finetunedatabase"

engine = create_engine(connection_string)
inspector = inspect(engine)

tables = inspector.get_table_names()
print("Tables in database:", tables)

if "alembic_version" in tables:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
        print("Alembic versions:", result)