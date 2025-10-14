// Configuration
var config = {
  redirectUrl: "https://amilaeduhelp.github.io/-2025/entrence.html",
  sessionTimeout: 24,
  accountValidityDays: 365
};

// Credentials database
var credentials = {
  "ADMIN": { hash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", created: "2024-10-11" },
  "CCAC": { hash: "8f49fc41262fc025774655f2cf0dc8b795a5b492f69ce4566c6c11cc58ba202d", created: "2025-10-10" },
  "CUST001": { hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", created: "2024-11-29" },
  "CUST002": { hash: "8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414", created: "2025-03-01" },
  "CUST100": { hash: "dc658816b8b6be963b4ae5ae4c6befcceb8ac9a8f24b02b7ba1f2e33966137e7", created: "2024-11-30" },
  "GAMINI": { hash: "f654e1e4e711d898a37fb539d53fe41b71d15f0e6090aa0ba2090084f5da140b", created: "2025-10-10" },
  "LAK100": { hash: "fd3ae3b595e9df173e5ad2163b1053f7cc606df00629da74958b0acc7a1d32e3", created: "2025-02-10" },
  "RUKSHI": { hash: "9d980933f27f5763decdc1879ade71901aca981c1467feb55d1aaf0b4b4c4f5b", created: "2025-10-10" },
  "USER001": { hash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", created: "2025-01-01" },
  "USER002": { hash: "481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5", created: "2025-01-15" },
  "NAVODI": { hash: "1d2b158b3ce0c3251f7398b9516db4e60c6fa3b2037179bfe45239688a856261", created: "2025-10-14" },
  "PND27": { hash: "17b77803568c0146a6fc029a255419f98c3ca9f0b2802ea5f4ae9a0e000ac317", created: "2025-10-14" },
  "LAK": { hash: "399c05ddb63bb9d98019a09df13d76d18a8b6e5d4a4a321bff5fda0a48876d8d", created: "2025-10-14" },
  "NISHA": { hash: "c86beae4e0324c4cb3f1d1922e691eaa128933e66e808d3cb0b311eca9a88f28", created: "2025-10-14" },
  "USER003": { hash: "5906ac361a137e2d286465cd6588ebb5ac3f5d5a86aff3ca12020c923adc6c92", created: "2025-02-01" }
};

// Global variables
var mySessionId = generateSessionId();
var myUser = null;
var channel = null;
var countdownInterval = null;

// Utility Functions
function hash(str) {
  return CryptoJS.SHA256(str).toString();
}

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
}

function show(text, type) {
  var m = document.getElementById('msg');
  m.textContent = text;
  m.className = 'message show ' + type;
}

// Modal Functions
function showLogoutModal() {
  document.getElementById('logoutModal').classList.add('show');
}

function closeModal() {
  document.getElementById('logoutModal').classList.remove('show');
  if (channel) {
    channel.postMessage({
      type: 'logout',
      user: myUser
    });
  }
  sessionStorage.clear();
  window.location.reload();
}

function showContentModal() {
  document.getElementById('contentModal').classList.add('show');
}

function closeContentModal() {
  document.getElementById('contentModal').classList.remove('show');
}

function showExpiredModal() {
  document.getElementById('expiredModal').classList.add('show');
}

function closeExpiredModal() {
  document.getElementById('expiredModal').classList.remove('show');
  sessionStorage.clear();
  window.location.reload();
}

// Account Expiry Functions
function checkAccountExpiry(user) {
  var userCred = credentials[user];
  if (!userCred || !userCred.created) {
    return { expired: false, daysLeft: 365 };
  }
  
  var createdDate = new Date(userCred.created);
  var expiryDate = new Date(createdDate);
  expiryDate.setDate(expiryDate.getDate() + config.accountValidityDays);
  
  var now = new Date();
  var timeLeft = expiryDate - now;
  var daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  
  return {
    expired: timeLeft <= 0,
    expiryDate: expiryDate,
    daysLeft: daysLeft,
    timeLeft: timeLeft
  };
}

function updateCountdown(expiryDate) {
  var now = new Date();
  var timeLeft = expiryDate - now;
  
  if (timeLeft <= 0) {
    clearInterval(countdownInterval);
    document.getElementById('countdownBox').classList.remove('show');
    showExpiredModal();
    return;
  }
  
  var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = hours;
  document.getElementById('minutes').textContent = minutes;
}

function startCountdown(expiryDate) {
  document.getElementById('countdownBox').classList.add('show');
  updateCountdown(expiryDate);
  countdownInterval = setInterval(function() {
    updateCountdown(expiryDate);
  }, 60000);
}

// News Badge Functions
function getNewsCount() {
  return 0;
}

function updateNewsBadge() {
  var count = getNewsCount();
  var badge = document.getElementById('newsBadge');
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

// Broadcast Channel Functions
function initBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('BroadcastChannel not supported');
    return null;
  }
  
  channel = new BroadcastChannel('auth_channel');
  
  channel.onmessage = function(event) {
    var data = event.data;
    
    if (data.type === 'new_login' && data.user === myUser && data.sessionId !== mySessionId) {
      showLogoutModal();
    }
    
    if (data.type === 'check_session' && data.user === myUser) {
      channel.postMessage({
        type: 'session_response',
        user: myUser,
        sessionId: mySessionId,
        timestamp: Date.now()
      });
    }
  };
  
  return channel;
}

function checkForExistingSessions(user) {
  return new Promise(function(resolve) {
    if (!channel) {
      resolve(false);
      return;
    }
    
    var responses = [];
    
    var responseHandler = function(event) {
      var data = event.data;
      if (data.type === 'session_response' && data.user === user) {
        responses.push(data);
      }
    };
    
    channel.addEventListener('message', responseHandler);
    
    channel.postMessage({
      type: 'check_session',
      user: user
    });
    
    setTimeout(function() {
      channel.removeEventListener('message', responseHandler);
      resolve(responses.length > 0);
    }, 500);
  });
}

function notifyNewLogin(user) {
  if (channel) {
    channel.postMessage({
      type: 'new_login',
      user: user,
      sessionId: mySessionId,
      timestamp: Date.now()
    });
  }
}

// Main Verification Function
async function verify() {
  var user = document.getElementById('username').value.trim().toUpperCase();
  var pass = document.getElementById('password').value;
  
  if (!user || !pass) {
    show('Please enter both access code and password', 'error');
    return;
  }
  
  var stored = credentials[user];
  
  if (!stored) {
    show('Invalid access code or password', 'error');
    document.getElementById('password').value = '';
    return;
  }
  
  var expiryCheck = checkAccountExpiry(user);
  
  if (expiryCheck.expired) {
    show('⚠️ Your account has expired. Please contact admin for renewal.', 'error');
    document.getElementById('password').value = '';
    showExpiredModal();
    return;
  }
  
  if (hash(pass) === stored.hash) {
    var hasActiveSession = await checkForExistingSessions(user);
    
    if (hasActiveSession) {
      show('⚠️ This account is already active on another tab/window', 'error');
      document.getElementById('password').value = '';
      return;
    }
    
    show('✓ Access granted! Redirecting...', 'success');
    
    myUser = user;
    
    var expires = new Date();
    expires.setHours(expires.getHours() + config.sessionTimeout);
    
    sessionStorage.setItem('auth', 'true');
    sessionStorage.setItem('user', user);
    sessionStorage.setItem('sessionId', mySessionId);
    sessionStorage.setItem('expires', expires.getTime());
    sessionStorage.setItem('accountExpiry', expiryCheck.expiryDate.getTime());
    
    notifyNewLogin(user);
    
    setTimeout(function() {
      window.location.href = config.redirectUrl;
    }, 1200);
  } else {
    show('Invalid access code or password', 'error');
    document.getElementById('password').value = '';
  }
}

// Event Listeners - Run after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Login button
  var loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', verify);
  }
  
  // Enter key on username field
  var usernameInput = document.getElementById('username');
  if (usernameInput) {
    usernameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        var passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.focus();
      }
    });
  }
  
  // Enter key on password field
  var passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') verify();
    });
  }
  
  // Modal close buttons
  var closeLogoutBtn = document.getElementById('closeLogoutBtn');
  if (closeLogoutBtn) {
    closeLogoutBtn.addEventListener('click', closeModal);
  }
  
  var closeContentBtn = document.getElementById('closeContentBtn');
  if (closeContentBtn) {
    closeContentBtn.addEventListener('click', closeContentModal);
  }
  
  var closeExpiredBtn = document.getElementById('closeExpiredBtn');
  if (closeExpiredBtn) {
    closeExpiredBtn.addEventListener('click', closeExpiredModal);
  }
  
  // Action buttons
  var contentBtn = document.getElementById('contentBtn');
  if (contentBtn) {
    contentBtn.addEventListener('click', showContentModal);
  }
  
  var newsBtn = document.getElementById('newsBtn');
  if (newsBtn) {
    newsBtn.addEventListener('click', function() {
      window.location.href = 'news.html';
    });
  }
  
  var priceBtn = document.getElementById('priceBtn');
  if (priceBtn) {
    priceBtn.addEventListener('click', function() {
      window.location.href = 'price.html';
    });
  }
  
  var contactBtn = document.getElementById('contactBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', function() {
      window.open('https://wa.me/94716637804', '_blank');
    });
  }
  
  // Check existing session
  var auth = sessionStorage.getItem('auth');
  var user = sessionStorage.getItem('user');
  var sessionId = sessionStorage.getItem('sessionId');
  var exp = sessionStorage.getItem('expires');
  var accountExp = sessionStorage.getItem('accountExpiry');
  
  if (auth === 'true' && user && sessionId && exp && new Date().getTime() < parseInt(exp)) {
    myUser = user;
    mySessionId = sessionId;
    initBroadcastChannel();
    
    if (accountExp) {
      var expiryDate = new Date(parseInt(accountExp));
      var now = new Date();
      
      if (now >= expiryDate) {
        sessionStorage.clear();
        showExpiredModal();
      } else {
        startCountdown(expiryDate);
      }
    }
    
    updateNewsBadge();
    setInterval(updateNewsBadge, 60000);
  } else {
    initBroadcastChannel();
    updateNewsBadge();
    setInterval(updateNewsBadge, 60000);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  if (channel && myUser) {
    channel.postMessage({
      type: 'logout',
      user: myUser
    });
  }
});
