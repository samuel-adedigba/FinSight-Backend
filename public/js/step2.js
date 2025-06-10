document.addEventListener('DOMContentLoaded', () => {
  // Dev fallback
  (function() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('token')) localStorage.setItem('token', p.get('token'));
  })();

  let token = localStorage.getItem('token') ||
              prompt('Paste your JWT token:');
  if (token) localStorage.setItem('token', token);
  if (!token) {
    alert('Please log in first.');
    return window.close();
  }

  // Back button
  document.querySelector('.back').addEventListener('click', () =>
    window.location.href = '/sync/step1'
  );

  // Spinner setup
  const spinner = document.createElement('div');
  spinner.className = 'spinner hidden';
  document.body.appendChild(spinner);

  const msgEl     = document.getElementById('message');
  const container = document.getElementById('accounts');
  const form      = document.getElementById('step2Form');
  const userId    = localStorage.getItem('userId');

  async function loadAccounts() {
    try {
      spinner.classList.remove('hidden'); // Show spinner
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate load

      const res = await fetch(`/account`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Failed to load accounts');

      const data = await res.json();
      const accounts = data.bank_account?.accounts;
      if (!Array.isArray(accounts)) throw new Error('Invalid server response');

      container.innerHTML = '';
      accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'account';
        div.innerHTML = `
          <label>
            <input
              type="checkbox"
              name="active"
              value="${acc.id}"
              ${acc.isActive ? 'checked' : ''}
            />
            ${acc.bankName} — ${acc.accountNumber} (${acc.currency} ${acc.balance.toLocaleString()})
          </label>`;
        container.append(div);
      });
    } catch (err) {
      console.error('step2 load error', err);
      msgEl.textContent = err.message;
    } finally {
      spinner.classList.add('hidden'); // Hide spinner
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msgEl.textContent = '';
    const selected = Array.from(
      document.querySelectorAll('input[name="active"]:checked')
    ).map(cb => Number(cb.value));

    spinner.classList.remove('hidden'); // Show spinner during submit

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate wait
      const res = await fetch('/account/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ accountIds: selected })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Save failed');
      }
      window.location.href = '/sync/step3';
    } catch (err) {
      console.error('step2 save error', err);
      msgEl.textContent = err.message;
    } finally {
      spinner.classList.add('hidden'); // Hide spinner
    }
  });

  loadAccounts();
});
