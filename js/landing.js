/* Madhi Studio main landing page interactions.
   Hero timing and accent choreography match the supplied scrollytelling reference. */

const typeLineOneText = document.getElementById("typeLineOneText");
const typeLineTwoBefore = document.getElementById("typeLineTwoBefore");
const typeAccent = document.getElementById("typeAccent");
const typeLineThreeText = document.getElementById("typeLineThreeText");
const heroPeriod = document.getElementById("heroPeriod");

const typingCursor = document.createElement("span");
typingCursor.className = "typing-cursor";
typingCursor.id = "typingCursor";

const typeSteps = [
  { target: typeLineOneText, text: "There’s nothing more powerful", pauseAfterWord: 230, pauseAfterLine: 1250 },
  { target: typeLineTwoBefore, text: "than getting the ", pauseAfterWord: 230, pauseAfterLine: 350 },
  { target: typeAccent, text: "right message", pauseAfterWord: 250, pauseAfterLine: 700, animateAccent: true },
  { target: typeLineThreeText, text: "to your audience", pauseAfterWord: 250, pauseAfterLine: 900, addPeriod: true }
];

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function placeCursorInside(target) {
  target.appendChild(typingCursor);
}

async function blinkBeforeTyping() {
  typeLineOneText.textContent = "";
  placeCursorInside(typeLineOneText);
  await wait(3900);
}

async function typeInto(target, textToType, speed = 72, pauseAfterWord = 230) {
  let typedText = "";
  placeCursorInside(target);

  for (const char of textToType) {
    typedText += char;
    target.textContent = typedText;
    placeCursorInside(target);
    await wait(char === " " ? pauseAfterWord : speed);
  }
}

function wrapAccentLetters() {
  const text = typeAccent.textContent;
  typeAccent.textContent = "";
  const chars = [];

  for (const char of text) {
    const span = document.createElement("span");
    span.className = "accent-char";
    span.textContent = char === " " ? "\u00A0" : char;
    typeAccent.appendChild(span);
    chars.push(span);
  }

  typeAccent.appendChild(typingCursor);
  return chars;
}

async function animateRightMessageBackward() {
  const chars = wrapAccentLetters();

  for (let i = chars.length - 1; i >= 0; i--) {
    typeAccent.insertBefore(typingCursor, chars[i]);
    chars[i].classList.add("is-selected");
    await wait(95);
  }

  await wait(260);
  typeAccent.classList.add("is-green");
  await wait(260);
  chars[chars.length - 1].insertAdjacentElement("afterend", typingCursor);
  chars.forEach(char => char.classList.remove("is-selected"));
  await wait(450);
}

async function runHeroTypewriter() {
  await blinkBeforeTyping();

  for (const step of typeSteps) {
    await typeInto(step.target, step.text, 72, step.pauseAfterWord);

    if (step.addPeriod) {
      heroPeriod.textContent = ".";
      heroPeriod.appendChild(typingCursor);
    }

    if (step.animateAccent) {
      await wait(250);
      await animateRightMessageBackward();
    }

    if (step.pauseAfterLine) {
      await wait(step.pauseAfterLine);
    }
  }

  heroPeriod.appendChild(typingCursor);
}

runHeroTypewriter();

/* Landing navigation state.
   Home remains the active page pill. The service nav underline follows only the
   featured-work viewport crossing the visual center of the screen, and clears
   immediately outside those four viewports (including after Web Design). */
const homeNavLink = document.querySelector('nav [data-nav="home"]');
const serviceNavLinks = [...document.querySelectorAll('nav [data-section-target]')];
const serviceSections = serviceNavLinks
  .map(link => ({ link, section: document.getElementById(link.dataset.sectionTarget) }))
  .filter(item => item.section);

if (homeNavLink) homeNavLink.classList.add('active');

let navStateFrame = 0;

function updateServiceUnderline() {
  navStateFrame = 0;
  const probeY = window.innerHeight * 0.5;
  let currentId = '';

  for (const { section } of serviceSections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= probeY && rect.bottom > probeY) {
      currentId = section.id;
      break;
    }
  }

  serviceNavLinks.forEach(link => {
    link.classList.toggle('section-current', Boolean(currentId) && link.dataset.sectionTarget === currentId);
  });
}

function queueServiceUnderlineUpdate() {
  if (navStateFrame) return;
  navStateFrame = window.requestAnimationFrame(updateServiceUnderline);
}

window.addEventListener('scroll', queueServiceUnderlineUpdate, { passive: true });
window.addEventListener('resize', queueServiceUnderlineUpdate);
window.addEventListener('load', updateServiceUnderline);
updateServiceUnderline();

