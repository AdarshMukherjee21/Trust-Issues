from neo4j import GraphDatabase
import os
import dotenv

dotenv.load_dotenv()

password = os.getenv("NEO4J_PASSWORD", "trustissue")  
class Neo4jConnection:
    def __init__(self):
        URI = "bolt://localhost:7687"
        AUTH = ("neo4j", password)
        self.driver = GraphDatabase.driver(URI, auth=AUTH)
        self.driver.verify_connectivity()
        print(" Core Neo4j Driver Initialized")

    def get_driver(self):
        return self.driver

    def close(self):
        self.driver.close()

# Create a single global instance to be imported by the routers
neo4j_db = Neo4jConnection()