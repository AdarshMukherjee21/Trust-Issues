import hashlib
from fastapi import APIRouter, HTTPException
from models import ThreatReportPayload
from database import neo4j_db

router = APIRouter(prefix="/api/v1/threats", tags=["Threats"])

class ThreatManager:
    def __init__(self, driver):
        self.driver = driver

    def calculate_hash(self, text: str) -> str:
        """Creates a unique SHA-256 fingerprint of the spam text."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    def report_threat(self, payload: ThreatReportPayload):
        threat_hash = self.calculate_hash(payload.threat_text)
        
        query = """
        MATCH (u:User {uid: $uid})
        MERGE (t:Threat {hash: $threat_hash})
        ON CREATE SET t.type = $threat_type, t.preview = $preview
        
        MERGE (s:Sender {contact: $sender_contact})
        ON CREATE SET s.platform = $sender_platform
        
        MERGE (u)-[r:REPORTED]->(t)
        ON CREATE SET r.timestamp = datetime()
        
        MERGE (t)-[sb:SENT_BY]->(s)
        ON CREATE SET sb.first_seen = datetime()
        """
        with self.driver.session() as session:
            session.run(
                query, 
                uid=payload.reporter_uid, 
                threat_hash=threat_hash, 
                threat_type=payload.threat_type,
                preview=payload.threat_text[:50] + "...", # Saves a small preview for UI
                sender_contact=payload.sender_contact,
                sender_platform=payload.sender_platform
            )

    def get_friend_threats(self, uid: str):
        query = """
        MATCH (me:User {uid: $uid})-[:FRIENDS_WITH]-(friend:User)-[:REPORTED]->(t:Threat)-[:SENT_BY]->(s:Sender)
        RETURN friend.username AS reporter, t.type AS scam_type, s.contact AS sender_id, t.preview AS preview
        ORDER BY r.timestamp DESC LIMIT 50
        """
        with self.driver.session() as session:
            result = session.run(query, uid=uid)
            return [{"reporter": rec["reporter"], "scam_type": rec["scam_type"], "sender_id": rec["sender_id"], "preview": rec["preview"]} for rec in result]

threat_manager = ThreatManager(neo4j_db.get_driver())

@router.post("/report")
async def report_threat(payload: ThreatReportPayload):
    try:
        threat_manager.report_threat(payload)
        return {"status": "success", "message": "Threat mapped and hashed in Graph."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/friends/{uid}")
async def get_friend_threats(uid: str):
    try:
        data = threat_manager.get_friend_threats(uid)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))