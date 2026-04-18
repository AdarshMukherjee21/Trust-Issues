import pickle
import nltk
import string
import time
import re
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

class SMSPredictor:
    def __init__(self, vec_path='pkl_files/vectorizer.pkl', model_path='pkl_files/model.pkl'):
        self.ps = PorterStemmer()
        print("Booting up SMS Predictor Engine...")
        try:
            self.tfidf = pickle.load(open(vec_path, 'rb'))
            self.model = pickle.load(open(model_path, 'rb'))
            print(" SMS Engine loaded successfully!")
        except FileNotFoundError as e:
            print(f" Error loading SMS Engine files: {e}")
            raise e

    def transform_text(self, text):
        if not isinstance(text, str):
            return ""
            
        text = text.lower()
        text = nltk.word_tokenize(text)
        
        y = [i for i in text if i.isalnum()]
        text = [i for i in y if i not in stopwords.words('english') and i not in string.punctuation]
        y = [self.ps.stem(i) for i in text]
            
        return " ".join(y)

    def _is_whitelisted_utility(self, text: str) -> bool:
        """
        Heuristic Pre-filter: Catches standard OTPs and Bank Transactions 
        before they hit the ML model to prevent false positives.
        """
        text_lower = text.lower()

        # 1. Catch Standard OTPs
        if "otp" in text_lower or "one time password" in text_lower or "verification code" in text_lower:
            # If it's short (like a standard OTP text), it's safe.
            if len(text) < 150 and not "http" in text_lower: 
                return True

        # 2. Catch Indian Banking Transaction Regex
        bank_pattern = re.compile(r'(a/c|acct|account).*?(debited|credited|trf|transfer)', re.IGNORECASE)
        if bank_pattern.search(text_lower):
            # Ensure it doesn't have a suspicious link.
            if not "http" in text_lower:
                return True
                
        # 3. Catch specific trusted entities
        if "sbi" in text_lower and "refno" in text_lower:
            return True

        return False

    def predict(self, text: str) -> dict:
        start_time = time.time()
        
        # STEP 1: The Abstraction Layer (Whitelist Check)
        if self._is_whitelisted_utility(text):
            process_time = time.time() - start_time
            return {
                "prediction": "HAM",
                "is_spam": False,
                "processing_time_sec": round(process_time, 4)
            }
        
        # STEP 2: ML Engine Fallback
        # Clean text
        transformed_message = self.transform_text(text)
        
        # Vectorize
        vector_input = self.tfidf.transform([transformed_message]).toarray()
        
        # Predict
        result = self.model.predict(vector_input)[0]
        
        process_time = time.time() - start_time
        
        return {
            "prediction": "SPAM" if result == 1 else "HAM",
            "is_spam": bool(result == 1),
            "processing_time_sec": round(process_time, 4)
        }