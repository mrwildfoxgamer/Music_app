class EnhancedMusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = 0;
        this.currentFormat = 'mp3'; // Default format
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none';
        this.deferredPrompt = null;
        this.shuffledOrder = [];
        this.installPromptDismissed = false;
        this.preloadCache = new Map();
        this.preloadLimit = 5;
        this.preloadInProgress = false;
        
        // Setup new format buttons
        this.setupFormatToggle();
        
        this.initializePlayer();
        
        // Default: Load MP3 playlist but keep it hidden (as per HTML structure)
        this.loadPlaylist('mp3', false);
        
        this.setupInstallPrompt();
        this.setupMediaSession();
        this.checkInstallStatus();
    }

    setupFormatToggle() {
        const mp3Btn = document.getElementById('mp3Btn');
        const flacBtn = document.getElementById('flacBtn');
        const playlistEl = document.getElementById('playlist');

        if (mp3Btn) {
            mp3Btn.addEventListener('click', () => {
                if (this.currentFormat !== 'mp3') {
                    // Switch to MP3
                    this.switchFormat('mp3');
                    // Show playlist if not already shown (user asked to show list on press)
                    this.showPlaylist(true);
                } else {
                    // Already MP3: Toggle visibility
                    this.togglePlaylistVisibility();
                }
            });
        }

        if (flacBtn) {
            flacBtn.addEventListener('click', () => {
                if (this.currentFormat !== 'flac') {
                    // Switch to FLAC
                    this.switchFormat('flac');
                    // Show playlist and Play
                    this.showPlaylist(true);
                    // "Starts to play flac music" -> Attempt autoplay after switch
                    this.autoPlayFirstSong = true; 
                } else {
                     // Already FLAC: Toggle visibility
                    this.togglePlaylistVisibility();
                }
            });
        }
    }

    togglePlaylistVisibility() {
        const playlistEl = document.getElementById('playlist');
        const isHidden = playlistEl.classList.contains('hidden') || playlistEl.style.display === 'none';
        
        if (isHidden) {
            this.showPlaylist(true);
        } else {
            this.showPlaylist(false);
        }
    }

    showPlaylist(show) {
        const playlistEl = document.getElementById('playlist');
        if (show) {
            playlistEl.classList.remove('hidden');
            playlistEl.style.display = 'block';
        } else {
            playlistEl.classList.add('hidden');
            playlistEl.style.display = 'none';
        }
    }

    async switchFormat(format) {
        this.currentFormat = format;
        
        // Update UI buttons
        document.getElementById('mp3Btn').classList.toggle('active', format === 'mp3');
        document.getElementById('flacBtn').classList.toggle('active', format === 'flac');

        // Reset Player State
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.currentIndex = 0;
        this.updatePlayState(false);
        this.preloadCache.clear();
        
        // Show loading
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('playlist').innerHTML = '';
        
        // Load new playlist
        await this.loadPlaylist(format, true);
    }

    async loadPlaylist(format, isSwitching = false) {
        try {
            // Select file based on format
            const playlistFile = format === 'flac' ? 'music/playlist-flac.json' : 'music/playlist.json';
            
            console.log(`Loading ${format} playlist from ${playlistFile}`);

            const response = await fetch(playlistFile);
            if (response.ok) {
                this.playlist = await response.json();
            } else {
                throw new Error(`${format.toUpperCase()} Playlist not found`);
            }

            this.createShuffledOrder();
            this.renderPlaylist();
            
            // Auto-load first song metadata
            if (this.playlist.length > 0) {
                // If we are switching formats and autoplay was requested (e.g. for FLAC)
                if (this.autoPlayFirstSong && isSwitching) {
                    await this.playSong(0);
                    this.autoPlayFirstSong = false; // reset flag
                } else {
                    // Just load metadata
                    this.audio.src = this.playlist[0].url;
                    this.updateTitleUI(this.playlist[0]);
                }
            }

            document.getElementById('loading').classList.add('hidden');
        } catch (error) {
            console.error('Error loading playlist:', error);
            document.getElementById('loading').textContent = `No ${format.toUpperCase()} songs found`;
        }
    }

    updateTitleUI(song) {
        const titleEl = document.getElementById('currentTitle');
        const artistEl = document.getElementById('currentArtist');
        if (titleEl) titleEl.textContent = song.title;
        if (artistEl) artistEl.textContent = song.artist;
    }

    // --- Standard Methods Below ---

    checkInstallStatus() {
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            return;
        }
        const dismissed = localStorage.getItem('installPromptDismissed');
        if (dismissed) this.installPromptDismissed = true;
        if (!this.installPromptDismissed) {
            setTimeout(() => this.showInstallPromptFallback(), 3000);
        }
    }

    showInstallPromptFallback() {
        if (!this.deferredPrompt && !this.installPromptDismissed) {
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) installPrompt.classList.remove('hidden');
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (!this.installPromptDismissed) {
                const installPrompt = document.getElementById('installPrompt');
                if (installPrompt) installPrompt.classList.remove('hidden');
            }
        });

        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const result = await this.deferredPrompt.userChoice;
                    this.deferredPrompt = null;
                    this.hideInstallPrompt();
                } else {
                    this.showManualInstallInstructions();
                }
            });
        }

        const dismissBtn = document.getElementById('dismissBtn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.installPromptDismissed = true;
                localStorage.setItem('installPromptDismissed', 'true');
                this.hideInstallPrompt();
            });
        }
    }

    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) installPrompt.classList.add('hidden');
    }

    showManualInstallInstructions() {
        alert('To install: Tap the share button or menu icon and select "Add to Home Screen" or "Install App".');
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
                    <h4>${this.escapeHtml(song.title)}</h4>
                    <p>${this.escapeHtml(song.artist)}</p>
                </div>
                <div class="song-format" style="font-size:0.7em; color: #666;">
                    ${this.currentFormat.toUpperCase()}
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
        
        this.updatePlaylistView();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || 'Unknown';
        return div.innerHTML;
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
                if (!this.audio.duration) return;
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.audio.volume = e.target.value / 100;
                const volumeValue = document.getElementById('volumeValue');
                if (volumeValue) volumeValue.textContent = e.target.value + '%';
            });
        }

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('play', () => this.updatePlayState(true));
        this.audio.addEventListener('pause', () => this.updatePlayState(false));
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
            this.preloadCache.clear();
            this.preloadUpcomingSongs();
        }
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        const repeatBtn = document.getElementById('repeatBtn');
        if (repeatBtn) {
            repeatBtn.classList.remove('repeat-none', 'repeat-all', 'repeat-one');
            repeatBtn.classList.add(`repeat-${this.repeatMode}`);
            
            switch(this.repeatMode) {
                case 'all':
                    repeatBtn.classList.add('active');
                    repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
                    break;
                case 'one':
                    repeatBtn.classList.add('active');
                    repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
                    break;
                default:
                    repeatBtn.classList.remove('active');
                    repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
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
                    this.updatePlayState(false);
                }
        }
        this.preloadUpcomingSongs();
    }

    async playSong(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentIndex = index;
            const song = this.playlist[index];
            
            if (this.preloadCache.has(index)) {
                const preloadedAudio = this.preloadCache.get(index);
                this.audio.src = preloadedAudio.src;
                await this.audio.load();
                this.preloadCache.delete(index);
            } else {
                this.audio.src = song.url;
                await this.audio.load();
            }
            
            this.updateTitleUI(song);
            this.updatePlaylistView();
            
            try {
                await this.audio.play();
            } catch(e) {
                console.log("Autoplay prevented or interrupted");
            }
            
            this.updateMediaSession();
            this.preloadUpcomingSongs();
        }
    }

    async togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.audio.paused) {
            if (!this.audio.src && this.playlist.length > 0) {
                await this.playSong(this.currentIndex);
            } else {
                await this.audio.play();
            }
            this.preloadUpcomingSongs();
        } else {
            this.audio.pause();
        }
    }

    previousSong() {
        if (this.playlist.length === 0) return;
        this.playSong(this.getPreviousIndex());
    }

    nextSong() {
        if (this.playlist.length === 0) return;
        this.playSong(this.getNextIndex());
    }

    updatePlayState(isPlaying) {
        this.isPlaying = isPlaying;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
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
        if (totalTimeEl && this.audio.duration) {
            totalTimeEl.textContent = this.formatTime(this.audio.duration);
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
                album: `My ${this.currentFormat.toUpperCase()} Collection`,
                artwork: [{ src: 'Icons/512.png', sizes: '512x512', type: 'image/png' }]
            });
        }
    }

    async preloadUpcomingSongs() {
        if (this.preloadInProgress || !this.playlist.length) return;
        this.preloadInProgress = true;
        try {
            let nextIndices = [];
            let currentPos = this.currentIndex;
            for (let i = 0; i < this.preloadLimit; i++) {
                if (this.isShuffled) {
                    const currentShuffledPos = this.shuffledOrder.indexOf(currentPos);
                    const nextShuffledPos = (currentShuffledPos + 1) % this.shuffledOrder.length;
                    currentPos = this.shuffledOrder[nextShuffledPos];
                } else {
                    currentPos = (currentPos + 1) % this.playlist.length;
                }
                nextIndices.push(currentPos);
            }
            for (let [index, audio] of this.preloadCache.entries()) {
                if (!nextIndices.includes(index) && index !== this.currentIndex) {
                    audio.src = '';
                    this.preloadCache.delete(index);
                }
            }
            for (let index of nextIndices) {
                if (!this.preloadCache.has(index)) {
                    const song = this.playlist[index];
                    const audio = new Audio();
                    audio.preload = 'auto';
                    const loadPromise = new Promise((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(e), { once: true });
                    });
                    audio.src = song.url;
                    this.preloadCache.set(index, audio);
                    await loadPromise;
                }
            }
        } catch (error) {
            console.error('Error preloading songs:', error);
        } finally {
            this.preloadInProgress = false;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new EnhancedMusicPlayer();
});

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => console.log('SW registered successfully'))
            .catch((err) => console.log('SW registration failed', err));
    });
}
