
#  Trust Issues: Community Graph (Neo4j & Python)

This directory houses the Graph Intelligence layer of the Trust Issues project. It contains the database schemas, Cypher queries, and Python data seeders required to map the community trust network and propagate zero-day threat warnings.

##  The Trust Graph Architecture
Unlike static databases, this Neo4j graph maps the relationships between entities to catch cyclical and clustered spam campaigns.
* **Nodes:** `User` (Mobile/Web users), `Threat` (Hashes of malicious payloads), `Sender` (Phone numbers or spoofed domains).
* **Edges:** `FRIENDS_WITH` (User-to-User), `REPORTED` (User-to-Threat), `SENT_BY` (Threat-to-Sender).

##  Contents
* `seeder.py` - A robust Python script that generates realistic clusters of friends, shared threat reports, and cyclical spam campaigns to populate the graph for testing and demos.
* `queries.cypher` - (Optional) A collection of the core Cypher queries used by the backend to traverse the graph and calculate user vulnerability scores.

##  Getting Started

### Prerequisites
* Python 3.9+
* A running instance of Neo4j (either local Neo4j Desktop or Cloud Neo4j Aura).
* Firebase Admin SDK credentials JSON file.

### Setup Instructions
1. **Setup Python Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate 
    # On Windows: venv\Scripts\activate
   pip install neo4j firebase-admin


2.  **Configure Credentials:**
      * Place your Firebase Admin SDK JSON file (e.g., `trust-issues-firebase-adminsdk.json`) in this directory.
      * Open `seeder.py` and update the `FIREBASE_CRED_PATH`, `NEO4J_URI`, and `NEO4J_AUTH` variables at the top of the file.
3.  **Run the Seeder:**
    ```bash
    python seeder.py
    ```
    *This will clear existing dummy data and populate your Neo4j instance and Firebase Firestore with interconnected test data, ready for UI rendering.*

