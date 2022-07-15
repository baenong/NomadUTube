const video = document.querySelector("video");

const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");

const volumeControls = document.querySelector(".videoControls__volume");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");

const volumeRng = document.getElementById("volume");
const playTime = document.getElementById("playTime");
const totalTime = document.getElementById("totalTime");
const timeline = document.getElementById("timeline");

const fullScreenBtn = document.getElementById("fullscreen");
const fullScreenBtnIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

const textarea = document.querySelector("#commentForm > textarea");

let volumeValue = 0.5;
video.volume = volumeValue;

let idControlsTimeout = null;
let idVolumeTimeout = null;

const handleVideoPause = () => {
  playBtnIcon.classList = "fas fa-play";
};

const handleVideoPlay = () => {
  playBtnIcon.classList = "fas fa-pause";
};

const handlePlay = () => {
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

  muteBtnIcon.classList = video.muted
    ? "fas fa-volume-xmark"
    : volumeValue > "0.7"
    ? "fas fa-volume-high"
    : "fas fa-volume-low";

  volumeRng.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
  const {
    target: { value },
  } = event;

  muteBtnIcon.classList =
    value > "0.7" ? "fas fa-volume-high" : "fas fa-volume-low";

  if (video.muted) {
    video.muted = false;
  }
  if (value === "0") {
    video.muted = true;
    muteBtnIcon.classList = "fas fa-volume-xmark";
  }

  volumeValue = value;
  video.volume = value;
};

const formatTime = (seconds) => {
  return new Date(seconds * 1000).toISOString().substring(14, 19);
};

const handleLoadedMetadata = () => {
  const duration = Math.floor(video.duration);
  totalTime.innerText = formatTime(duration);
  timeline.max = duration;
};

const handleTimeUpdate = (event) => {
  const currentTime = Math.floor(video.currentTime);
  playTime.innerText = formatTime(currentTime);
  timeline.value = currentTime;
};

const handleTimelineChange = (event) => {
  const {
    target: { value },
  } = event;
  video.currentTime = value;
};

const handleFullScreen = () => {
  if (!document.fullscreenElement) {
    videoContainer.requestFullscreen();
    fullScreenBtnIcon.classList = "fas fa-compress";
  } else {
    document.exitFullscreen();
    fullScreenBtnIcon.classList = "fas fa-expand";
  }
};

const handleMouseMove = () => {
  if (idControlsTimeout) {
    clearTimeout(idControlsTimeout);
    idControlsTimeout = null;
  }

  videoControls.classList.add("show");

  idControlsTimeout = setTimeout(() => {
    videoControls.classList.remove("show");
  }, 3000);
};

const handleVolumeEnter = () => {
  if (idVolumeTimeout) {
    clearTimeout(idVolumeTimeout);
    idVolumeTimeout = null;
  }
  volumeRng.classList.add("show");
};

const handleVolumeLeave = () => {
  idVolumeTimeout = setTimeout(() => {
    volumeRng.classList.remove("show");
  }, 500);
};

const handleKeyboardDown = (event) => {
  if (!document.activeElement.classList.contains("comment")) {
    switch (event.key) {
      case " ":
        event.preventDefault();
        handlePlay();
        break;
      case "m":
        handleMute();
        break;
      case "f":
        handleFullScreen();
        break;
    }
  }
};

const handleEnded = () => {
  playBtnIcon.classList = "fas fa-rotate-right";
  const { id } = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, { method: "POST" });
};

video.addEventListener("pause", handleVideoPause);
video.addEventListener("play", handleVideoPlay);
video.addEventListener("click", handlePlay);
video.addEventListener("loadedmetadata", handleLoadedMetadata);
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("ended", handleEnded);
document.addEventListener("keydown", handleKeyboardDown);
videoContainer.addEventListener("mousemove", handleMouseMove);

playBtn.addEventListener("click", handlePlay);
muteBtn.addEventListener("click", handleMute);
volumeRng.addEventListener("input", handleVolumeChange);
timeline.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullScreen);

volumeControls.addEventListener("mouseenter", handleVolumeEnter);
volumeControls.addEventListener("mouseleave", handleVolumeLeave);
