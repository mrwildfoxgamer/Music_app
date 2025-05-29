/**
 * Enhanced Music Player with Shuffle and Repeat functionality
 * Features: Play/Pause, Next/Previous, Shuffle, Repeat modes, Volume control, PWA support
 */

class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'all', 'one'
        this.deferredPrompt = null;
        this.originalPlaylist = []; // Keep track of original order
        this.shuffledIndices = []; // Track shuffled order
        this.wakeLock = null;
        
        this.initializePlayer();
        this.loadPlaylist();
        this.setupInstallPrompt();
        this.setupMediaSession();
        this.setupWakeLock();
        this.restoreState();
    }

    /**
     * Load playlist from JSON file or API
     */
    async loadPlaylist() {
        try {
            // Option 1: Load from JSON file
            const response = await fetch('music/playlist.json');
            if (!response.ok) throw new Error('Failed to load playlist');
            this.playlist = await response.json();
            
            // Option 2: Sample data for testing (uncomment if no JSON file)
            /*
            this.playlist = [
                { title: "Sample Song 1", artist: "Artist 1", url: "path/to/song1.mp3", duration: "3:45" },
                { title: "Sample Song 2", artist: "Artist 2", url: "path/to/song2.mp3", duration: "4:12" },
                { title: "Sample Song 3", artist: "Artist 3", url: "path/to/song3.mp3", duration: "3:28" }
            ];
            */
            
            this.originalPlaylist = [...this.playlist];
            this.renderPlaylist();
            this.hideLoading();
            
            // Auto-load first song if playlist exists
            if (this.playlist.length > 0) {
                this.loadSong(0);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.showError('Failed to load playlist. Check your internet connection.');
        }
    }

    /**
     * Render playlist in the UI
     */
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

        // Add click listeners for playlist items
        playlistEl.addEventListener('click', (e) => {
            const songItem = e.target.closest('.song-item');
            if (songItem) {
                const index = parseInt(songItem.dataset.index);
                this.playSong(index);
            }
        });

        // Show playlist
        playlistEl.classList.remove('hidden');
    }

    /**
     * Initialize all player controls and event listeners
     */
    initializePlayer() {
        this.addEventListeners();
        this.setupAudioEventListeners();
        this.setInitialVolume();
    }

    /**
     * Add event listeners for all control buttons
     */
    addEventListeners() {
        const controls = {
            playBtn: () => this.togglePlay(),
            prevBtn: () => this.previousSong(),
            nextBtn: () => this.nextSong(),
            shuffleBtn: () => this.toggleShuffle(),
            repeatBtn: () => this.toggleRepeat()
        };

        // Add button event listeners
        Object.entries(controls).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });

        // Progress bar click to seek
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekTo(e));
        }

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Setup audio element event listeners
     */
    setupAudioEventListeners() {
        if (!this.audio) return;

        const audioEvents = {
            'loadstart': () => this.showLoading(),
            'canplay': () => this.hideLoading(),
            'timeupdate': () => this.updateProgress(),
            'ended': () => this.handleSongEnd(),
            'loadedmetadata': () => this.updateDuration(),
            'error': (e) => this.handleAudioError(e),
            'play': () => this.updatePlayState(true),
            'pause': () => this.updatePlayState(false)
        };

        Object.entries(audioEvents).forEach(([event, handler]) => {
            this.audio.addEventListener(event, handler);
        });
    }

    /**
     * Set initial volume from saved preference or default
     */
    setInitialVolume() {
        const savedVolume = localStorage.getItem('musicPlayerVolume');
        const volume = savedVolume ? parseInt(savedVolume) : 50;
        this.setVolume(volume);
    }

    /**
     * Load a specific song by index
     */
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

    /**
     * Play a specific song by index
     */
    playSong(index) {
        this.loadSong(index);
        this.play();
    }

    /**
     * Start audio playback
     */
    async play() {
        try {
            await this.audio.play();
            this.requestWakeLock();
        } catch (error) {
            console.error('Playback failed:', error);
            this.showError('Playback failed. Try again.');
        }
    }

    /**
     * Pause audio playback
     */
    pause() {
        this.audio.pause();
        this.releaseWakeLock();
    }

    /**
     * Toggle between play and pause
     */
    togglePlay() {
        if (this.playlist.length === 0) return;