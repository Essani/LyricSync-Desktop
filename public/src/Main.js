// Load WaveSurfer globally (required for UMD plugins)
import WaveSurfer from "../wavesurfer.js";
window.WaveSurfer = WaveSurfer;

// Now load the Timeline plugin
import TimelinePlugin from "../wavesurfer.timeline.js";

console.log("Main.js loaded successfully");

// Elements
const fileInput = document.getElementById('file-input');
const playButton = document.getElementById('play-button');
const stopButton = document.getElementById('stop-button');
const exportButton = document.getElementById('export-button');
const clearButton = document.getElementById('clear-button');
const subtitleText = document.getElementById('subtitle-text');
const subtitleList = document.getElementById('subtitle-list');
const trackTimer = document.getElementById('track-timer');

// Subtitles Array
const subtitles = [];

// Create WaveSurfer instance
const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#555',
    progressColor: '#f36',
    cursorColor: '#f36',
    height: 150,
    responsive: true,
    scrollParent: true,
    backend: 'MediaElement',
    plugins: [
        TimelinePlugin.create({
            container: "#waveform-timeline",
            primaryColor: '#555',
            secondaryColor: '#aaa',
            primaryFontColor: '#555',
            secondaryFontColor: '#aaa'
        })
    ]
});

// Update track timer and highlight active subtitle
wavesurfer.on('audioprocess', () => {
    const currentTime = wavesurfer.getCurrentTime();
    const duration = wavesurfer.getDuration();
    trackTimer.textContent = formatTime(currentTime) + " / " + formatTime(duration);

    // Highlight the current subtitle
    subtitles.forEach((subtitle, index) => {
        const listItem = subtitleList.children[index];
        if (currentTime >= subtitle.time && currentTime < subtitle.time + 5) {
            listItem.classList.add('active-subtitle');
        } else {
            listItem.classList.remove('active-subtitle');
        }
    });
});


// Zoom Slider Logic
const zoomSlider = document.getElementById('zoom-slider');

zoomSlider.addEventListener('input', (e) => {
    const zoomLevel = e.target.value;
    wavesurfer.zoom(Number(zoomLevel));
});

// Volume Slider Logic
const volumeSlider = document.getElementById('volume-slider');

volumeSlider.addEventListener('input', (e) => {
    const volumeLevel = e.target.value / 100;
    wavesurfer.setVolume(volumeLevel);
});

subtitleText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const currentTime = wavesurfer.getCurrentTime();
        const subtitle = subtitleText.value.trim();

        if (subtitle) {
            const subtitleObj = {
                time: currentTime,
                text: subtitle,
            };
            subtitles.push(subtitleObj);

            const listItem = document.createElement('li');
            listItem.textContent = `${formatTime(currentTime)} - ${subtitle}`;
            listItem.dataset.index = subtitles.length - 1;

            // Enable inline editing on click
            listItem.addEventListener('click', () => {
                const newText = prompt("Edit subtitle:", subtitleObj.text);
                if (newText !== null && newText.trim() !== "") {
                    subtitleObj.text = newText.trim();
                    listItem.textContent = `${formatTime(subtitleObj.time)} - ${subtitleObj.text}`;
                }
            });

            subtitleList.appendChild(listItem);
            subtitleText.value = "";

            console.log('Subtitle added:', subtitle);
        }

        e.preventDefault();
    }
});

// File loading
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileType = file.type.split('/')[0];
        if (fileType !== 'audio' && fileType !== 'video') {
            alert("Only audio and video files are supported.");
            return;
        }

        const url = URL.createObjectURL(file);
        wavesurfer.load(url);
        console.log('File loaded:', file.name);
    }
});


// Playback controls
playButton.addEventListener('click', () => wavesurfer.playPause());
stopButton.addEventListener('click', () => wavesurfer.stop());

// SRT Export Logic
exportButton.addEventListener('click', () => {
    if (subtitles.length === 0) {
        alert("No subtitles to export!");
        return;
    }

    let srtContent = "";
    subtitles.forEach((subtitle, index) => {
        const startTime = formatTime(subtitle.time, true);
        const endTime = formatTime(subtitle.time + 5, true); // 5 seconds default duration
        srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'subtitles.srt';
    link.click();

    console.log('SRT exported.');
});


// Clear Subtitles Logic
clearButton.addEventListener('click', () => {
    subtitles.length = 0; // Clear the array
    subtitleList.innerHTML = ""; // Clear the UI list
    console.log('Subtitles cleared.');
});

// Format time for display and SRT export
function formatTime(seconds, srt = false) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    if (srt) {
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
    } else {
        return `${pad(minutes)}:${pad(secs)}.${pad(millis, 3)}`;
    }
}

// Format time for padding
function pad(number, length = 2) {
    return number.toString().padStart(length, '0');
}

