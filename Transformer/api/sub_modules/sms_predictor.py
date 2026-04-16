import pickle
import nltk
import string
import time
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

    def predict(self, text: str) -> dict:
        start_time = time.time()
        
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