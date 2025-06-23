
// Initialize the music player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
    
    // Save state before page unload
    window.addEventListener('beforeunload', () => {
        if (window.musicPlayer) {
            window.musicPlayer.saveState();
        }
    });
});