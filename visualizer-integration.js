// Integration script for audio visualizer with existing music player
class VisualizerIntegration {
    constructor() {
        this.visualizer = null;
        this.isVisualizerEnabled = localStorage.getItem('visualizerEnabled') === 'true';
        this.init();
    }

    init() {
        // Wait for DOM and music player to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createVisualizerHTML();
        this.initializeVisualizer();
        this.setupControls();
        this.integrateWithMusicPlayer();
    }

    createVisualizerHTML() {
        // Find the player container
        const playerContainer = document.querySelector('.player');
        if (!playerContainer) {
            console.error('Player container not found');
            return;
        }

        // Create visualizer HTML
        const visualizerHTML = `
            <div class="visualizer-container ${this.isVisualizerEnabled ? '' : 'hidden'}" id="visualizerContainer">
                <canvas id="audioCanvas"></canvas>
                <div class="visualizer-controls">
                    <button class="visualizer-btn" id="visualizerSettings" title="Settings">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="visualizer-btn" id="visualizerFullscreen" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        `;

        // Insert visualizer after current song info
        const currentSong = playerContainer.querySelector('.current-song');
        if (currentSong) {
            currentSong.insertAdjacentHTML('afterend', visualizerHTML);
        }

        // Add toggle button
        this.addToggleButton(playerContainer);
    }

    addToggleButton(container) {
        const toggleHTML = `
            <button class="visualizer-toggle ${this.isVisualizerEnabled ? 'active' : ''}" id="visualizerToggle">
                <i class="fas fa-wave-square"></i> Visualizer
            </button>
        `;

        // Add toggle button near view toggle
        const viewToggle = container.querySelector('.view-toggle');
        if (viewToggle) {
            viewToggle.insertAdjacentHTML('beforebegin', toggleHTML);
        }
    }

    initializeVisualizer() {
        if (!this.isVisualizerEnabled) return;

        // Wait for audio element to be available
        const checkAudio = () => {
            const audioElement = document.getElementById('audioPlayer');
            if (audioElement && window.AudioVisualizer) {
                try {
                    this.visualizer = new AudioVisualizer('audioCanvas', audioElement);
                    this.setupVisualizerEvents();
                } catch (error) {
                    console.error('Failed to initialize visualizer:', error);
                }
            } else {
                setTimeout(checkAudio, 100);
            }
        };

        checkAudio();
    }

    setupVisualizerEvents() {
        if (!this.visualizer) return;

        // Listen to music player events
        const audioElement = document.getElementById('audioPlayer');
        if (audioElement) {
            audioElement.addEventListener('play', () => {
                const container = document.getElementById('visualizerContainer');
                if (container) {
                    container.classList.add('playing');
                }
            });

            audioElement.addEventListener('pause', () => {
                const container = document.getElementById('visualizerContainer');
                if (container) {
                    container.classList.remove('playing');
                }
            });

            audioElement.addEventListener('ended', () => {
                const container = document.getElementById('visualizerContainer');
                if (container) {
                    container.classList.remove('playing');
                }
            });
        }
    }

    setupControls() {
        // Toggle button
        const toggleBtn = document.getElementById('visualizerToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleVisualizer());
        }

        // Settings button
        const settingsBtn = document.getElementById('visualizerSettings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('visualizerFullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Canvas click for interaction
        const canvas = document.getElementById('audioCanvas');
        if (canvas) {
            canvas.addEventListener('click', () => this.cycleVisualizerStyle());
        }
    }

    toggleVisualizer() {
        this.isVisualizerEnabled = !this.isVisualizerEnabled;
        localStorage.setItem('visualizerEnabled', this.isVisualizerEnabled.toString());

        const container = document.getElementById('visualizerContainer');
        const toggleBtn = document.getElementById('visualizerToggle');

        if (this.isVisualizerEnabled) {
            container?.classList.remove('hidden');
            toggleBtn?.classList.add('active');
            this.initializeVisualizer();
        } else {
            container?.classList.add('hidden');
            toggleBtn?.classList.remove('active');
            if (this.visualizer) {
                this.visualizer.destroy();
                this.visualizer = null;
            }
        }
    }

    showSettings() {
        if (!this.visualizer) return;

        const settings = prompt(`Visualizer Settings:
        
1. Vertex Count (8-64): ${this.visualizer.vertices}
2. Base Radius (20-200): ${this.visualizer.baseRadius}

Enter new values separated by commas (e.g., "32,80") or press Cancel to keep current settings:`);

        if (settings) {
            const [vertices, radius] = settings.split(',').map(v => parseInt(v.trim()));
            
            if (vertices && vertices >= 8 && vertices <= 64) {
                this.visualizer.setVertexCount(vertices);
            }
            
            if (radius && radius >= 20 && radius <= 200) {
                this.visualizer.setBaseRadius(radius);
            }
        }
    }

    toggleFullscreen() {
        const container = document.getElementById('visualizerContainer');
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    cycleVisualizerStyle() {
        if (!this.visualizer) return;

        // Cycle through different color schemes
        const colorSchemes = [
            { primary: '#1DB954', secondary: '#1ed760', accent: '#ffffff' }, // Default green
            { primary: '#FF6B6B', secondary: '#FF8E8E', accent: '#ffffff' }, // Red
            { primary: '#4ECDC4', secondary: '#6EE3DB', accent: '#ffffff' }, // Teal
            { primary: '#45B7D1', secondary: '#6BC5D8', accent: '#ffffff' }, // Blue
            { primary: '#96CEB4', secondary: '#AAD7C4', accent: '#ffffff' }, // Mint
            { primary: '#FECA57', secondary: '#FED86B', accent: '#ffffff' }  // Yellow
        ];

        const currentTime = Date.now();
        const schemeIndex = Math.floor(currentTime / 3000) % colorSchemes.length;
        this.visualizer.setColorScheme(colorSchemes[schemeIndex]);
    }

    integrateWithMusicPlayer() {
        // Listen for music player initialization
        const checkMusicPlayer = () => {
            if (window.musicPlayer) {
                // Extend music player with visualizer methods
                window.musicPlayer.toggleVisualizer = () => this.toggleVisualizer();
                window.musicPlayer.getVisualizer = () => this.visualizer;
                
                console.log('Visualizer integrated with music player');
            } else {
                setTimeout(checkMusicPlayer, 100);
            }
        };

        checkMusicPlayer();
    }
}

// Initialize visualizer integration
window.addEventListener('DOMContentLoaded', () => {
    window.visualizerIntegration = new VisualizerIntegration();
});