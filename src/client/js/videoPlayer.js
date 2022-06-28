const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const muteBtn = document.getElementById("mute");
const time = document.getElementById("time");
const volumeRng = document.getElementById("volume");

let volumeValue = 0.5;
video.volume = volumeValue;

const handleVideoPause = (e) => {
  playBtn.innerText = "Play";
};

const handleVideoPlay = (e) => {
  playBtn.innerText = "Pause";
};

const handlePlay = (e) => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
};

const handleMute = (e) => {
  if (video.muted) {
    video.muted = false;
  } else {
    video.muted = true;
  }
  muteBtn.innerText = video.muted ? "Unmute" : "Mute";
  volumeRng.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
  const {
    target: { value },
  } = event;

  if (video.muted) {
    video.muted = false;
    muteBtn.innerText = "Mute";
  }
  if (value === "0") {
    video.muted = true;
    muteBtn.innerText = "Unmute";
  }
  volumeValue = value;
  video.volume = value;
};

video.addEventListener("pause", handleVideoPause);
video.addEventListener("play", handleVideoPlay);
playBtn.addEventListener("click", handlePlay);
muteBtn.addEventListener("click", handleMute);
volumeRng.addEventListener("input", handleVolumeChange);
