document.addEventListener("DOMContentLoaded", () => {
  initDirectOrderingButtons();
  initVideoModal();
});

// --- DIRECT ORDERING & SMOOTH SCROLL ---
function initDirectOrderingButtons() {
  const orderNowBtns = document.querySelectorAll(
    ".order-now-btn, a[href='#menu']",
  );

  orderNowBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const menuSection = document.getElementById("menu");

      if (menuSection) {
        menuSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// --- VIDEO PLAYBACK MODAL CONTROLLER ---
function initVideoModal() {
  const playBtn = document.getElementById("play-video-btn");
  const modal = document.getElementById("video-modal");
  const closeBtn = document.getElementById("close-video-modal");
  const backdrop = document.getElementById("video-modal-backdrop");
  const videoPlayer = document.getElementById("promo-video");
  const iframePlayer = document.getElementById("promo-iframe");

  if (!playBtn || !modal) return;

  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden"; // Prevent background scroll

    // Play local video element if present
    if (videoPlayer) {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    }

    // Play YouTube/Vimeo iframe if present
    if (iframePlayer) {
      const src = iframePlayer.getAttribute("data-src");
      if (src) iframePlayer.src = `${src}?autoplay=1`;
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = ""; // Restore scrolling

    // Pause local video
    if (videoPlayer) {
      videoPlayer.pause();
    }

    // Stop iframe video playback
    if (iframePlayer) {
      iframePlayer.src = "";
    }
  }

  playBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);

  // Close on Escape key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}
