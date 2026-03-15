const cartBtn = document.getElementById('cartBtn');
const btnText = document.getElementById('btnText');
let isAdded = false;

cartBtn.addEventListener('click', () => {
  if (cartBtn.classList.contains('animating')) return;

  /* ── Reset if already added ─────────────── */
  if (isAdded) {
    cartBtn.classList.remove('phase-done');
    btnText.style.clipPath = '';
    btnText.style.opacity = '';
    btnText.textContent = 'Add to Cart';
    isAdded = false;
    return;
  }

  /* ── Measure button width for the cart slide distance ── */
  const btnWidth = cartBtn.offsetWidth;
  cartBtn.style.setProperty('--btn-width', btnWidth + 'px');

  cartBtn.classList.add('animating');

  /* Phase 1: Item drops into cart (0 → 500ms) */
  cartBtn.classList.add('phase-drop');

  /* Phase 2: Cart slides right wiping text (500ms → 1100ms) */
  setTimeout(() => {
    cartBtn.classList.remove('phase-drop');
    cartBtn.classList.add('phase-wipe');
  }, 500);

  /* Phase 3: Show success state (1100ms) */
  setTimeout(() => {
    cartBtn.classList.remove('phase-wipe');
    cartBtn.classList.add('phase-done');
    cartBtn.classList.remove('animating');
    isAdded = true;

    /* Auto-reset back to "Add to Cart" after 3 seconds */
    setTimeout(() => {
      cartBtn.classList.remove('phase-done');
      btnText.style.clipPath = '';
      btnText.style.opacity = '';
      btnText.textContent = 'Add to Cart';
      isAdded = false;
    }, 1500);
  }, 1150);
});
