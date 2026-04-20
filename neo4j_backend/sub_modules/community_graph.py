from neo4j import GraphDatabase
from datetime import datetime

class CommunityGraph:
    def __init__(self):
        # 1. Connection Details
        self.URI = "bolt://localhost:7687"
        self.AUTH = ("neo4j", "trustissue")
        
        print("🕸️ Booting up Neo4j Community Graph Driver...")
        try:
            self.driver = GraphDatabase.driver(self.URI, auth=self.AUTH)
            # Verify connectivity
            self.driver.verify_connectivity()
            print("✅ Connected to Neo4j successfully!")
        except Exception as e:
            print(f"❌ Failed to connect to Neo4j: {e}")
            raise e

    def close(self):
        """Always close the driver when the server shuts down."""
        self.driver.close()

    # ==========================================
    # 1. USER & COMMUNITY MANAGEMENT
    # ==========================================

    def create_or_update_user(self, uid: str, username: str):
        """Creates a new user node, or updates the username if the UID already exists."""
        query = """
        MERGE (u:User {uid: $uid})
        SET u.username = $username
        RETURN u
        """
        with self.driver.session() as session:
            session.run(query, uid=uid, username=username)
            return True

    def create_friendship(self, uid1: str, uid2: str):
        """Creates a bidirectional FRIENDS_WITH relationsphip between two users."""
        query = """
        MATCH (u1:User {uid: $uid1})
        MATCH (u2:User {uid: $uid2})
        MERGE (u1)-[r1:FRIENDS_WITH]->(u2)
        MERGE (u2)-[r2:FRIENDS_WITH]->(u1)
        SET r1.since = datetime(), r2.since = datetime()
        RETURN r1, r2
        """
        with self.driver.session() as session:
            session.run(query, uid1=uid1, uid2=uid2)
            return True

    # ==========================================
    # 2. THREAT REPORTING
    # ==========================================

    def report_threat(self, reporter_uid: str, threat_hash: str, threat_type: str, sender_contact: str, sender_platform: str):
        """
        The Master Query. 
        Creates/Matches the Threat and the Sender, then links them to the User who reported it.
        """
        query = """
        // 1. Find the user making the report
        MATCH (u:User {uid: $uid})
        
        // 2. Find or Create the Threat and Sender
        MERGE (t:Threat {hash: $threat_hash})
        ON CREATE SET t.type = $threat_type
        
        MERGE (s:Sender {contact: $sender_contact})
        ON CREATE SET s.platform = $sender_platform
        
        // 3. Create the Relationships (The Red String)
        MERGE (u)-[r:REPORTED]->(t)
        ON CREATE SET r.timestamp = datetime()
        
        MERGE (t)-[sb:SENT_BY]->(s)
        ON CREATE SET sb.first_seen = datetime()
        """
        with self.driver.session() as session:
            session.run(
                query, 
                uid=reporter_uid, 
                threat_hash=threat_hash, 
                threat_type=threat_type,
                sender_contact=sender_contact,
                sender_platform=sender_platform
            )
            return True

    # ==========================================
    # 3. GRAPH INTELLIGENCE QUERIES
    # ==========================================

    def get_threats_targeting_friends(self, uid: str):
        """
        Finds all spam that has been reported by people in the user's friend network.
        This is why we use Neo4j!
        """
        query = """
        MATCH (me:User {uid: $uid})-[:FRIENDS_WITH]-(friend:User)-[:REPORTED]->(t:Threat)-[:SENT_BY]->(s:Sender)
        RETURN friend.username AS reporter, t.type AS scam_type, s.contact AS sender_id, t.hash AS hash
        ORDER BY friend.username
        """
        with self.driver.session() as session:
            result = session.run(query, uid=uid)
            # Format the output into a clean list of dictionaries
            return [{"reporter": record["reporter"], 
                     "scam_type": record["scam_type"], 
                     "sender_id": record["sender_id"],
                     "hash": record["hash"]} 
                    for record in result]

# ==========================================
# 🧪 LOCAL TESTING BLOCK
# ==========================================
if __name__ == "__main__":
    # Boot up the graph
    graph = CommunityGraph()

    print("\n--- Generating Dummy Data ---")
    
    # 1. Create Users
    graph.create_or_update_user("user_101", "adarsh_m")
    graph.create_or_update_user("user_102", "krish_b")
    graph.create_or_update_user("user_103", "sailendra_k")
    print("Users created.")

    # 2. Link them up
    graph.create_friendship("user_101", "user_102") # Adarsh is friends with Krish
    graph.create_friendship("user_101", "user_103") # Adarsh is friends with Sailendra
    print("Friend network established.")

    # 3. Simulate a Spam Attack
    # Krish gets a fake bank alert
    graph.report_threat(
        reporter_uid="user_102", 
        threat_hash="hash_8899_fake_bank", 
        threat_type="Smishing", 
        sender_contact="+91-9876543210", 
        sender_platform="sms"
    )
    
    # Sailendra gets a crypto scam
    graph.report_threat(
        reporter_uid="user_103", 
        threat_hash="hash_7777_crypto", 
        threat_type="Advance Fee", 
        sender_contact="admin@cryptowin.net", 
        sender_platform="email"
    )
    print("Threats reported to the global graph.")

    print("\n--- Running Graph Intelligence ---")
    # Adarsh logs in and checks his "Friend Threat Feed"
    friend_threats = graph.get_threats_targeting_friends("user_101")
    
    print(f"Threats targeting Adarsh's network:")
    for threat in friend_threats:
        print(f" ⚠️ {threat['reporter']} reported a {threat['scam_type']} from {threat['sender_id']}")

    graph.close()