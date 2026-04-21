function injectButton() {
  const headerRows = document.querySelectorAll('.ha');

  headerRows.forEach(row => {
    if (row.querySelector('.trust-issues-btn')) return;

    const subjectH2 = row.querySelector('h2.hP');
    if (!subjectH2) return;

    const btn = document.createElement('button');
    btn.className = 'trust-issues-btn';
    btn.innerText = '🛡️ Scan Threat';
    
    btn.style.cssText = `
      margin-left: 15px; background-color: #0b57d0; color: white; border: none; 
      padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; 
      font-size: 12px; font-family: "Google Sans", sans-serif; transition: background 0.2s;
    `;

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.innerText = '⏳ Scanning...';
      btn.style.opacity = '0.7';

      // Extract Data
      const subject = subjectH2.innerText.trim();
      const bodyNodes = document.querySelectorAll('.a3s.aiL');
      const body = bodyNodes.length > 0 ? bodyNodes[bodyNodes.length - 1].innerText.trim() : "";
      
      // Gmail keeps the sender email in a 'gD' class attribute called 'email'
      const senderNode = document.querySelector('.gD');
      const sender = senderNode ? senderNode.getAttribute('email') : "Unknown";

      chrome.runtime.sendMessage(
        { action: "SCAN_API", subject, body, sender },
        (response) => {
          btn.style.opacity = '1';
          
          if (response && response.success) {
            const prediction = response.prediction;
            if (prediction === "SPAM" || prediction === "PHISHING") {
              btn.innerText = '🚨 ' + prediction;
              btn.style.backgroundColor = '#b3261e'; 
            } else if (prediction === "HAM") {
              btn.innerText = '✅ SAFE (HAM)';
              btn.style.backgroundColor = '#146c2e'; 
            } else {
              btn.innerText = '⚠️ UNKNOWN';
              btn.style.backgroundColor = '#d97706'; 
            }
          } else {
            if (response?.error === "AUTH_REQUIRED") {
              btn.innerText = '🔒 Login in Extension';
              btn.style.backgroundColor = '#d97706';
              alert("Please click the Trust Issues extension icon in the top right of Chrome to log in first!");
            } else {
              btn.innerText = '❌ Error';
              btn.style.backgroundColor = '#5f6368'; 
            }
          }
        }
      );
    };

    subjectH2.style.display = 'inline-block';
    subjectH2.parentNode.insertBefore(btn, subjectH2.nextSibling);
  });
}

setInterval(injectButton, 1000);