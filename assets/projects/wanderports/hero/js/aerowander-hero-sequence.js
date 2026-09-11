(() => {
  'use strict';

  const stages = document.querySelectorAll('[data-aw-hero-sequence]');
  if (!stages.length) return;

  const readMutedPreference = () => {
    try { return localStorage.getItem('aerowanderHeroMuted') === 'true'; }
    catch (error) { return false; }
  };

  const saveMutedPreference = (value) => {
    try { localStorage.setItem('aerowanderHeroMuted', String(value)); }
    catch (error) {}
  };

  let audioContext = null;
  let muted = readMutedPreference();

  const ensureAudio = () => {
    if (!audioContext) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioContext = new AC();
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  };

  const playMechanicalClick = (accent = 0) => {
    if (muted) return;
    const ctx = ensureAudio();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const output = ctx.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(accent ? 0.08 : 0.05, now + 0.002);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    output.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = accent ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(accent ? 920 : 1160, now);
    osc.frequency.exponentialRampToValueAtTime(accent ? 280 : 410, now + 0.055);
    osc.connect(output);
    osc.start(now);
    osc.stop(now + 0.07);
  };

  const updateSoundButtons = () => {
    document.querySelectorAll('[data-aw-sound-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', muted ? 'true' : 'false');
      const label = button.querySelector('.aw-sound-toggle__label');
      const icon = button.querySelector('.aw-sound-toggle__icon');
      button.setAttribute('aria-label', muted ? 'Turn on hero flip sounds' : 'Mute hero flip sounds');
      button.setAttribute('title', muted ? 'Turn on hero flip sounds' : 'Mute hero flip sounds');
      if (label) label.textContent = muted ? 'Muted' : 'Sound on';
      if (icon) icon.textContent = muted ? '🔇' : '🔊';
    });
  };

  document.querySelectorAll('[data-aw-sound-toggle]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      muted = !muted;
      saveMutedPreference(muted);
      if (!muted) {
        ensureAudio();
        playMechanicalClick(1);
      }
      updateSoundButtons();
    });
  });

  updateSoundButtons();
  document.addEventListener('pointerdown', ensureAudio, { once: true, passive: true });
  document.addEventListener('keydown', ensureAudio, { once: true });

  const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  stages.forEach((stage) => {
    const hero = stage.closest('.aw-journey-hero');
    if (!hero) return;

    const lineOne = hero.querySelector('[data-aw-type-line-one]');
    const lineTwo = hero.querySelector('[data-aw-type-line-two]');
    const lineThree = hero.querySelector('[data-aw-type-line-three]');
    const replayButton = hero.querySelector('[data-aw-hero-replay]');

    const arrivingBoard = hero.querySelector('[data-aw-board-role="arriving"]');
    const connectingBoard = hero.querySelector('[data-aw-board-role="connecting"]');
    const departingBoard = hero.querySelector('[data-aw-board-role="departing"]');
    const discoverBoard = hero.querySelector('[data-aw-board-role="discover"]');
    const betweenBoard = hero.querySelector('[data-aw-board-role="between"]');
    const betweenRow = hero.querySelector('.aw-journey-title-secondary');

    const allBoards = [arrivingBoard, connectingBoard, departingBoard, discoverBoard, betweenBoard]
      .filter(Boolean);

    const DURATION = {
      arrivingMotion: 6000,
      leftPassenger: 7000,
      connectingBoard: 6000,
      rightPassenger: 7000,
      departingMotion: 6000,
      discoverBoard: 5200,
      betweenBoard: 13800,
      typedLineHold: 1800,
      typedLineFade: 700,
      typedLineGap: 800
    };

    let timers = [];
    let running = false;

    const schedule = (delay, fn) => {
      const timer = window.setTimeout(fn, delay);
      timers.push(timer);
      return timer;
    };

    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const rememberBaseSrc = (board) => {
      if (!board) return;
      const source = board.getAttribute('src') || board.getAttribute('data') || '';
      board.dataset.awBaseSrc = source.split('?')[0];
    };
    allBoards.forEach(rememberBaseSrc);

    const restartBoard = (board, suffix) => {
      if (!board) return;
      const baseSrc = board.dataset.awBaseSrc;
      if (!baseSrc) return;
      const refreshed = `${baseSrc}?awSequence=${Date.now()}-${suffix}`;
      if (board.tagName.toLowerCase() === 'object') board.setAttribute('data', refreshed);
      else board.setAttribute('src', refreshed);
    };

    const clearLine = (element) => {
      if (!element) return;
      element.innerHTML = '';
      element.classList.remove('is-complete', 'is-hiding');
    };

    const clearAllLines = () => [lineOne, lineTwo, lineThree].forEach(clearLine);

    const hideBoard = (board) => board?.classList.remove('is-seq-visible');
    const showBoard = (board, suffix) => {
      if (!board) return;
      board.classList.remove('is-seq-visible');
      restartBoard(board, suffix);
      schedule(30, () => board.classList.add('is-seq-visible'));
      playMechanicalClick(1);
    };

    const typeLine = (element, text, speed = 125, onComplete) => {
      if (!element) {
        if (onComplete) onComplete();
        return;
      }

      clearLine(element);
      let index = 0;

      const step = () => {
        index += 1;
        const current = escapeHtml(text.slice(0, index));
        element.innerHTML =
          `<span class="aw-typed-copy">${current}</span>` +
          `<span class="aw-type-cursor" aria-hidden="true"></span>`;

        if (index < text.length) {
          schedule(speed, step);
        } else {
          element.classList.add('is-complete');
          if (onComplete) onComplete();
        }
      };

      step();
    };

    const fadeOutLine = (element, onComplete) => {
      if (!element) {
        if (onComplete) onComplete();
        return;
      }

      element.classList.add('is-hiding');
      schedule(DURATION.typedLineFade, () => {
        clearLine(element);
        if (onComplete) onComplete();
      });
    };

    const typeAerowanderWordmark = (onComplete) => {
      if (!lineThree) {
        if (onComplete) onComplete();
        return;
      }

      clearLine(lineThree);

      const wander = 'wander';
      const aero = 'Aero';
      let wanderIndex = 0;
      let aeroIndex = 0;

      const renderWander = () => {
        const currentWander = escapeHtml(wander.slice(0, wanderIndex));
        lineThree.innerHTML =
          `<span class="aw-brand-wander">${currentWander}</span>` +
          `<span class="aw-type-cursor" aria-hidden="true"></span>`;
      };

      const renderAeroJoin = () => {
        const currentAero = escapeHtml(aero.slice(0, aeroIndex));
        lineThree.innerHTML =
          `<span class="aw-brand-aero">${currentAero}</span>` +
          `<span class="aw-type-cursor" aria-hidden="true"></span>` +
          `<span class="aw-brand-wander">${escapeHtml(wander)}</span>`;
      };

      const finish = () => {
        lineThree.innerHTML =
          `<span class="aw-brand-aero">${escapeHtml(aero)}</span>` +
          `<span class="aw-brand-wander">${escapeHtml(wander)}</span>` +
          `<span class="aw-type-cursor" aria-hidden="true"></span>`;
        lineThree.classList.add('is-complete');
        if (onComplete) schedule(350, onComplete);
      };

      const typeAero = () => {
        aeroIndex += 1;
        renderAeroJoin();
        if (aeroIndex < aero.length) schedule(500, typeAero);
        else finish();
      };

      const typeWander = () => {
        wanderIndex += 1;
        renderWander();
        if (wanderIndex < wander.length) schedule(410, typeWander);
        else schedule(1000, typeAero);
      };

      typeWander();
    };

    const runTypedMessage = (onComplete) => {
      typeLine(lineOne, 'On a layover?', 250, () => {
        schedule(DURATION.typedLineHold, () => {
          fadeOutLine(lineOne, () => {
            schedule(DURATION.typedLineGap, () => {
              typeLine(lineTwo, "Don't just wait.", 250, () => {
                schedule(DURATION.typedLineHold, () => {
                  fadeOutLine(lineTwo, () => {
                    schedule(DURATION.typedLineGap, () => {
                      typeAerowanderWordmark(onComplete);
                    });
                  });
                });
              });
            });
          });
        });
      });
    };

    const resetSequence = () => {
      clearTimers();
      running = false;
      clearAllLines();
      if (replayButton) {
        replayButton.hidden = true;
        replayButton.classList.remove('is-visible');
      }

      stage.classList.remove(
        'is-seq-arriving',
        'is-seq-left-passenger',
        'is-seq-right-passenger',
        'is-seq-departing'
      );

      [arrivingBoard, connectingBoard, departingBoard, discoverBoard].forEach(hideBoard);
      if (betweenRow) betweenRow.classList.remove('is-seq-visible');
      hideBoard(betweenBoard);
    };

    const runSequence = () => {
      if (running) return;
      running = true;
      clearTimers();
      if (replayButton) {
        replayButton.hidden = true;
        replayButton.classList.remove('is-visible');
      }
      clearAllLines();

      stage.classList.remove(
        'is-seq-arriving',
        'is-seq-left-passenger',
        'is-seq-right-passenger',
        'is-seq-departing'
      );
      void stage.offsetWidth;

      [arrivingBoard, connectingBoard, departingBoard, discoverBoard].forEach(hideBoard);
      if (betweenRow) betweenRow.classList.remove('is-seq-visible');
      hideBoard(betweenBoard);

      // 1 + 2 — arriving aircraft and ARRIVING board at the same time.
      stage.classList.add('is-seq-arriving');
      showBoard(arrivingBoard, 'arriving');

      // 3 — after both arrival animations finish, passenger walks from airport to skyline.
      schedule(DURATION.arrivingMotion, () => {
        stage.classList.add('is-seq-left-passenger');

        // 4 — CONNECTING begins one second after passenger #3 starts.
        schedule(1000, () => {
          showBoard(connectingBoard, 'connecting');

          // Wait 1 second after CONNECTING completes, then start the typed sequence.
          schedule(DURATION.connectingBoard + 1000, () => {
            runTypedMessage(() => {

              // 6 — passenger moves from skyline toward the right airport building.
              stage.classList.add('is-seq-right-passenger');

              schedule(DURATION.rightPassenger, () => {
                // 7 — DEPARTING board begins when the traveler reaches the terminal.
                showBoard(departingBoard, 'departing');

                // 8 — wait one full second before the departing aircraft emerges
                // from behind the right-side terminal/building.
                schedule(1000, () => {
                  stage.classList.add('is-seq-departing');

                  schedule(DURATION.departingMotion, () => {
                    // 9 — first row of flipcards fades/appears.
                    showBoard(discoverBoard, 'discover');

                    schedule(DURATION.discoverBoard, () => {
                      // 10 — BETWEEN FLIGHTS runs internally: left plane, +1 s
                      // right plane, +1 s center traveler/suitcase.
                      if (betweenRow) betweenRow.classList.add('is-seq-visible');
                      showBoard(betweenBoard, 'between');

                      schedule(DURATION.betweenBoard, () => {
                        running = false;
                        try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'wanderports-hero:complete' }, '*'); } catch (error) {}
                        if (replayButton) {
                          replayButton.hidden = false;
                          requestAnimationFrame(() => replayButton.classList.add('is-visible'));
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    };

    // Replay is intentionally limited to the compact control that appears
    // after the complete hero sequence. Clicking the hero itself does nothing.
    replayButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetSequence();
      schedule(60, runSequence);
    });

    const embedded = window.parent && window.parent !== window;

    const playFromParent = (event) => {
      if (!event || !event.data || event.data.type !== 'wanderports-hero:play') return;
      resetSequence();
      schedule(60, runSequence);
    };

    window.addEventListener('message', playFromParent);

    if (embedded) {
      resetSequence();
      try { window.parent.postMessage({ type: 'wanderports-hero:ready' }, '*'); } catch (error) {}
    } else {
      runSequence();
    }
  });
})();
