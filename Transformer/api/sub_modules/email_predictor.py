import pickle
import numpy as np
import nltk
import string
import time
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from bs4 import BeautifulSoup

class EmailPredictor:
    def __init__(self, subject_vec_path='pkl_files/tfidf_subject.pkl', body_vec_path='pkl_files/tfidf_body.pkl', model_path='pkl_files/email_model_etc.pkl'):
        self.ps = PorterStemmer()
        print("Booting up Email Predictor Engine...")
        try:
            self.tfidf_subject = pickle.load(open(subject_vec_path, 'rb'))
            self.tfidf_body = pickle.load(open(body_vec_path, 'rb'))
            self.model = pickle.load(open(model_path, 'rb'))
            print("Email Engine loaded successfully!")
        except FileNotFoundError as e:
            print(f" Error loading Email Engine files: {e}")
            raise e

    def transform_text(self, text):
        if not isinstance(text, str):
            return ""
            
        # Strip HTML and lowercase
        text = BeautifulSoup(text, "html.parser").get_text(separator=" ").lower()
        text = nltk.word_tokenize(text)
        
        # Remove special characters, stopwords, and punctuation, then stem
        y = [i for i in text if i.isalnum()]
        text = [i for i in y if i not in stopwords.words('english') and i not in string.punctuation]
        y = [self.ps.stem(i) for i in text]
                
        return " ".join(y)

    def predict(self, subject: str, body: str) -> dict:
        start_time = time.time()
        
        # Clean text
        clean_sub = self.transform_text(subject)
        clean_bod = self.transform_text(body)
        
        # Vectorize and stack
        vec_sub = self.tfidf_subject.transform([clean_sub]).toarray()
        vec_bod = self.tfidf_body.transform([clean_bod]).toarray()
        vector_input = np.hstack((vec_sub, vec_bod))
        
        # Predict
        result = self.model.predict(vector_input)[0]
        
        process_time = time.time() - start_time
        
        return {
            "prediction": "SPAM" if result == 1 else "HAM",
            "is_spam": bool(result == 1),
            "processing_time_sec": round(process_time, 4)
        }