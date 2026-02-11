from neo4j import GraphDatabase

# 1. Connection Details
URI = "bolt://localhost:7687"
AUTH = ("neo4j", "12345678")

def run_crud_example():
    # Use the driver context manager to handle connection cleanup
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        
        # --- CREATE ---
        print("Creating nodes...")
        driver.execute_query(
            "CREATE (p:Person {name: $name, age: $age})",
            name="Alice", age=30,
            database_="neo4j",
        )

        # --- READ ---
        print("Reading data...")
        records, summary, keys = driver.execute_query(
            "MATCH (p:Person {name: $name}) RETURN p.name AS name, p.age AS age",
            name="Alice",
            database_="neo4j",
        )
        for record in records:
            print(f"Found: {record['name']}, Age: {record['age']}")

        # --- UPDATE ---
        print("Updating data...")
        driver.execute_query(
            "MATCH (p:Person {name: $name}) SET p.age = $new_age",
            name="Alice", new_age=31,
            database_="neo4j",
        )

        # --- DELETE ---
        # print("Deleting data...")
        # driver.execute_query(
        #     "MATCH (p:Person {name: $name}) DETACH DELETE p",
        #     name="Alice",
        #     database_="neo4j",
        # )

if __name__ == "__main__":
    run_crud_example()