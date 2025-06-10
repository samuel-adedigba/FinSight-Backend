// Create Confetti Animation
function createConfetti() {
  const colors = ['#ff0', '#f00', '#0f0', '#00f', '#ff69b4', '#ffa500'];
  const confettiContainer = document.querySelector('.confetti');

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('span');
    confetti.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    confettiContainer.appendChild(confetti);
  }
}

document.addEventListener('DOMContentLoaded', createConfetti);

document.querySelector('.add').addEventListener('click', () => {
  window.location.href = '/sync/step2'; // or the appropriate add account page
});

document.querySelector('.done').addEventListener('click', () => {
  window.location.href = '/dashboard'; // or wherever "Done" should take them
});
