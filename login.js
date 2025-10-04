// login.js - Debug Version
(function() {
  const SUPABASE_URL = "https://uqgzlaxsnknheoerbfus.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3psYXhzbmtuaGVvZXJiZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQzMTEsImV4cCI6MjA2MDM4MDMxMX0.O5dNUizqZ5kfwTs0mHLEorqOAqjZFjWakp2Q484MKEk";
  const REDIRECT_URL = "https://amilaeduhelp.github.io/-2025/";

  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const messageDiv = document.getElementById('message');

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message show ' + type;
  }

  function hideMessage() {
    messageDiv.className = 'message';
  }

  async function handleLogin() {
    const password = passwordInput.value.trim();

    if (!password) {
      showMessage('Please enter a password', 'error');
      return;
    }

    hideMessage();
    loginBtn.disabled = true;
    loginBtn.textContent = 'Checking...';
    showMessage('Verifying password...', 'loading');

    try {
      console.log('=== DEBUG INFO ===');
      console.log('Password entered:', password);
      console.log('Supabase URL:', SUPABASE_URL);
      
      const url = SUPABASE_URL + '/rest/v1/access_keys?password=eq.' + encodeURIComponent(password);
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', data ? data.length : 'null');

      if (!response.ok) {
        console.error('Database error:', data);
        throw new Error(data.message || 'Failed to connect to database');
      }

      if (data && data.length > 0) {
        console.log('✓ Password match found!');
        console.log('Matched record:', data[0]);
        showMessage('✓ Success! Redirecting...', 'success');
        
        console.log('Redirecting to:', REDIRECT_URL);
        setTimeout(function() {
          console.log('Executing redirect now...');
          window.location.href = REDIRECT_URL;
        }, 1500);
      } else {
        console.log('✗ No password match found');
        showMessage('Invalid password. Please try again.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Error occurred:', error);
      console.error('Error stack:', error.stack);
      showMessage('Error: ' + error.message, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  }

  loginBtn.addEventListener('click', handleLogin);

  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });

  passwordInput.focus();
})();
