// Music Player Controller with Real Audio Playback
class MusicPlayer {
    constructor() {
        // Sample playlist with royalty-free music from various sources
        // You can replace these URLs with your own audio files
        this.playlist = [
            {
                title: "Inspiring Cinematic",
                artist: "Lexin Music",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"
            },
            {
                title: "Electronic Future",
                artist: "Neon Waves",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
            },
            {
                title: "Ambient Dreams",
                artist: "Cosmic Pulse",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop"
            },
            {
                title: "Upbeat Energy",
                artist: "Tropical Vibes",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop"
            },
            {
                title: "Smooth Jazz",
                artist: "Jazz Ensemble",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
                cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop"
            }
        ];

        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
        this.volume = 0.7;

        this.initElements();
        this.initAudio();
        this.initEventListeners();
        this.loadSong(this.currentIndex);
        this.updateVolume(this.volume);
    }

    initElements() {
        this.player = document.querySelector('.music-player');
        this.albumImage = document.getElementById('albumImage');
        this.songTitle = document.getElementById('songTitle');
        this.artistName = document.getElementById('artistName');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.progressBar = document.getElementById('progressBar');
        this.progress = document.getElementById('progress');
        this.progressThumb = document.getElementById('progressThumb');
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.volumeBar = document.getElementById('volumeBar');
        this.volumeLevel = document.getElementById('volumeLevel');
        this.volumeThumb = document.getElementById('volumeThumb');
        this.nextSongEl = document.getElementById('nextSong');
    }

    initAudio() {
        this.audio = document.getElementById('audioPlayer');

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            this.handleSongEnd();
        });

        this.audio.addEventListener('canplay', () => {
            // Audio is ready to play
            if (this.isPlaying) {
                this.audio.play().catch(e => console.log('Playback error:', e));
            }
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            // Try next song on error
            this.playNext();
        });
    }

    initEventListeners() {
        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous/Next
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // Shuffle
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());

        // Repeat
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());

        // Progress bar - click and drag
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.progressBar.addEventListener('mousedown', (e) => this.startProgressDrag(e));
        this.progressBar.addEventListener('touchstart', (e) => this.startProgressDrag(e), { passive: false });

        // Volume bar - click and drag
        this.volumeBar.addEventListener('click', (e) => this.setVolume(e));
        this.volumeBar.addEventListener('mousedown', (e) => this.startVolumeDrag(e));
        this.volumeBar.addEventListener('touchstart', (e) => this.startVolumeDrag(e), { passive: false });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeypress(e));
    }

    loadSong(index) {
        const song = this.playlist[index];
        this.albumImage.src = song.cover;
        this.songTitle.textContent = song.title;
        this.artistName.textContent = song.artist;
        this.audio.src = song.src;
        this.audio.load();
        this.currentTimeEl.textContent = '0:00';
        this.totalTimeEl.textContent = '--:--';
        this.updateNextSong();
        this.updateProgress();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.player.classList.add('playing');
        this.playIcon.classList.remove('fa-play');
        this.playIcon.classList.add('fa-pause');

        // Play the audio
        this.audio.play().catch(e => {
            console.log('Playback failed:', e);
            // Some browsers block autoplay, show a message
            this.pause();
        });
    }

    pause() {
        this.isPlaying = false;
        this.player.classList.remove('playing');
        this.playIcon.classList.remove('fa-pause');
        this.playIcon.classList.add('fa-play');
        this.audio.pause();
    }

    handleSongEnd() {
        if (this.repeatMode === 2) {
            // Repeat one
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.isShuffle) {
            this.playRandom();
        } else if (this.currentIndex < this.playlist.length - 1) {
            this.playNext();
        } else if (this.repeatMode === 1) {
            // Repeat all
            this.currentIndex = 0;
            this.loadSong(this.currentIndex);
            this.play();
        } else {
            this.pause();
            this.audio.currentTime = 0;
            this.updateProgress();
        }
    }

    updateProgress() {
        const duration = this.audio.duration || 0;
        const currentTime = this.audio.currentTime || 0;
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

        this.progress.style.width = `${percent}%`;
        this.progressThumb.style.left = `${percent}%`;
        this.currentTimeEl.textContent = this.formatTime(currentTime);

        if (duration > 0) {
            this.totalTimeEl.textContent = this.formatTime(duration);
        }
    }

    playPrevious() {
        // If more than 3 seconds in, restart the song
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        if (this.isShuffle) {
            this.playRandom();
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadSong(this.currentIndex);
            if (this.isPlaying) {
                this.play();
            }
        }
    }

    playNext() {
        if (this.isShuffle) {
            this.playRandom();
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            this.loadSong(this.currentIndex);
            if (this.isPlaying) {
                this.play();
            }
        }
    }

    playRandom() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } while (newIndex === this.currentIndex && this.playlist.length > 1);

        this.currentIndex = newIndex;
        this.loadSong(this.currentIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
        this.updateNextSong();
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        this.repeatBtn.classList.toggle('active', this.repeatMode > 0);

        // Update icon based on repeat mode
        const icon = this.repeatBtn.querySelector('i');
        if (this.repeatMode === 2) {
            icon.className = 'fas fa-redo';
            icon.style.fontSize = '0.8rem';
            this.repeatBtn.setAttribute('title', 'Repeat One');
            // Add a "1" indicator
            if (!this.repeatBtn.querySelector('.repeat-one')) {
                const one = document.createElement('span');
                one.className = 'repeat-one';
                one.textContent = '1';
                one.style.cssText = 'position:absolute;font-size:0.5rem;bottom:8px;right:8px;';
                this.repeatBtn.appendChild(one);
            }
        } else {
            icon.className = 'fas fa-redo';
            icon.style.fontSize = '';
            this.repeatBtn.setAttribute('title', this.repeatMode === 1 ? 'Repeat All' : 'Repeat');
            const one = this.repeatBtn.querySelector('.repeat-one');
            if (one) one.remove();
        }
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const duration = this.audio.duration || 0;

        if (duration > 0) {
            this.audio.currentTime = percent * duration;
        }
    }

    setVolume(e) {
        const rect = this.volumeBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.updateVolume(Math.max(0, Math.min(1, percent)));
    }

    updateVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        const percent = value * 100;
        this.volumeLevel.style.width = `${percent}%`;
        this.volumeThumb.style.left = `${percent}%`;
    }

    startProgressDrag(e) {
        e.preventDefault();
        this.isDraggingProgress = true;

        // Immediately seek to clicked position
        this.seekFromEvent(e);

        const handleDrag = (event) => {
            if (this.isDraggingProgress) {
                this.seekFromEvent(event);
            }
        };

        const stopDrag = () => {
            this.isDraggingProgress = false;
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', handleDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    seekFromEvent(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        const duration = this.audio.duration || 0;
        if (duration > 0) {
            this.audio.currentTime = percent * duration;
            // Update UI immediately for smooth feedback
            this.progress.style.width = `${percent * 100}%`;
            this.progressThumb.style.left = `${percent * 100}%`;
            this.currentTimeEl.textContent = this.formatTime(percent * duration);
        }
    }

    startVolumeDrag(e) {
        e.preventDefault();
        this.isDraggingVolume = true;

        // Immediately set volume at clicked position
        this.setVolumeFromEvent(e);

        const handleDrag = (event) => {
            if (this.isDraggingVolume) {
                this.setVolumeFromEvent(event);
            }
        };

        const stopDrag = () => {
            this.isDraggingVolume = false;
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', handleDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    setVolumeFromEvent(e) {
        const rect = this.volumeBar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        this.updateVolume(percent);
    }

    updateNextSong() {
        if (this.isShuffle) {
            this.nextSongEl.textContent = 'Shuffle Mode';
        } else {
            const nextIndex = (this.currentIndex + 1) % this.playlist.length;
            this.nextSongEl.textContent = this.playlist[nextIndex].title;
        }
    }

    handleKeypress(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                this.playPrevious();
                break;
            case 'ArrowRight':
                this.playNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.updateVolume(Math.min(1, this.volume + 0.1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.updateVolume(Math.max(0, this.volume - 0.1));
                break;
            case 'KeyS':
                this.toggleShuffle();
                break;
            case 'KeyR':
                this.toggleRepeat();
                break;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize the player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
