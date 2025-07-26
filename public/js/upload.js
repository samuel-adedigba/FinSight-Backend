const form = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const resultDiv = document.getElementById('result');

const token = localStorage.getItem('token');
if (!token) {
  alert('Please log in');
  window.close();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('🟢 Form submitted');

  resultDiv.textContent = 'Uploading...';

  const file = fileInput.files[0];
  if (!file) {
    console.error('❌ No file selected');
    resultDiv.textContent = 'Please select a file to upload.';
    return;
  }

  console.log('📂 Selected file:', file);

  const formData = new FormData();
  formData.append('statement', file);

  console.log('🗂️ FormData prepared:');
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }

  try {
    console.log('🚀 Sending fetch request to /statements/upload');
    const res = await fetch('/statements/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Authorization': 'Bearer ' + token }
    });

    console.log('✅ Fetch response received:', res);

    const contentType = res.headers.get('content-type');
    console.log('ℹ️ Response Content-Type:', contentType);

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    console.log('📨 Parsed response body:', data);

    if (res.ok) {
      resultDiv.textContent = `✅ Success: ${JSON.stringify(data)}`;
    } else {
      console.error('❌ Server returned error status:', res.status);
      resultDiv.textContent = `❌ Error: ${data.error || data.message || res.statusText}`;
    }
  } catch (err) {
    console.error('❌ Network error occurred:', err);
    resultDiv.textContent = `❌ Network error: ${err.message}`;
  }
});
