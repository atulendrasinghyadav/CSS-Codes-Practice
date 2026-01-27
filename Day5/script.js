// Select all nav items and the indicator
const navItems = document.querySelectorAll('.nav-item');
const indicator = document.querySelector('.indicator');

// Function to move the indicator
function moveIndicator(item) {
    // Get the position of the item relative to its parent
    const itemRect = item.getBoundingClientRect();
    const parentRect = item.parentElement.getBoundingClientRect();
    const offsetLeft = itemRect.left - parentRect.left;

    // Move the indicator
    indicator.style.left = `${offsetLeft}px`;
}

// Set initial position based on active item
const activeItem = document.querySelector('.nav-item.active');
if (activeItem) {
    // Small delay to ensure layout is ready
    setTimeout(() => moveIndicator(activeItem), 100);
}

// Add event listeners to each nav item
navItems.forEach(item => {
    // Hover: only add visual pop-up effect (no indicator movement)
    item.addEventListener('mouseenter', () => {
        item.classList.add('hovered');
    });

    item.addEventListener('mouseleave', () => {
        item.classList.remove('hovered');
    });

    // Click: move the indicator and set as active
    item.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class from all
        navItems.forEach(i => i.classList.remove('active'));
        // Add active to current
        item.classList.add('active');
        // Move the indicator
        moveIndicator(item);
    });
});
