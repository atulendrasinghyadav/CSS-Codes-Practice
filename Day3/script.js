document.addEventListener('DOMContentLoaded', () => {
    const scrollContainer = document.querySelector('.scroll-container');
    const leftBtn = document.querySelector('.scroll-indicator.left');
    const rightBtn = document.querySelector('.scroll-indicator.right');
    const scrollItems = document.querySelectorAll('.scroll-item');

    // Helper function to reset and control animation
    const setAnimationTime = (percent) => {
        // Remove animation to reset it
        scrollContainer.style.animation = 'none';

        // Trigger reflow/repaint
        void scrollContainer.offsetWidth; // This forces the browser to apply the 'none' change

        // Calculate delay based on percentage (negative delay fast-forwards)
        // Total duration is 30s as defined in CSS
        const totalDuration = 30;
        const delay = -(totalDuration * percent);

        // Re-apply animation with calculated delay
        // We need to match the CSS animation definition: scroll 30s linear infinite
        scrollContainer.style.animation = `scroll ${totalDuration}s linear infinite`;
        scrollContainer.style.animationDelay = `${delay}s`;
    };

    // Pause animation on hover over any scroll item
    scrollItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            scrollContainer.style.animationPlayState = 'paused';
        });

        item.addEventListener('mouseleave', () => {
            scrollContainer.style.animationPlayState = 'running';
        });
    });

    leftBtn.addEventListener('click', () => {
        // Start animation from the beginning (0%)
        // This effectively shows the first image
        setAnimationTime(0);
    });

    rightBtn.addEventListener('click', () => {
        // Jump to the last image
        // Since there are 5 images effectively in one cycle (before duplicate)
        // The last image (5th) is roughly at the 80% mark of the scroll
        // (4/5 = 0.8)
        setAnimationTime(0.3);
    });
});
