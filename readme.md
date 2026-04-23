

# Trust Issues 🚩
*"In Cybersecurity, having Trust Issues is a good thing."*

### Real-Time AI/ML-Based Phishing Detection & Prevention System

**Trust Issues** is a cross-platform security solution—available as a **Browser Extension and Mobile App**—that uses advanced Artificial Intelligence and rules to detect phishing attacks in *real-time*. Unlike traditional tools that rely on static blocklists, Trust Issues analyzes the "vibe" of websites, SMS messages, and emails using Deep Learning, NLP, and visual analysis to catch zero-day threats on both your computer and smartphone before you click.

**[View the Live Dashboard Here](https://trustissue.adarshmukherjee.com/)**

---

##  Technology Stack

### **Client & Frontend Applications**
* **Web Dashboard:** Next.js
* **Mobile Application:** Flutter
* **Browser Extension:** Chrome Extension (Manifest V3 architecture)

### **Backend Architecture**
The system operates on a microservices-inspired architecture with two distinct backend services:

**1. Core API & Database Service**
* **Framework:** FastAPI (for high-performance routing)
* **Database:** Neo4j (Graph Database for mapping relationships between entities)
* **Authentication/Config:** Firebase SDK
* **Tunneling/Exposure:** ngrok 

**2. AI/ML Inference Service (Hosted on Railway)**
* **Framework:** FastAPI (secured via API keys)
* **Hosting:** Railway

### **Artificial Intelligence & Machine Learning**
* **Framework:** scikit-learn (sklearn)
* **Email Classification:** ECT Model *(Extra Trees Classifier)*
* **SMS Classification:** Naive Bayes
* **Threat Explanation Engine:** Google Gemini (Generative AI for natural language explanations of threats)
* **Prompt Engineering & Reliability:** DSPy (used to structure and constrain the Gemini model to ensure outputs "stick" and remain consistent)

---

##  Problem Statement Details

| Attribute | Details |
| :--- | :--- |
| **Problem Statement ID** | 25159 |
| **Problem Statement Title** | Real-Time AI/ML-Based Phishing Detection and Prevention System |
| **Organization** | AICTE |
| **Domain** | Blockchain & Cybersecurity |
| **Project Lead** | Adarsh Mukherjee |

