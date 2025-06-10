(function() {
  console.log('[step1] bootstrapping…');
  const params = new URLSearchParams(window.location.search);
  const t = params.get('token');
  const u = params.get('userId');
  if (t) localStorage.setItem('token', t);
  if (u) localStorage.setItem('userId', u);
})();

const tokenKey  = 'token';
const userKey   = 'userId';
const messageEl = document.getElementById('message');
const form      = document.getElementById('step1Form');
const spinner   = document.createElement('div');
spinner.className = 'spinner hidden';
document.body.appendChild(spinner);

let token  = localStorage.getItem(tokenKey);
let userId = localStorage.getItem(userKey);

if (!token) token = prompt('Paste your JWT token:');
if (!userId) userId = prompt('Paste your userId:');
if (token)  localStorage.setItem(tokenKey, token);
if (userId) localStorage.setItem(userKey, userId);

if (!token || !userId) {
  messageEl.textContent = 'Authentication required.';
  form.querySelector('button').disabled = true;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  messageEl.textContent = '';
  console.log('[step1] submitting form…');

  const bvn = form.bvn.value.trim();
  const nin = form.nin.value.trim();

  // Show spinner and disable form
  spinner.classList.remove('hidden');
  form.querySelectorAll('input, button').forEach(el => el.disabled = true);

  // Simulate a 2-second wait
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    const res = await fetch('/api/auth/identity', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ bvn, nin })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Verification failed');
    }
    window.location.href = '/sync/step2';
  } catch (err) {
    messageEl.textContent = err.message;
  } finally {
    spinner.classList.add('hidden');
    form.querySelectorAll('input, button').forEach(el => el.disabled = false);
  }
});
