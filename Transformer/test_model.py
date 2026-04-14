import pickle
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
import string

# Download required NLTK data (uncomment these if you haven't downloaded them already)
# nltk.download('punkt')
# nltk.download('stopwords')

ps = PorterStemmer()

# 1. Recreate your exact text cleaning function
def transform_text(text):
    text = text.lower()
    text = nltk.word_tokenize(text)
    
    y = []
    for i in text:
        if i.isalnum():
            y.append(i)
            
    text = y[:]
    y.clear()
    
    for i in text:
        if i not in stopwords.words('english') and i not in string.punctuation:
            y.append(i)
            
    text = y[:]
    y.clear()
    
    for i in text:
        y.append(ps.stem(i))
        
    return " ".join(y)

# 2. Load the Pickle files
print("Loading model and vectorizer...")
tfidf = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))
print("Loaded successfully!\n")

# 3. Write a test message
test_message = "AE MOTE TERA GYM IRAN ne uda diya kya, at this point have to call youthe gay of hormuz "

# 4. Clean the text
transformed_message = transform_text(test_message)
print(f"Cleaned Message: '{transformed_message}'")

# 5. Vectorize the text
vector_input = tfidf.transform([transformed_message]).toarray()

# 6. Predict!
result = model.predict(vector_input)[0]

# 7. Print the result
if result == 1:
    print("\n🚨 PREDICTION: SPAM")
else:
    print("\n✅ PREDICTION: NOT SPAM (HAM)")