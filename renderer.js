// Import Wavesurfer (must have installed it with npm install wavesurfer.js)
const WaveSurfer = require("wavesurfer.js");

// Subtitle storage
let subtitles = [];

// Utility to format time as SRT
function formatTime(seconds) {
    const date = new Date(seconds * 1000);
    return date.toISOString().substr(11, 8) + "," + String(date.getMilliseconds()).padStart(3, '0');
}

// Handle media loading
document.getElementById("load-media").addEventListener("click", async () => {
    const [fileHandle] = await window.showOpenFilePicker({
        types: [
            { description: "Media Files", accept: { "video/*": [".mp4", ".webm", ".ogg"], "audio/*": [".mp3", ".wav"] } }
        ],
        multiple: false
    });

    const file = await fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const fileType = file.type.split("/")[0];

    const videoPlayer = document.getElementById("video-player");
    const exportButton = document.getElementById("export-srt");
    const subtitleEditor = document.getElementById("subtitle-editor");
    const subtitleList = document.getElementById("subtitle-list");

    // Setup Wavesurfer
    const wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "#007bff",
        progressColor: "#0056b3",
        cursorColor: "#ff0000",
        barWidth: 2,
        height: 150,
    });

    // Load video or audio
    if (fileType === "video") {
        videoPlayer.src = url;
        videoPlayer.style.display = "block";
        videoPlayer.addEventListener("loadedmetadata", () => {
            wavesurfer.load(url);
            subtitleEditor.style.display = "block";
        });
    } else {
        wavesurfer.load(url);
        videoPlayer.style.display = "none";
        subtitleEditor.style.display = "block";
    }

    // Add subtitle
    document.getElementById("add-subtitle").addEventListener("click", () => {
        const currentTime = wavesurfer.getCurrentTime();
        const endTime = currentTime + 2; // 2 seconds by default

        const subtitle = {
            start: currentTime,
            end: endTime,
            text: `Subtitle ${subtitles.length + 1}`
        };

        subtitles.push(subtitle);
        updateSubtitleList(subtitleList);
    });

    // Export SRT
    exportButton.addEventListener("click", () => {
        let srtContent = "";
        subtitles.forEach((subtitle, index) => {
            srtContent += `${index + 1}\n`;
            srtContent += `${formatTime(subtitle.start)} --> ${formatTime(subtitle.end)}\n`;
            srtContent += `${subtitle.text}\n\n`;
        });

        const blob = new Blob([srtContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "subtitles.srt";
        link.click();
    });

    // Update subtitle list
    function updateSubtitleList(listElement) {
        listElement.innerHTML = "";
        subtitles.forEach((subtitle, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div>
                    <label>Start:</label>
                    <input type="number" step="0.01" value="${subtitle.start}" data-index="${index}" data-type="start">
                    <label>End:</label>
                    <input type="number" step="0.01" value="${subtitle.end}" data-index="${index}" data-type="end">
                    <input type="text" value="${subtitle.text}" data-index="${index}" data-type="text">
                    <button data-index="${index}" class="delete-subtitle">Delete</button>
                </div>
            `;
            listElement.appendChild(li);
        });
    }

    // Handle subtitle edits
    subtitleList.addEventListener("input", (event) => {
        const index = event.target.getAttribute("data-index");
        const type = event.target.getAttribute("data-type");
        const value = event.target.value;

        if (type === "start" || type === "end") {
            subtitles[index][type] = parseFloat(value);
        } else if (type === "text") {
            subtitles[index].text = value;
        }
    });

    // Handle subtitle deletion
    subtitleList.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-subtitle")) {
            const index = event.target.getAttribute("data-index");
            subtitles.splice(index, 1);
            updateSubtitleList(subtitleList);
        }
    });
});
