import firebase_admin
from firebase_admin import credentials, firestore
from neo4j import GraphDatabase
import hashlib
from datetime import datetime, timedelta
import random

# ==========================================
# 1. CONFIGURATION
# ==========================================
FIREBASE_CRED_PATH = "trust-issues-v1-firebase-adminsdk-fbsvc-dbb0590da2.json" # UPDATE THIS
NEO4J_URI = "bolt://localhost:7687"
NEO4J_AUTH = ("neo4j", "trustissue")

print("🌱 Booting up Database Seeder...")

# ==========================================
# 2. DUMMY DATA POOL
# ==========================================
users = [
    {"uid": "usr_101", "username": "adarsh_m", "name": "Adarsh Mukherjee"},
    {"uid": "usr_102", "username": "krish_b", "name": "Krish Bhatia"},
    {"uid": "usr_103", "username": "sailendra_k", "name": "Sailendra Kolluru"},
    {"uid": "usr_104", "username": "aryan_r", "name": "Aryan Rao"},
    {"uid": "usr_105", "username": "siddharth_m", "name": "Siddharth Mody"}
]

# We define the core spam campaigns here
spam_campaigns = [
    {
        "text": "Dear UPI user A/C X6831 debited by 914.00 on date 17Apr. If not u? call-1800111109", 
        "type": "Bank Fraud", 
        "sender": "+91-9876500000", 
        "platform": "sms",
        "collection": "sms_checks"
    },
    {
        "text": "Your Geek Squad Receipt - Invoice #GS-89912. Charged $399.99. Call 1-800-555-0199 for refund.", 
        "type": "Refund Scam", 
        "sender": "billing@geeksquad-alerts.net", 
        "platform": "email",
        "collection": "email_checks"
    },
    {
        "text": "URGENT: Your package is stuck at customs. Pay 50 INR fee here to release: http://indiapost-track.in", 
        "type": "Phishing", 
        "sender": "+91-8888877777", 
        "platform": "sms",
        "collection": "sms_checks"
    }
]

def generate_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

# ==========================================
# 3. FIREBASE POPULATION
# ==========================================
def seed_firebase():
    print("\n🔥 Seeding Firebase Firestore...")
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_CRED_PATH)
        firebase_admin.initialize_app(cred)
    db = firestore.client()

    for user in users:
        # 1. Create the main User Document
        user_ref = db.collection("users").document(user["uid"])
        user_ref.set({
            "username": user["username"],
            "name": user["name"],
            "joined_at": firestore.SERVER_TIMESTAMP
        })

        # 2. Add sub-collection data (Assigning random spam to users to simulate reality)
        assigned_spam = random.sample(spam_campaigns, 2) # Give each user 2 random spam messages
        
        for spam in assigned_spam:
            # We use ISO format for the document ID as requested
            doc_id = datetime.utcnow().isoformat().replace(".", "_")
            
            sub_col_ref = user_ref.collection(spam["collection"]).document(doc_id)
            sub_col_ref.set({
                "message": spam["text"],
                "sender": spam["sender"],
                "prediction": "SPAM",
                "timestamp": firestore.SERVER_TIMESTAMP,
                "pushed_to_community": True # Simulating they clicked the button
            })
            
            # Simulate an AI ask for one of them
            if random.choice([True, False]):
                ai_doc_id = datetime.utcnow().isoformat().replace(".", "_")
                user_ref.collection("ai_asks").document(ai_doc_id).set({
                    "original_text": spam["text"],
                    "ai_explanation": f"This is a classic {spam['type']}. Do not click the link or call the number.",
                    "timestamp": firestore.SERVER_TIMESTAMP
                })

    print("✅ Firebase seeding complete!")

# ==========================================
# 4. NEO4J POPULATION
# ==========================================
def seed_neo4j():
    print("\n🕸️ Seeding Neo4j Community Graph...")
    driver = GraphDatabase.driver(NEO4J_URI, auth=NEO4J_AUTH)
    
    with driver.session() as session:
        # 1. Create Users
        for user in users:
            session.run("MERGE (u:User {uid: $uid}) SET u.username = $username", 
                        uid=user["uid"], username=user["username"])

        # 2. Create the Friend Network
        # Adarsh is the hub, connected to everyone
        for i in range(1, 5):
            session.run("""
                MATCH (a:User {uid: $u1}), (b:User {uid: $u2})
                MERGE (a)-[r1:FRIENDS_WITH]->(b)
                MERGE (b)-[r2:FRIENDS_WITH]->(a)
                SET r1.since = datetime(), r2.since = datetime()
            """, u1=users[0]["uid"], u2=users[i]["uid"])
        
        # Krish and Sailendra are also friends
        session.run("""
            MATCH (a:User {uid: 'usr_102'}), (b:User {uid: 'usr_103'})
            MERGE (a)-[r1:FRIENDS_WITH]->(b)
            MERGE (b)-[r2:FRIENDS_WITH]->(a)
        """)

        # 3. Inject the Threats (Simulating multiple people reporting the same thing)
        report_query = """
        MATCH (u:User {uid: $uid})
        MERGE (t:Threat {hash: $hash})
        ON CREATE SET t.type = $type, t.preview = $preview
        
        MERGE (s:Sender {contact: $sender})
        ON CREATE SET s.platform = $platform
        
        MERGE (u)-[r:REPORTED]->(t)
        ON CREATE SET r.timestamp = datetime()
        
        MERGE (t)-[sb:SENT_BY]->(s)
        ON CREATE SET sb.first_seen = datetime()
        """
        
        # Attack 1: Bank Fraud hits Adarsh and Aryan
        bank_fraud = spam_campaigns[0]
        for target in ["usr_101", "usr_104"]:
            session.run(report_query, uid=target, hash=generate_hash(bank_fraud["text"]), 
                        type=bank_fraud["type"], preview=bank_fraud["text"][:40]+"...", 
                        sender=bank_fraud["sender"], platform=bank_fraud["platform"])

        # Attack 2: Phishing hits Krish, Sailendra, and Siddharth
        phish = spam_campaigns[2]
        for target in ["usr_102", "usr_103", "usr_105"]:
            session.run(report_query, uid=target, hash=generate_hash(phish["text"]), 
                        type=phish["type"], preview=phish["text"][:40]+"...", 
                        sender=phish["sender"], platform=phish["platform"])

    driver.close()
    print("✅ Neo4j seeding complete!")

# ==========================================
# 5. EXECUTION
# ==========================================
if __name__ == "__main__":
    seed_firebase()
    seed_neo4j()
    print("\n🎉 All dummy data successfully injected! You are ready to build the UI.")