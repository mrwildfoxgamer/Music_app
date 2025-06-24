class AudioVisualizer {
    constructor(canvasId, audioElement) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioElement = audioElement;
        
        // Audio analysis setup
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = 0;
        
        // Visualization parameters
        this.centerX = 0;
        this.centerY = 0;
        this.baseRadius = 80;
        this.vertices = 32;
        this.animationId = null;
        this.isPlaying = false;
        
        // Color scheme
        this.colorScheme = {
            primary: '#1DB954',
            secondary: '#1ed760',
            accent: '#ffffff',
            background: 'rgba(0, 0, 0, 0.1)'
        };
        
        this.setupCanvas();
        this.setupAudioContext();
        this.bindEvents();
        this.animate();
    }
    
    setupCanvas() {
        const resize = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            this.centerX = rect.width / 2;
            this.centerY = rect.height / 2;
            this.baseRadius = Math.min(rect.width, rect.height) * 0.15;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    async setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            // Configure analyser
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            // Connect audio source
            if (!this.source) {
                this.source = this.audioContext.createMediaElementSource(this.audioElement);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
        } catch (error) {
            console.error('Audio context setup failed:', error);
        }
    }
    
    bindEvents() {
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        });
        
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
        });
        
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
        });
    }
    
    getFrequencyData() {
        if (!this.analyser) return null;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Process frequency data into useful ranges
        const bass = this.getAverageFrequency(0, 8);
        const mid = this.getAverageFrequency(8, 32);
        const treble = this.getAverageFrequency(32, 64);
        
        return {
            bass: bass / 255,
            mid: mid / 255,
            treble: treble / 255,
            all: this.dataArray
        };
    }
    
    getAverageFrequency(start, end) {
        let sum = 0;
        const count = Math.min(end, this.bufferLength) - start;
        
        for (let i = start; i < Math.min(end, this.bufferLength); i++) {
            sum += this.dataArray[i];
        }
        
        return count > 0 ? sum / count : 0;
    }
    
    createBlobVertices(frequencyData) {
        const vertices = [];
        const angleStep = (Math.PI * 2) / this.vertices;
        
        for (let i = 0; i < this.vertices; i++) {
            const angle = i * angleStep;
            
            // Calculate radius based on frequency data
            let radiusMultiplier = 1;
            
            if (frequencyData && this.isPlaying) {
                // Map vertex to frequency range
                const freqIndex = Math.floor((i / this.vertices) * this.bufferLength);
                const freqValue = frequencyData.all[freqIndex] / 255;
                
                // Combine different frequency ranges for more dynamic movement
                const bassInfluence = frequencyData.bass * 0.8;
                const midInfluence = frequencyData.mid * 0.6;
                const trebleInfluence = frequencyData.treble * 0.4;
                const localInfluence = freqValue * 0.5;
                
                radiusMultiplier = 1 + (bassInfluence + midInfluence + trebleInfluence + localInfluence) * 0.8;
            } else {
                // Gentle breathing animation when no audio
                radiusMultiplier = 1 + Math.sin(Date.now() * 0.002 + angle) * 0.1;
            }
            
            const radius = this.baseRadius * radiusMultiplier;
            const x = this.centerX + Math.cos(angle) * radius;
            const y = this.centerY + Math.sin(angle) * radius;
            
            vertices.push({ x, y, radius });
        }
        
        return vertices;
    }
    
    drawBlob(vertices, frequencyData) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (vertices.length < 3) return;
        
        // Create gradient based on audio intensity
        let intensity = 0;
        if (frequencyData && this.isPlaying) {
            intensity = (frequencyData.bass + frequencyData.mid + frequencyData.treble) / 3;
        }
        
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.baseRadius * 2
        );
        
        const alpha = 0.3 + intensity * 0.7;
        gradient.addColorStop(0, `rgba(29, 185, 84, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(30, 215, 96, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(29, 185, 84, 0.1)`);
        
        // Draw blob using smooth curves
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        
        for (let i = 0; i < vertices.length; i++) {
            const current = vertices[i];
            const next = vertices[(i + 1) % vertices.length];
            
            // Control points for smooth curves
            const cp1x = current.x + (next.x - current.x) * 0.3;
            const cp1y = current.y + (next.y - current.y) * 0.3;
            const cp2x = next.x - (next.x - current.x) * 0.3;
            const cp2y = next.y - (next.y - current.y) * 0.3;
            
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
        }
        
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add outer glow effect
        if (this.isPlaying && intensity > 0.3) {
            this.ctx.shadowColor = this.colorScheme.primary;
            this.ctx.shadowBlur = 20 + intensity * 30;
            this.ctx.strokeStyle = `rgba(29, 185, 84, ${intensity * 0.8})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw center point
        this.drawCenterPoint(intensity);
    }
    
    drawCenterPoint(intensity) {
        const pulseRadius = 3 + intensity * 8;
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, pulseRadius
        );
        
        gradient.addColorStop(0, this.colorScheme.accent);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, pulseRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    animate() {
        const frequencyData = this.getFrequencyData();
        const vertices = this.createBlobVertices(frequencyData);
        this.drawBlob(vertices, frequencyData);
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
    
    // Public methods for customization
    setColorScheme(colors) {
        this.colorScheme = { ...this.colorScheme, ...colors };
    }
    
    setVertexCount(count) {
        this.vertices = Math.max(8, Math.min(64, count));
    }
    
    setBaseRadius(radius) {
        this.baseRadius = Math.max(20, radius);
    }
}