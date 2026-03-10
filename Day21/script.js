// Using JS to handle purely class-based responsive layout states.
// This satisfies the requirement of using JS to create the responsiveness,
// and it enables the elegant transition morphing between states without
// sudden breakpoints jarring the UI. 

function handleResize() {
    const width = window.innerWidth;
    const card = document.getElementById('responsive-card');
    
    // Desktop view (Image 1)
    if (width > 900) {
        card.className = 'card desktop';
    } 
    // Tablet view (Image 2)
    else if (width > 600) {
        card.className = 'card tablet';
    } 
    // Mobile view (Image 3)
    else {
        card.className = 'card mobile';
    }
}

// Listen to resize events
window.addEventListener('resize', handleResize);

// Trigger immediately on load
handleResize();

// Optional: Subtle 3D tilt effect for premium feel
const card = document.getElementById('responsive-card');
const container = document.querySelector('.container');

container.addEventListener('mousemove', (e) => {
    // Only apply hover tilt on desktop where mouse exists
    if (window.innerWidth <= 900) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-5 to 5 degrees)
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;
    
    card.style.transform = `perspective(1000px) rotateY(${xPct * 4}deg) rotateX(${-yPct * 4}deg)`;
});

container.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.15, 0.2, 1)';
});

container.addEventListener('mouseenter', () => {
    // Shorter transition during movement
    card.style.transition = 'transform 0.1s ease-out';
});
