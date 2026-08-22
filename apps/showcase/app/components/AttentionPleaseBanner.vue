<template>
  <aside class="attention-banner" aria-label="attention, please. launch">
    <a
      class="attention-banner__link"
      href="https://attentionplease.lol/?utm_source=uisfx.com&utm_medium=portfolio_banner&utm_campaign=edition_1_launch"
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label="Visit attention, please."
    >
      <span class="attention-banner__viewport" aria-hidden="true">
        <span class="attention-banner__track">
          <span v-for="group in 2" :key="group" class="attention-banner__group">
            <span v-for="item in 8" :key="item" class="attention-banner__item">
              <span class="attention-banner__wordmark">ATTENTION, PLEASE.</span>
              <span class="attention-banner__divider">//</span>
            </span>
          </span>
        </span>
      </span>
    </a>
  </aside>
</template>

<style scoped>
.attention-banner {
  position: relative;
  z-index: 60;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid rgb(243 239 228 / 22%);
  background: #080808;
  color: #f3efe4;
}

.attention-banner__link {
  display: block;
  color: inherit;
  text-decoration: none;
  transition: background-color 180ms ease-out, color 180ms ease-out;
}

.attention-banner__viewport {
  display: flex;
  min-height: 2.625rem;
  align-items: center;
  overflow: hidden;
}

.attention-banner__track {
  display: flex;
  width: max-content;
  will-change: transform;
  animation: attention-banner-scroll 22s linear infinite;
}

.attention-banner__group {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2rem;
  padding-inline: 1rem;
}

.attention-banner__item {
  display: inline-flex;
  align-items: center;
  gap: 2rem;
}

.attention-banner__wordmark {
  white-space: nowrap;
  font-family: "Barlow Condensed", "Arial Narrow", sans-serif;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.065em;
}

.attention-banner__divider {
  color: #ffd100;
  font-family: "Barlow Condensed", "Arial Narrow", sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0;
  transition: color 180ms ease-out;
}

.attention-banner__link:hover .attention-banner__track,
.attention-banner__link:focus .attention-banner__track {
  animation-play-state: paused;
}

.attention-banner__link:hover,
.attention-banner__link:focus-visible {
  background: #ffd100;
  color: #080808;
}

.attention-banner__link:hover .attention-banner__divider,
.attention-banner__link:focus-visible .attention-banner__divider {
  color: #ff3217;
}

.attention-banner__link:focus-visible {
  outline: 2px solid #ffd100;
  outline-offset: -2px;
}

@keyframes attention-banner-scroll {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .attention-banner__track {
    animation: none;
    will-change: auto;
  }
}
</style>

