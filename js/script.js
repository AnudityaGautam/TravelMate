/**
 * TravelMate - Trip Expense Tracker & Splitter
 * Main JavaScript File (js/script.js)
 * 
 * Features:
 * 1. Mobile navigation menu toggle and active link detection.
 * 2. URL parameter parsing (e.g. ?destination=Goa pre-fills "Goa Trip").
 * 3. Dynamic Trip Creation with customizable number of members.
 * 4. LocalStorage persistence for both trip metadata and actual expenses.
 * 5. Full Expense CRUD (Add, Edit, Delete) with live recalculations.
 * 6. Financial Analytics: Total Expense, Average per Person, Member Summary.
 * 7. Simplified Settlement Engine ("Who Owes Whom").
 * 8. Native Browser Print & "Save as PDF" report generation.
 */

// Global state keys for localStorage
const STORAGE_KEYS = {
  TRIPS: 'travelMateTrips',
  ACTIVE_ID: 'travelMateActiveTripId',
  LEGACY_TRIP: 'travelMateTrip',
  LEGACY_EXPENSES: 'travelMateExpenses',
  USERS: 'travelMateUsers',
  CURRENT_USER: 'travelMateCurrentUser'
};

// Current editing state
let editingExpenseId = null;
let editingTripId = null;

// Initialize app when DOM is ready
function initApp() {
  initTheme();
  initAuth();
  setupNavigation();
  initSosModal();
  initExpenseTracker();
  initDestinationsFilter();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/**
 * ----------------------------------------------------
 * Theme Switcher (Dark Mode / Light Mode)
 * ----------------------------------------------------
 */
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('travelMateTheme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  
  function applyTheme(dark) {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('travelMateTheme', 'dark');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '☀️';
        themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('travelMateTheme', 'light');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = '🌙';
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
      }
    }
  }

  // Initial sync with DOM state
  applyTheme(isDark);

  if (themeToggleBtn) {
    themeToggleBtn.onclick = () => {
      const currentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(!currentlyDark);
    };
  }
}

/**
 * ----------------------------------------------------
 * Emergency Tourist Helplines Modal (SOS)
 * ----------------------------------------------------
 */
function initSosModal() {
  const sosNavBtn = document.getElementById('sosNavBtn');
  const sosModal = document.getElementById('sosModal');
  const closeSosBtn = document.getElementById('closeSosBtn');

  if (!sosModal) return;

  if (sosNavBtn) {
    sosNavBtn.addEventListener('click', () => {
      sosModal.classList.remove('hidden');
    });
  }

  if (closeSosBtn) {
    closeSosBtn.addEventListener('click', () => {
      sosModal.classList.add('hidden');
    });
  }

  sosModal.addEventListener('click', (e) => {
    if (e.target === sosModal) {
      sosModal.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sosModal.classList.add('hidden');
      const shareModal = document.getElementById('shareModal');
      if (shareModal) shareModal.classList.add('hidden');
      const activityModal = document.getElementById('activityModal');
      if (activityModal) activityModal.classList.add('hidden');
    }
  });
}

/**
 * ----------------------------------------------------
 * 1. Navigation Setup
 * ----------------------------------------------------
 */
function setupNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('show');
      }
    });
  }

  // Highlight active link based on current filename
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Render dynamic login / user greeting in navigation bar
  renderNavAuth();
}

/**
 * ----------------------------------------------------
 * User Authentication & Session Management
 * ----------------------------------------------------
 */
const DEFAULT_USERS = [
  {
    name: 'Avisneh Kushwaha',
    email: 'avisneh@travelmate.com',
    password: 'password123',
    role: 'Team Leader',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    name: 'Anuditya Gautam',
    email: 'anuditya@travelmate.com',
    password: 'password123',
    role: 'UI/UX & Settlement',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    name: 'Dipali Sinha',
    email: 'dipali@travelmate.com',
    password: 'password123',
    role: 'QA & Documentation',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch (e) {
    return DEFAULT_USERS;
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    const safeUser = {
      name: user.name,
      email: user.email,
      role: user.role || 'Traveler'
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  renderNavAuth();
  alert('You have been signed out.');
  window.location.reload();
}

function renderNavAuth() {
  const actionsGroup = document.querySelector('.nav-actions-group');
  if (!actionsGroup) return;

  let authSlot = document.getElementById('navAuthSlot');
  if (!authSlot) {
    authSlot = document.createElement('div');
    authSlot.id = 'navAuthSlot';
    authSlot.style.display = 'flex';
    authSlot.style.alignItems = 'center';
    authSlot.style.gap = '0.5rem';
    actionsGroup.appendChild(authSlot);
  }

  const currentUser = getCurrentUser();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  if (currentUser) {
    const firstName = currentUser.name.split(' ')[0] || currentUser.name;
    const initial = (currentUser.name[0] || 'U').toUpperCase();
    authSlot.innerHTML = `
      <div class="nav-user-chip" title="${currentUser.name} (${currentUser.role || 'Member'})">
        <span class="nav-user-avatar">${initial}</span>
        <span>${firstName}</span>
      </div>
      <button type="button" class="btn-nav-logout" id="navLogoutBtn" title="Sign Out">Logout</button>
    `;

    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logoutUser();
      });
    }
  } else {
    if (currentPath !== 'login.html') {
      authSlot.innerHTML = `
        <a href="login.html" class="btn-nav-login" title="Sign In or Create Account">
          <span>👤</span> Sign In
        </a>
      `;
    } else {
      authSlot.innerHTML = '';
    }
  }
}

function initAuth() {
  // Pre-seed default team accounts if empty
  getUsers();

  // Active OTP session state
  let currentOtpSession = {
    active: false,
    code: null,
    channel: 'gmail', // 'gmail' or 'whatsapp'
    target: '',
    purpose: 'login', // 'login' or 'signup'
    payload: null,
    expiresAt: 0,
    countdownTimer: null
  };

  // Login & Sign Up page DOM elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const otpForm = document.getElementById('otpForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabSignupBtn = document.getElementById('tabSignupBtn');
  const authTabsNav = document.getElementById('authTabsNav');
  const loginPanel = document.getElementById('loginPanel');
  const signupPanel = document.getElementById('signupPanel');
  const otpPanel = document.getElementById('otpPanel');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const loginAlert = document.getElementById('loginAlert');
  const signupAlert = document.getElementById('signupAlert');
  const otpAlert = document.getElementById('otpAlert');
  const togglePwdButtons = document.querySelectorAll('.btn-toggle-pwd');
  const forgotPwdLink = document.getElementById('forgotPwdLink');
  const forgotPwdModal = document.getElementById('forgotPwdModal');
  const closeForgotPwdBtn = document.getElementById('closeForgotPwdBtn');
  const resetPwdForm = document.getElementById('resetPwdForm');
  const resetPwdAlert = document.getElementById('resetPwdAlert');

  // Channel toggles for Login
  const loginGmailLabel = document.getElementById('loginChannelGmailLabel');
  const loginWhatsappLabel = document.getElementById('loginChannelWhatsappLabel');
  const loginWhatsappWrap = document.getElementById('loginWhatsappWrap');
  const loginWhatsappPhone = document.getElementById('loginWhatsappPhone');

  // Channel toggles for Signup
  const signupGmailLabel = document.getElementById('signupChannelGmailLabel');
  const signupWhatsappLabel = document.getElementById('signupChannelWhatsappLabel');
  const signupWhatsappWrap = document.getElementById('signupWhatsappWrap');
  const signupWhatsappPhone = document.getElementById('signupWhatsappPhone');

  // OTP Controls
  const otpDigits = document.querySelectorAll('.otp-digit');
  const btnResendOtp = document.getElementById('btnResendOtp');
  const otpCountdown = document.getElementById('otpCountdown');
  const otpTimerText = document.getElementById('otpTimerText');
  const btnAutoFillOtp = document.getElementById('btnAutoFillOtp');
  const btnCancelOtp = document.getElementById('btnCancelOtp');
  const whatsappActionBox = document.getElementById('whatsappActionBox');
  const btnOpenWhatsApp = document.getElementById('btnOpenWhatsApp');
  const otpTargetDisplay = document.getElementById('otpTargetDisplay');

  // Floating Toast
  const otpToast = document.getElementById('otpSimulatorToast');
  const toastIcon = document.getElementById('toastIcon');
  const toastChannelName = document.getElementById('toastChannelName');
  const toastCodeDisplay = document.getElementById('toastCodeDisplay');
  const toastCloseBtn = document.getElementById('toastCloseBtn');

  // Demo user quick fill buttons
  const demoUserBtns = document.querySelectorAll('.btn-demo-user');
  demoUserBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const pwd = btn.getAttribute('data-pwd');
      const phone = btn.getAttribute('data-phone');
      const emailInput = document.getElementById('loginEmail');
      const pwdInput = document.getElementById('loginPassword');
      if (emailInput) emailInput.value = email || '';
      if (pwdInput) pwdInput.value = pwd || '';
      if (loginWhatsappPhone && phone) loginWhatsappPhone.value = phone;
      if (loginAlert) loginAlert.classList.add('hidden');
    });
  });

  // 1. Channel Selector Setup
  if (loginGmailLabel && loginWhatsappLabel) {
    loginGmailLabel.addEventListener('click', () => {
      loginGmailLabel.classList.add('active');
      loginWhatsappLabel.classList.remove('active');
      const r = loginGmailLabel.querySelector('input[type="radio"]');
      if (r) r.checked = true;
      if (loginWhatsappWrap) loginWhatsappWrap.classList.add('hidden');
    });

    loginWhatsappLabel.addEventListener('click', () => {
      loginWhatsappLabel.classList.add('active');
      loginGmailLabel.classList.remove('active');
      const r = loginWhatsappLabel.querySelector('input[type="radio"]');
      if (r) r.checked = true;
      if (loginWhatsappWrap) {
        loginWhatsappWrap.classList.remove('hidden');
        if (loginWhatsappPhone) loginWhatsappPhone.focus();
      }
    });
  }

  if (signupGmailLabel && signupWhatsappLabel) {
    signupGmailLabel.addEventListener('click', () => {
      signupGmailLabel.classList.add('active');
      signupWhatsappLabel.classList.remove('active');
      const r = signupGmailLabel.querySelector('input[type="radio"]');
      if (r) r.checked = true;
      if (signupWhatsappWrap) signupWhatsappWrap.classList.add('hidden');
    });

    signupWhatsappLabel.addEventListener('click', () => {
      signupWhatsappLabel.classList.add('active');
      signupGmailLabel.classList.remove('active');
      const r = signupWhatsappLabel.querySelector('input[type="radio"]');
      if (r) r.checked = true;
      if (signupWhatsappWrap) {
        signupWhatsappWrap.classList.remove('hidden');
        if (signupWhatsappPhone) signupWhatsappPhone.focus();
      }
    });
  }

  // 2. Tab switching
  if (tabLoginBtn && tabSignupBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabSignupBtn.classList.remove('active');
      tabLoginBtn.setAttribute('aria-selected', 'true');
      tabSignupBtn.setAttribute('aria-selected', 'false');
      if (loginPanel) loginPanel.classList.remove('hidden');
      if (signupPanel) signupPanel.classList.add('hidden');
      if (otpPanel) otpPanel.classList.add('hidden');
      if (authTabsNav) authTabsNav.classList.remove('hidden');
      if (authTitle) authTitle.textContent = 'Welcome Back';
      if (authSubtitle) authSubtitle.textContent = 'Sign in to sync your trips, track expenses, and manage group splits with OTP verification.';
      if (loginAlert) loginAlert.classList.add('hidden');
    });

    tabSignupBtn.addEventListener('click', () => {
      tabSignupBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      tabSignupBtn.setAttribute('aria-selected', 'true');
      tabLoginBtn.setAttribute('aria-selected', 'false');
      if (signupPanel) signupPanel.classList.remove('hidden');
      if (loginPanel) loginPanel.classList.add('hidden');
      if (otpPanel) otpPanel.classList.add('hidden');
      if (authTabsNav) authTabsNav.classList.remove('hidden');
      if (authTitle) authTitle.textContent = 'Create an Account';
      if (authSubtitle) authSubtitle.textContent = 'Join TravelMate to start planning trips, setting budgets, and splitting expenses.';
      if (signupAlert) signupAlert.classList.add('hidden');
    });
  }

  // 3. Password visibility toggle
  togglePwdButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  // 4. Audio Notification Chime Helper (Web Audio API)
  function playOtpChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // Note A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // 5. Floating Toast Notification
  function showOtpToast(channel, target, code) {
    if (!otpToast) return;
    if (channel === 'whatsapp') {
      otpToast.className = 'otp-toast whatsapp-toast';
      if (toastIcon) toastIcon.textContent = '💬';
      if (toastChannelName) toastChannelName.textContent = `WhatsApp Code (${target})`;
    } else {
      otpToast.className = 'otp-toast gmail-toast';
      if (toastIcon) toastIcon.textContent = '📧';
      if (toastChannelName) toastChannelName.textContent = `Gmail Code (${target})`;
    }
    if (toastCodeDisplay) toastCodeDisplay.textContent = code;
    otpToast.classList.remove('hidden');
    playOtpChime();

    // Clicking toast auto-fills the OTP
    otpToast.onclick = (e) => {
      if (e.target.id === 'toastCloseBtn' || e.target.classList.contains('toast-close')) {
        otpToast.classList.add('hidden');
        return;
      }
      fillOtp(code);
      otpToast.classList.add('hidden');
    };

    if (toastCloseBtn) {
      toastCloseBtn.onclick = (e) => {
        e.stopPropagation();
        otpToast.classList.add('hidden');
      };
    }

    setTimeout(() => {
      if (otpToast) otpToast.classList.add('hidden');
    }, 12000);
  }

  // 6. OTP Digit Input Helpers
  function clearOtpDigits() {
    otpDigits.forEach(d => { d.value = ''; });
    if (otpDigits[0]) otpDigits[0].focus();
  }

  function fillOtp(code) {
    const chars = code.toString().split('');
    otpDigits.forEach((d, i) => {
      d.value = chars[i] || '';
    });
    if (otpDigits[otpDigits.length - 1]) otpDigits[otpDigits.length - 1].focus();
  }

  function getEnteredOtp() {
    let code = '';
    otpDigits.forEach(d => { code += d.value.trim(); });
    return code;
  }

  // Setup 6-digit box auto-advance, backspace, and paste events
  otpDigits.forEach((digit, idx) => {
    digit.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val ? val[0] : '';
      if (val && idx < otpDigits.length - 1) {
        otpDigits[idx + 1].focus();
      }
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        otpDigits[idx - 1].focus();
      }
    });

    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (text) {
        fillOtp(text.slice(0, 6));
      }
    });
  });

  // 7. OTP Countdown Timer
  function startOtpCountdown(seconds) {
    if (currentOtpSession.countdownTimer) {
      clearInterval(currentOtpSession.countdownTimer);
    }
    let remaining = seconds;
    if (btnResendOtp) btnResendOtp.disabled = true;
    if (otpCountdown) otpCountdown.textContent = remaining;
    if (otpTimerText) otpTimerText.style.display = 'inline';

    currentOtpSession.countdownTimer = setInterval(() => {
      remaining--;
      if (otpCountdown) otpCountdown.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(currentOtpSession.countdownTimer);
        currentOtpSession.countdownTimer = null;
        if (btnResendOtp) btnResendOtp.disabled = false;
        if (otpTimerText) otpTimerText.style.display = 'none';
      }
    }, 1000);
  }

  // 8. Generate & Dispatch OTP
  function dispatchOtp(channel, target, purpose, payload) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min validity

    currentOtpSession = {
      active: true,
      code,
      channel,
      target,
      purpose,
      payload,
      expiresAt,
      countdownTimer: null
    };

    // If WhatsApp channel, configure Click-to-Chat link
    if (channel === 'whatsapp') {
      const cleanPhone = target.replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent(`Your TravelMate verification OTP is ${code}. Valid for 5 minutes.`);
      const waUrl = cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${waMsg}` : `https://api.whatsapp.com/send?text=${waMsg}`;
      if (btnOpenWhatsApp) btnOpenWhatsApp.href = waUrl;
      if (whatsappActionBox) whatsappActionBox.classList.remove('hidden');
    } else {
      if (whatsappActionBox) whatsappActionBox.classList.add('hidden');
    }

    // Update texts in OTP Panel
    if (otpTargetDisplay) {
      otpTargetDisplay.textContent = channel === 'whatsapp' ? `your WhatsApp (${target})` : `your Gmail (${target})`;
    }

    if (otpAlert) {
      otpAlert.className = 'alert alert-info';
      otpAlert.innerHTML = channel === 'whatsapp'
        ? `💬 6-Digit security OTP sent to WhatsApp: <strong>${target}</strong>`
        : `📧 6-Digit security OTP sent to Gmail: <strong>${target}</strong>`;
      otpAlert.classList.remove('hidden');
    }

    // Switch view to OTP Panel
    if (loginPanel) loginPanel.classList.add('hidden');
    if (signupPanel) signupPanel.classList.add('hidden');
    if (authTabsNav) authTabsNav.classList.add('hidden');
    if (otpPanel) otpPanel.classList.remove('hidden');

    if (authTitle) authTitle.textContent = 'Two-Factor OTP Verification';
    if (authSubtitle) authSubtitle.textContent = `Enter the 6-digit code sent to your ${channel === 'whatsapp' ? 'WhatsApp' : 'Gmail'} to verify your identity.`;

    clearOtpDigits();
    startOtpCountdown(60);
    showOtpToast(channel, target, code);
  }

  // Resend OTP button
  if (btnResendOtp) {
    btnResendOtp.addEventListener('click', () => {
      if (!currentOtpSession.active) return;
      dispatchOtp(currentOtpSession.channel, currentOtpSession.target, currentOtpSession.purpose, currentOtpSession.payload);
      if (otpAlert) {
        otpAlert.className = 'alert alert-success';
        otpAlert.textContent = 'A new 6-digit OTP has been sent!';
        otpAlert.classList.remove('hidden');
      }
    });
  }

  // Auto-Fill OTP button for rapid testing
  if (btnAutoFillOtp) {
    btnAutoFillOtp.addEventListener('click', () => {
      if (currentOtpSession.code) {
        fillOtp(currentOtpSession.code);
        if (otpAlert) {
          otpAlert.className = 'alert alert-success';
          otpAlert.textContent = `Auto-filled verification code: ${currentOtpSession.code}`;
          otpAlert.classList.remove('hidden');
        }
      }
    });
  }

  // Cancel / Back to login or signup
  if (btnCancelOtp) {
    btnCancelOtp.addEventListener('click', () => {
      if (currentOtpSession.countdownTimer) {
        clearInterval(currentOtpSession.countdownTimer);
      }
      currentOtpSession.active = false;
      if (otpPanel) otpPanel.classList.add('hidden');
      if (authTabsNav) authTabsNav.classList.remove('hidden');

      if (currentOtpSession.purpose === 'signup') {
        if (signupPanel) signupPanel.classList.remove('hidden');
        if (tabSignupBtn) tabSignupBtn.click();
      } else {
        if (loginPanel) loginPanel.classList.remove('hidden');
        if (tabLoginBtn) tabLoginBtn.click();
      }
    });
  }

  // 9. Handle OTP Verification Submit
  if (otpForm) {
    otpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredCode = getEnteredOtp();

      if (enteredCode.length !== 6) {
        if (otpAlert) {
          otpAlert.className = 'alert alert-error';
          otpAlert.textContent = 'Please enter all 6 digits of the OTP code.';
          otpAlert.classList.remove('hidden');
        }
        return;
      }

      if (Date.now() > currentOtpSession.expiresAt) {
        if (otpAlert) {
          otpAlert.className = 'alert alert-error';
          otpAlert.textContent = 'This verification code has expired. Please click "Resend OTP".';
          otpAlert.classList.remove('hidden');
        }
        return;
      }

      if (enteredCode !== currentOtpSession.code) {
        if (otpAlert) {
          otpAlert.className = 'alert alert-error';
          otpAlert.textContent = 'Incorrect verification code. Please check and try again.';
          otpAlert.classList.remove('hidden');
        }
        return;
      }

      // Success! Perform appropriate action
      if (currentOtpSession.countdownTimer) {
        clearInterval(currentOtpSession.countdownTimer);
      }

      if (currentOtpSession.purpose === 'login') {
        const user = currentOtpSession.payload;
        setCurrentUser(user);
        if (otpAlert) {
          otpAlert.className = 'alert alert-success';
          otpAlert.textContent = `🎉 Verification successful! Welcome back, ${user.name}! Redirecting...`;
          otpAlert.classList.remove('hidden');
        }
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      } else if (currentOtpSession.purpose === 'signup') {
        const newUser = currentOtpSession.payload;
        const users = getUsers();
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);
        if (otpAlert) {
          otpAlert.className = 'alert alert-success';
          otpAlert.textContent = `🎉 Account verified and created! Welcome, ${newUser.name}! Redirecting...`;
          otpAlert.classList.remove('hidden');
        }
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      }
    });
  }

  // 10. Handle Login Form Submit (Initiates OTP)
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const pwdInput = document.getElementById('loginPassword');

      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const password = pwdInput ? pwdInput.value : '';

      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

      if (!user) {
        if (loginAlert) {
          loginAlert.className = 'alert alert-error';
          loginAlert.textContent = 'Invalid email or password. Please verify and try again.';
          loginAlert.classList.remove('hidden');
        }
        return;
      }

      // Determine selected channel: Gmail or WhatsApp
      const selectedChannelRadio = document.querySelector('input[name="loginOtpChannel"]:checked');
      const channel = selectedChannelRadio ? selectedChannelRadio.value : 'gmail';
      let target = email;

      if (channel === 'whatsapp') {
        const phoneVal = loginWhatsappPhone ? loginWhatsappPhone.value.trim() : '';
        if (!phoneVal) {
          if (loginAlert) {
            loginAlert.className = 'alert alert-error';
            loginAlert.textContent = 'Please enter your WhatsApp mobile number.';
            loginAlert.classList.remove('hidden');
          }
          if (loginWhatsappPhone) loginWhatsappPhone.focus();
          return;
        }
        target = phoneVal;
      }

      // Dispatch OTP and switch to OTP panel
      dispatchOtp(channel, target, 'login', user);
    });
  }

  // 11. Handle Sign Up Form Submit (Initiates OTP)
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('signupName');
      const emailInput = document.getElementById('signupEmail');
      const roleInput = document.getElementById('signupRole');
      const pwdInput = document.getElementById('signupPassword');
      const confirmPwdInput = document.getElementById('signupConfirmPassword');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const role = roleInput ? roleInput.value : 'Traveler';
      const password = pwdInput ? pwdInput.value : '';
      const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';

      if (!name || !email || !password) {
        showSignupError('Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        showSignupError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        showSignupError('Passwords do not match. Please verify.');
        return;
      }

      const users = getUsers();
      const existing = users.find(u => u.email.toLowerCase() === email);
      if (existing) {
        showSignupError('An account with this email already exists. Please sign in instead.');
        return;
      }

      // Determine selected channel
      const selectedChannelRadio = document.querySelector('input[name="signupOtpChannel"]:checked');
      const channel = selectedChannelRadio ? selectedChannelRadio.value : 'gmail';
      let target = email;
      const phoneVal = signupWhatsappPhone ? signupWhatsappPhone.value.trim() : '';

      if (channel === 'whatsapp') {
        if (!phoneVal) {
          showSignupError('Please enter your WhatsApp mobile number to receive the verification OTP.');
          if (signupWhatsappPhone) signupWhatsappPhone.focus();
          return;
        }
        target = phoneVal;
      }

      const newUser = {
        name,
        email,
        password,
        role,
        phone: phoneVal || '',
        createdAt: new Date().toISOString()
      };

      // Dispatch OTP and switch to OTP panel
      dispatchOtp(channel, target, 'signup', newUser);
    });

    function showSignupError(msg) {
      if (signupAlert) {
        signupAlert.className = 'alert alert-error';
        signupAlert.textContent = msg;
        signupAlert.classList.remove('hidden');
      }
    }
  }

  // 12. Forgot password modal open / close / submit
  if (forgotPwdLink && forgotPwdModal) {
    forgotPwdLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotPwdModal.classList.remove('hidden');
      if (resetPwdAlert) resetPwdAlert.classList.add('hidden');
    });
  }

  if (closeForgotPwdBtn && forgotPwdModal) {
    closeForgotPwdBtn.addEventListener('click', () => {
      forgotPwdModal.classList.add('hidden');
    });
  }

  if (resetPwdForm) {
    resetPwdForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('resetEmail');
      const newPwdInput = document.getElementById('newPassword');
      const confirmNewPwdInput = document.getElementById('confirmNewPassword');

      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const newPwd = newPwdInput ? newPwdInput.value : '';
      const confirmNewPwd = confirmNewPwdInput ? confirmNewPwdInput.value : '';

      if (newPwd.length < 6) {
        if (resetPwdAlert) {
          resetPwdAlert.className = 'alert alert-error';
          resetPwdAlert.textContent = 'Password must be at least 6 characters long.';
          resetPwdAlert.classList.remove('hidden');
        }
        return;
      }

      if (newPwd !== confirmNewPwd) {
        if (resetPwdAlert) {
          resetPwdAlert.className = 'alert alert-error';
          resetPwdAlert.textContent = 'Passwords do not match.';
          resetPwdAlert.classList.remove('hidden');
        }
        return;
      }

      const users = getUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email);

      if (userIndex === -1) {
        if (resetPwdAlert) {
          resetPwdAlert.className = 'alert alert-error';
          resetPwdAlert.textContent = 'No account found with this email address.';
          resetPwdAlert.classList.remove('hidden');
        }
        return;
      }

      users[userIndex].password = newPwd;
      saveUsers(users);

      if (resetPwdAlert) {
        resetPwdAlert.className = 'alert alert-success';
        resetPwdAlert.textContent = 'Password updated successfully! You can now sign in.';
        resetPwdAlert.classList.remove('hidden');
      }

      setTimeout(() => {
        if (forgotPwdModal) forgotPwdModal.classList.add('hidden');
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) loginEmail.value = email;
      }, 1500);
    });
  }
}

/**
 * ----------------------------------------------------
 * 2. Multi-Trip Expense Tracker Core Logic
 * ----------------------------------------------------
 */
function initExpenseTracker() {
  // Only execute on budget.html (Trip Expenses page)
  const tripSetupForm = document.getElementById('tripSetupForm');
  if (!tripSetupForm) return;

  // 0. Auto-import shared trip if opened via share URL (?shareData=...)
  checkUrlShareData();

  // DOM Elements - Quick Presentation Demo Controls
  const loadDemoTripBtn = document.getElementById('loadDemoTripBtn');
  const resetAllDataBtn = document.getElementById('resetAllDataBtn');

  // DOM Elements - My Trips Dashboard
  const myTripsSection = document.getElementById('myTripsSection');
  const myTripsGrid = document.getElementById('myTripsGrid');
  const btnCreateNewTrip = document.getElementById('btnCreateNewTrip');

  // DOM Elements - Trip Setup / Edit
  const tripSetupPanel = document.getElementById('tripSetupPanel');
  const tripSetupTag = document.getElementById('tripSetupTag');
  const tripSetupTitle = document.getElementById('tripSetupTitle');
  const tripSetupDesc = document.getElementById('tripSetupDesc');
  const tripNameInput = document.getElementById('tripNameInput');
  const tripDestInput = document.getElementById('tripDestInput');
  const tripBudgetInput = document.getElementById('tripBudgetInput');
  const numMembersInput = document.getElementById('numMembersInput');
  const memberNamesContainer = document.getElementById('memberNamesContainer');
  const startTripBtn = document.getElementById('startTripBtn');
  const cancelTripSetupBtn = document.getElementById('cancelTripSetupBtn');

  // DOM Elements - Active Trip Banner
  const activeTripBanner = document.getElementById('activeTripBanner');
  const activeTripTitle = document.getElementById('activeTripTitle');
  const activeTripDestBadge = document.getElementById('activeTripDestBadge');
  const activeMembersList = document.getElementById('activeMembersList');
  const backToTripsBtn = document.getElementById('backToTripsBtn');
  const editTripBtn = document.getElementById('editTripBtn');
  const deleteActiveTripBtn = document.getElementById('deleteActiveTripBtn');

  // DOM Elements - Target Budget Meter
  const budgetMeterSection = document.getElementById('budgetMeterSection');
  const budgetStatusBadge = document.getElementById('budgetStatusBadge');
  const budgetBarFill = document.getElementById('budgetBarFill');
  const meterSpentVal = document.getElementById('meterSpentVal');
  const meterTargetVal = document.getElementById('meterTargetVal');
  const meterTargetWrap = document.getElementById('meterTargetWrap');
  const meterRemainingText = document.getElementById('meterRemainingText');

  // DOM Elements - Expense Form
  const expenseFormPanel = document.getElementById('expenseFormPanel');
  const expenseForm = document.getElementById('expenseForm');
  const expensePayer = document.getElementById('expensePayer');
  const expenseName = document.getElementById('expenseName');
  const expenseCategory = document.getElementById('expenseCategory');
  const expenseAmount = document.getElementById('expenseAmount');
  const expenseDate = document.getElementById('expenseDate');
  const expenseError = document.getElementById('expenseError');
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // DOM Elements - Expense History Table
  const expenseHistoryPanel = document.getElementById('expenseHistoryPanel');
  const expenseTableBody = document.getElementById('expenseTableBody');
  const emptyExpenseState = document.getElementById('emptyExpenseState');

  // DOM Elements - Financial Summary & Settlements
  const summaryPanel = document.getElementById('summaryPanel');
  const totalTripExpense = document.getElementById('totalTripExpense');
  const totalMembersCount = document.getElementById('totalMembersCount');
  const averageExpensePerPerson = document.getElementById('averageExpensePerPerson');
  const memberSummaryBody = document.getElementById('memberSummaryBody');
  const pairSettlementList = document.getElementById('pairSettlementList');
  const settlementList = document.getElementById('settlementList');

  // DOM Elements - Category Analytics
  const categoryDistBar = document.getElementById('categoryDistBar');
  const categoryCardsGrid = document.getElementById('categoryCardsGrid');

  // DOM Elements - Packing Checklist
  const packingChecklistPanel = document.getElementById('packingChecklistPanel');
  const checklistGrid = document.getElementById('checklistGrid');
  const checklistProgress = document.getElementById('checklistProgress');

  // DOM Elements - Print & Export Actions
  const printReportBtn = document.getElementById('printReportBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // DOM Elements - Share & QR Code Modal
  const shareTripBtn = document.getElementById('shareTripBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareBtn = document.getElementById('closeShareBtn');
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const qrHelpText = document.getElementById('qrHelpText');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
  const whatsappShareBtn = document.getElementById('whatsappShareBtn');
  const shareRoomBadgeWrap = document.getElementById('shareRoomBadgeWrap');
  const shareRoomCodeVal = document.getElementById('shareRoomCodeVal');
  const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');

  // DOM Elements - Import Trip Modal
  const btnOpenImportTrip = document.getElementById('btnOpenImportTrip');
  const importTripModal = document.getElementById('importTripModal');
  const closeImportBtn = document.getElementById('closeImportBtn');
  const cancelImportBtn = document.getElementById('cancelImportBtn');
  const importTripForm = document.getElementById('importTripForm');
  const importDataInput = document.getElementById('importDataInput');
  const importErrorMsg = document.getElementById('importErrorMsg');
  const submitImportBtn = document.getElementById('submitImportBtn');

  // DOM Elements - Cloud Room Sync Bar
  const cloudSyncBar = document.getElementById('cloudSyncBar');
  const syncStatusDot = document.getElementById('syncStatusDot');
  const cloudSyncStatus = document.getElementById('cloudSyncStatus');
  const syncRoomCodeInput = document.getElementById('syncRoomCodeInput');
  const syncRoomBtn = document.getElementById('syncRoomBtn');
  const syncPushBtn = document.getElementById('syncPushBtn');
  const syncPullBtn = document.getElementById('syncPullBtn');

  // DOM Elements - Day-by-Day Itinerary Planner
  const itineraryPanel = document.getElementById('itineraryPanel');
  const itineraryTimelineList = document.getElementById('itineraryTimelineList');
  const emptyItineraryState = document.getElementById('emptyItineraryState');
  const openAddActivityBtn = document.getElementById('openAddActivityBtn');
  const activityModal = document.getElementById('activityModal');
  const closeActivityBtn = document.getElementById('closeActivityBtn');
  const cancelActivityBtn = document.getElementById('cancelActivityBtn');
  const activityForm = document.getElementById('activityForm');
  const actDayInput = document.getElementById('actDayInput');
  const actTimeInput = document.getElementById('actTimeInput');
  const actTitleInput = document.getElementById('actTitleInput');
  const actCostInput = document.getElementById('actCostInput');
  const actCategoryInput = document.getElementById('actCategoryInput');

  // DOM Elements - Multi-Currency Converter
  const currencyWidgetCard = document.getElementById('currencyWidgetCard');
  const currencyAmountInput = document.getElementById('currencyAmountInput');
  const currencyFromSelect = document.getElementById('currencyFromSelect');
  const currencyToSelect = document.getElementById('currencyToSelect');
  const currencyConvertedVal = document.getElementById('currencyConvertedVal');
  const currencyRateNote = document.getElementById('currencyRateNote');

  // Set today's date as default on expense date input
  if (expenseDate && !expenseDate.value) {
    const today = new Date().toISOString().split('T')[0];
    expenseDate.value = today;
  }

  // --------------------------------------------------
  // Helper: Currency Formatter (Indian Rupee - INR)
  // --------------------------------------------------
  const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });

  function formatINR(amount) {
    return inrFormatter.format(amount || 0);
  }

  // --------------------------------------------------
  // Backward Compatibility Migration
  // --------------------------------------------------
  function migrateLegacyData() {
    try {
      const existingTrips = localStorage.getItem(STORAGE_KEYS.TRIPS);
      if (!existingTrips) {
        const legacyTripData = localStorage.getItem(STORAGE_KEYS.LEGACY_TRIP);
        if (legacyTripData) {
          const legacyTrip = JSON.parse(legacyTripData);
          let legacyExpenses = [];
          try {
            const expData = localStorage.getItem(STORAGE_KEYS.LEGACY_EXPENSES);
            if (expData) legacyExpenses = JSON.parse(expData);
          } catch (e) {}

          const tripId = 'trip_' + Date.now();
          const tripName = legacyTrip.tripName || 'My Trip';
          const migratedTrip = {
            id: tripId,
            name: tripName,
            destination: legacyTrip.destination || (tripName.replace(/\s*Trip$/i, '').trim()),
            members: Array.isArray(legacyTrip.members) ? legacyTrip.members : [],
            expenses: Array.isArray(legacyExpenses) ? legacyExpenses : [],
            createdAt: new Date().toISOString()
          };

          localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify([migratedTrip]));
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, tripId);
        }
      }
    } catch (err) {
      console.error('Data migration error:', err);
    }
  }

  // Run migration once upon initialization
  migrateLegacyData();

  // --------------------------------------------------
  // Multi-Trip LocalStorage Helpers
  // --------------------------------------------------
  function getAllTrips() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAllTrips(trips) {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  }

  function getActiveTripId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || null;
  }

  function setActiveTripId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    }
  }

  function getActiveTrip() {
    const trips = getAllTrips();
    if (trips.length === 0) return null;
    const activeId = getActiveTripId();
    const found = trips.find(t => t.id === activeId);
    if (found) return found;

    // Fallback to first trip if activeId not matched
    setActiveTripId(trips[0].id);
    return trips[0];
  }

  function saveActiveTrip(updatedTrip, skipCloud = false) {
    ensureTripSyncMetadata(updatedTrip);
    const trips = getAllTrips();
    const index = trips.findIndex(t => t.id === updatedTrip.id);
    if (index !== -1) {
      trips[index] = updatedTrip;
    } else {
      trips.unshift(updatedTrip);
    }
    saveAllTrips(trips);

    if (!skipCloud) {
      pushTripToCloud(updatedTrip);
    }
  }

  // --------------------------------------------------
  // Dynamic Member Input Generator
  // --------------------------------------------------
  function renderMemberInputs(count, existingNames = []) {
    if (!memberNamesContainer) return;

    const currentValues = existingNames.length > 0 ? existingNames : [];
    if (currentValues.length === 0) {
      const inputs = memberNamesContainer.querySelectorAll('.member-name-input');
      inputs.forEach(input => currentValues.push(input.value.trim()));
    }

    memberNamesContainer.innerHTML = '';
    const safeCount = Math.max(1, Math.min(count || 3, 20));

    for (let i = 0; i < safeCount; i++) {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      const label = document.createElement('label');
      label.className = 'form-label';
      label.innerHTML = `<span>Member ${i + 1} Name</span> <span class="req">*</span>`;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input member-name-input';
      input.placeholder = `e.g. Member ${i + 1}`;
      input.required = true;
      input.value = currentValues[i] || '';

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      memberNamesContainer.appendChild(formGroup);
    }
  }

  // Listen to member count changes
  if (numMembersInput) {
    numMembersInput.addEventListener('input', () => {
      const count = parseInt(numMembersInput.value, 10) || 1;
      renderMemberInputs(count);
    });
  }

  // --------------------------------------------------
  // Global Actions attached to window (Trip Switching & Deletion)
  // --------------------------------------------------
  window.openTrip = function(tripId) {
    setActiveTripId(tripId);
    editingExpenseId = null;
    editingTripId = null;

    if (tripSetupPanel) tripSetupPanel.classList.add('hidden');
    renderTracker();

    if (activeTripBanner) {
      activeTripBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  window.deleteTrip = function(tripId) {
    const trips = getAllTrips();
    const tripToDelete = trips.find(t => t.id === tripId);
    const tripName = tripToDelete ? tripToDelete.name : 'this trip';

    const confirmed = confirm(`Are you sure you want to delete "${tripName}" and all its recorded expenses? This action cannot be undone.`);
    if (!confirmed) return;

    const remainingTrips = trips.filter(t => t.id !== tripId);
    saveAllTrips(remainingTrips);

    const currentActiveId = getActiveTripId();
    if (currentActiveId === tripId) {
      if (remainingTrips.length > 0) {
        setActiveTripId(remainingTrips[0].id);
      } else {
        setActiveTripId(null);
      }
    }

    editingExpenseId = null;
    editingTripId = null;
    renderTracker();
  };

  // --------------------------------------------------
  // "+ Create New Trip" & Cancel Buttons
  // --------------------------------------------------
  if (btnCreateNewTrip) {
    btnCreateNewTrip.addEventListener('click', () => {
      editingTripId = null;
      if (tripNameInput) tripNameInput.value = '';
      if (tripDestInput) tripDestInput.value = '';
      if (tripBudgetInput) tripBudgetInput.value = '';
      if (numMembersInput) numMembersInput.value = '3';
      renderMemberInputs(3, []);

      if (tripSetupTag) tripSetupTag.textContent = 'NEW TRIP SETUP';
      if (tripSetupTitle) tripSetupTitle.textContent = 'Create a New Trip';
      if (tripSetupDesc) tripSetupDesc.textContent = 'Add a new trip to your collection and start logging expenses.';
      if (startTripBtn) startTripBtn.textContent = 'Create Trip →';

      const trips = getAllTrips();
      if (cancelTripSetupBtn) {
        if (trips.length > 0) {
          cancelTripSetupBtn.classList.remove('hidden');
        } else {
          cancelTripSetupBtn.classList.add('hidden');
        }
      }

      if (tripSetupPanel) tripSetupPanel.classList.remove('hidden');
      tripSetupPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (cancelTripSetupBtn) {
    cancelTripSetupBtn.addEventListener('click', () => {
      editingTripId = null;
      const active = getActiveTrip();
      if (active && tripSetupPanel) {
        tripSetupPanel.classList.add('hidden');
      }
      renderTracker();
    });
  }

  // --------------------------------------------------
  // Sample Presentation Demo Trip & Reset Actions
  // --------------------------------------------------
  function loadSampleDemoTrip() {
    const demoTrip = {
      id: 'trip_demo_goa',
      name: 'Goa Holiday with Friends',
      destination: 'Goa',
      targetBudget: 25000,
      roomCode: 'GOA26',
      members: ['Aryan', 'Neha', 'Rohit', 'Priya'],
      expenses: [
        { id: 'exp_demo_1', payer: 'Aryan', name: 'Beachside Villa / Resort Booking', category: 'Hotel / Stay', amount: 8000, date: '2026-10-10' },
        { id: 'exp_demo_2', payer: 'Neha', name: 'Candolim Shack Seafood & Dinner', category: 'Food', amount: 3200, date: '2026-10-10' },
        { id: 'exp_demo_3', payer: 'Rohit', name: 'Scooty Rentals & Fuel', category: 'Travel', amount: 2400, date: '2026-10-11' },
        { id: 'exp_demo_4', payer: 'Priya', name: 'Scuba Diving & Water Sports', category: 'Activities', amount: 4800, date: '2026-10-11' },
        { id: 'exp_demo_5', payer: 'Aryan', name: 'Breakfast & Cafe Drinks', category: 'Food', amount: 1600, date: '2026-10-12' },
        { id: 'exp_demo_6', payer: 'Neha', name: 'Anjuna Flea Market Souvenirs', category: 'Shopping', amount: 1800, date: '2026-10-12' },
        { id: 'exp_demo_7', payer: 'Rohit', name: 'Highway Tolls & Airport Cabs', category: 'Travel', amount: 1200, date: '2026-10-13' }
      ],
      itinerary: [
        { id: 'act_demo_1', day: 1, time: '11:00 AM', title: 'Resort Check-in & Pool Chill at Calangute', cost: 8000, category: 'Hotel / Stay' },
        { id: 'act_demo_2', day: 1, time: '07:30 PM', title: 'Candolim Beach Seafood Dinner & Live Music', cost: 3200, category: 'Food' },
        { id: 'act_demo_3', day: 2, time: '09:00 AM', title: 'Scooty Hire & Fuel for North Goa Sightseeing', cost: 2400, category: 'Travel' },
        { id: 'act_demo_4', day: 2, time: '02:00 PM', title: 'Scuba Diving & Jet Ski at Baga Beach', cost: 4800, category: 'Activities' },
        { id: 'act_demo_5', day: 3, time: '10:00 AM', title: 'Anjuna Flea Market Souvenir Shopping', cost: 1800, category: 'Shopping' }
      ],
      createdAt: new Date().toISOString()
    };

    const trips = getAllTrips();
    const filtered = trips.filter(t => t.id !== 'trip_demo_goa');
    filtered.unshift(demoTrip);
    saveAllTrips(filtered);
    setActiveTripId(demoTrip.id);
    editingExpenseId = null;
    editingTripId = null;
    if (tripSetupPanel) tripSetupPanel.classList.add('hidden');
    renderTracker();
    if (activeTripBanner) {
      activeTripBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resetAllData() {
    const confirmed = confirm('Are you sure you want to reset all trip data? This will clear all stored trips and expenses from local storage.');
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ID);
    editingExpenseId = null;
    editingTripId = null;
    renderTracker();
  }

  if (loadDemoTripBtn) {
    loadDemoTripBtn.addEventListener('click', loadSampleDemoTrip);
  }
  if (resetAllDataBtn) {
    resetAllDataBtn.addEventListener('click', resetAllData);
  }

  // --------------------------------------------------
  // Check URL Parameters for Destination / Demo / Share Import
  // --------------------------------------------------
  checkUrlShareData();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') {
    loadSampleDemoTrip();
  }

  const selectedDest = urlParams.get('destination');
  if (selectedDest) {
    const cleanDest = selectedDest.trim();
    const trips = getAllTrips();
    const matchingTrip = trips.find(t =>
      (t.destination && t.destination.toLowerCase() === cleanDest.toLowerCase()) ||
      (t.name && t.name.toLowerCase().includes(cleanDest.toLowerCase()))
    );

    if (matchingTrip) {
      setActiveTripId(matchingTrip.id);
    } else {
      if (tripNameInput) tripNameInput.value = `${cleanDest} Trip`;
      if (tripDestInput) tripDestInput.value = cleanDest;
      if (tripBudgetInput) tripBudgetInput.value = '20000';
      if (tripSetupPanel) tripSetupPanel.classList.remove('hidden');
    }
  }

  // --------------------------------------------------
  // Trip Creation & Edit Form Handler
  // --------------------------------------------------
  tripSetupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const tripName = tripNameInput ? tripNameInput.value.trim() : '';
    const tripDest = tripDestInput ? tripDestInput.value.trim() : '';
    const targetBudget = tripBudgetInput ? (parseFloat(tripBudgetInput.value) || 0) : 0;

    if (!tripName) {
      alert('Please enter a trip name.');
      return;
    }

    const memberInputs = memberNamesContainer.querySelectorAll('.member-name-input');
    const members = [];
    let hasEmpty = false;

    memberInputs.forEach((inp) => {
      const val = inp.value.trim();
      if (!val) {
        hasEmpty = true;
      } else {
        members.push(val);
      }
    });

    if (hasEmpty || members.length === 0) {
      alert('Please enter a name for every member.');
      return;
    }

    const trips = getAllTrips();

    if (editingTripId) {
      // Update existing trip
      const idx = trips.findIndex(t => t.id === editingTripId);
      if (idx !== -1) {
        trips[idx].name = tripName;
        trips[idx].destination = tripDest;
        trips[idx].targetBudget = targetBudget;
        trips[idx].members = members;
      }
      saveAllTrips(trips);
      setActiveTripId(editingTripId);
      editingTripId = null;
    } else {
      // Create brand new trip
      const newId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const newTrip = {
        id: newId,
        name: tripName,
        destination: tripDest,
        targetBudget: targetBudget,
        members: members,
        expenses: [],
        createdAt: new Date().toISOString()
      };
      trips.unshift(newTrip);
      saveAllTrips(trips);
      setActiveTripId(newId);
    }

    if (tripSetupPanel) tripSetupPanel.classList.add('hidden');
    renderTracker();
  });

  // --------------------------------------------------
  // Edit Active Trip Handler
  // --------------------------------------------------
  if (editTripBtn) {
    editTripBtn.addEventListener('click', () => {
      const activeTrip = getActiveTrip();
      if (!activeTrip) return;

      editingTripId = activeTrip.id;
      if (tripNameInput) tripNameInput.value = activeTrip.name;
      if (tripDestInput) tripDestInput.value = activeTrip.destination || '';
      if (tripBudgetInput) tripBudgetInput.value = activeTrip.targetBudget ? activeTrip.targetBudget : '';
      if (numMembersInput) numMembersInput.value = activeTrip.members.length;
      renderMemberInputs(activeTrip.members.length, activeTrip.members);

      if (tripSetupTag) tripSetupTag.textContent = 'EDIT TRIP';
      if (tripSetupTitle) tripSetupTitle.textContent = 'Edit Trip Details & Members';
      if (tripSetupDesc) tripSetupDesc.textContent = 'Update the trip title or add/modify members.';
      if (startTripBtn) startTripBtn.textContent = 'Save Changes →';
      if (cancelTripSetupBtn) cancelTripSetupBtn.classList.remove('hidden');

      if (tripSetupPanel) tripSetupPanel.classList.remove('hidden');
      tripSetupPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // --------------------------------------------------
  // Delete Active Trip Handler
  // --------------------------------------------------
  if (deleteActiveTripBtn) {
    deleteActiveTripBtn.addEventListener('click', () => {
      const activeTrip = getActiveTrip();
      if (activeTrip) {
        window.deleteTrip(activeTrip.id);
      }
    });
  }

  // --------------------------------------------------
  // Back to All Trips Button Handler
  // --------------------------------------------------
  if (backToTripsBtn) {
    backToTripsBtn.addEventListener('click', () => {
      if (myTripsSection) {
        myTripsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // --------------------------------------------------
  // Add / Edit Expense Handler
  // --------------------------------------------------
  if (expenseForm) {
    expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (expenseError) {
        expenseError.textContent = '';
        expenseError.classList.add('hidden');
      }

      const activeTrip = getActiveTrip();
      if (!activeTrip) {
        alert('Please select or create a trip first.');
        return;
      }

      const payer = expensePayer ? expensePayer.value.trim() : '';
      const name = expenseName ? expenseName.value.trim() : '';
      const category = expenseCategory ? expenseCategory.value.trim() : 'Other';
      const amount = parseFloat(expenseAmount.value);
      const date = expenseDate ? expenseDate.value : new Date().toISOString().split('T')[0];

      // Validation
      if (!payer) {
        showExpenseError('Please select who paid for this expense.');
        return;
      }
      if (!name) {
        showExpenseError('Please enter the expense name.');
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        showExpenseError('Please enter a valid expense amount greater than 0.');
        return;
      }
      if (!date) {
        showExpenseError('Please select a valid date.');
        return;
      }

      const expenses = activeTrip.expenses || [];

      if (editingExpenseId) {
        // Edit mode
        const index = expenses.findIndex(exp => exp.id === editingExpenseId);
        if (index !== -1) {
          expenses[index] = {
            id: editingExpenseId,
            payer,
            name,
            category,
            amount,
            date
          };
        }
        editingExpenseId = null;
        if (addExpenseBtn) addExpenseBtn.textContent = '+ Add Expense';
        if (cancelEditBtn) cancelEditBtn.classList.add('hidden');
      } else {
        // Create mode
        const newExpense = {
          id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          payer,
          name,
          category,
          amount,
          date
        };
        expenses.unshift(newExpense); // Put latest on top
      }

      activeTrip.expenses = expenses;
      saveActiveTrip(activeTrip);

      // Reset fields except date
      if (expenseName) expenseName.value = '';
      if (expenseAmount) expenseAmount.value = '';
      if (expensePayer) expensePayer.selectedIndex = 0;
      if (expenseCategory) expenseCategory.selectedIndex = 0;

      renderTracker();
    });
  }

  // Cancel edit expense handler
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      editingExpenseId = null;
      if (expenseName) expenseName.value = '';
      if (expenseAmount) expenseAmount.value = '';
      if (expensePayer) expensePayer.selectedIndex = 0;
      if (expenseCategory) expenseCategory.selectedIndex = 0;
      if (addExpenseBtn) addExpenseBtn.textContent = '+ Add Expense';
      cancelEditBtn.classList.add('hidden');
      if (expenseError) expenseError.classList.add('hidden');
    });
  }

  function showExpenseError(msg) {
    if (expenseError) {
      expenseError.textContent = msg;
      expenseError.classList.remove('hidden');
    }
  }

  // --------------------------------------------------
  // Global Delete and Edit Handlers for Expenses
  // --------------------------------------------------
  window.deleteExpense = function(id) {
    const confirmed = confirm('Are you sure you want to delete this expense?');
    if (!confirmed) return;

    const activeTrip = getActiveTrip();
    if (!activeTrip) return;

    activeTrip.expenses = (activeTrip.expenses || []).filter(exp => exp.id !== id);
    saveActiveTrip(activeTrip);

    if (editingExpenseId === id) {
      editingExpenseId = null;
      if (addExpenseBtn) addExpenseBtn.textContent = '+ Add Expense';
      if (cancelEditBtn) cancelEditBtn.classList.add('hidden');
      if (expenseName) expenseName.value = '';
      if (expenseAmount) expenseAmount.value = '';
    }

    renderTracker();
  };

  window.editExpense = function(id) {
    const activeTrip = getActiveTrip();
    if (!activeTrip) return;

    const exp = (activeTrip.expenses || []).find(e => e.id === id);
    if (!exp) return;

    editingExpenseId = id;
    if (expensePayer) expensePayer.value = exp.payer;
    if (expenseName) expenseName.value = exp.name;
    if (expenseCategory) expenseCategory.value = exp.category;
    if (expenseAmount) expenseAmount.value = exp.amount;
    if (expenseDate) expenseDate.value = exp.date;

    if (addExpenseBtn) addExpenseBtn.textContent = 'Save Changes';
    if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');

    if (expenseFormPanel) {
      expenseFormPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (expenseAmount) expenseAmount.focus();
  };

  // --------------------------------------------------
  // Print & CSV Export Actions (Active Trip Only)
  // --------------------------------------------------
  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const activeTrip = getActiveTrip();
      if (activeTrip) {
        exportExpensesToCSV(activeTrip);
      } else {
        alert('Please select or create an active trip first.');
      }
    });
  }

  // --------------------------------------------------
  // Settlement Calculator: Direct Pairwise Debts
  // --------------------------------------------------
  function calculateDirectSettlements(members, paidByMember, fairShare) {
    const debtors = [];
    const creditors = [];

    members.forEach(m => {
      const paid = paidByMember[m] || 0;
      const balance = Math.round((paid - fairShare) * 100) / 100;
      if (balance < -0.01) {
        debtors.push({ member: m, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ member: m, amount: balance });
      }
    });

    // Sort descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        transfers.push({
          from: debtor.member,
          to: creditor.member,
          amount: Math.round(settleAmount * 100) / 100
        });
      }

      debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
      creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

      if (debtor.amount <= 0.01) d++;
      if (creditor.amount <= 0.01) c++;
    }

    return transfers;
  }

  // --------------------------------------------------
  // Render "My Trips" Dashboard Cards
  // --------------------------------------------------
  function renderMyTrips(trips, activeTrip) {
    if (!myTripsGrid) return;
    myTripsGrid.innerHTML = '';

    if (trips.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'empty-trips-card';
      emptyCard.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✈️</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">No Trips Saved Yet</h3>
        <p style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 1.25rem;">Create your first trip below to begin tracking expenses.</p>
      `;
      myTripsGrid.appendChild(emptyCard);
      return;
    }

    trips.forEach(trip => {
      const isActive = activeTrip && trip.id === activeTrip.id;
      const totalExp = (trip.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const memberCount = (trip.members || []).length;

      const card = document.createElement('div');
      card.className = `trip-card ${isActive ? 'active' : ''}`;
      card.id = `trip-card-${trip.id}`;

      const destBadgeHtml = trip.destination 
        ? `<span class="trip-badge-dest">📍 ${trip.destination}</span>` 
        : '';
      const activeBadgeHtml = isActive 
        ? `<span class="trip-badge-active">✓ Active Trip</span>` 
        : '';

      const memberTagsHtml = (trip.members || [])
        .map(m => `<span class="trip-member-tag">${m}</span>`)
        .join('');

      card.innerHTML = `
        <div class="trip-card-header">
          <div>
            <h3 class="trip-card-title">${trip.name}</h3>
            ${destBadgeHtml}
          </div>
          ${activeBadgeHtml}
        </div>

        <div class="trip-card-members">
          <div><strong>${memberCount} Members:</strong></div>
          <div class="trip-members-chips">
            ${memberTagsHtml}
          </div>
        </div>

        <div class="trip-card-stats">
          <span class="trip-card-total-label">Total Expense</span>
          <span class="trip-card-total-val">${formatINR(totalExp)}</span>
        </div>

        <div class="trip-card-actions">
          <button class="btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="openTrip('${trip.id}')">
            ${isActive ? 'Viewing Trip' : 'Open Trip'}
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteTrip('${trip.id}')" title="Delete Trip">
            Delete
          </button>
        </div>
      `;

      myTripsGrid.appendChild(card);
    });
  }

  // --------------------------------------------------
  // Core UI Render Function
  // --------------------------------------------------
  function renderTracker() {
    const trips = getAllTrips();
    const activeTrip = getActiveTrip();

    // 1. Render My Trips section
    renderMyTrips(trips, activeTrip);

    // 2. Determine View State
    if (!activeTrip) {
      // No active trip
      if (tripSetupPanel) {
        tripSetupPanel.classList.remove('hidden');
        if (tripSetupTag) tripSetupTag.textContent = 'STEP 1: TRIP SETUP';
        if (tripSetupTitle) tripSetupTitle.textContent = 'Create Your Trip';
        if (tripSetupDesc) tripSetupDesc.textContent = 'Set your trip name and add your group members to start tracking expenses.';
        if (startTripBtn) startTripBtn.textContent = 'Start Trip →';
      }
      if (cancelTripSetupBtn) cancelTripSetupBtn.classList.add('hidden');
      if (activeTripBanner) activeTripBanner.classList.add('hidden');
      if (cloudSyncBar) cloudSyncBar.classList.add('hidden');
      if (budgetMeterSection) budgetMeterSection.classList.add('hidden');
      if (expenseFormPanel) expenseFormPanel.classList.add('hidden');
      if (expenseHistoryPanel) expenseHistoryPanel.classList.add('hidden');
      if (summaryPanel) summaryPanel.classList.add('hidden');
      if (itineraryPanel) itineraryPanel.classList.add('hidden');
      if (currencyWidgetCard) currencyWidgetCard.classList.add('hidden');
      if (packingChecklistPanel) packingChecklistPanel.classList.add('hidden');
      if (printReportBtn) printReportBtn.closest('.print-actions-bar')?.classList.add('hidden');
      return;
    }

    // Active trip exists
    if (!editingTripId && tripSetupPanel) {
      tripSetupPanel.classList.add('hidden');
    }
    if (activeTripBanner) activeTripBanner.classList.remove('hidden');
    if (cloudSyncBar) cloudSyncBar.classList.remove('hidden');
    if (expenseFormPanel) expenseFormPanel.classList.remove('hidden');
    if (expenseHistoryPanel) expenseHistoryPanel.classList.remove('hidden');
    if (summaryPanel) summaryPanel.classList.remove('hidden');
    if (itineraryPanel) itineraryPanel.classList.remove('hidden');
    if (currencyWidgetCard) currencyWidgetCard.classList.remove('hidden');
    if (packingChecklistPanel) packingChecklistPanel.classList.remove('hidden');
    if (printReportBtn) printReportBtn.closest('.print-actions-bar')?.classList.remove('hidden');

    // Update Active Trip Banner
    if (activeTripTitle) activeTripTitle.textContent = activeTrip.name;
    if (activeTripDestBadge) {
      if (activeTrip.destination) {
        activeTripDestBadge.textContent = `📍 ${activeTrip.destination}`;
        activeTripDestBadge.classList.remove('hidden');
      } else {
        activeTripDestBadge.classList.add('hidden');
      }
    }

    if (activeMembersList) {
      activeMembersList.innerHTML = '';
      (activeTrip.members || []).forEach(member => {
        const chip = document.createElement('span');
        chip.className = 'member-chip';
        chip.innerHTML = `<span class="member-chip-avatar">${member.charAt(0).toUpperCase()}</span> ${member}`;
        activeMembersList.appendChild(chip);
      });
    }

    // Populate Payer dropdown
    if (expensePayer) {
      const currentSelected = expensePayer.value;
      expensePayer.innerHTML = '<option value="" disabled selected>Select who paid</option>';
      (activeTrip.members || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        expensePayer.appendChild(opt);
      });
      if ((activeTrip.members || []).includes(currentSelected)) {
        expensePayer.value = currentSelected;
      }
    }

    const expenses = activeTrip.expenses || [];

    // Render Expense Table
    if (expenseTableBody) {
      expenseTableBody.innerHTML = '';

      if (expenses.length === 0) {
        if (emptyExpenseState) emptyExpenseState.classList.remove('hidden');
      } else {
        if (emptyExpenseState) emptyExpenseState.classList.add('hidden');

        expenses.forEach(exp => {
          const row = document.createElement('tr');

          let formattedDate = exp.date;
          try {
            const dateObj = new Date(exp.date + 'T00:00:00');
            formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          } catch (e) {}

          row.innerHTML = `
            <td><strong>${formattedDate}</strong></td>
            <td>${exp.payer}</td>
            <td><strong>${exp.name}</strong></td>
            <td><span class="category-tag">${exp.category}</span></td>
            <td class="amount-cell">${formatINR(exp.amount)}</td>
            <td class="actions-cell">
              <button class="btn-action-edit" onclick="editExpense('${exp.id}')">Edit</button>
              <button class="btn-action-delete" onclick="deleteExpense('${exp.id}')">Delete</button>
            </td>
          `;
          expenseTableBody.appendChild(row);
        });
      }
    }

    // ------------------------------------------------
    // Calculations: Totals, Fair Shares & Settlements
    // ------------------------------------------------
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const memberCount = (activeTrip.members || []).length || 1;
    const fairShare = memberCount > 0 ? (total / memberCount) : 0;

    // Map each member's actual paid amount
    const paidByMember = {};
    (activeTrip.members || []).forEach(m => paidByMember[m] = 0);
    expenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      if (paidByMember[e.payer] !== undefined) {
        paidByMember[e.payer] += amt;
      } else {
        paidByMember[e.payer] = amt;
      }
    });

    // Update Top Metric Cards
    if (totalTripExpense) totalTripExpense.textContent = formatINR(total);
    if (totalMembersCount) totalMembersCount.textContent = memberCount;
    if (averageExpensePerPerson) averageExpensePerPerson.textContent = formatINR(fairShare);

    // Update Member Payment Summary Table
    if (memberSummaryBody) {
      memberSummaryBody.innerHTML = '';
      (activeTrip.members || []).forEach(member => {
        const paid = paidByMember[member] || 0;
        const balance = paid - fairShare;

        const row = document.createElement('tr');
        const balanceClass = balance > 0.01 
          ? 'color: var(--accent);' 
          : balance < -0.01 
          ? 'color: var(--secondary);' 
          : 'color: var(--text-muted);';
        const balanceSign = balance > 0.01 ? '+' : '';

        row.innerHTML = `
          <td><strong>${member}</strong></td>
          <td style="text-align: right; font-weight: 700;">${formatINR(paid)}</td>
          <td style="text-align: right; color: var(--text-muted);">${formatINR(fairShare)}</td>
          <td style="text-align: right; font-weight: 800; ${balanceClass}">
            ${balanceSign}${formatINR(balance)}
          </td>
        `;
        memberSummaryBody.appendChild(row);
      });
    }

    // Calculate Direct Pairwise Settlements
    const directTransfers = calculateDirectSettlements(activeTrip.members || [], paidByMember, fairShare);

    // Update Pairwise Settlement List
    if (pairSettlementList) {
      pairSettlementList.innerHTML = '';

      if (directTransfers.length === 0) {
        const cleanItem = document.createElement('div');
        cleanItem.className = 'pair-settlement-item settled-clean';
        cleanItem.innerHTML = `
          <div class="pair-settlement-desc">
            <span>🎉</span> <span>All balances are settled! No one owes anything.</span>
          </div>
        `;
        pairSettlementList.appendChild(cleanItem);
      } else {
        directTransfers.forEach(t => {
          const item = document.createElement('div');
          item.className = 'pair-settlement-item';
          item.innerHTML = `
            <div class="pair-settlement-desc">
              <span class="pair-debtor">${t.from}</span>
              <span class="pair-arrow">pays</span>
              <span class="pair-creditor">${t.to}</span>
            </div>
            <div class="pair-amount">${formatINR(t.amount)}</div>
          `;
          pairSettlementList.appendChild(item);
        });
      }
    }

    // Update Individual Member Settlement Cards
    if (settlementList) {
      settlementList.innerHTML = '';

      (activeTrip.members || []).forEach(member => {
        const paid = paidByMember[member] || 0;
        const balance = paid - fairShare;
        const card = document.createElement('div');

        if (balance > 0.01) {
          card.className = 'settlement-card receive';
          card.innerHTML = `
            <div>
              <div class="settlement-member">${member}</div>
              <div class="settlement-sub">Paid ${formatINR(paid)} (Fair share: ${formatINR(fairShare)})</div>
            </div>
            <div class="settlement-badge receive">
              Should receive ${formatINR(balance)}
            </div>
          `;
        } else if (balance < -0.01) {
          card.className = 'settlement-card pay';
          card.innerHTML = `
            <div>
              <div class="settlement-member">${member}</div>
              <div class="settlement-sub">Paid ${formatINR(paid)} (Fair share: ${formatINR(fairShare)})</div>
            </div>
            <div class="settlement-badge pay">
              Should pay ${formatINR(Math.abs(balance))}
            </div>
          `;
        } else {
          card.className = 'settlement-card settled';
          card.innerHTML = `
            <div>
              <div class="settlement-member">${member}</div>
              <div class="settlement-sub">Paid ${formatINR(paid)} (Fair share: ${formatINR(fairShare)})</div>
            </div>
            <div class="settlement-badge settled">
              Settled Up (₹0 balance)
            </div>
          `;
        }

        settlementList.appendChild(card);
      });
    }

    // ------------------------------------------------
    // College Showcase Analytics & Utilities
    // ------------------------------------------------
    // 1. Target Budget Health Meter
    renderBudgetMeter(activeTrip, total);

    // 2. Visual Category Spending Analytics
    renderCategoryAnalytics(expenses, total);

    // 3. Trip Packing Essentials Checklist
    initPackingChecklist(activeTrip);

    // 4. Day-by-Day Itinerary Planner
    renderItinerary(activeTrip);

    // 5. Cloud Room Sync Bar Status
    updateCloudSyncDisplay(activeTrip);

    // Update Dedicated Print Container (Active Trip Only)
    renderPrintReport(activeTrip, expenses, total, fairShare, paidByMember, directTransfers);
  }

  // --------------------------------------------------
  // Helper: Renders Print-only Dedicated Report for Active Trip
  // --------------------------------------------------
  function renderPrintReport(trip, expenses, total, fairShare, paidByMember, directTransfers) {
    const printContainer = document.getElementById('printableReport');
    if (!printContainer) return;

    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    let expenseRows = '';
    expenses.forEach((e, idx) => {
      expenseRows += `
        <tr>
          <td>${idx + 1}</td>
          <td>${e.date}</td>
          <td>${e.payer}</td>
          <td>${e.name}</td>
          <td>${e.category}</td>
          <td style="text-align: right; font-weight: bold;">${formatINR(e.amount)}</td>
        </tr>
      `;
    });

    let memberRows = '';
    (trip.members || []).forEach(m => {
      const paid = paidByMember[m] || 0;
      const balance = paid - fairShare;
      const status = balance > 0.01 
        ? `Should receive ${formatINR(balance)}`
        : balance < -0.01 
        ? `Should pay ${formatINR(Math.abs(balance))}` 
        : `Settled Up`;

      memberRows += `
        <tr>
          <td><strong>${m}</strong></td>
          <td style="text-align: right;">${formatINR(paid)}</td>
          <td style="text-align: right;">${formatINR(fairShare)}</td>
          <td style="text-align: right;"><strong>${balance > 0.01 ? '+' : ''}${formatINR(balance)}</strong></td>
          <td>${status}</td>
        </tr>
      `;
    });

    let transferRows = '';
    if (directTransfers.length === 0) {
      transferRows = '<tr><td colspan="3">All members are settled up. No debt transfers needed.</td></tr>';
    } else {
      directTransfers.forEach((t, i) => {
        transferRows += `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${t.from}</strong> pays <strong>${t.to}</strong></td>
            <td style="text-align: right; font-weight: bold;">${formatINR(t.amount)}</td>
          </tr>
        `;
      });
    }

    printContainer.innerHTML = `
      <div class="print-header">
        <div class="print-brand">TRAVELMATE</div>
        <div class="print-title">TRIP EXPENSE REPORT</div>
        <div class="print-meta">
          <div><strong>Trip:</strong> ${trip.name} ${trip.destination ? `(${trip.destination})` : ''}</div>
          <div><strong>Date Generated:</strong> ${reportDate}</div>
          <div><strong>Members (${(trip.members || []).length}):</strong> ${(trip.members || []).join(', ')}</div>
        </div>
      </div>

      <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; border: 1px solid #000; padding: 10pt;">
        <div><strong>TOTAL EXPENSES:</strong> ${formatINR(total)}</div>
        <div><strong>MEMBERS:</strong> ${(trip.members || []).length}</div>
        <div><strong>AVERAGE / FAIR SHARE:</strong> ${formatINR(fairShare)}</div>
      </div>

      <h3 style="font-size: 12pt; margin-bottom: 6pt;">DIRECT SETTLEMENT INSTRUCTIONS</h3>
      <table class="expense-table" style="margin-bottom: 1.5rem;">
        <thead>
          <tr>
            <th>#</th>
            <th>Direct Settlement Transfer</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transferRows}
        </tbody>
      </table>

      <h3 style="font-size: 12pt; margin-bottom: 6pt;">ITEMIZED EXPENSES</h3>
      <table class="expense-table" style="margin-bottom: 1.5rem;">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Person</th>
            <th>Expense</th>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.length > 0 ? expenseRows : '<tr><td colspan="6">No expenses recorded.</td></tr>'}
        </tbody>
      </table>

      <h3 style="font-size: 12pt; margin-bottom: 6pt;">MEMBER PAYMENT & BALANCE SUMMARY</h3>
      <table class="expense-table">
        <thead>
          <tr>
            <th>Member</th>
            <th style="text-align: right;">Total Paid</th>
            <th style="text-align: right;">Fair Share</th>
            <th style="text-align: right;">Balance</th>
            <th>Settlement Status</th>
          </tr>
        </thead>
        <tbody>
          ${memberRows}
        </tbody>
      </table>
    `;
  }

  // --------------------------------------------------
  // Helper: Renders Target Budget Health Meter
  // --------------------------------------------------
  function renderBudgetMeter(activeTrip, total) {
    if (!budgetMeterSection) return;

    const target = Number(activeTrip.targetBudget) || 0;
    if (target <= 0) {
      budgetMeterSection.classList.add('hidden');
      return;
    }

    budgetMeterSection.classList.remove('hidden');

    if (meterSpentVal) meterSpentVal.textContent = formatINR(total);
    if (meterTargetVal) meterTargetVal.textContent = formatINR(target);
    if (meterTargetWrap) meterTargetWrap.style.display = 'inline';

    const rawPct = target > 0 ? (total / target) * 100 : 0;
    const boundedPct = Math.min(rawPct, 100);

    if (budgetBarFill) {
      budgetBarFill.style.width = `${boundedPct}%`;
      budgetBarFill.className = 'budget-bar-fill';

      if (rawPct <= 80) {
        budgetBarFill.classList.add('safe');
      } else if (rawPct <= 100) {
        budgetBarFill.classList.add('warning');
      } else {
        budgetBarFill.classList.add('danger');
      }
    }

    if (budgetStatusBadge) {
      budgetStatusBadge.className = 'budget-badge';

      if (total <= target) {
        const remaining = target - total;
        budgetStatusBadge.classList.add(rawPct <= 80 ? 'safe' : 'warning');
        budgetStatusBadge.innerHTML = `<span>🟢</span> ${Math.round(rawPct)}% Spent - Within Budget`;
        if (meterRemainingText) {
          meterRemainingText.innerHTML = `Remaining: <strong style="color: var(--accent);">${formatINR(remaining)}</strong>`;
        }
      } else {
        const exceeded = total - target;
        budgetStatusBadge.classList.add('danger');
        budgetStatusBadge.innerHTML = `<span>🔴</span> Over Budget (+${Math.round(rawPct - 100)}%)`;
        if (meterRemainingText) {
          meterRemainingText.innerHTML = `Exceeded by: <strong style="color: var(--error);">${formatINR(exceeded)}</strong>`;
        }
      }
    }
  }

  // --------------------------------------------------
  // Helper: Visual Category Spending Analytics
  // --------------------------------------------------
  function renderCategoryAnalytics(expenses, total) {
    if (!categoryDistBar || !categoryCardsGrid) return;

    categoryDistBar.innerHTML = '';
    categoryCardsGrid.innerHTML = '';

    const categories = [
      { name: 'Hotel / Stay', color: '#3b82f6', class: 'cat-color-stay', icon: '🏨' },
      { name: 'Food', color: '#f59e0b', class: 'cat-color-food', icon: '🍲' },
      { name: 'Travel', color: '#10b981', class: 'cat-color-travel', icon: '🚕' },
      { name: 'Activities', color: '#8b5cf6', class: 'cat-color-activities', icon: '🏄‍♂️' },
      { name: 'Shopping', color: '#ec4899', class: 'cat-color-shopping', icon: '🛍️' },
      { name: 'Other', color: '#64748b', class: 'cat-color-other', icon: '📦' }
    ];

    const categoryTotals = {};
    categories.forEach(c => categoryTotals[c.name] = 0);

    expenses.forEach(e => {
      const cat = e.category || 'Other';
      const amt = Number(e.amount) || 0;
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amt;
      } else {
        categoryTotals['Other'] = (categoryTotals['Other'] || 0) + amt;
      }
    });

    if (total <= 0) {
      categoryDistBar.innerHTML = '<div style="width: 100%; height: 100%; background: #e2e8f0; border-radius: var(--radius-full);"></div>';
      categories.forEach(c => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.borderLeftColor = c.color;
        card.innerHTML = `
          <div class="category-card-name">
            <span>${c.icon} ${c.name}</span>
            <span class="category-card-pct">0%</span>
          </div>
          <div class="category-card-amount">₹0</div>
        `;
        categoryCardsGrid.appendChild(card);
      });
      return;
    }

    // Render horizontal stacked distribution bar
    categories.forEach(c => {
      const amt = categoryTotals[c.name] || 0;
      if (amt > 0) {
        const pct = (amt / total) * 100;
        const segment = document.createElement('div');
        segment.className = `category-dist-segment ${c.class}`;
        segment.style.width = `${pct}%`;
        segment.setAttribute('data-tooltip', `${c.name}: ${formatINR(amt)} (${pct.toFixed(1)}%)`);
        categoryDistBar.appendChild(segment);
      }
    });

    // Render category summary cards
    categories.forEach(c => {
      const amt = categoryTotals[c.name] || 0;
      const pct = total > 0 ? ((amt / total) * 100).toFixed(0) : '0';

      const card = document.createElement('div');
      card.className = 'category-card';
      card.style.borderLeftColor = c.color;
      card.innerHTML = `
        <div class="category-card-name">
          <span>${c.icon} ${c.name}</span>
          <span class="category-card-pct">${pct}%</span>
        </div>
        <div class="category-card-amount">${formatINR(amt)}</div>
      `;
      categoryCardsGrid.appendChild(card);
    });
  }

  // --------------------------------------------------
  // Helper: Trip Packing Essentials Checklist
  // --------------------------------------------------
  function initPackingChecklist(activeTrip) {
    if (!packingChecklistPanel || !checklistGrid || !activeTrip) return;

    const defaultItems = [
      'Flight / Train Tickets & Travel Passes',
      'Govt ID Cards (Aadhar / Driving License / Passport)',
      'Power Bank & Mobile Charging Cables',
      'First Aid Kit & Prescription Medicines',
      'Sunglasses, Sunscreen & Personal Toiletries',
      'Emergency Cash & Active ATM Cards',
      'Weather-appropriate Clothes & Comfy Footwear',
      'Hotel Booking Vouchers & Reservation Confirmations'
    ];

    const storageKey = `travelMateChecklist_${activeTrip.id}`;
    let savedState = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) savedState = JSON.parse(raw);
    } catch (e) {}

    function renderChecklist() {
      checklistGrid.innerHTML = '';
      let completedCount = 0;

      defaultItems.forEach((item, index) => {
        const isDone = !!savedState[index];
        if (isDone) completedCount++;

        const label = document.createElement('label');
        label.className = `checklist-item ${isDone ? 'done' : ''}`;
        label.innerHTML = `
          <input type="checkbox" data-index="${index}" ${isDone ? 'checked' : ''}>
          <span class="checklist-text">${item}</span>
        `;

        const checkbox = label.querySelector('input');
        checkbox.addEventListener('change', (e) => {
          savedState[index] = e.target.checked;
          localStorage.setItem(storageKey, JSON.stringify(savedState));
          renderChecklist();
        });

        checklistGrid.appendChild(label);
      });

      if (checklistProgress) {
        checklistProgress.textContent = `${completedCount} of ${defaultItems.length} packed`;
      }
    }

    renderChecklist();
  }

  // --------------------------------------------------
  // Helper: Instant Export to CSV (Excel Spreadsheet)
  // --------------------------------------------------
  function exportExpensesToCSV(activeTrip) {
    if (!activeTrip || !activeTrip.expenses || activeTrip.expenses.length === 0) {
      alert('No expenses recorded for this trip yet to export.');
      return;
    }

    const rows = [
      ['Trip Name', `"${activeTrip.name}"`],
      ['Destination', `"${activeTrip.destination || 'N/A'}"`],
      ['Target Budget (INR)', activeTrip.targetBudget || 'N/A'],
      ['Export Date', `"${new Date().toLocaleDateString('en-IN')}"`],
      [],
      ['#', 'Date', 'Payer', 'Expense Name', 'Category', 'Amount (INR)']
    ];

    activeTrip.expenses.forEach((e, idx) => {
      rows.push([
        idx + 1,
        `"${e.date}"`,
        `"${e.payer}"`,
        `"${(e.name || '').replace(/"/g, '""')}"`,
        `"${e.category}"`,
        e.amount
      ]);
    });

    const total = activeTrip.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    rows.push([]);
    rows.push(['', '', '', 'TOTAL TRIP EXPENSE', '', total]);

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (activeTrip.name || 'Trip').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('href', url);
    link.setAttribute('download', `${safeName}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --------------------------------------------------
  // Feature A: Multi-Device Share, QR Engine & Import
  // --------------------------------------------------

  // Unicode-safe Base64 conversion (supports Indian Rupee ₹, emojis, accents)
  function safeUtf8ToBase64(str) {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch (err) {
      console.error('Base64 encode error:', err);
      return '';
    }
  }

  function safeBase64ToUtf8(b64) {
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(b64), (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (err) {
      console.error('Base64 decode error:', err);
      return null;
    }
  }

  // Efficient trip compression (reduces payload by ~85% for QR and URL limits)
  function compressTrip(trip) {
    return {
      v: 1,
      n: trip.name || '',
      d: trip.destination || '',
      b: Number(trip.targetBudget) || 0,
      r: trip.roomCode || '',
      m: Array.isArray(trip.members) ? trip.members : [],
      e: (trip.expenses || []).map(x => [
        x.payer || '',
        x.name || '',
        x.category || '',
        Number(x.amount) || 0,
        x.date || ''
      ]),
      i: (trip.itinerary || []).map(a => [
        Number(a.day) || 1,
        a.time || '',
        a.title || '',
        Number(a.cost) || 0,
        a.category || ''
      ])
    };
  }

  function decompressTrip(data) {
    if (!data) return null;
    // If it's already full trip format
    if (data.name && Array.isArray(data.members) && !data.v) {
      if (!data.id) data.id = 'trip_imp_' + Date.now();
      return data;
    }
    // Decompress short keys
    return {
      id: 'trip_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: data.n || 'Shared Trip',
      destination: data.d || '',
      targetBudget: Number(data.b) || 0,
      roomCode: data.r || '',
      members: Array.isArray(data.m) ? data.m : [],
      expenses: Array.isArray(data.e) ? data.e.map((x, idx) => ({
        id: 'exp_imp_' + Date.now() + '_' + idx,
        payer: x[0] || '',
        name: x[1] || '',
        category: x[2] || 'Other',
        amount: Number(x[3]) || 0,
        date: x[4] || new Date().toISOString().split('T')[0]
      })) : [],
      itinerary: Array.isArray(data.i) ? data.i.map((a, idx) => ({
        id: 'act_imp_' + Date.now() + '_' + idx,
        day: Number(a[0]) || 1,
        time: a[1] || '',
        title: a[2] || '',
        cost: Number(a[3]) || 0,
        category: a[4] || 'Activities'
      })) : [],
      createdAt: new Date().toISOString()
    };
  }

  // Generates a clean, robust live share URL
  function generateShareUrl(trip) {
    try {
      ensureTripSyncMetadata(trip);
      const compact = compressTrip(trip);
      const jsonStr = JSON.stringify(compact);
      const token = safeUtf8ToBase64(jsonStr);

      const baseUrl = window.location.href.split('?')[0].split('#')[0];
      const roomParam = trip.roomCode ? `&room=${encodeURIComponent(trip.roomCode)}` : '';
      const cloudParam = trip.cloudId ? `&cloudId=${encodeURIComponent(trip.cloudId)}` : '';
      return `${baseUrl}?shareData=${encodeURIComponent(token)}${roomParam}${cloudParam}`;
    } catch (e) {
      console.error('Error generating share URL:', e);
      return window.location.href;
    }
  }

  // Resilient multi-tier QR Code Renderer
  function renderQrCode(url, trip) {
    if (!qrCodeContainer) return;
    qrCodeContainer.innerHTML = '<div class="qr-spinner" title="Generating QR code..."></div>';

    // Prepare payload: if local file:/// protocol, mobile cameras cannot open file:/// links,
    // so we provide a web-standard link for phones, or direct token if needed.
    let qrPayload = url;
    if (window.location.protocol === 'file:') {
      const token = (url.split('shareData=')[1] || '').trim();
      qrPayload = `https://travelmate-project.web.app/budget.html?shareData=${token}`;
    }

    const encodedPayload = encodeURIComponent(qrPayload);

    const img = new Image();
    // Tier 1: QuickChart API (Fast, crisp, handles query params up to several KB, CORS enabled)
    img.src = `https://quickchart.io/qr?size=220&margin=2&text=${encodedPayload}`;
    img.alt = 'Trip QR Code';
    img.style.width = '200px';
    img.style.height = '200px';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';

    img.onload = () => {
      qrCodeContainer.innerHTML = '';
      qrCodeContainer.appendChild(img);
      if (qrHelpText) {
        qrHelpText.textContent = '📷 Scan with any phone camera or Google Lens to open trip';
      }
    };

    img.onerror = () => {
      // Tier 2 Fallback: QRServer API
      const fallbackImg = new Image();
      fallbackImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedPayload}`;
      fallbackImg.alt = 'Trip QR Code';
      fallbackImg.style.width = '200px';
      fallbackImg.style.height = '200px';
      fallbackImg.style.borderRadius = '8px';

      fallbackImg.onload = () => {
        qrCodeContainer.innerHTML = '';
        qrCodeContainer.appendChild(fallbackImg);
        if (qrHelpText) {
          qrHelpText.textContent = '📷 Scan with any phone camera or Google Lens to open trip';
        }
      };

      fallbackImg.onerror = () => {
        // Tier 3 Offline Fallback: Render a handsome visual offline card (NEVER a blank broken box)
        const tripName = trip ? trip.name : 'Active Trip';
        const memberCount = trip && trip.members ? trip.members.length : 0;
        const totalExp = trip && trip.expenses ? trip.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) : 0;
        qrCodeContainer.innerHTML = `
          <div style="width: 200px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 12px; text-align: center; box-sizing: border-box;">
            <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">📱</div>
            <strong style="font-size: 0.85rem; color: #047857; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">${tripName}</strong>
            <span style="font-size: 0.75rem; color: #065f46; margin-top: 0.2rem;">${memberCount} Members • ${formatINR(totalExp)}</span>
            <span style="font-size: 0.7rem; color: #64748b; margin-top: 0.5rem;">Copy link below to open on any device</span>
          </div>
        `;
        if (qrHelpText) {
          qrHelpText.textContent = '💡 Offline Mode: Direct link is ready below to copy & share';
        }
      };
    };
  }

  // Universal Trip Importer (accepts URLs, query strings, Base64 tokens, or Room codes)
  function importTripFromData(rawStr) {
    if (!rawStr || !rawStr.trim()) {
      return { success: false, error: 'Please enter a valid trip link, token or room code.' };
    }

    const trimmed = rawStr.trim();
    let token = trimmed;
    let roomParam = '';
    let cloudIdParam = '';

    if (trimmed.includes('shareData=') || trimmed.includes('?')) {
      try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : 'http://dummy.com/' + trimmed);
        token = urlObj.searchParams.get('shareData') || token;
        roomParam = urlObj.searchParams.get('room') || '';
        cloudIdParam = urlObj.searchParams.get('cloudId') || '';
      } catch (e) {
        const match = trimmed.match(/shareData=([^&#\s]+)/);
        if (match) token = match[1];
        const rMatch = trimmed.match(/room=([^&#\s]+)/);
        if (rMatch) roomParam = rMatch[1];
      }
    }

    token = decodeURIComponent(token);

    try {
      const decodedJson = safeBase64ToUtf8(token);
      if (decodedJson) {
        const parsed = JSON.parse(decodedJson);
        const trip = decompressTrip(parsed);
        if (trip && trip.name && Array.isArray(trip.members) && trip.members.length > 0) {
          if (roomParam) trip.roomCode = roomParam.toUpperCase();
          if (cloudIdParam) trip.cloudId = cloudIdParam;
          ensureTripSyncMetadata(trip);

          const trips = getAllTrips();
          const existingIdx = trips.findIndex(t => t.id === trip.id || (t.roomCode && t.roomCode === trip.roomCode));
          if (existingIdx !== -1) {
            trips[existingIdx] = trip;
          } else {
            trips.unshift(trip);
          }
          saveAllTrips(trips);
          setActiveTripId(trip.id);
          startLiveCloudSync(trip);
          return { success: true, trip: trip };
        }
      }
    } catch (err) {
      console.warn('Base64 parse in import error:', err);
    }

    // Check if Room Code (alphanumeric 3-12 characters, e.g. GOA26)
    if (/^[A-Z0-9_-]{3,12}$/i.test(trimmed)) {
      const roomCode = trimmed.toUpperCase();
      const trips = getAllTrips();
      const match = trips.find(t => t.roomCode && t.roomCode.toUpperCase() === roomCode);
      if (match) {
        setActiveTripId(match.id);
        startLiveCloudSync(match);
        return { success: true, trip: match, isLocalRoom: true };
      }
      pullTripFromCloud(null, roomCode);
      return { success: true, trip: { name: `Room ${roomCode}`, roomCode }, isRemoteRoom: true };
    }

    return { success: false, error: 'Invalid or incomplete trip data. Please copy the complete share link or token.' };
  }

  // Auto-import shared trip when opening a link with ?shareData=... or &room=...
  function checkUrlShareData() {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareDataParam = params.get('shareData');
      const roomParam = params.get('room');
      const cloudIdParam = params.get('cloudId');

      if (shareDataParam || roomParam || cloudIdParam) {
        let importedTrip = null;
        if (shareDataParam) {
          const result = importTripFromData(shareDataParam);
          if (result.success) importedTrip = result.trip;
        }

        if (importedTrip) {
          if (roomParam) importedTrip.roomCode = roomParam.toUpperCase();
          if (cloudIdParam) importedTrip.cloudId = cloudIdParam;
          ensureTripSyncMetadata(importedTrip);
          saveActiveTrip(importedTrip, true);
          setActiveTripId(importedTrip.id);
          startLiveCloudSync(importedTrip);
          pullTripFromCloud(importedTrip.cloudId, importedTrip.roomCode);
          showLiveSyncToast(`🎉 Connected to live trip: "${importedTrip.name}"`);
        } else if (roomParam) {
          pullTripFromCloud(cloudIdParam, roomParam);
        }

        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
          window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }
      }
    } catch (err) {
      console.warn('Could not auto-import share data from URL:', err);
    }
  }

  function initShareModal() {
    if (shareTripBtn && shareModal) {
      shareTripBtn.addEventListener('click', () => {
        const activeTrip = getActiveTrip();
        if (!activeTrip) return alert('No active trip to share.');

        // Update Room Code Badge in Share Modal
        if (shareRoomBadgeWrap && shareRoomCodeVal) {
          if (activeTrip.roomCode) {
            shareRoomCodeVal.textContent = activeTrip.roomCode;
            shareRoomBadgeWrap.style.display = 'block';
          } else {
            shareRoomBadgeWrap.style.display = 'none';
          }
        }

        // Generate Link and QR
        const shareUrl = generateShareUrl(activeTrip);
        if (shareUrlInput) shareUrlInput.value = shareUrl;
        renderQrCode(shareUrl, activeTrip);
        shareModal.classList.remove('hidden');
      });
    }

    if (closeShareBtn && shareModal) {
      closeShareBtn.addEventListener('click', () => {
        shareModal.classList.add('hidden');
      });
    }

    if (shareModal) {
      shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) shareModal.classList.add('hidden');
      });
    }

    // 1-Click Copy Link
    if (copyShareUrlBtn && shareUrlInput) {
      copyShareUrlBtn.addEventListener('click', () => {
        shareUrlInput.select();
        shareUrlInput.setSelectionRange(0, 99999);
        const textToCopy = shareUrlInput.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            copyShareUrlBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyShareUrlBtn.textContent = '📋 Copy Link'; }, 2000);
          }).catch(() => {
            document.execCommand('copy');
            copyShareUrlBtn.textContent = '✓ Copied!';
            setTimeout(() => { copyShareUrlBtn.textContent = '📋 Copy Link'; }, 2000);
          });
        } else {
          document.execCommand('copy');
          copyShareUrlBtn.textContent = '✓ Copied!';
          setTimeout(() => { copyShareUrlBtn.textContent = '📋 Copy Link'; }, 2000);
        }
      });
    }

    // 1-Click Copy Room Code
    if (copyRoomCodeBtn && shareRoomCodeVal) {
      copyRoomCodeBtn.addEventListener('click', () => {
        const code = shareRoomCodeVal.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            copyRoomCodeBtn.textContent = '✓';
            setTimeout(() => { copyRoomCodeBtn.textContent = 'Copy'; }, 2000);
          }).catch(() => {
            copyRoomCodeBtn.textContent = '✓';
            setTimeout(() => { copyRoomCodeBtn.textContent = 'Copy'; }, 2000);
          });
        } else {
          copyRoomCodeBtn.textContent = '✓';
          setTimeout(() => { copyRoomCodeBtn.textContent = 'Copy'; }, 2000);
        }
      });
    }

    // WhatsApp Share Button
    if (whatsappShareBtn && shareUrlInput) {
      whatsappShareBtn.addEventListener('click', () => {
        const activeTrip = getActiveTrip();
        const tripName = activeTrip ? activeTrip.name : 'Group Trip';
        const destText = activeTrip && activeTrip.destination ? ` (${activeTrip.destination})` : '';
        const roomNote = activeTrip && activeTrip.roomCode ? ` | Sync Room: ${activeTrip.roomCode}` : '';
        const text = `Hey! Here is our "${tripName}${destText}" trip details, expense split & itinerary on TravelMate:${roomNote}\n\n👉 Open & Import Trip: ${shareUrlInput.value}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      });
    }
  }

  // Import Trip Modal Logic
  function initImportTripModal() {
    if (!importTripModal) return;

    if (btnOpenImportTrip) {
      btnOpenImportTrip.addEventListener('click', () => {
        if (importDataInput) importDataInput.value = '';
        if (importErrorMsg) {
          importErrorMsg.textContent = '';
          importErrorMsg.classList.add('hidden');
        }
        importTripModal.classList.remove('hidden');
        if (importDataInput) importDataInput.focus();
      });
    }

    function closeImport() {
      importTripModal.classList.add('hidden');
      if (importErrorMsg) importErrorMsg.classList.add('hidden');
    }

    if (closeImportBtn) closeImportBtn.addEventListener('click', closeImport);
    if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImport);
    importTripModal.addEventListener('click', (e) => {
      if (e.target === importTripModal) closeImport();
    });

    if (importTripForm) {
      importTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = importDataInput ? importDataInput.value.trim() : '';
        const result = importTripFromData(raw);

        if (result.success) {
          closeImport();
          editingExpenseId = null;
          editingTripId = null;
          if (tripSetupPanel) tripSetupPanel.classList.add('hidden');
          renderTracker();
          if (activeTripBanner) {
            activeTripBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          alert(`🎉 Trip "${result.trip.name}" loaded successfully!`);
        } else {
          if (importErrorMsg) {
            importErrorMsg.textContent = result.error || 'Failed to import trip.';
            importErrorMsg.classList.remove('hidden');
          } else {
            alert(result.error || 'Failed to import trip.');
          }
        }
      });
    }
  }

  // --------------------------------------------------
  // Feature B: Real-Time Multi-Device Live Cloud Sync Engine
  // --------------------------------------------------
  let syncEventSource = null;
  let syncPollInterval = null;
  let liveBroadcastChannel = null;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      liveBroadcastChannel = new BroadcastChannel('travelmate_live_sync_bus');
      liveBroadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'TRIP_UPDATED') {
          handleIncomingLiveTrip(event.data.trip, 'Local Tab');
        }
      };
    }
  } catch (e) {
    console.warn('BroadcastChannel notice:', e);
  }

  function showLiveSyncToast(msg = '⚡ Live Sync: Trip updated in real-time!') {
    let toast = document.getElementById('liveSyncToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'liveSyncToast';
      toast.className = 'live-sync-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
    toast.classList.remove('hidden');
    toast.style.display = 'flex';

    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.add('hidden');
      toast.style.display = 'none';
    }, 3200);
  }

  function ensureTripSyncMetadata(trip) {
    if (!trip) return;
    if (!trip.updatedAt) trip.updatedAt = Date.now();
    if (!trip.roomCode) {
      const destPrefix = (trip.destination || trip.name || 'TRIP')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase() || 'TRIP';
      const randNum = Math.floor(1000 + Math.random() * 9000);
      trip.roomCode = `${destPrefix}${randNum}`;
    }
  }

  async function pushTripToCloud(trip) {
    if (!trip || !trip.roomCode) return;
    ensureTripSyncMetadata(trip);
    trip.updatedAt = Date.now();

    if (cloudSyncStatus) {
      cloudSyncStatus.textContent = `Syncing to Room ${trip.roomCode}...`;
    }

    try {
      // 1. Broadcast to other open tabs on this device
      if (liveBroadcastChannel) {
        liveBroadcastChannel.postMessage({ type: 'TRIP_UPDATED', trip: trip });
      }

      // 2. Publish to NTFY Realtime SSE Message Bus for instantaneous cross-device push
      const ntfyTopic = `travelmate_sync_${trip.roomCode.toLowerCase()}`;
      fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        headers: { 'Title': 'TravelMate Live Sync', 'Tags': 'airplane,moneybag' },
        body: JSON.stringify({
          type: 'LIVE_TRIP_UPDATE',
          tripId: trip.id,
          updatedAt: trip.updatedAt,
          cloudId: trip.cloudId || null,
          trip: trip
        })
      }).catch(err => console.warn('NTFY push notice:', err));

      // 3. Persistent REST object store
      if (trip.cloudId) {
        fetch(`https://api.restful-api.dev/objects/${trip.cloudId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trip.name,
            data: trip
          })
        }).catch(e => console.warn('REST PUT notice:', e));
      } else {
        fetch('https://api.restful-api.dev/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trip.name,
            data: trip
          })
        }).then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.id) {
              trip.cloudId = data.id;
              const trips = getAllTrips();
              const idx = trips.findIndex(t => t.id === trip.id);
              if (idx !== -1) {
                trips[idx].cloudId = data.id;
                saveAllTrips(trips);
              }
            }
          }).catch(e => console.warn('REST create notice:', e));
      }

      if (cloudSyncStatus) {
        cloudSyncStatus.textContent = `🟢 Live Synced • Room: ${trip.roomCode} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`;
      }
      if (syncStatusDot) {
        syncStatusDot.style.backgroundColor = '#10b981';
        syncStatusDot.style.boxShadow = '0 0 10px #10b981';
        syncStatusDot.classList.add('live-sync-pulse');
        setTimeout(() => syncStatusDot.classList.remove('live-sync-pulse'), 3000);
      }
    } catch (err) {
      console.warn('Cloud sync push warning:', err);
      if (cloudSyncStatus) {
        cloudSyncStatus.textContent = `Saved locally • Room: ${trip.roomCode}`;
      }
    }
  }

  async function pullTripFromCloud(cloudId, roomCode) {
    const activeTrip = getActiveTrip();
    const effectiveRoom = (roomCode || activeTrip?.roomCode || '').trim();
    const effectiveCloudId = (cloudId || activeTrip?.cloudId || '').trim();

    if (!effectiveRoom && !effectiveCloudId) return;

    try {
      let remoteTrip = null;

      if (effectiveCloudId) {
        const res = await fetch(`https://api.restful-api.dev/objects/${effectiveCloudId}`);
        if (res.ok) {
          const obj = await res.json();
          if (obj && obj.data && obj.data.name) {
            remoteTrip = obj.data;
          }
        }
      }

      if (!remoteTrip && effectiveRoom) {
        const ntfyTopic = `travelmate_sync_${effectiveRoom.toLowerCase()}`;
        const res = await fetch(`https://ntfy.sh/${ntfyTopic}/json?poll=1`);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsedLine = JSON.parse(lines[i]);
              if (parsedLine.message) {
                const msgObj = JSON.parse(parsedLine.message);
                if (msgObj && msgObj.trip && msgObj.trip.name) {
                  remoteTrip = msgObj.trip;
                  break;
                }
              }
            } catch (e) {}
          }
        }
      }

      if (remoteTrip) {
        handleIncomingLiveTrip(remoteTrip, 'Cloud');
      }
    } catch (err) {
      console.warn('Pull trip error:', err);
    }
  }

  function handleIncomingLiveTrip(incomingTrip, source = 'Cloud') {
    if (!incomingTrip || !incomingTrip.id) return;
    const activeTrip = getActiveTrip();

    const trips = getAllTrips();
    const existingIdx = trips.findIndex(t => t.id === incomingTrip.id || (t.roomCode && t.roomCode === incomingTrip.roomCode));

    const localTrip = existingIdx !== -1 ? trips[existingIdx] : null;
    const localUpdated = (localTrip && localTrip.updatedAt) ? Number(localTrip.updatedAt) : 0;
    const incomingUpdated = incomingTrip.updatedAt ? Number(incomingTrip.updatedAt) : Date.now();

    const isDifferent = !localTrip || JSON.stringify(localTrip.expenses) !== JSON.stringify(incomingTrip.expenses) || localTrip.targetBudget !== incomingTrip.targetBudget || (localTrip.itinerary?.length !== incomingTrip.itinerary?.length);

    if (incomingUpdated >= localUpdated && isDifferent) {
      if (existingIdx !== -1) {
        trips[existingIdx] = incomingTrip;
      } else {
        trips.unshift(incomingTrip);
      }
      saveAllTrips(trips);

      if (activeTrip && (activeTrip.id === incomingTrip.id || activeTrip.roomCode === incomingTrip.roomCode)) {
        setActiveTripId(incomingTrip.id);
        renderTracker();
        showLiveSyncToast(`⚡ Live Update: Trip updated in real-time by collaborator!`);
        updateCloudSyncDisplay(incomingTrip);
      }
    }
  }

  function startLiveCloudSync(trip) {
    if (!trip || !trip.roomCode) return;
    ensureTripSyncMetadata(trip);

    if (syncEventSource) {
      try { syncEventSource.close(); } catch (e) {}
      syncEventSource = null;
    }

    if (syncPollInterval) {
      clearInterval(syncPollInterval);
      syncPollInterval = null;
    }

    const ntfyTopic = `travelmate_sync_${trip.roomCode.toLowerCase()}`;
    try {
      syncEventSource = new EventSource(`https://ntfy.sh/${ntfyTopic}/sse`);
      syncEventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.message) {
            const data = JSON.parse(payload.message);
            if (data && data.trip && data.trip.id) {
              handleIncomingLiveTrip(data.trip, 'Realtime SSE');
            }
          }
        } catch (err) {
          console.warn('SSE message parse error:', err);
        }
      };
    } catch (e) {
      console.warn('EventSource initialization notice:', e);
    }

    syncPollInterval = setInterval(() => {
      pullTripFromCloud(trip.cloudId, trip.roomCode);
    }, 3000);

    updateCloudSyncDisplay(trip);
  }

  function updateCloudSyncDisplay(activeTrip) {
    if (!cloudSyncBar) return;
    if (activeTrip && activeTrip.roomCode) {
      if (syncRoomCodeInput) syncRoomCodeInput.value = activeTrip.roomCode;
      if (cloudSyncStatus) {
        cloudSyncStatus.textContent = `🟢 Live Synced • Room: ${activeTrip.roomCode}`;
      }
      if (syncStatusDot) {
        syncStatusDot.style.backgroundColor = '#10b981';
        syncStatusDot.style.boxShadow = '0 0 8px #10b981';
      }
    } else {
      if (syncRoomCodeInput) syncRoomCodeInput.value = '';
      if (cloudSyncStatus) {
        cloudSyncStatus.textContent = 'Working in local offline mode';
      }
      if (syncStatusDot) {
        syncStatusDot.style.backgroundColor = '#94a3b8';
        syncStatusDot.style.boxShadow = 'none';
      }
    }
  }

  function initCloudRoomSync() {
    if (!syncRoomBtn || !syncRoomCodeInput) return;

    syncRoomBtn.addEventListener('click', () => {
      const activeTrip = getActiveTrip();
      if (!activeTrip) return alert('No active trip to connect.');
      const code = syncRoomCodeInput.value.trim().toUpperCase();
      if (!code) return alert('Please enter a room code (e.g. GOA26).');

      activeTrip.roomCode = code;
      saveActiveTrip(activeTrip);
      startLiveCloudSync(activeTrip);
      pullTripFromCloud(activeTrip.cloudId, code);
      alert(`✅ Connected to Live Room "${code}"! Any peer device on this code will now sync in real-time.`);
    });

    if (syncPushBtn) {
      syncPushBtn.addEventListener('click', () => {
        const activeTrip = getActiveTrip();
        if (!activeTrip) return;
        const code = (activeTrip.roomCode || syncRoomCodeInput.value.trim()).toUpperCase();
        if (!code) return alert('Please enter or connect to a room code first.');

        activeTrip.roomCode = code;
        saveActiveTrip(activeTrip);
        pushTripToCloud(activeTrip);
        showLiveSyncToast(`🚀 Pushed latest trip updates to Room "${code}"!`);
      });
    }

    if (syncPullBtn) {
      syncPullBtn.addEventListener('click', () => {
        const activeTrip = getActiveTrip();
        const code = (activeTrip?.roomCode || syncRoomCodeInput.value.trim()).toUpperCase();
        if (!code) return alert('Please enter a room code to pull from.');

        pullTripFromCloud(activeTrip?.cloudId, code);
        showLiveSyncToast(`📥 Checking for live updates in Room "${code}"...`);
      });
    }

    // Auto sync on window focus & storage event
    window.addEventListener('storage', (e) => {
      const activeTrip = getActiveTrip();
      if (!activeTrip) return;
      if (e.key === STORAGE_KEYS.TRIPS) {
        renderTracker();
      }
    });

    window.addEventListener('focus', () => {
      const activeTrip = getActiveTrip();
      if (activeTrip && activeTrip.roomCode) {
        pullTripFromCloud(activeTrip.cloudId, activeTrip.roomCode);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const activeTrip = getActiveTrip();
        if (activeTrip && activeTrip.roomCode) {
          pullTripFromCloud(activeTrip.cloudId, activeTrip.roomCode);
        }
      }
    });

    // Start live sync for current active trip on load
    const active = getActiveTrip();
    if (active) {
      startLiveCloudSync(active);
    }
  }

  // --------------------------------------------------
  // Feature C: Day-by-Day Itinerary Timeline Planner
  // --------------------------------------------------
  function renderItinerary(activeTrip) {
    if (!itineraryTimelineList) return;
    const items = activeTrip.itinerary || [];
    itineraryTimelineList.innerHTML = '';

    if (items.length === 0) {
      if (emptyItineraryState) emptyItineraryState.classList.remove('hidden');
      return;
    }

    if (emptyItineraryState) emptyItineraryState.classList.add('hidden');

    const dayGroups = {};
    items.forEach(item => {
      const dayNum = item.day || 1;
      if (!dayGroups[dayNum]) dayGroups[dayNum] = [];
      dayGroups[dayNum].push(item);
    });

    const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

    sortedDays.forEach(day => {
      const groupEl = document.createElement('div');
      groupEl.className = 'itinerary-day-group';

      const tag = document.createElement('div');
      tag.className = 'itinerary-day-tag';
      tag.textContent = `Day ${day}`;
      groupEl.appendChild(tag);

      dayGroups[day].forEach(act => {
        const itemEl = document.createElement('div');
        itemEl.className = 'timeline-item';
        const costText = act.cost > 0 ? formatINR(act.cost) : 'Free / Not specified';

        itemEl.innerHTML = `
          <div class="timeline-item-header">
            <span class="timeline-time-badge">⏰ ${act.time || 'All Day'}</span>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <span class="category-tag">${act.category || 'Activities'}</span>
              <button class="btn-action-delete" style="padding: 0.2rem 0.5rem;" onclick="deleteItineraryActivity('${act.id}')" title="Delete Activity">✕</button>
            </div>
          </div>
          <div class="timeline-title">${act.title}</div>
          <div class="timeline-meta">
            <span><strong>Est. Cost:</strong> ${costText}</span>
            <button type="button" class="btn-convert-expense" onclick="convertActivityToExpense('${act.id}')">
              + Log to Expenses
            </button>
          </div>
        `;
        groupEl.appendChild(itemEl);
      });

      itineraryTimelineList.appendChild(groupEl);
    });
  }

  window.deleteItineraryActivity = function(actId) {
    const activeTrip = getActiveTrip();
    if (!activeTrip) return;
    activeTrip.itinerary = (activeTrip.itinerary || []).filter(a => a.id !== actId);
    saveActiveTrip(activeTrip);
    renderTracker();
  };

  window.convertActivityToExpense = function(actId) {
    const activeTrip = getActiveTrip();
    if (!activeTrip) return;
    const act = (activeTrip.itinerary || []).find(a => a.id === actId);
    if (!act) return;

    const defaultPayer = (activeTrip.members && activeTrip.members.length > 0) ? activeTrip.members[0] : 'Member';
    const amount = act.cost > 0 ? act.cost : 500;

    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      payer: defaultPayer,
      name: act.title,
      category: act.category || 'Activities',
      amount: amount,
      date: new Date().toISOString().split('T')[0]
    };

    activeTrip.expenses = activeTrip.expenses || [];
    activeTrip.expenses.unshift(newExpense);
    saveActiveTrip(activeTrip);
    renderTracker();
    alert(`✅ Activity "${act.title}" logged as an expense (Paid by ${defaultPayer}, ${formatINR(amount)})!`);
  };

  function initItineraryEvents() {
    if (openAddActivityBtn && activityModal) {
      openAddActivityBtn.addEventListener('click', () => {
        activityModal.classList.remove('hidden');
      });
    }
    if (closeActivityBtn && activityModal) {
      closeActivityBtn.addEventListener('click', () => {
        activityModal.classList.add('hidden');
      });
    }
    if (cancelActivityBtn && activityModal) {
      cancelActivityBtn.addEventListener('click', () => {
        activityModal.classList.add('hidden');
      });
    }
    if (activityModal) {
      activityModal.addEventListener('click', (e) => {
        if (e.target === activityModal) activityModal.classList.add('hidden');
      });
    }
    if (activityForm) {
      activityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeTrip = getActiveTrip();
        if (!activeTrip) return;

        const day = parseInt(actDayInput.value, 10) || 1;
        const time = actTimeInput.value.trim() || 'Morning';
        const title = actTitleInput.value.trim();
        const cost = parseFloat(actCostInput.value) || 0;
        const category = actCategoryInput.value || 'Activities';

        if (!title) return alert('Please enter activity title.');

        const newAct = {
          id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          day,
          time,
          title,
          cost,
          category
        };

        activeTrip.itinerary = activeTrip.itinerary || [];
        activeTrip.itinerary.push(newAct);
        saveActiveTrip(activeTrip);

        actTitleInput.value = '';
        actCostInput.value = '0';
        activityModal.classList.add('hidden');

        renderTracker();
      });
    }
  }

  // --------------------------------------------------
  // Feature D: Live Multi-Currency Converter
  // --------------------------------------------------
  function initCurrencyConverter() {
    if (!currencyAmountInput || !currencyFromSelect || !currencyToSelect) return;

    const RATES_TO_INR = {
      INR: 1,
      USD: 86.8,
      EUR: 91.5,
      GBP: 109.8,
      AED: 23.6,
      THB: 2.45
    };

    const CURRENCY_SYMBOLS = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      AED: 'د.إ',
      THB: '฿'
    };

    function calculateCurrency() {
      const amount = parseFloat(currencyAmountInput.value) || 0;
      const from = currencyFromSelect.value;
      const to = currencyToSelect.value;

      const inrValue = amount * (RATES_TO_INR[from] || 1);
      const converted = inrValue / (RATES_TO_INR[to] || 1);

      const symbol = CURRENCY_SYMBOLS[to] || '';
      if (currencyConvertedVal) {
        currencyConvertedVal.textContent = `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      if (currencyRateNote) {
        const unitRate = (RATES_TO_INR[from] / RATES_TO_INR[to]).toFixed(4);
        currencyRateNote.textContent = `1 ${from} ≈ ${unitRate} ${to}`;
      }
    }

    currencyAmountInput.addEventListener('input', calculateCurrency);
    currencyFromSelect.addEventListener('change', calculateCurrency);
    currencyToSelect.addEventListener('change', calculateCurrency);

    calculateCurrency();
  }

  // Initial setup: render dynamic inputs if no trips exist
  const existingTrips = getAllTrips();
  if (existingTrips.length === 0 && memberNamesContainer) {
    renderMemberInputs(parseInt(numMembersInput?.value, 10) || 3);
  }

  // Initialize interactive features
  initShareModal();
  initImportTripModal();
  initCloudRoomSync();
  initItineraryEvents();
  initCurrencyConverter();

  // Render tracker state on load
  renderTracker();
}

/**
 * ----------------------------------------------------
 * 3. Destinations Page Search & Category Filter
 * ----------------------------------------------------
 */
function initDestinationsFilter() {
  const destSearchInput = document.getElementById('destSearchInput');
  const filterPills = document.querySelectorAll('.filter-pill');
  const destinationCards = document.querySelectorAll('.destination-card');
  const noDestFoundState = document.getElementById('noDestFoundState');

  if (!destinationCards.length) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function applyFilters() {
    let visibleCount = 0;

    destinationCards.forEach(card => {
      const cardCategory = (card.getAttribute('data-category') || '').toLowerCase();
      const cardName = (card.getAttribute('data-name') || card.textContent).toLowerCase();

      const matchesCategory = currentCategory === 'all' || cardCategory.includes(currentCategory.toLowerCase());
      const matchesSearch = !searchQuery || cardName.includes(searchQuery.toLowerCase());

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noDestFoundState) {
      if (visibleCount === 0) {
        noDestFoundState.classList.remove('hidden');
      } else {
        noDestFoundState.classList.add('hidden');
      }
    }
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  if (destSearchInput) {
    destSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      applyFilters();
    });
  }
}

/**
 * ----------------------------------------------------
 * 4. About Page Contact & Feedback Form Handler
 * ----------------------------------------------------
 */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const contactSuccessAlert = document.getElementById('contactSuccessAlert');

  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value.trim() || '';
    const email = document.getElementById('contactEmail')?.value.trim() || '';
    const subject = document.getElementById('contactSubject')?.value.trim() || '';
    const message = document.getElementById('contactMessage')?.value.trim() || '';

    if (!name || !email || !message) return;

    // Save message locally
    try {
      const messages = JSON.parse(localStorage.getItem('travelMateContactMessages') || '[]');
      messages.push({
        id: 'msg_' + Date.now(),
        name,
        email,
        subject,
        message,
        date: new Date().toISOString()
      });
      localStorage.setItem('travelMateContactMessages', JSON.stringify(messages));
    } catch (err) {
      console.warn('Could not save message to localStorage', err);
    }

    if (contactSuccessAlert) {
      contactSuccessAlert.className = 'alert alert-success';
      contactSuccessAlert.style.backgroundColor = '#ecfdf5';
      contactSuccessAlert.style.borderColor = '#a7f3d0';
      contactSuccessAlert.style.color = '#065f46';
      contactSuccessAlert.textContent = `Thank you, ${name}! Your message has been received. Our team will get back to you shortly.`;
      contactSuccessAlert.classList.remove('hidden');
    }

    contactForm.reset();
  });
}


