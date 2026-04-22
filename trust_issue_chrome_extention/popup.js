// Check if already logged in
chrome.storage.local.get(['uid'], (res) => {
  if (res.uid) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('success-section').classList.remove('hidden');
  }
});

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  const errorMsg = document.getElementById('error-msg');

  btn.innerText = "Authenticating...";
  errorMsg.classList.add('hidden');

  try {
    // 1. Use Firebase REST API to login
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CONFIG.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

   const data = await res.json();

    if (!res.ok) throw new Error(data.error.message);

    // ✅ FIX: Use 'data' instead of 'user'
    chrome.storage.local.set({ 
      uid: data.localId, 
      idToken: data.idToken,       // From REST response
      refreshToken: data.refreshToken // From REST response
    }, () => {
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('success-section').classList.remove('hidden');
    });

  } catch (err) {
    errorMsg.innerText = err.message.replace(/_/g, ' ');
    errorMsg.classList.remove('hidden');
    btn.innerText = "Login";
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  chrome.storage.local.clear(() => location.reload());
});