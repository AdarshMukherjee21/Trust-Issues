from fastapi import APIRouter, HTTPException
from database import neo4j_db

router = APIRouter(prefix="/api/v1/graph-viz", tags=["Graph Visualization"])

class GraphVizManager:
    def __init__(self, driver):
        self.driver = driver

    def get_user_subgraph(self, uid: str):
        """
        Grabs the user, their friends, and the threats/senders connected to them.
        Formats the output strictly into { "nodes": [], "links": [] }
        """
        # This query finds the user, their 1st-degree friends, and any spam they reported
        query = """
        MATCH (me:User {uid: $uid})-[:FRIENDS_WITH*0..1]-(network:User)
        OPTIONAL MATCH (network)-[r1:REPORTED]->(t:Threat)
        OPTIONAL MATCH (t)-[r2:SENT_BY]->(s:Sender)
        RETURN network, r1, t, r2, s
        """
        
        nodes_dict = {}
        links_list = []
        links_tracker = set() # To prevent duplicate lines

        def process_node(node):
            if node is not None and node.element_id not in nodes_dict:
                # Extract the label (e.g., "User", "Threat") and all properties
                nodes_dict[node.element_id] = {
                    "id": node.element_id,
                    "label": list(node.labels)[0],
                    "properties": dict(node)
                }

        def process_edge(rel):
            if rel is not None and rel.element_id not in links_tracker:
                links_tracker.add(rel.element_id)
                links_list.append({
                    "id": rel.element_id,
                    "source": rel.start_node.element_id,
                    "target": rel.end_node.element_id,
                    "type": rel.type,
                    "properties": dict(rel)
                })

        with self.driver.session() as session:
            result = session.run(query, uid=uid)
            
            for record in result:
                # Process all possible nodes in this row
                process_node(record.get("network"))
                process_node(record.get("t"))
                process_node(record.get("s"))
                
                # Process all possible relationships in this row
                process_edge(record.get("r1"))
                process_edge(record.get("r2"))

        # Convert the dictionary of nodes into a flat list for the frontend
        return {
            "nodes": list(nodes_dict.values()),
            "links": links_list
        }

# Instantiate the manager
viz_manager = GraphVizManager(neo4j_db.get_driver())

@router.get("/{uid}")
async def fetch_graph_data(uid: str):
    """Endpoint for Next.js and Flutter to download the graph layout."""
    try:
        graph_data = viz_manager.get_user_subgraph(uid)
        return {"status": "success", "data": graph_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))