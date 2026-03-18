import { verifyEmailCode, resendVerificationCode } from '../authService.js';

// --- Leer email desde la URL ---
const params = new URLSearchParams(location.search);
const email = decodeURIComponent(params.get('email') || '');
document.getElementById('emailDisplay').textContent = email || 'tu correo';

// --- Helpers de alerta ---
function showAlert(msg, type = 'danger') {
  const el = document.getElementById('globalAlert');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
}
function hideAlert() {
  document.getElementById('globalAlert').className = 'alert d-none';
}

// --- Lógica OTP ---
const inputs = [...document.querySelectorAll('.otp-input')];
const btnVerify = document.getElementById('btnVerify');

function getCode() {
  return inputs.map(i => i.value).join('');
}

function checkComplete() {
  const complete = inputs.every(i => i.value.match(/\d/));
  btnVerify.disabled = !complete;
}

inputs.forEach((input, idx) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && idx > 0) {
      inputs[idx - 1].value = '';
      inputs[idx - 1].classList.remove('filled');
      inputs[idx - 1].focus();
    }
  });

  input.addEventListener('input', () => {
    // Solo dígitos
    input.value = input.value.replace(/\D/g, '').slice(-1);
    input.classList.toggle('filled', input.value !== '');
    input.classList.remove('error');

    if (input.value && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }
    checkComplete();
  });

  // Pegar en cualquier input
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, i) => {
      if (inputs[i]) {
        inputs[i].value = ch;
        inputs[i].classList.add('filled');
        inputs[i].classList.remove('error');
      }
    });
    const next = Math.min(pasted.length, inputs.length - 1);
    inputs[next].focus();
    checkComplete();
  });
});

// --- Verificar ---
btnVerify.addEventListener('click', async () => {
  const code = getCode();
  hideAlert();

  document.getElementById('verifyText').classList.add('d-none');
  document.getElementById('verifyLoading').classList.remove('d-none');
  btnVerify.disabled = true;

  try {
    const result = await verifyEmailCode(email, code);
    // Auto-login: guardar token y usuario, redirigir
    localStorage.setItem('user', JSON.stringify(result.data));
    localStorage.setItem('token', result.token || '');
    const role = result?.data?.role;
    window.location.replace(role === 'admin' ? '/admin/dashboard' : '/client/proyectos');
  } catch (err) {
    inputs.forEach(i => i.classList.add('error'));
    showAlert(err.message || 'Código inválido. Inténtalo de nuevo.');
    document.getElementById('verifyText').classList.remove('d-none');
    document.getElementById('verifyLoading').classList.add('d-none');
    btnVerify.disabled = false;
  }
});

// --- Reenviar con cooldown de 60s ---
let resendSeconds = 60;
const resendBtn = document.getElementById('resendBtn');
const resendTimer = document.getElementById('resendTimer');

function startResendTimer(seconds) {
  resendSeconds = seconds;
  resendBtn.disabled = true;
  const interval = setInterval(() => {
    resendSeconds--;
    resendTimer.textContent = resendSeconds > 0 ? `(${resendSeconds}s)` : '';
    if (resendSeconds <= 0) {
      clearInterval(interval);
      resendBtn.disabled = false;
    }
  }, 1000);
  resendTimer.textContent = `(${resendSeconds}s)`;
}

startResendTimer(60);

resendBtn.addEventListener('click', async () => {
  hideAlert();
  resendBtn.disabled = true;
  resendTimer.textContent = '';
  try {
    await resendVerificationCode(email);
    showAlert('Código reenviado. Revisa tu correo.', 'success');
    inputs.forEach(i => { i.value = ''; i.classList.remove('filled', 'error'); });
    inputs[0].focus();
    checkComplete();
    startResendTimer(60);
  } catch (err) {
    showAlert(err.message || 'No se pudo reenviar el código.');
    resendBtn.disabled = false;
  }
});
