 class EnhancedMusicPlayer {
            constructor() {
                this.audio = document.getElementById('audioPlayer');
                this.playlist = [];
                this.currentIndex = 0;
                this.isPlaying = false;
                this.isShuffled = false;
                this.repeatMode = 'none';
                this.deferredPrompt = null;
                this.shuffledOrder = [];
                this.installPromptDismissed = false;
                this.isFocusedView = true; // Start in focused view
                this.setupViewToggle();
                
                this.initializePlayer();
                this.loadPlaylist();
                this.setupInstallPrompt();
                this.setupMediaSession();
                this.checkInstallStatus();
            }

            checkInstallStatus() {
                // Check if app is already installed (standalone mode)
                if (window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true) {
                    console.log('App is running in standalone mode (installed)');
                    return;
                }

                // Check if user has dismissed the prompt before
                const dismissed = localStorage.getItem('installPromptDismissed');
                if (dismissed) {
                    this.installPromptDismissed = true;
                }

                // Show install prompt after a delay if not dismissed
                if (!this.installPromptDismissed) {
                    setTimeout(() => {
                        this.showInstallPromptFallback();
                    }, 3000);
                }
            }

            showInstallPromptFallback() {
                // Show install prompt even if beforeinstallprompt didn't fire
                if (!this.deferredPrompt && !this.installPromptDismissed) {
                    const installPrompt = document.getElementById('installPrompt');
                    if (installPrompt) {
                        installPrompt.classList.remove('hidden');
                    }
                }
            }

            setupInstallPrompt() {
                // Listen for the beforeinstallprompt event
                window.addEventListener('beforeinstallprompt', (e) => {
                    console.log('PWA install prompt triggered');
                    e.preventDefault();
                    this.deferredPrompt = e;
                    
                    if (!this.installPromptDismissed) {
                        const installPrompt = document.getElementById('installPrompt');
                        if (installPrompt) {
                            installPrompt.classList.remove('hidden');
                        }
                    }
                });

                // Install button click handler
                const installBtn = document.getElementById('installBtn');
                if (installBtn) {
                    installBtn.addEventListener('click', async () => {
                        if (this.deferredPrompt) {
                            // Use the browser's native install prompt
                            try {
                                this.deferredPrompt.prompt();
                                const result = await this.deferredPrompt.userChoice;
                                console.log('Install result:', result);
                                
                                if (result.outcome === 'accepted') {
                                    this.showInstallStatus('App installing...', 3000);
                                } else {
                                    this.showInstallStatus('Installation cancelled', 2000);
                                }
                                
                                this.deferredPrompt = null;
                                this.hideInstallPrompt();
                            } catch (error) {
                                console.error('Installation failed:', error);
                                this.showInstallStatus('Installation failed', 2000);
                            }
                        } else {
                            // Fallback: Show manual installation instructions
                            this.showManualInstallInstructions();
                        }
                    });
                }

                // Dismiss button click handler
                const dismissBtn = document.getElementById('dismissBtn');
                if (dismissBtn) {
                    dismissBtn.addEventListener('click', () => {
                        this.dismissInstallPrompt();
                    });
                }

                // Listen for successful installation
                window.addEventListener('appinstalled', () => {
                    console.log('PWA was installed successfully');
                    this.showInstallStatus('App installed successfully!', 3000);
                    this.hideInstallPrompt();
                });

                // Check for iOS devices and show appropriate message
                this.checkiOSInstallation();
            }

        
           checkiOSInstallation() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone;
    
    if (isIOS && !isInStandaloneMode) {
        setTimeout(() => {
            const installPrompt = document.getElementById('installPrompt');
            const installBtnText = document.querySelector('#installBtn');
            if (installPrompt && installBtnText && !this.installPromptDismissed) {
                installPrompt.querySelector('p').innerHTML = 
                    'Tap the share button <i class="fas fa-share"></i> and select "Add to Home Screen" to install this app!';
                installBtnText.innerHTML = '<i class="fas fa-info-circle"></i> Show Instructions';
                installPrompt.classList.remove('hidden');
            }
        }, 2000);
    }
}
            showManualInstallInstructions() {
                const userAgent = navigator.userAgent.toLowerCase();
                let instructions = '';

                if (userAgent.includes('chrome')) {
                    instructions = 'Click the menu (⋮) → "Install Music Player" or look for the install icon in the address bar.';
                } else if (userAgent.includes('firefox')) {
                    instructions = 'Look for the install icon in the address bar or refresh the page to try again.';
                } else if (userAgent.includes('safari')) {
                    instructions = 'Tap the Share button (↗️) → "Add to Home Screen" to install this app.';
                } else {
                    instructions = 'Look for an install option in your browser menu or refresh the page to try again.';
                }

                alert(`Manual Installation:\n\n${instructions}`);
            }

            dismissInstallPrompt() {
                this.installPromptDismissed = true;
                localStorage.setItem('installPromptDismissed', 'true');
                this.hideInstallPrompt();
                this.showInstallStatus('You can install this app anytime from your browser menu', 3000);
            }

            hideInstallPrompt() {
                const installPrompt = document.getElementById('installPrompt');
                if (installPrompt) {
                    installPrompt.classList.add('hidden');
                }
            }

            showInstallStatus(message, duration = 3000) {
                const statusEl = document.getElementById('installStatus');
                const textEl = document.getElementById('installStatusText');
                
                if (statusEl && textEl) {
                    textEl.textContent = message;
                    statusEl.classList.add('show');
                    
                    setTimeout(() => {
                        statusEl.classList.remove('show');
                    }, duration);
                }
            }

            async loadPlaylist() {
                try {
                    const samplePlaylist = [
                        {
                            title: "Sample Song 1",
                            artist: "Artist 1",
                            url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
                        },
                        {
                            title: "Sample Song 2", 
                            artist: "Artist 2",
                            url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
                        },
                        {
                            title: "Sample Song 3",
                            artist: "Artist 3", 
                            url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
                        }
                    ];

                    try {
                        const response = await fetch('music/playlist.json');
                        if (response.ok) {
                            this.playlist = await response.json();
                        } else {
                            throw new Error('Playlist not found');
                        }
                    } catch (error) {
                        console.log('Using sample playlist');
                        this.playlist = samplePlaylist;
                    }

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
                            <h4>${this.escapeHtml(song.title)}</h4>
                            <p>${this.escapeHtml(song.artist)}</p>
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

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
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
                        const volume = e.target.value / 100;
                        this.audio.volume = volume;
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
        repeatBtn.title = `Repeat: ${this.repeatMode}`;
        
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
            }

            playSong(index) {
                if (index >= 0 && index < this.playlist.length) {
                    this.currentIndex = index;
                    const song = this.playlist[index];
                    
                    this.audio.src = song.url;
                    const titleEl = document.getElementById('currentTitle');
                    const artistEl = document.getElementById('currentArtist');
                    
                    if (titleEl) titleEl.textContent = song.title;
                    if (artistEl) artistEl.textContent = song.artist;
                    
                    this.updatePlaylistView();
                    this.audio.play();
                    this.updateMediaSession();
                }
            }

            togglePlay() {
                if (this.playlist.length === 0) return;

                if (this.audio.paused) {
                    if (!this.audio.src && this.playlist.length > 0) {
                        this.playSong(0);
                    } else {
                        this.audio.play();
                    }
                } else {
                    this.audio.pause();
                }
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
                        album: 'My Music Collection'
                    });
                }
            }


            setupViewToggle() {
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', () => this.toggleView());
    }
}

toggleView() {
    this.isFocusedView = !this.isFocusedView;
    const playlist = document.getElementById('playlist');
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    
    if (this.isFocusedView) {
        // Show only current song (focused view)
        playlist.style.display = 'none';
        if (viewToggleBtn) {
            viewToggleBtn.innerHTML = '<i class="fas fa-list"></i>';
            viewToggleBtn.title = 'Show Playlist';
        }
    } else {
        // Show playlist
        playlist.style.display = 'block';
        playlist.classList.remove('hidden');
        if (viewToggleBtn) {
            viewToggleBtn.innerHTML = '<i class="fas fa-music"></i>';
            viewToggleBtn.title = 'Hide Playlist';
        }
    }
}



        }

        // Initialize enhanced music player
        document.addEventListener('DOMContentLoaded', () => {
            window.musicPlayer = new EnhancedMusicPlayer();
        });

        // Register service worker
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