/**
 * Enhanced Music Player with Shuffle and Repeat functionality
 * Replace the existing MusicPlayer class in your HTML with this version
 */

class EnhancedMusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'all', 'one'
        this.deferredPrompt = null;
        this.shuffledOrder = [];
        
        this.initializePlayer();
        this.loadPlaylist();
        this.setupInstallPrompt();
        this.setupMediaSession();
    }

    async loadPlaylist() {
        try {
            const response = await fetch('music/playlist.json');
            this.playlist = await response.json();
            this.createShuffledOrder();
            this.renderPlaylist();
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('playlist').classList.remove('hidden');
        } catch (error) {
            console.error('Error loading playlist:', error);
            document.getElementById('loading').textContent = 'Error loading playlist';
        }
    }

    createShuffledOrder() {
        this.shuffledOrder = [...Array(this.playlist.length).keys()];
        for (let i = this.shuffledOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledOrder[i], this.shuffledOrder[j]] = [this.shuffledOrder[j], this.shuffledOrder[i]];
        }
    }

    renderPlaylist() {
        const playlistEl = document.getElementById('playlist');
        playlistEl.innerHTML = this.playlist.map((song, index) => `
            <div class="song-item" data-index="${index}">
                <div class="song-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
            </div>
        `).join('');

        playlistEl.addEventListener('click', (e) => {
            const songItem = e.target.closest('.song-item');
            if (songItem) {
                const index = parseInt(songItem.dataset.index);
                this.playSong(index);
            }
        });
    }

    initializePlayer() {
        const playBtn = document.getElementById('playBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const shuffleBtn = document.getElementById('shuffleBtn');
        const repeatBtn = document.getElementById('repeatBtn');
        const progressBar = document.getElementById('progressBar');
        const volumeSlider = document.getElementById('volumeSlider');

        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousSong());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSong());
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        if (repeatBtn) repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.audio.volume = volume;
                document.getElementById('volumeValue').textContent = e.target.value + '%';
            });
        }

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffleBtn');
        
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffled);
            shuffleBtn.title = this.isShuffled ? 'Shuffle: On' : 'Shuffle: Off';
        }
        
        if (this.isShuffled) {
            this.createShuffledOrder();
        }
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        const repeatBtn = document.getElementById('repeatBtn');
        if (repeatBtn) {
            // Remove all repeat classes
            repeatBtn.classList.remove('repeat-none', 'repeat-all', 'repeat-one');
            // Add current mode class
            repeatBtn.classList.add(`repeat-${this.repeatMode}`);
            repeatBtn.title = `Repeat: ${this.repeatMode}`;
            
            // Update button appearance
            switch(this.repeatMode) {
                case 'all':
                    repeatBtn.style.background = '#1DB954';
                    break;
                case 'one':
                    repeatBtn.style.background = '#ff6b35';
                    repeatBtn.innerHTML = '🔂';
                    break;
                default:
                    repeatBtn.style.background = 'rgba(255, 255, 255, 0.2)';
                    repeatBtn.innerHTML = '🔁';
            }
        }
    }

    getNextIndex() {
        if (this.isShuffled) {
            const currentShuffledPos = this.shuffledOrder.indexOf(this.currentIndex);
            const nextShuffledPos = (currentShuffledPos + 1) % this.shuffledOrder.length;
            return this.shuffledOrder[nextShuffledPos];
        } else {
            return this.currentIndex < this.playlist.length - 1 ? this.currentIndex + 1 : 0;
        }
    }

    getPreviousIndex() {
        if (this.isShuffled) {
            const currentShuffledPos = this.shuffledOrder.indexOf(this.currentIndex);
            const prevShuffledPos = currentShuffledPos > 0 ? currentShuffledPos - 1 : this.shuffledOrder.length - 1;
            return this.shuffledOrder[prevShuffledPos];
        } else {
            return this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
        }
    }

    handleSongEnd() {
        switch (this.repeatMode) {
            case 'one':
                this.audio.currentTime = 0;
                this.audio.play();
                break;
            case 'all':
                this.nextSong();
                break;
            default:
                if (this.isShuffled || this.currentIndex < this.playlist.length - 1) {
                    this.nextSong();
                } else {
                    this.updatePlayButton();
                }
        }
    }

    playSong(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentIndex = index;
            const song = this.playlist[index];
            
            this.audio.src = song.url;
            document.getElementById('currentTitle').textContent = song.title;
            document.getElementById('currentArtist').textContent = song.artist;
            
            this.updatePlaylistView();
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateMediaSession();
        }
    }

    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.audio.paused) {
            if (!this.audio.src) {
                this.playSong(0);
            } else {
                this.audio.play();
            }
            this.isPlaying = true;
        } else {
            this.audio.pause();
            this.isPlaying = false;
        }
        this.updatePlayButton();
    }

    previousSong() {
        if (this.playlist.length === 0) return;
        const newIndex = this.getPreviousIndex();
        this.playSong(newIndex);
    }

    nextSong() {
        if (this.playlist.length === 0) return;
        const newIndex = this.getNextIndex();
        this.playSong(newIndex);
    }

    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸' : '▶';
        }
    }

    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('progress').style.width = percent + '%';
            document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        const totalTime = document.getElementById('totalTime');
        if (totalTime) {
            totalTime.textContent = this.formatTime(this.audio.duration);
        }
    }

    updatePlaylistView() {
        document.querySelectorAll('.song-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentIndex);
        });
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt triggered');
            e.preventDefault();
            this.deferredPrompt = e;
            
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.remove('hidden');
            }
        });

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const result = await this.deferredPrompt.userChoice;
                    console.log('Install result:', result);
                    this.deferredPrompt = null;
                    
                    const installPrompt = document.getElementById('installPrompt');
                    if (installPrompt) {
                        installPrompt.classList.add('hidden');
                    }
                }
            });
        }

        // Check if already installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.add('hidden');
            }
        });
    }

    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.previousSong());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSong());
        }
    }

    updateMediaSession() {
        if ('mediaSession' in navigator && this.currentIndex < this.playlist.length) {
            const song = this.playlist[this.currentIndex];
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: 'My Music Collection'
            });
        }
    }
}

// Initialize enhanced music player
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new EnhancedMusicPlayer();
});

// Register service worker with correct path
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered successfully:', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed:', registrationError);
            });
    });
}