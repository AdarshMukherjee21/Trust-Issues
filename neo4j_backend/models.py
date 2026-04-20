from pydantic import BaseModel

class UserPayload(BaseModel):
    uid: str
    username: str

class FriendPayload(BaseModel):
    uid1: str
    uid2: str

class ThreatReportPayload(BaseModel):
    reporter_uid: str
    threat_text: str      # We will hash this in the backend!
    threat_type: str
    sender_contact: str
    sender_platform: str