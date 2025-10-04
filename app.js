/*
var CONFIG = {
  supabaseUrl: "https://uqgzlaxsnknheoerbfus.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ3psYXhzbmtuaGVvZXJiZnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQzMTEsImV4cCI6MjA2MDM4MDMxMX0.O5dNUizqZ5kfwTs0mHLEorqOAqjZFjWakp2Q484MKEk",
  redirectUrl: "https://amilaeduhelp.github.io/-2025/",
  tableName: "access_keys",
  debug: true
};

var elements = {
  password: document.getElementById('password'),
  loginBtn: document.getElementById('login-btn'),
  message: document.getElementById('message'),
  debug: document.getElementById('debug')
};

function log(msg, data) {
  if (!CONFIG.debug) return;
  var debugEl = elements.debug;
  debugEl.classList.add('show');
  var item = document.createElement('div');
  item.className = 'debug-item';
  item.textContent = msg + (data ? ': ' + JSON.stringify(data) : '');
  debugEl.appendChild(item);
  debugEl.scrollTop = debugEl.scrollHeight;
  console.log(msg, data || '');
}

function showMessage(text, type) {
  elements.message.textContent = text;
  elements.message.className = 'message show ' + type;
}

function setLoading(isLoading) {
  elements.loginBtn.disabled = isLoading;
  elements.loginBtn.textContent = isLoading ? 'Checking...' : 'Login';
}

function verifyPassword(password) {
  var url = CONFIG.supabaseUrl + '/rest/v1/' + CONFIG.tableName + '?password=eq.' + encodeURIComponent(password);
  
  log('Request URL', url);
  
  return fetch(url, {
    method: 'GET',
    headers: {
      'apikey': CONFIG.supabaseKey,
      'Authorization': 'Bearer ' + CONFIG.supabaseKey,
      'Content-Type': 'application/json'
    }
  })
  .then(function(response) {
    log('Response status', response.status);
    log('Response OK', response.ok);
    
    if (!response.ok) {
      return response.json().then(function(err) {
        log('Error response', err);
        throw new Error(err.message || 'Database connection failed');
      });
    }
    return response.json();
  })
  .then(function(data) {
    log('Response data', data);
    log('Data length', data ? data.length : 0);
    return data;
  });
}

function handleLogin() {
  var password = elements.password.value.trim();
  
  if (!password) {
    showMessage('Please enter a password', 'error');
    return;
  }

  log('Login attempt', 'Starting...');
  showMessage('Verifying password...', 'loading');
  setLoading(true);

  verifyPassword(password)
    .then(function(data) {
      if (data && data.length > 0) {
        log('Login success', 'Match found!');
        showMessage('✓ Success! Redirecting...', 'success');
        setTimeout(function() {
          log('Redirecting', CONFIG.redirectUrl);
          window.location.href = CONFIG.redirectUrl;
        }, 1500);
      } else {
        log('Login failed', 'No match');
        showMessage('Invalid password. Please try again.', 'error');
        setLoading(false);
        elements.password.value = '';
        elements.password.focus();
      }
    })
    .catch(function(error) {
      log('Error occurred', error.message);
      showMessage('Error: ' + error.message, 'error');
      setLoading(false);
    });
}

elements.loginBtn.addEventListener('click', handleLogin);
elements.password.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') handleLogin();
});
elements.password.focus();

log('System initialized', 'Ready');
*/
