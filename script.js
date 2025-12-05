// YouTube Video Editor Recreation - 2016
// Main application logic

class YouTubeVideoEditor {
    constructor() {
        this.selectedClip = null;
        this.isDragging = false;
        this.dragOffset = 0;
        this.playheadPosition = 110;
        this.isPlaying = false;
        this.totalDuration = 30; // seconds

        this.initializeElements();
        this.attachEventListeners();
        this.setupDragAndDrop();
    }

    initializeElements() {
        this.videoUploadArea = document.querySelector('.upload-area');
        this.videoUpload = document.getElementById('videoUpload');
        this.previewVideo = document.getElementById('previewVideo');
        this.playBtn = document.getElementById('playBtn');
        this.videoTrack = document.getElementById('videoTrack');
        this.audioTrack = document.getElementById('audioTrack');
        this.textTrack = document.getElementById('textTrack');
        this.timeline = document.querySelector('.timeline');
        this.playhead = document.querySelector('.playhead');
        this.clips = document.querySelectorAll('.clip, .audio-clip, .text-clip');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
    }

    attachEventListeners() {
        // Upload functionality
        this.videoUploadArea.addEventListener('click', () => this.videoUpload.click());
        this.videoUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.videoUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.videoUpload.addEventListener('change', (e) => this.handleFileUpload(e));

        // Playback controls
        this.playBtn.addEventListener('click', () => this.togglePlayback());
        this.previewVideo.addEventListener('timeupdate', () => this.updateTimeDisplay());

        // Clip selection
        this.clips.forEach(clip => {
            clip.addEventListener('click', (e) => this.selectClip(e));
            clip.addEventListener('dblclick', (e) => this.editClip(e));
        });

        // Timeline interaction
        this.timeline.addEventListener('click', (e) => this.seekTo(e));
        this.playhead.addEventListener('mousedown', (e) => this.startPlayheadDrag(e));

        // Properties panel interactions
        const speedControl = document.querySelector('.property input[type="range"]');
        if (speedControl) {
            speedControl.addEventListener('change', (e) => this.changeClipSpeed(e));
        }

        // Footage items drag
        const footageItems = document.querySelectorAll('.footage-item');
        footageItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleFootageDragStart(e));
        });

        // Effect items
        const effectItems = document.querySelectorAll('.effect-item');
        effectItems.forEach(item => {
            item.addEventListener('click', (e) => this.applyEffect(e));
        });

        // Transition items
        const transitionItems = document.querySelectorAll('.transition-item');
        transitionItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleTransitionDragStart(e));
        });
    }

    setupDragAndDrop() {
        // Make timeline tracks drop zones
        [this.videoTrack, this.audioTrack, this.textTrack].forEach(track => {
            track.addEventListener('dragover', (e) => this.handleTrackDragOver(e));
            track.addEventListener('drop', (e) => this.handleTrackDrop(e));
            // Touch support for tablets
            track.addEventListener('touchover', (e) => this.handleTrackDragOver(e));
        });

        // Make clips draggable within tracks
        document.addEventListener('mousemove', (e) => this.handleClipDrag(e));
        document.addEventListener('mouseup', (e) => this.endClipDrag(e));
        
        // Touch support
        document.addEventListener('touchmove', (e) => this.handleClipDrag(e));
        document.addEventListener('touchend', (e) => this.endClipDrag(e));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.videoUploadArea.style.backgroundColor = '#e8f5ff';
        this.videoUploadArea.style.borderColor = '#065fd4';
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.videoUploadArea.style.backgroundColor = '#fafafa';
        this.videoUploadArea.style.borderColor = '#d3d3d3';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileUpload({ target: { files } });
        }
    }

    handleFileUpload(e) {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            const url = URL.createObjectURL(file);
            
            this.previewVideo.src = url;
            this.addToFootageLibrary(file.name, url);
            
            // Show success message
            this.showNotification('Video uploaded successfully!');
        }
    }

    addToFootageLibrary(name, url) {
        const footageList = document.querySelector('.footage-list');
        const newItem = document.createElement('div');
        newItem.className = 'footage-item';
        newItem.draggable = true;
        newItem.innerHTML = `
            <div class="thumbnail" style="background: linear-gradient(135deg, #2196f3, #1976d2); color: white; font-size: 16px;">▶</div>
            <span>${name}</span>
        `;
        
        newItem.addEventListener('dragstart', (e) => this.handleFootageDragStart(e));
        footageList.insertBefore(newItem, footageList.firstChild);
    }

    selectClip(e) {
        // Remove previous selection
        this.clips.forEach(clip => clip.classList.remove('selected'));
        
        // Select new clip
        e.target.closest('.clip, .audio-clip, .text-clip').classList.add('selected');
        this.selectedClip = e.target.closest('.clip, .audio-clip, .text-clip');
        
        this.updatePropertiesPanel();
    }

    editClip(e) {
        const clip = e.target.closest('.clip, .audio-clip, .text-clip');
        if (clip) {
            const newName = prompt('Enter clip name:', clip.textContent.trim());
            if (newName) {
                clip.innerHTML = `<span>${newName}</span>`;
            }
        }
    }

    updatePropertiesPanel() {
        if (this.selectedClip) {
            const duration = this.selectedClip.dataset.duration || '5.0';
            const startTime = this.selectedClip.dataset.start || '0';
            
            const durationInput = document.querySelector('.property input[type="text"]:first-of-type');
            const startInput = document.querySelector('.property input[type="text"]:nth-of-type(2)');
            
            if (durationInput) durationInput.value = duration + 's';
            if (startInput) startInput.value = this.formatTime(startTime);
        }
    }

    togglePlayback() {
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

    updateTimeDisplay() {
        const current = this.formatTime(this.previewVideo.currentTime);
        const duration = this.formatTime(this.previewVideo.duration || 0);
        
        this.currentTimeDisplay.textContent = current;
        this.durationDisplay.textContent = duration;
        
        // Update playhead position
        if (this.previewVideo.duration) {
            const percentage = (this.previewVideo.currentTime / this.previewVideo.duration) * 100;
            this.playhead.style.left = (percentage * 6) + 'px'; // Adjust based on timeline width
        }
    }

    seekTo(e) {
        if (e.target.closest('.playhead')) return;
        
        const timelineRect = this.timeline.getBoundingClientRect();
        const clickX = e.clientX - timelineRect.left + this.timeline.scrollLeft;
        const percentage = clickX / (this.timeline.scrollWidth - 100);
        
        if (this.previewVideo.duration) {
            this.previewVideo.currentTime = percentage * this.previewVideo.duration;
        }
    }

    startPlayheadDrag(e) {
        this.isDragging = true;
        e.preventDefault();
    }

    handleClipDrag(e) {
        if (!this.isDragging || !this.selectedClip) return;
        
        if (e.buttons === 1) {
            const rect = this.selectedClip.parentElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > 0) {
                this.selectedClip.style.left = x + 'px';
            }
        }
    }

    endClipDrag(e) {
        this.isDragging = false;
    }

    handleFootageDragStart(e) {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', e.target.textContent);
    }

    handleTrackDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.target.style.backgroundColor = '#f0f0f0';
    }

    handleTrackDrop(e) {
        e.preventDefault();
        e.target.style.backgroundColor = '';
        
        const trackType = e.target.closest('.track').classList[1];
        const itemName = e.dataTransfer.getData('text/plain');
        
        this.addClipToTrack(e.target.closest('.track'), itemName, trackType);
    }

    addClipToTrack(track, name, trackType) {
        const newClip = document.createElement('div');
        const classes = trackType === 'video-track' ? 'clip' : 
                       trackType === 'audio-track' ? 'audio-clip' : 'text-clip';
        
        newClip.className = classes;
        newClip.dataset.start = '0';
        newClip.dataset.duration = '3';
        newClip.innerHTML = `<span>${name}</span>`;
        newClip.style.left = '10px';
        newClip.draggable = true;
        
        newClip.addEventListener('click', (e) => this.selectClip(e));
        newClip.addEventListener('dblclick', (e) => this.editClip(e));
        
        track.appendChild(newClip);
        this.showNotification(`Added "${name}" to ${trackType.replace('-track', '')} track`);
    }

    handleTransitionDragStart(e) {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'transition:' + e.target.textContent);
    }

    changeClipSpeed(e) {
        if (this.selectedClip) {
            const speed = e.target.value;
            this.showNotification(`Clip speed changed to ${speed}x`);
        }
    }

    applyEffect(e) {
        if (this.selectedClip) {
            const effect = e.target.textContent;
            this.showNotification(`Applied "${effect}" effect`);
        } else {
            this.showNotification('Please select a clip first');
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #323232;
            color: white;
            padding: 12px 20px;
            border-radius: 2px;
            font-size: 13px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const editor = new YouTubeVideoEditor();
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
