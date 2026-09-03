document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('wanderportsHeroFrame');
  const button = document.getElementById('wanderportsPlayButton');

  if (!frame || !button) return;

  const setReady = (label = 'PLAY') => {
    button.disabled = false;
    button.textContent = label;
    button.classList.add('is-ready');
  };

  const setPlaying = () => {
    button.disabled = true;
    button.textContent = 'PLAYING…';
    button.classList.remove('is-ready');
  };

  frame.addEventListener('load', () => {
    setReady('PLAY');
  });

  try {
    if (frame.contentDocument?.readyState === 'complete') {
      setReady('PLAY');
    }
  } catch (error) {}

  button.addEventListener('click', () => {
    if (!frame.contentWindow) return;
    setPlaying();
    frame.contentWindow.postMessage({ type: 'wanderports-hero:play' }, '*');
  });

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow) return;

    if (event.data?.type === 'wanderports-hero:ready') {
      setReady('PLAY');
    }

    if (event.data?.type === 'wanderports-hero:complete') {
      setReady('REPLAY');
    }
  });
});
