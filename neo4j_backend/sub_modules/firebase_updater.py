import firebase_admin
from firebase_admin import credentials, firestore

class FirebaseUpdater:
    def __init__(self, cred_path: str):
        print("⚙️ Initializing Firebase Admin SDK...")
        # Prevent initializing twice if the app reloads
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()
        print("  Firebase Connected!")

    def update_backend_status(self, is_active: bool, url: str = ""):
        """Updates the public/backend_status document in Firestore."""
        doc_ref = self.db.collection("public").document("backend_status")
        
        try:
            doc_ref.set({
                "is_active": is_active,
                "link_to_backend": url,
                "last_updated": firestore.SERVER_TIMESTAMP
            }, merge=True)
            print(f"📡 Firebase Status Updated -> Active: {is_active} | URL: {url}")
        except Exception as e:
            print(f"❌ Failed to update Firebase status: {e}")