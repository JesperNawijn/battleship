document.addEventListener('DOMContentLoaded', () => {
    const dom = new DOMController();
    const audio = new AudioController();

    // Auto-init audio context on first user click to satisfy browser policies
    document.body.addEventListener('click', () => {
        audio.init();
    }, { once: true });

    const game = new GameController(dom, audio);
    game.init();
});
