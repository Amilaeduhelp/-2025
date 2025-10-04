document.addEventListener('DOMContentLoaded', function() {
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
      console.log('Attempting to verify password...');
      
      const response = await fetch(
        SUPABASE_URL + '/rest/v1/access_keys?password=eq.' + encodeURIComponent(password),
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Database error:', errorData);
        throw new Error(errorData.message || 'Failed to connect to database');
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data && data.length > 0) {
        console.log('Login successful!');
        showMessage('✓ Success! Redirecting...', 'success');
        setTimeout(function() {
          window.location.href = REDIRECT_URL;
        }, 1000);
      } else {
        console.log('Invalid password');
        showMessage('Invalid password. Please try again.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Error:', error);
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
});
