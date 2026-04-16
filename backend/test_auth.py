import sys
sys.path.append('..')
import traceback
from backend.core.database import SessionLocal
from backend.api.routes_auth import create_user, UserCreate

def run():
    db = SessionLocal()
    user = UserCreate(
        name="Test",
        email="test_diagnostics_123@test.com",
        password="test",
        current_role="",
        target_role=""
    )
    try:
        print("Starting user creation...")
        res = create_user(user, db)
        print("Success:", res)
    except Exception as e:
        print("CRASH TRACEBACK:")
        traceback.print_exc()

if __name__ == "__main__":
    run()
