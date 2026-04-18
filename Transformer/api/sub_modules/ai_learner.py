import os
import dspy
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

# ==========================================
# 1. Pydantic Data Models (Input & Output)
# ==========================================
class ExplanationRequest(BaseModel):
    source: str = Field(..., description="Either 'email' or 'sms'")
    subject: Optional[str] = Field(default="N/A", description="Subject line if it is an email")
    body: str = Field(..., description="The main text content of the message")
    ml_model_output: str = Field(..., description="The classification result from your ML engine (e.g., 'SPAM' or 'HAM')")

class ExplanationResponse(BaseModel):
    why_spam: str = Field(description="Detailed explanation of why this was flagged. word limit: 150 words. must be clear no formating or markdown, just plain text.")
    spam_type: str = Field(description="The category of spam.")
    detection_tips: str = Field(description="Actionable tips for the user.word limit: 150 words. must be clear no formating or markdown, just plain text.")
    # Added an optional error field to cleanly pass backend issues to the Flutter app
    error: Optional[str] = Field(default=None, description="System error message, if any.")

# ==========================================
# 2. DSPy Signature
# ==========================================
class SpamAnalysisSignature(dspy.Signature):
    """Analyze a suspicious message to explain why it is spam, classify its type, and provide detection tips to educate the user."""
    
    source: str = dspy.InputField(desc="Source of the message: 'email' or 'sms'")
    subject: str = dspy.InputField(desc="Subject of the message (if applicable)")
    body: str = dspy.InputField(desc="Body content of the message")
    ml_model_output: str = dspy.InputField(desc="Prediction from the ML classification engine")

    why_spam: str = dspy.OutputField(desc="A clear, conversational, and empathetic explanation of exactly why this message triggered the spam filter.")
    spam_type: str = dspy.OutputField(desc="The specific cybersecurity category of this spam (e.g., Phishing, Smishing, Advance Fee Fraud, Credential Harvesting).")
    detection_tips: str = dspy.OutputField(desc="A brief, bulleted list of actionable tips on how the user can manually spot this specific type of scam in the future.")

# ==========================================
# 3. The Core Class
# ==========================================
class AILearner:
    def __init__(self):
        print(" Booting up DSPy AI Learner Engine...")
        load_dotenv()
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(" GEMINI_API_KEY is missing from the environment variables!")

        # Initialize DSPy with Gemini 2.5 Flash
        self.lm = dspy.LM("gemini/gemini-2.5-flash", api_key=api_key)
        dspy.configure(lm=self.lm)
        
        # Initialize the Predictor using our Signature
        self.analyzer = dspy.Predict(SpamAnalysisSignature)
        print(" AI Learner Engine connected to Gemini!")

    def explain_spam(self, data: ExplanationRequest) -> ExplanationResponse:
        """Takes a Pydantic request, runs it through DSPy, and returns a Pydantic response with error handling."""
        
        try:
            # Run the DSPy prediction
            result = self.analyzer(
                source=data.source,
                subject=data.subject,
                body=data.body,
                ml_model_output=data.ml_model_output
            )

            # Map the DSPy output cleanly into our Pydantic Response model
            return ExplanationResponse(
                why_spam=result.why_spam,
                spam_type=result.spam_type,
                detection_tips=result.detection_tips,
                error=None
            )
            
        except Exception as e:
            # DSPy will pass up the underlying HTTP/API errors from the Gemini call.
            # We convert the error to a string and make it lowercase to easily check for keywords.
            error_str = str(e).lower()
            
            # 1. Handle Rate Limits & Exhausted API Keys
            if "429" in error_str or "quota" in error_str or "rate limit" in error_str or "exhausted" in error_str:
                safe_error_msg = "API_QUOTA_EXCEEDED: The AI Helper is currently experiencing high traffic or is out of credits. Please try again later."
                
            # 2. Handle Timeouts (Gemini took too long to reply)
            elif "timeout" in error_str or "deadline" in error_str:
                safe_error_msg = "TIMEOUT: The AI Helper took too long to analyze this message. Please try again."
                
            # 3. Catch-all for other weird API errors
            else:
                safe_error_msg = f"SYSTEM_ERROR: The AI Helper encountered an unexpected issue."
                print(f" Unhandled AI Error: {str(e)}") # Log the actual error to your Railway console

            # Return a "Graceful Fallback" response. 
            # This ensures your Flutter app still receives valid JSON and can display the warning to the user cleanly.
            return ExplanationResponse(
                why_spam=f" {safe_error_msg}",
                spam_type="Classification Unavailable",
                detection_tips="Please rely on the core ML Model's prediction until the AI Helper is back online.",
                error=safe_error_msg
            )