import firebase_admin
from firebase_admin import credentials, firestore
from neo4j import GraphDatabase
import hashlib
from datetime import datetime
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
# Your live profile is the hub
LIVE_UID = "Surkp8rN5MSQgfbl1hd9kXrCs4r1"

users = [
    {"uid": LIVE_UID, "username": "adarsh_m", "name": "Adarsh Mukherjee"},
    {"uid": "usr_102", "username": "krish_b", "name": "Krish Bhatia"},
    {"uid": "usr_103", "username": "sailendra_k", "name": "Sailendra Kolluru"},
    {"uid": "usr_104", "username": "aryan_r", "name": "Aryan Rao"},
    {"uid": "usr_105", "username": "siddharth_m", "name": "Siddharth Mody"},
    # New Friends to create a dense cluster
    {"uid": "usr_106", "username": "priya_d", "name": "Priya Desai"},
    {"uid": "usr_107", "username": "karan_s", "name": "Karan Singh"},
    {"uid": "usr_108", "username": "neha_p", "name": "Neha Patel"},
    {"uid": "usr_109", "username": "rahul_v", "name": "Rahul Verma"},
    {"uid": "usr_110", "username": "anjali_c", "name": "Anjali Chopra"}
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
    },
    # NEW: Netflix scam using the SAME SENDER as the Bank Fraud to create a graph intersection
    {
        "text": "Your Netflix account is suspended. Update payment details here: http://netflix-billing-update.com",
        "type": "Phishing",
        "sender": "+91-9876500000", 
        "platform": "sms",
        "collection": "sms_checks"
    },
    # NEW: Lottery scam hitting random outliers
    {
        "text": "WINNER! Your number won 50,000 INR. Reply with bank details to claim.",
        "type": "Scam",
        "sender": "+44-7700-900077",
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
        user_ref = db.collection("users").document(user["uid"])
        user_ref.set({
            "username": user["username"],
            "name": user["name"],
            "joined_at": firestore.SERVER_TIMESTAMP
        })

        # Give each user 3 random spam messages to bulk up the logs
        assigned_spam = random.sample(spam_campaigns, 3) 
        
        for spam in assigned_spam:
            doc_id = datetime.utcnow().isoformat().replace(".", "_")
            
            sub_col_ref = user_ref.collection(spam["collection"]).document(doc_id)
            sub_col_ref.set({
                "message": spam["text"],
                "sender": spam["sender"],
                "prediction": "SPAM",
                "timestamp": firestore.SERVER_TIMESTAMP,
                "pushed_to_community": True 
            })
            
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
        print("   -> Connecting user relationships...")
        # Make Adarsh the absolute center hub
        for i in range(1, len(users)):
            session.run("""
                MATCH (a:User {uid: $u1}), (b:User {uid: $u2})
                MERGE (a)-[r1:FRIENDS_WITH]->(b)
                MERGE (b)-[r2:FRIENDS_WITH]->(a)
            """, u1=LIVE_UID, u2=users[i]["uid"])
        
        # Create cross-connections (triangles) among friends
        cross_links = [
            ("usr_102", "usr_103"), ("usr_104", "usr_105"), 
            ("usr_106", "usr_107"), ("usr_108", "usr_109"),
            ("usr_102", "usr_106"), ("usr_103", "usr_110")
        ]
        for link in cross_links:
            session.run("""
                MATCH (a:User {uid: $u1}), (b:User {uid: $u2})
                MERGE (a)-[r1:FRIENDS_WITH]->(b)
                MERGE (b)-[r2:FRIENDS_WITH]->(a)
            """, u1=link[0], u2=link[1])

        # 3. Inject the Threats (The Cyclic Spam Logic)
        print("   -> Injecting cyclical threat reports...")
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
        
        # Threat 1: Bank Fraud hits Adarsh and a cluster of friends
        bank_fraud = spam_campaigns[0]
        for target in [LIVE_UID, "usr_104", "usr_106", "usr_108"]:
            session.run(report_query, uid=target, hash=generate_hash(bank_fraud["text"]), 
                        type=bank_fraud["type"], preview=bank_fraud["text"][:40]+"...", 
                        sender=bank_fraud["sender"], platform=bank_fraud["platform"])

        # Threat 2: Geek Squad hits a different cluster
        geek_squad = spam_campaigns[1]
        for target in ["usr_102", "usr_107", "usr_109"]:
            session.run(report_query, uid=target, hash=generate_hash(geek_squad["text"]), 
                        type=geek_squad["type"], preview=geek_squad["text"][:40]+"...", 
                        sender=geek_squad["sender"], platform=geek_squad["platform"])

        # Threat 3: Customs Phishing hits a massive chunk of the network, including Adarsh
        phish = spam_campaigns[2]
        for target in ["usr_102", "usr_103", "usr_105", "usr_107", "usr_110", LIVE_UID]:
            session.run(report_query, uid=target, hash=generate_hash(phish["text"]), 
                        type=phish["type"], preview=phish["text"][:40]+"...", 
                        sender=phish["sender"], platform=phish["platform"])

        # Threat 4: Netflix Scam (Shared Sender Node with Bank Fraud)
        netflix = spam_campaigns[3]
        for target in ["usr_106", "usr_108", "usr_110", LIVE_UID]:
            session.run(report_query, uid=target, hash=generate_hash(netflix["text"]), 
                        type=netflix["type"], preview=netflix["text"][:40]+"...", 
                        sender=netflix["sender"], platform=netflix["platform"])
            
        # Threat 5: Lottery hits the outskirts
        lottery = spam_campaigns[4]
        for target in ["usr_104", "usr_109", "usr_110"]:
            session.run(report_query, uid=target, hash=generate_hash(lottery["text"]), 
                        type=lottery["type"], preview=lottery["text"][:40]+"...", 
                        sender=lottery["sender"], platform=lottery["platform"])

    driver.close()
    print("✅ Neo4j seeding complete!")

# ==========================================
# 5. EXECUTION
# ==========================================
if __name__ == "__main__":
    seed_firebase()
    seed_neo4j()
    print("\n🎉 All dummy data successfully injected! You are ready to build the UI.")