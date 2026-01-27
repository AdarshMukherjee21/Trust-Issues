import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

# 1. Load the variables from .env
load_dotenv()

# 2. Get the values (Must match the names in your .env file exactly)
URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME", "neo4j") # Defaults to "neo4j" if not found
PASSWORD = os.getenv("NEO4J_PASSWORD")

# Debug check: Print to see if they loaded (DO NOT print the password in real apps!)
if not URI or not PASSWORD:
    print("Error: Could not load credentials from .env file.")
else:
    print(f"Loaded URI: {URI}")

# 3. Create the driver
try:
    with GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD)) as driver:
        driver.verify_connectivity()
        print("Success! Connected securely using .env")
        
        # Optional: Run a quick test query
        summary = driver.execute_query("RETURN 'Hello Neo4j' AS greeting").summary
        print(f"Query executed successfully. {summary}")

except Exception as e:
    print(f"Connection failed: {e}")