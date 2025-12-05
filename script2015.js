// YouTube Video Editor 2015 Recreation
class Editor2015 {
    constructor() {
        this.videoUpload = document.getElementById('videoUpload');
        this.previewVideo = document.getElementById('previewVideo');
        this.playBtn = document.getElementById('playBtn');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        this.videoTrack = document.getElementById('videoTrack');
        this.audioTrack = document.getElementById('audioTrack');
        this.textTrack = document.getElementById('textTrack');
        this.playhead = document.querySelector('.playhead');
        this.timelineContainer = document.querySelector('.timeline-container');
        
        this.selectedClip = null;
        this.isPlaying = false;
        
        this.init();
    }
    
    init() {
        this.attachEvents();
    }
    
    attachEvents() {
        // Upload
        document.querySelector('.upload-box').addEventListener('click', () => {
            this.videoUpload.click();
        });
        
        this.videoUpload.addEventListener('change', (e) => this.handleUpload(e));
        
        // Drag over upload area
        document.querySelector('.upload-box').addEventListener('dragover', (e) => {
            e.preventDefault();
            document.querySelector('.upload-box').style.borderColor = '#4285f4';
        });
        
        document.querySelector('.upload-box').addEventListener('dragleave', () => {
            document.querySelector('.upload-box').style.borderColor = '#ccc';
        });
        
        document.querySelector('.upload-box').addEventListener('drop', (e) => {
            e.preventDefault();
            document.querySelector('.upload-box').style.borderColor = '#ccc';
            if (e.dataTransfer.files.length > 0) {
                this.videoUpload.files = e.dataTransfer.files;
                this.handleUpload({ target: this.videoUpload });
            }
        });
        
        // Playback
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.previewVideo.addEventListener('timeupdate', () => this.updateTime());
        this.previewVideo.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // Timeline
        this.timelineContainer.addEventListener('click', (e) => this.seekTimeline(e));
        
        // Clips
        document.querySelectorAll('.clip, .audio-clip, .text-clip').forEach(clip => {
            clip.addEventListener('click', (e) => this.selectClip(e));
            clip.addEventListener('dblclick', (e) => this.renameClip(e));
        });
        
        // Effects
        document.querySelectorAll('.effect-item').forEach(item => {
            item.addEventListener('click', (e) => this.applyEffect(e));
        });
    }
    
    handleUpload(e) {
        const files = e.target.files;
        if (files && files[0]) {
            const url = URL.createObjectURL(files[0]);
            this.previewVideo.src = url;
            this.addToVideoList(files[0].name, url);
        }
    }
    
    addToVideoList(name, url) {
        const videoList = document.querySelector('.video-list');
        const item = document.createElement('div');
        item.className = 'video-item';
        item.innerHTML = `
            <div class="video-thumb">📹</div>
            <div class="video-info">
                <p class="video-name">${name}</p>
                <p class="video-duration">--:--</p>
            </div>
        `;
        videoList.insertBefore(item, videoList.firstChild);
    }
    
    togglePlay() {
        if (this.previewVideo.paused) {
            this.previewVideo.play();
            this.playBtn.textContent = '⏸';
            this.isPlaying = true;
        } else {
            this.previewVideo.pause();
            this.playBtn.textContent = '▶';
            this.isPlaying = false;
        }
    }
    
    updateTime() {
        this.currentTimeDisplay.textContent = this.formatTime(this.previewVideo.currentTime);
        
        if (this.previewVideo.duration) {
            const percent = (this.previewVideo.currentTime / this.previewVideo.duration) * 100;
            this.playhead.style.left = (60 + (percent * 5.4)) + 'px';
        }
    }
    
    updateDuration() {
        this.durationDisplay.textContent = this.formatTime(this.previewVideo.duration);
    }
    
    seekTimeline(e) {
        if (e.target.closest('.playhead')) return;
        
        const rect = this.timelineContainer.getBoundingClientRect();
        const x = e.clientX - rect.left + this.timelineContainer.scrollLeft - 60;
        const percent = Math.max(0, x / (this.timelineContainer.scrollWidth - 100));
        
        if (this.previewVideo.duration) {
            this.previewVideo.currentTime = percent * this.previewVideo.duration;
        }
    }
    
    selectClip(e) {
        document.querySelectorAll('.clip, .audio-clip, .text-clip').forEach(c => c.classList.remove('selected'));
        e.target.closest('.clip, .audio-clip, .text-clip').classList.add('selected');
        this.selectedClip = e.target.closest('.clip, .audio-clip, .text-clip');
    }
    
    renameClip(e) {
        const clip = e.target.closest('.clip, .audio-clip, .text-clip');
        const newName = prompt('Rename clip:', clip.textContent);
        if (newName) {
            clip.textContent = newName;
        }
    }
    
    applyEffect(e) {
        if (!this.selectedClip) {
            alert('Please select a clip first');
            return;
        }
        const effect = e.target.textContent;
        alert(`Applied "${effect}" effect`);
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new Editor2015();
});
