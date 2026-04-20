from fastapi import APIRouter, HTTPException
from models import UserPayload
from database import neo4j_db

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

class UserManager:
    def __init__(self, driver):
        self.driver = driver

    def add_or_update(self, uid: str, username: str):
        query = """
        MERGE (u:User {uid: $uid})
        SET u.username = $username
        RETURN u
        """
        with self.driver.session() as session:
            session.run(query, uid=uid, username=username)

# Instantiate the class
user_manager = UserManager(neo4j_db.get_driver())

@router.post("/update")
async def update_user(payload: UserPayload):
    try:
        user_manager.add_or_update(payload.uid, payload.username)
        return {"status": "success", "message": f"User {payload.username} mapped in Graph."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))