// 3D Card Tilt Effect
document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.card');

    if (!card) return;

    // Configuration
    const maxTilt = 15; // Maximum tilt angle in degrees
    const maxScale = 1.05; // Maximum scale on hover

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();

        // Get mouse position relative to card center
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;

        // Calculate mouse position from center (-1 to 1)
        const mouseX = (e.clientX - cardCenterX) / (rect.width / 2);
        const mouseY = (e.clientY - cardCenterY) / (rect.height / 2);

        // Calculate tilt angles
        // When mouse is on right edge (mouseX = 1), rotate around Y axis positively
        // When mouse is on bottom edge (mouseY = 1), rotate around X axis negatively
        const rotateX = mouseX * maxTilt;
        const rotateY = -mouseY * maxTilt;

        // Apply transform with scale and rotation
        card.style.transform = `scale(${maxScale}) rotateX(${rotateY}deg) rotateY(${rotateX}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        // Reset to initial state
        card.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)';
    });
});
