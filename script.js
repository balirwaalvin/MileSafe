// Mobile menu toggle
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Smooth scroll for anchor links (optional)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Utility function to show error messages on a form
function showError(formId, message) {
  const form = document.getElementById(formId);
  if (!form) return;

  const errorElement = form.querySelector('.login-error, .signup-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

// Clear error message on input focus
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', () => {
    const form = input.closest('form');
    if (!form) return;
    const errorElement = form.querySelector('.login-error, .signup-error');
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  });
});

// Login form validation
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();

    if (!username || !password) {
      e.preventDefault();
      showError('login-form', 'Please enter both username and password.');
    }
  });
}

// Signup form validation
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', e => {
    const username = signupForm.username.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;
    const confirmPassword = signupForm['confirm-password'].value;

    if (!username || !email || !password || !confirmPassword) {
      e.preventDefault();
      showError('signup-form', 'Please fill out all fields.');
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      showError('signup-form', 'Passwords do not match.');
      return;
    }
  });
}

