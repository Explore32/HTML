/* =========================================================================
   KHALED — Personal Page — behaviour

   EDIT HERE: the PLAYLIST array below controls song title / artist /
   audio file / album art shown in the player. Add or remove objects to
   change how many tracks the Previous / Next buttons cycle through.
   ========================================================================= */

const PLAYLIST = [
  {
    title: "LALALALALALALA",     // EDIT: song title
    artist: "Husayn",        // EDIT: artist name
    src: "track.mp3",        // EDIT: path to audio file
    art: "album-art.svg"     // EDIT: path to album art image
  },
];

(() => {
  "use strict";

  const audio          = document.getElementById("audio");
  const playBtn        = document.getElementById("playBtn");
  const playIcon        = document.getElementById("playIcon");
  const pauseIcon       = document.getElementById("pauseIcon");
  const prevBtn         = document.getElementById("prevBtn");
  const nextBtn         = document.getElementById("nextBtn");
  const progressBar     = document.getElementById("progressBar");
  const progressFill    = document.getElementById("progressFill");
  const progressHandle  = document.getElementById("progressHandle");
  const currentTimeEl   = document.getElementById("currentTime");
  const durationTimeEl  = document.getElementById("durationTime");
  const trackTitleEl    = document.getElementById("trackTitle");
  const trackArtistEl   = document.getElementById("trackArtist");
  const artImage        = document.getElementById("artImage");
  const playerSection   = document.querySelector(".player");
  const volumeBtn       = document.getElementById("volumeBtn");
  const volumeIcon      = document.getElementById("volumeIcon");
  const volumePanel     = document.getElementById("volumePanel");
  const volumeSlider    = document.getElementById("volumeSlider");
  const yearEl          = document.getElementById("year");

  let trackIndex = 0;
  let isScrubbing = false;
  let lastVolume = 0.7;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  function formatTime(seconds){
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function loadTrack(index, { autoplay = false } = {}){
    trackIndex = (index + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[trackIndex];

    trackTitleEl.textContent = track.title;
    trackArtistEl.textContent = track.artist;
    artImage.src = track.art;
    artImage.alt = `Album cover for ${track.title} by ${track.artist}`;
    audio.src = track.src;

    progressFill.style.width = "0%";
    progressHandle.style.left = "0%";
    currentTimeEl.textContent = "0:00";
    progressBar.setAttribute("aria-valuenow", "0");

    if (autoplay){
      audio.play().catch(() => { /* autoplay may be blocked; ignore */ });
    }
  }

  function setPlayingUI(playing){
    playIcon.hidden = playing;
    pauseIcon.hidden = !playing;
    playBtn.setAttribute("aria-pressed", String(playing));
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    playerSection.classList.toggle("is-playing", playing);
  }

  /* ---------- transport controls ---------- */
  playBtn.addEventListener("click", () => {
    if (audio.paused){
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  prevBtn.addEventListener("click", () => {
    const wasPlaying = !audio.paused;
    loadTrack(trackIndex - 1, { autoplay: wasPlaying });
  });

  nextBtn.addEventListener("click", () => {
    const wasPlaying = !audio.paused;
    loadTrack(trackIndex + 1, { autoplay: wasPlaying });
  });

  audio.addEventListener("play",  () => setPlayingUI(true));
  audio.addEventListener("pause", () => setPlayingUI(false));
  audio.addEventListener("ended", () => {
    loadTrack(trackIndex + 1, { autoplay: true });
  });

  audio.addEventListener("loadedmetadata", () => {
    durationTimeEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (isScrubbing) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progressFill.style.width = pct + "%";
    progressHandle.style.left = pct + "%";
    currentTimeEl.textContent = formatTime(audio.currentTime);
    progressBar.setAttribute("aria-valuenow", String(Math.round(pct)));
  });

  /* ---------- progress bar: click / drag / keyboard ---------- */
  function seekFromClientX(clientX){
    const rect = progressBar.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.min(1, Math.max(0, pct));
    if (audio.duration){
      audio.currentTime = pct * audio.duration;
    }
    progressFill.style.width = (pct * 100) + "%";
    progressHandle.style.left = (pct * 100) + "%";
    currentTimeEl.textContent = formatTime(pct * (audio.duration || 0));
    progressBar.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
  }

  progressBar.addEventListener("pointerdown", (e) => {
    isScrubbing = true;
    progressBar.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  });
  progressBar.addEventListener("pointermove", (e) => {
    if (isScrubbing) seekFromClientX(e.clientX);
  });
  ["pointerup", "pointercancel"].forEach(evt =>
    progressBar.addEventListener(evt, () => { isScrubbing = false; })
  );

  progressBar.addEventListener("keydown", (e) => {
    const step = (audio.duration || 0) * 0.05 || 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp"){
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + step);
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown"){
      audio.currentTime = Math.max(0, audio.currentTime - step);
      e.preventDefault();
    }
  });

  /* ---------- volume ---------- */
  audio.volume = Number(volumeSlider.value) / 100;

  volumeBtn.addEventListener("click", () => {
    const isOpen = volumePanel.classList.toggle("is-open");
    volumeBtn.setAttribute("aria-expanded", String(isOpen));
  });

  volumeSlider.addEventListener("input", () => {
    const v = Number(volumeSlider.value) / 100;
    audio.volume = v;
    audio.muted = v === 0;
    volumeBtn.setAttribute("aria-pressed", String(v === 0));
    updateVolumeIcon(v);
    if (v > 0) lastVolume = v;
  });

  function updateVolumeIcon(v){
    const waves = volumeIcon.querySelectorAll(".wave");
    waves[0].style.opacity = v > 0 ? "1" : "0.15";
    waves[1].style.opacity = v > 0.5 ? "1" : "0.15";
  }
  updateVolumeIcon(audio.volume);

  /* ---------- init ---------- */
  loadTrack(0);
  yearEl.textContent = new Date().getFullYear();

})();
