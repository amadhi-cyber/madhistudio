/* Madhi Studio main landing page interactions.
   Hero timing and accent choreography match the supplied scrollytelling reference. */

const typeLineOneText = document.getElementById("typeLineOneText");
const typeLineTwoBefore = document.getElementById("typeLineTwoBefore");
const typeAccentMessage = document.getElementById("typeAccentMessage");
const typeLineThreeBefore = document.getElementById("typeLineThreeBefore");
const typeAccentAudience = document.getElementById("typeAccentAudience");
const typeLineFourBefore = document.getElementById("typeLineFourBefore");
const typeAccentTime = document.getElementById("typeAccentTime");
const heroPeriod = document.getElementById("heroPeriod");

const typingCursor = document.createElement("span");
typingCursor.className = "typing-cursor";
typingCursor.id = "typingCursor";

const hasTypewriterHero = Boolean(
  typeLineOneText &&
  typeLineTwoBefore &&
  typeAccentMessage &&
  typeLineThreeBefore &&
  typeAccentAudience &&
  typeLineFourBefore &&
  typeAccentTime &&
  heroPeriod
);

const typeSteps = hasTypewriterHero ? [
  { target: typeLineOneText, text: "There’s nothing more powerful", pauseAfterWord: 230, pauseAfterLine: 1250 },
  { target: typeLineTwoBefore, text: "than getting the ", pauseAfterWord: 230, pauseAfterLine: 250 },
  { target: typeAccentMessage, text: "right message", pauseAfterWord: 250, pauseAfterLine: 650, animateAccent: true },
  { target: typeLineThreeBefore, text: "to the ", pauseAfterWord: 230, pauseAfterLine: 250 },
  { target: typeAccentAudience, text: "right audience", pauseAfterWord: 250, pauseAfterLine: 650, animateAccent: true },
  { target: typeLineFourBefore, text: "at the ", pauseAfterWord: 230, pauseAfterLine: 250 },
  { target: typeAccentTime, text: "right time", pauseAfterWord: 250, pauseAfterLine: 650, animateAccent: true, addPeriodAfterAccent: true }
] : [];

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

function wrapAccentLetters(accentElement) {
  const text = accentElement.textContent;
  accentElement.textContent = "";
  const chars = [];

  for (const char of text) {
    const span = document.createElement("span");
    span.className = "accent-char";
    span.textContent = char === " " ? "\u00A0" : char;
    accentElement.appendChild(span);
    chars.push(span);
  }

  accentElement.appendChild(typingCursor);
  return chars;
}

async function animateAccentBackward(accentElement) {
  const chars = wrapAccentLetters(accentElement);

  for (let i = chars.length - 1; i >= 0; i--) {
    accentElement.insertBefore(typingCursor, chars[i]);
    chars[i].classList.add("is-selected");
    await wait(95);
  }

  await wait(260);
  accentElement.classList.add("is-green");
  await wait(260);
  chars[chars.length - 1].insertAdjacentElement("afterend", typingCursor);
  chars.forEach(char => char.classList.remove("is-selected"));
  await wait(450);
}

async function runHeroTypewriter() {
  await blinkBeforeTyping();

  for (const step of typeSteps) {
    await typeInto(step.target, step.text, 72, step.pauseAfterWord);

    if (step.animateAccent) {
      await wait(250);
      await animateAccentBackward(step.target);
    }

    if (step.addPeriodAfterAccent) {
      heroPeriod.textContent = ".";
      typingCursor.remove();
    }

    if (step.pauseAfterLine) {
      await wait(step.pauseAfterLine);
    }
  }
}

if (hasTypewriterHero) runHeroTypewriter();

/* Landing navigation state.
   Home remains the active page pill. The service nav underline follows only the
   featured-work viewport crossing the visual center of the screen, and clears
   immediately outside those four viewports (including after Web Design). */
const homeNavLink = document.querySelector('nav [data-nav="home"]');
const contactNavLink = document.querySelector('nav [data-nav="contact"]');
const serviceNavLinks = [...document.querySelectorAll('nav [data-section-target]')];
const serviceSections = serviceNavLinks
  .map(link => ({ link, section: document.getElementById(link.dataset.sectionTarget) }))
  .filter(item => item.section);
const contactSection = document.getElementById('contact');

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

  if (!currentId && contactSection) {
    const contactRect = contactSection.getBoundingClientRect();
    if (contactRect.top <= probeY && contactRect.bottom > probeY) {
      currentId = 'contact';
    }
  }

  serviceNavLinks.forEach(link => {
    link.classList.toggle('section-current', Boolean(currentId) && link.dataset.sectionTarget === currentId);
  });

  if (contactNavLink) {
    contactNavLink.classList.toggle('section-current', currentId === 'contact');
  }
}

function queueServiceUnderlineUpdate() {
  if (navStateFrame) return;
  navStateFrame = window.requestAnimationFrame(updateServiceUnderline);
}

window.addEventListener('scroll', queueServiceUnderlineUpdate, { passive: true });
window.addEventListener('resize', queueServiceUnderlineUpdate);
window.addEventListener('load', updateServiceUnderline);
updateServiceUnderline();


/* Contact-project brief validation, attachments, and email submission. */
const projectBriefForm = document.getElementById('projectBriefForm');
const briefFormStatus = document.getElementById('briefFormStatus');
const attachmentInput = document.getElementById('briefAttachments');
const attachmentDropzone = document.getElementById('attachmentDropzone');
const attachmentBrowse = document.getElementById('attachmentBrowse');
const attachmentFileList = document.getElementById('attachmentFileList');
const contactSuccessPopup = document.getElementById('contactSuccessPopup');

if (projectBriefForm) {
  const requiredBriefFields = [...projectBriefForm.querySelectorAll('[required]')];
  const submitButton = projectBriefForm.querySelector('.contact-submit');
  let selectedAttachments = [];
  let successTimer = 0;

  function fieldHasValidValue(field) {
    if (!String(field.value || '').trim()) return false;
    return field.checkValidity();
  }

  function updateBriefFieldState(field) {
    const wrapper = field.closest('.contact-field');
    if (!wrapper) return;
    wrapper.classList.toggle('is-valid', fieldHasValidValue(field));
  }

  requiredBriefFields.forEach(field => {
    ['input', 'change', 'blur'].forEach(eventName => {
      field.addEventListener(eventName, () => updateBriefFieldState(field));
    });
    updateBriefFieldState(field);
  });

  function buildProjectBrief() {
    const value = id => document.getElementById(id)?.value?.trim() || '';
    return [
      `Name: ${value('briefName')}`,
      `Email: ${value('briefEmail')}`,
      `Project type: ${value('briefProjectType')}`,
      `Timeline: ${value('briefTimeline')}`,
      '',
      'What I am trying to build or fix:',
      value('briefMessage')
    ].join('\n');
  }

  function renderAttachments() {
    if (!attachmentFileList) return;
    attachmentFileList.textContent = selectedAttachments.length
      ? selectedAttachments.map(file => file.name).join(', ')
      : 'No files added.';
  }

  function addAttachments(files) {
    const incoming = [...(files || [])].filter(file => file instanceof File);
    if (!incoming.length) return;

    const merged = [...selectedAttachments];
    incoming.forEach(file => {
      const duplicate = merged.some(existing =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
      );
      if (!duplicate) merged.push(file);
    });

    const totalBytes = merged.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 10 * 1024 * 1024) {
      if (briefFormStatus) briefFormStatus.textContent = 'Attachments must total 10 MB or less.';
      return;
    }

    selectedAttachments = merged;
    if (briefFormStatus) briefFormStatus.textContent = '';
    renderAttachments();
  }

  if (attachmentBrowse && attachmentInput) {
    attachmentBrowse.addEventListener('click', event => {
      event.preventDefault();
      attachmentInput.click();
    });
    attachmentInput.addEventListener('change', () => {
      addAttachments(attachmentInput.files);
      attachmentInput.value = '';
    });
  }

  if (attachmentDropzone) {
    attachmentDropzone.addEventListener('click', event => {
      if (event.target !== attachmentBrowse) attachmentDropzone.focus();
    });
    attachmentDropzone.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && attachmentInput) {
        event.preventDefault();
        attachmentInput.click();
      }
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      attachmentDropzone.addEventListener(eventName, event => {
        event.preventDefault();
        attachmentDropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      attachmentDropzone.addEventListener(eventName, event => {
        event.preventDefault();
        attachmentDropzone.classList.remove('is-dragover');
      });
    });
    attachmentDropzone.addEventListener('drop', event => addAttachments(event.dataTransfer?.files));
    attachmentDropzone.addEventListener('paste', event => {
      const files = [...(event.clipboardData?.items || [])]
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(Boolean);
      if (files.length) {
        event.preventDefault();
        addAttachments(files);
      }
    });
  }

  function showSuccessPopup() {
    if (!contactSuccessPopup) return;
    window.clearTimeout(successTimer);
    contactSuccessPopup.classList.add('is-visible');
    contactSuccessPopup.setAttribute('aria-hidden', 'false');
    successTimer = window.setTimeout(() => {
      contactSuccessPopup.classList.remove('is-visible');
      contactSuccessPopup.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  if (contactSuccessPopup) {
    contactSuccessPopup.addEventListener('click', () => {
      window.clearTimeout(successTimer);
      contactSuccessPopup.classList.remove('is-visible');
      contactSuccessPopup.setAttribute('aria-hidden', 'true');
    });
  }

  projectBriefForm.addEventListener('submit', async event => {
    event.preventDefault();
    requiredBriefFields.forEach(updateBriefFieldState);

    if (!projectBriefForm.checkValidity()) {
      projectBriefForm.reportValidity();
      if (briefFormStatus) briefFormStatus.textContent = 'Please complete the required fields.';
      return;
    }

    if (briefFormStatus) briefFormStatus.textContent = 'Sending…';
    if (submitButton) submitButton.disabled = true;

    const formData = new FormData(projectBriefForm);
    formData.delete('attachment');
    selectedAttachments.forEach(file => formData.append('attachment', file, file.name));
    formData.append('project_brief', buildProjectBrief());

    try {
      const response = await fetch('https://formsubmit.co/ajax/info@madhistudio.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      let result = null;
      try { result = await response.json(); } catch (error) { result = null; }
      if (!response.ok || result?.success === false) throw new Error('Submission failed');

      if (briefFormStatus) briefFormStatus.textContent = '';
      showSuccessPopup();
      projectBriefForm.reset();
      selectedAttachments = [];
      renderAttachments();
      requiredBriefFields.forEach(updateBriefFieldState);
    } catch (error) {
      if (briefFormStatus) briefFormStatus.textContent = 'Unable to send. Please email info@madhistudio.com directly.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  renderAttachments();
}
