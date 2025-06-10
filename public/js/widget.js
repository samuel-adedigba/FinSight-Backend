document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const errDiv = document.getElementById('error');
  errDiv.textContent = '';

  const form = e.target;
  const body = {
    email: form.email.value,
    password: form.password.value
  };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || json.message || 'Login failed');
    }

    // Expecting { token, userId }
    const { token, user } = json;
    const userId = user.id;
    const name = user.name
    localStorage.setItem('token', token);
    localStorage.setItem('userId', String(userId));

localStorage.setItem('name', name);


    window.location = '/verify';
  } catch (err) {
    errDiv.textContent = err.message;
  }
});
