from fastapi import APIRouter, HTTPException
from models import FriendPayload
from database import neo4j_db

router = APIRouter(prefix="/api/v1/friends", tags=["Friends"])

class FriendManager:
    def __init__(self, driver):
        self.driver = driver

    def add_friend(self, uid1: str, uid2: str):
        query = """
        MATCH (u1:User {uid: $uid1})
        MATCH (u2:User {uid: $uid2})
        MERGE (u1)-[r1:FRIENDS_WITH]->(u2)
        MERGE (u2)-[r2:FRIENDS_WITH]->(u1)
        SET r1.since = datetime(), r2.since = datetime()
        """
        with self.driver.session() as session:
            session.run(query, uid1=uid1, uid2=uid2)

    def remove_friend(self, uid1: str, uid2: str):
        query = """
        MATCH (u1:User {uid: $uid1})-[r:FRIENDS_WITH]-(u2:User {uid: $uid2})
        DELETE r
        """
        with self.driver.session() as session:
            session.run(query, uid1=uid1, uid2=uid2)

# Instantiate the class
friend_manager = FriendManager(neo4j_db.get_driver())

@router.post("/add")
async def add_friend(payload: FriendPayload):
    try:
        friend_manager.add_friend(payload.uid1, payload.uid2)
        return {"status": "success", "message": "Friendship established."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remove")
async def remove_friend(payload: FriendPayload):
    try:
        friend_manager.remove_friend(payload.uid1, payload.uid2)
        return {"status": "success", "message": "Friendship removed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))