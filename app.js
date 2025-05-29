class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.deferredPrompt = null;
        
        this.initializePlayer();
        this.loadPlaylist();
        this.setupInstallPrompt();
        this.setupMediaSession();
        this.setupWakeLock();
    }

    async loadPlaylist() {
        try {
            const response = await fetch('music/playlist.json');
            if (!response.ok) throw new Error('Failed to load playlist');
            
            this.playlist = await response.json();
            this.renderPlaylist();
            this.hideLoading();
            
            // Auto-load first song
            if (this.playlist.length > 0) {
                this.loadSong(0);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.showError('Failed to load playlist. Check your internet connection.');
        }
    }

    renderPlaylist() {
        const playlistEl = document.getElementById('playlist');
        if (!playlistEl) return;

        playlistEl.innerHTML = this.playlist.map((song, index) => `
            <div class="song-item" data-index="${index}">
                <div class="song-info">
                    <h4>${this.escapeHtml(song.title)}</h4>
                    <p>${this.escapeHtml(song.artist)}</p>
                </div>
                <div class="song-duration">${song.duration || ''}</div>
            </div>
        `).join('');

        // Add click listeners
        playlistEl.addEventListener('click', (e) => {
            const songItem = e.target.closest('.song-item');
            if (songItem) {
                const index = parseInt(songItem.dataset.index);
                this.playSong(index);
            }
        });
    }

    initializePlayer() {
        // Button event listeners
        this.addEventListeners();
        
        // Audio event listeners
        this.audio.addEventListener('loadstart', () => this.showLoading());
        this.audio.addEventListener('canplay', () => this.hideLoading());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        this.audio.addEventListener('play', () => this.updatePlayState(true));
        this.audio.addEventListener('pause', () => this.updatePlayState(false));

        // Set initial volume
        this.audio.volume = 0.5;
    }

    addEventListeners() {
        const elements = {
            playBtn: () => this.togglePlay(),
            prevBtn: () => this.previousSong(),
            nextBtn: () => this.nextSong(),
            shuffleBtn: () => this.toggleShuffle(),
            repeatBtn: () => this.toggleRepeat()
        };

        Object.entries(elements).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        });

        // Progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekTo(e));
        }

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
    }

    loadSong(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentIndex = index;
            const song = this.playlist[index];
            
            this.audio.src = song.url;
            this.updateCurrentSongDisplay(song);
            this.updatePlaylistView();
            this.updateMediaSession();
        }
    }

    playSong(index) {
        this.loadSong(index);
        this.play();
    }

    async play() {
        try {
            await this.audio.play();
            this.requestWakeLock();
        } catch (error) {
            console.error('Playback failed:', error);
            this.showError('Playback failed. Try again.');
        }
    }

    pause() {
        this.audio.pause();
        this.releaseWakeLock();
    }

    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.audio.paused) {
            if (!this.audio.src && this.playlist.length > 0) {
                this.playSong(0);
            } else {
                this.play();
            }
        } else {
            this.pause();
        }
    }

    previousSong() {
        if (this.playlist.length === 0) return;

        let newIndex;
        if (this.isShuffled) {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            newIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.playlist.length - 1;
        }
        this.playSong(newIndex);
    }

    nextSong() {
        if (this.playlist.length === 0) return;

        let newIndex;
        if (this.isShuffled) {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            newIndex = this.currentIndex < this.playlist.length - 1 ? this.currentIndex + 1 : 0;
        }
        this.playSong(newIndex);
    }

    handleSongEnd() {
        switch (this.repeatMode) {
            case 'one':
                this.audio.currentTime = 0;
                this.play();
                break;
            case 'all':
                this.nextSong();
                break;
            default:
                if (this.currentIndex < this.playlist.length - 1) {
                    this.nextSong();
                } else {
                    this.updatePlayState(false);
                }
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffled);
        }
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        const repeatBtn = document.getElementById('repeatBtn');
        if (repeatBtn) {
            repeatBtn.className = `control-btn repeat-${this.repeatMode}`;
            repeatBtn.title = `Repeat: ${this.repeatMode}`;
        }
    }

    seekTo(e) {
        if (!this.audio.duration) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    setVolume(value) {
        const volume = value / 100;
        this.audio.volume = volume;
        
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) volumeValue.textContent = value + '%';
        
        // Save volume preference
        localStorage.setItem('musicPlayerVolume', value);
    }

    updateProgress() {
        if (!this.audio.duration) return;

        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        const progressEl = document.getElementById('progress');
        const currentTimeEl = document.getElementById('currentTime');
        
        if (progressEl) progressEl.style.width = percent + '%';
        if (currentTimeEl) currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        const totalTimeEl = document.getElementById('totalTime');
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateCurrentSongDisplay(song) {
        const titleEl = document.getElementById('currentTitle');
        const artistEl = document.getElementById('currentArtist');
        
        if (titleEl) titleEl.textContent = song.title;
        if (artistEl) artistEl.textContent = song.artist;
    }

    updatePlayState(isPlaying) {
        this.isPlaying = isPlaying;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.innerHTML = isPlaying ? '⏸️' : '▶️';
        }
    }

    updatePlaylistView() {
        document.querySelectorAll('.song-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentIndex);
        });
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds === null) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');
    }

    showError(message) {
        console.error(message);
        // You can implement a toast notification here
    }

    handleAudioError(e) {
        console.error('Audio error:', e);
        this.showError('Failed to load audio file');
    }

    // PWA Installation
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) installPrompt.classList.remove('hidden');
        });

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const result = await this.deferredPrompt.userChoice;
                    this.deferredPrompt = null;
                    
                    const installPrompt = document.getElementById('installPrompt');
                    if (installPrompt) installPrompt.classList.add('hidden');
                }
            });
        }
    }

    // Media Session API for background controls
    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.previousSong());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextSong());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                this.audio.currentTime = details.seekTime;
            });
        }
    }

    updateMediaSession() {
        if ('mediaSession' in navigator && this.currentIndex < this.playlist.length) {
            const song = this.playlist[this.currentIndex];
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: 'My Music Collection',
                artwork: [
                    { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
                    { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
                ]
            });
        }
    }

    // Wake Lock API to prevent screen sleep during playback
    async setupWakeLock() {
        if ('wakeLock' in navigator) {
            this.wakeLock = null;
        }
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.log('Wake lock failed:', err);
            }
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    // Save and restore app state
    saveState() {
        const state = {
            currentIndex: this.currentIndex,
            currentTime: this.audio.currentTime,
            volume: this.audio.volume,
            isShuffled: this.isShuffled,
            repeatMode: this.repeatMode
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    restoreState() {
        const savedState = localStorage.getItem('musicPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.currentIndex = state.currentIndex || 0;
            this.isShuffled = state.isShuffled || false;
            this.repeatMode = state.repeatMode || 'none';
            
            if (state.volume !== undefined) {
                this.audio.volume = state.volume;
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) volumeSlider.value = state.volume * 100;
            }
        }
    }
}

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

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}