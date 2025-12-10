/**
 * Sistema de Login Profesional
 * JavaScript del Frontend
 */

// ===== Configuración =====
const API_URL = '/api/auth';

// ===== Estado de la aplicación =====
let currentEmail = '';

// ===== Utilidades =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTabs();
    initPasswordToggle();
    initPasswordStrength();
    initForms();
    initCodeInputs();
    checkAuth();
});

// ===== Partículas de Fondo =====
function initParticles() {
    const container = $('#particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${15 + Math.random() * 20}s`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.width = `${3 + Math.random() * 6}px`;
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// ===== Tabs =====
function initTabs() {
    const tabs = $$('.tab-btn');
    const indicator = $('.tab-indicator');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Links para cambiar de tab
    $$('.switch-tab').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.target);
        });
    });
}

function switchTab(tabName) {
    // Actualizar botones
    $$('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Actualizar formularios
    $$('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}-form`);
    });

    // Limpiar formularios
    $('#loginForm').reset();
    $('#registerForm').reset();
    $('.password-strength').style.display = 'none';
}

// ===== Password Toggle =====
function initPasswordToggle() {
    $$('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');

            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
            }
        });
    });
}

// ===== Password Strength =====
function initPasswordStrength() {
    const passwordInput = $('#registerPassword');
    const strengthContainer = $('.password-strength');
    const strengthFill = $('.strength-fill');
    const strengthText = $('.strength-text');

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;

        if (password.length === 0) {
            strengthContainer.style.display = 'none';
            return;
        }

        strengthContainer.style.display = 'flex';

        const strength = calculatePasswordStrength(password);

        strengthFill.className = 'strength-fill ' + strength.level;
        strengthText.className = 'strength-text ' + strength.level;
        strengthText.textContent = strength.text;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
        return { level: 'weak', text: 'Débil' };
    } else if (score <= 3) {
        return { level: 'medium', text: 'Media' };
    } else {
        return { level: 'strong', text: 'Fuerte' };
    }
}

// ===== Formularios =====
function initForms() {
    // Login
    $('#loginForm').addEventListener('submit', handleLogin);

    // Registro
    $('#registerForm').addEventListener('submit', handleRegister);

    // Verificación
    $('#verificationForm').addEventListener('submit', handleVerification);

    // Reenviar código
    $('#resendCodeBtn').addEventListener('click', handleResendCode);

    // Cerrar modal
    $('#closeVerificationModal').addEventListener('click', closeVerificationModal);
    $('#verificationModal').addEventListener('click', (e) => {
        if (e.target.id === 'verificationModal') {
            closeVerificationModal();
        }
    });
}

// ===== Login =====
async function handleLogin(e) {
    e.preventDefault();

    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;

    if (!validateEmail(email)) {
        showNotification('error', 'Error', 'Por favor ingresa un correo válido');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Guardar token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showNotification('success', '¡Bienvenido!', data.message);

            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            if (data.requiresVerification) {
                currentEmail = data.email;
                showNotification('warning', 'Verificación Requerida', data.message);
                openVerificationModal(data.email);
            } else {
                showNotification('error', 'Error', data.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== Registro =====
async function handleRegister(e) {
    e.preventDefault();

    const nombre = $('#registerNombre').value.trim();
    const email = $('#registerEmail').value.trim();
    const password = $('#registerPassword').value;
    const confirmPassword = $('#registerConfirmPassword').value;

    // Validaciones
    if (!nombre || nombre.length < 2) {
        showNotification('error', 'Error', 'Por favor ingresa tu nombre completo');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('error', 'Error', 'Por favor ingresa un correo válido');
        return;
    }

    if (password.length < 6) {
        showNotification('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('error', 'Error', 'Las contraseñas no coinciden');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentEmail = email;
            showNotification('success', '¡Registro Exitoso!', 'Revisa tu correo para verificar tu cuenta');

            // Mostrar código en desarrollo si está disponible
            if (data.devCode) {
                console.log('Código de verificación (desarrollo):', data.devCode);
                showNotification('info', 'Modo Desarrollo', `Código: ${data.devCode}`);
            }

            openVerificationModal(email);
        } else {
            if (data.requiresVerification) {
                currentEmail = data.email;
                showNotification('info', 'Cuenta Existente', data.message);
                if (data.devCode) {
                    showNotification('info', 'Modo Desarrollo', `Código: ${data.devCode}`);
                }
                openVerificationModal(data.email);
            } else {
                showNotification('error', 'Error', data.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== Verificación =====
function initCodeInputs() {
    const inputs = $$('.code-input');

    inputs.forEach((input, index) => {
        // Solo permitir números
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            if (value) {
                e.target.classList.add('filled');
                // Mover al siguiente input
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        // Manejar backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Manejar paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);

            paste.split('').forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add('filled');
                }
            });

            if (paste.length > 0) {
                inputs[Math.min(paste.length, inputs.length) - 1].focus();
            }
        });
    });
}

function openVerificationModal(email) {
    $('#verificationEmail').textContent = email;
    $('#verificationModal').classList.add('active');
    clearCodeInputs();
    $$('.code-input')[0].focus();
}

function closeVerificationModal() {
    $('#verificationModal').classList.remove('active');
    clearCodeInputs();
}

function clearCodeInputs() {
    $$('.code-input').forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
}

function getCodeFromInputs() {
    return Array.from($$('.code-input')).map(input => input.value).join('');
}

async function handleVerification(e) {
    e.preventDefault();

    const code = getCodeFromInputs();

    if (code.length !== 6) {
        $$('.code-input').forEach(input => input.classList.add('error'));
        setTimeout(() => {
            $$('.code-input').forEach(input => input.classList.remove('error'));
        }, 500);
        showNotification('error', 'Error', 'Por favor ingresa el código completo de 6 dígitos');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, code })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('success', '¡Verificado!', data.message);
            closeVerificationModal();

            // Cambiar a login
            setTimeout(() => {
                switchTab('login');
                $('#loginEmail').value = currentEmail;
                $('#loginPassword').focus();
            }, 500);
        } else {
            $$('.code-input').forEach(input => input.classList.add('error'));
            setTimeout(() => {
                $$('.code-input').forEach(input => input.classList.remove('error'));
            }, 500);
            showNotification('error', 'Error', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== Reenviar Código =====
let resendCooldown = false;

async function handleResendCode() {
    if (resendCooldown) return;

    const btn = $('#resendCodeBtn');
    btn.disabled = true;
    resendCooldown = true;

    try {
        const response = await fetch(`${API_URL}/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('success', 'Código Reenviado', data.message);
            if (data.devCode) {
                showNotification('info', 'Modo Desarrollo', `Código: ${data.devCode}`);
            }

            // Iniciar temporizador
            startResendTimer();
        } else {
            showNotification('error', 'Error', data.message);
            btn.disabled = false;
            resendCooldown = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Error al conectar con el servidor');
        btn.disabled = false;
        resendCooldown = false;
    }
}

function startResendTimer() {
    const btn = $('#resendCodeBtn');
    const timerElement = $('#resendTimer');
    const countElement = $('#timerCount');

    btn.classList.add('hidden');
    timerElement.classList.remove('hidden');

    let seconds = 60;
    countElement.textContent = seconds;

    const interval = setInterval(() => {
        seconds--;
        countElement.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            btn.classList.remove('hidden');
            btn.disabled = false;
            timerElement.classList.add('hidden');
            resendCooldown = false;
        }
    }, 1000);
}

// ===== Notificaciones =====
function showNotification(type, title, message) {
    const container = $('#notifications');

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;

    container.appendChild(notification);

    // Cerrar al hacer click
    notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
    });

    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

function closeNotification(notification) {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// ===== Utilidades =====
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');

    if (loading) {
        text.classList.add('hidden');
        loader.classList.remove('hidden');
        btn.disabled = true;
    } else {
        text.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
}

// ===== Verificar Autenticación =====
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token && window.location.pathname === '/') {
        // Verificar si el token es válido
        fetch(`${API_URL}/verify-token`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/dashboard';
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            });
    }
}
