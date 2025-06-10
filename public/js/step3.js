// Ensure user is authenticated
const token = localStorage.getItem('token');
if (!token) {
  alert('Please log in');
  window.close();
}

// Show username from localStorage
const username = localStorage.getItem('name') || 'User';
document.getElementById('username').textContent = username;

// Spinner logic
const spinner = document.querySelector('.spinner');
function showSpinner() {
  spinner.classList.remove('hidden');
}
function hideSpinner() {
  spinner.classList.add('hidden');
}

// Load active accounts
async function loadActiveAccounts() {
  try {
    showSpinner();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s load
    const res = await fetch('/account/active', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Failed to fetch active accounts');
    const { active } = await res.json();
    const container = document.getElementById('accounts');
    container.innerHTML = '';

    if (active.length === 0) {
      container.textContent = 'No accounts activated.';
      return;
    }

    active.forEach(acc => {
      const div = document.createElement('div');
      div.className = 'account';
      div.textContent = `  ${acc.bankName} — ${acc.accountNumber} (${acc.currency} ${acc.balance.toLocaleString()})`;
      container.append(div);
    });
  } catch (err) {
    document.getElementById('accounts').textContent = err.message;
  } finally {
    hideSpinner();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadActiveAccounts();

  // Add event listeners for buttons
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = '/sync/step2';
  });

  document.getElementById('edit-btn').addEventListener('click', () => {
    window.location.href = '/sync/step2';
  });

  document.getElementById('continue-btn').addEventListener('click', () => {
    window.location.href = '/sync/step4';
  });
});
