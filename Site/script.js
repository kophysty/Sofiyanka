document.addEventListener('DOMContentLoaded', () => {

    const setupModal = (modalId, openBtnId) => {
        const modal = document.getElementById(modalId);
        const openBtn = document.getElementById(openBtnId);
        const closeBtn = modal.querySelector('.close-button');

        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('show');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target == modal) {
                modal.classList.remove('show');
            }
        });
    };

    setupModal('about-modal', 'open-about-modal');
    setupModal('attractions-modal', 'open-attractions-modal');

}); 