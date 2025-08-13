import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from database.connection import Base
from faker import Faker
from unittest.mock import patch
from alembic.config import Config
from alembic import command

# Load environment variables
load_dotenv()

# Initialize Faker
fake = Faker()

# Test database configuration
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise ValueError("TEST_DATABASE_URL environment variable is required for testing")

# Create test database engine and session
test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session")
def setup_test_database():
    """Set up test database tables before running tests."""
    # Mask the password in the URL for security
    masked_url = TEST_DATABASE_URL
    if '@' in masked_url and ':' in masked_url:
        # Extract just the database name and host for display
        parts = masked_url.split('/')
        db_name = parts[-1] if parts else 'unknown'
        host_part = masked_url.split('@')[-1].split('/')[0] if '@' in masked_url else 'localhost'
        masked_url = f"postgresql://***:***@{host_part}/{db_name}"
    
    print(f"\n🔧 Setting up test database: {masked_url}")
    
    # Test database connection
    try:
        with test_engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Test database connection successful")
    except Exception as e:
        print(f"❌ Test database connection failed: {e}")
        raise
    
    # Create all tables using SQLAlchemy models (simpler and more reliable for tests)
    try:
        Base.metadata.create_all(bind=test_engine)
        
        # Manually create junction tables that are not defined in models
        with test_engine.connect() as conn:
            # Create users_roles junction table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users_roles (
                    user_id INTEGER NOT NULL,
                    role_id INTEGER NOT NULL,
                    PRIMARY KEY (user_id, role_id),
                    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY(role_id) REFERENCES roles (role_id) ON DELETE CASCADE
                )
            """))
            
            # Create users_permissions junction table if needed
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users_permissions (
                    user_id INTEGER NOT NULL,
                    permission_id INTEGER NOT NULL,
                    PRIMARY KEY (user_id, permission_id),
                    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY(permission_id) REFERENCES permissions (permission_id) ON DELETE CASCADE
                )
            """))
            
            # Create roles_permissions junction table if needed
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS roles_permissions (
                    role_id INTEGER NOT NULL,
                    permission_id INTEGER NOT NULL,
                    PRIMARY KEY (role_id, permission_id),
                    FOREIGN KEY(role_id) REFERENCES roles (role_id) ON DELETE CASCADE,
                    FOREIGN KEY(permission_id) REFERENCES permissions (permission_id) ON DELETE CASCADE
                )
            """))
            
            conn.commit()
        
        print("✅ Test database tables created successfully")
    except Exception as e:
        print(f"❌ Failed to create test database tables: {e}")
    
    yield
    
    # Cleanup: Drop all tables after tests
    print("\n🧹 Cleaning up test database")
    try:
        # Drop junction tables first to avoid foreign key constraint issues
        with test_engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS users_roles CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS users_permissions CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS roles_permissions CASCADE"))
            conn.commit()
        # Then drop the main tables
        Base.metadata.drop_all(bind=test_engine)
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")

@pytest.fixture
def db_session(setup_test_database):
    """Create a database session for a test and patch SessionLocal globally."""
    session = TestSessionLocal()
    
    # Patch SessionLocal at multiple locations to ensure test isolation
    with patch('database.connection.SessionLocal') as mock_session_local, \
        patch('database.operations.users.store_user_appending_approval.SessionLocal') as mock_store_session, \
        patch('database.operations.users.get_user_by_discord_id.SessionLocal') as mock_get_discord_session, \
        patch('database.operations.users.get_user_by_id.SessionLocal') as mock_get_id_session, \
        patch('database.operations.users.get_server_nickname_by_user_id.SessionLocal') as mock_nickname_session, \
        patch('database.operations.users.update_user_discord_info.SessionLocal') as mock_update_session, \
        patch('database.operations.role_operations.SessionLocal') as mock_role_session, \
        patch('database.operations.permission_operations.SessionLocal') as mock_permission_session, \
        patch('database.operations.users_roles.SessionLocal') as mock_users_roles_session:
        
        # Return a fresh session each time SessionLocal() is called
        mock_session_local.return_value = session
        mock_store_session.return_value = session
        mock_get_discord_session.return_value = session
        mock_get_id_session.return_value = session
        mock_nickname_session.return_value = session
        mock_update_session.return_value = session
        mock_role_session.return_value = session
        mock_permission_session.return_value = session
        mock_users_roles_session.return_value = session
        
        try:
            yield session
        finally:
            # Clean up all data after each test
            session.rollback()
            
            # Delete all data from tables
            from database.models.session import Session as SessionModel
            from database.models.user import User
            from database.models.role import Role
            
            session.query(SessionModel).delete()
            session.query(User).delete()
            session.query(Role).delete()
            session.commit()
            
            session.close()

@pytest.fixture
def sample_user_data():
    """Generate sample user data for testing."""
    return {
        "id": str(fake.random_int(min=100000000000000000, max=999999999999999999)),
        "username": fake.user_name(),
        "server_nickname": fake.user_name(),
        "email": fake.email()
    }
