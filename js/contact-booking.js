/* Madhi Studio contact tabs and meeting-request controls.
   Uses the existing projectBriefForm and its existing FormSubmit handler.
   A preferred time is a request, never a confirmed booking. */
(() => {
  'use strict';
  const form = document.getElementById('projectBriefForm');
  const contact = document.getElementById('contact');
  if (!form || !contact) return;

  const tabs = [...form.querySelectorAll('.madhi-contact-tab')];
  const picker = document.getElementById('madhiMeetingPicker');
  const panel = document.getElementById('madhiMeetingPanel');
  const fields = document.getElementById('madhiBookingFields');
  const typeInput = document.getElementById('briefMeetingType');
  const lengthInput = document.getElementById('briefMeetingDuration');
  const dateInput = document.getElementById('briefMeetingDate');
  const timeInput = document.getElementById('briefMeetingTime');
  const status = document.getElementById('briefFormStatus');
  const subject = form.querySelector('input[name="_subject"]');
  const bookingControls = [...fields.querySelectorAll('input, select, textarea')];
  const durationButtons = [...picker.querySelectorAll('.madhi-duration-rail [data-minutes]')];

  const types = Object.freeze({
    discovery: { label: 'Madhi Studio Discovery Call', durations: [30, 45, 60] },
    inperson: { label: 'In-person meeting', durations: [60] },
    partnership: { label: 'Partnership & Opportunity Review', durations: [15, 30, 45, 60] },
    review: { label: 'Client Review & Next Steps Meeting', durations: [30, 45] }
  });
  let meeting = null;
  let length = null;

  function easternNow() {
    const tokens = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const value = name => tokens.find(token => token.type === name)?.value || '00';
    return { date: `${value('year')}-${value('month')}-${value('day')}`,
             time: `${value('hour')}:${value('minute')}` };
  }

  function validatePreferredTime() {
    timeInput.setCustomValidity('');
    const now = easternNow();
    if (dateInput.value === now.date && timeInput.value && timeInput.value <= now.time) {
      timeInput.setCustomValidity('Choose a future time in Eastern Time.');
    }
  }

  function updateSelection(type, minutes) {
    const definition = types[type];
    if (!definition) return;
    const minutesNumber = Number(minutes);
    if (!definition.durations.includes(minutesNumber)) return;
    meeting = type;
    length = minutesNumber;
    typeInput.value = definition.label;
    lengthInput.disabled = false;
    lengthInput.value = String(length);
    durationButtons.forEach(button => {
      const minutes = Number(button.dataset.minutes);
      const permitted = definition.durations.includes(minutes);
      button.disabled = !permitted;
      button.setAttribute('aria-pressed', String(permitted && minutes === length));
    });
    form.querySelectorAll('.madhi-meeting-choice').forEach(card => {
      const selected = card.dataset.meeting === type;
      card.classList.toggle('is-selected', selected);
      card.querySelector('.madhi-meeting-select')?.setAttribute('aria-pressed', String(selected));
    });
    if (status) status.textContent = '';
  }

  function setMode(mode, focus = false) {
    const scheduling = mode === 'meeting';
    form.dataset.contactMode = scheduling ? 'meeting' : 'inquiry';
    contact.classList.toggle('is-meeting-mode', scheduling);
    panel.hidden = !scheduling;
    picker.hidden = !scheduling;
    fields.hidden = !scheduling;
    if (!scheduling) closeCalendar();
    tabs.forEach(tab => {
      const selected = tab.dataset.contactMode === mode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    bookingControls.forEach(control => { control.disabled = !scheduling; });
    if (scheduling) {
      dateInput.min = easternNow().date;
      lengthInput.disabled = !meeting;
      if (subject) subject.value = 'Madhi Studio — Meeting Request';
      validatePreferredTime();
    } else {
      timeInput.setCustomValidity('');
      if (subject) subject.value = 'Madhi Studio — Project Brief';
    }
    if (status) status.textContent = '';
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setMode(tab.dataset.contactMode));
    tab.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setMode(tabs[next].dataset.contactMode, true);
    });
  });

  picker.querySelectorAll('.madhi-meeting-choice').forEach(card => {
    const type = card.dataset.meeting;
    card.querySelector('.madhi-meeting-select')?.addEventListener('click', () => {
      const saved = meeting === type && types[type].durations.includes(length) ? length : types[type].durations[0];
      updateSelection(type, saved);
    });
  });

  durationButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (meeting && !button.disabled) updateSelection(meeting, button.dataset.minutes);
    });
  });
  // A controlled calendar avoids the platform's unstyleable blue/red date picker.
  const dateTrigger = document.getElementById('madhiDateTrigger');
  const dateValue = document.getElementById('madhiDateValue');
  const dateCalendar = document.getElementById('madhiDateCalendar');
  const dateMonth = document.getElementById('madhiCalendarMonth');
  const dateDays = document.getElementById('madhiCalendarDays');
  const dateClear = document.getElementById('madhiCalendarClear');
  let calendarYear = 0;
  let calendarMonth = 0;
  const formatISO = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  function syncDateText() {
    if (!dateInput.value) { dateValue.textContent = 'mm/dd/yyyy'; return; }
    const [y,m,d] = dateInput.value.split('-');
    dateValue.textContent = `${m}/${d}/${y}`;
  }
  function closeCalendar(refocus = false) {
    dateCalendar.hidden = true;
    dateTrigger.setAttribute('aria-expanded', 'false');
    if (refocus) dateTrigger.focus();
  }
  function renderCalendar() {
    const first = new Date(calendarYear,calendarMonth,1);
    const daysInMonth = new Date(calendarYear,calendarMonth+1,0).getDate();
    const today = easternNow().date;
    dateMonth.textContent = new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric'}).format(first);
    dateDays.replaceChildren();
    for(let i=0;i<first.getDay();i++){
      const blank=document.createElement('span');blank.className='madhi-calendar-empty';
      blank.setAttribute('aria-hidden','true');dateDays.appendChild(blank);
    }
    for(let day=1;day<=daysInMonth;day++){
      const iso=formatISO(calendarYear,calendarMonth,day);
      const button=document.createElement('button');button.type='button';button.textContent=String(day);
      button.dataset.date=iso;
      button.dataset.weekend=String(new Date(calendarYear,calendarMonth,day).getDay() % 6 === 0);
      button.setAttribute('aria-label',new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date(calendarYear,calendarMonth,day)));
      button.setAttribute('aria-pressed',String(dateInput.value===iso));
      button.disabled=iso<today;
      button.addEventListener('click',()=>{
        dateInput.value=iso;
        dateInput.setCustomValidity('');
        syncDateText();
        dateInput.dispatchEvent(new Event('change',{bubbles:true}));
        closeCalendar(true);
        if(status)status.textContent='';
      });
      dateDays.appendChild(button);
    }
  }
  function openCalendar() {
    if(form.dataset.contactMode !== 'meeting')return;
    const anchor=dateInput.value || easternNow().date;
    const [y,m]=anchor.split('-').map(Number);
    calendarYear=y;calendarMonth=m-1;
    renderCalendar();dateCalendar.hidden=false;
    dateTrigger.setAttribute('aria-expanded','true');
  }
  dateTrigger.addEventListener('click',()=>dateCalendar.hidden ? openCalendar() : closeCalendar());
  dateTrigger.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown' || e.key==='Enter' || e.key===' '){
      if(dateCalendar.hidden){e.preventDefault();openCalendar();}
    }
  });
  dateCalendar.querySelectorAll('[data-calendar-move]').forEach(button=>button.addEventListener('click',()=>{
    calendarMonth+=Number(button.dataset.calendarMove);
    if(calendarMonth<0){calendarMonth=11;calendarYear--;}
    if(calendarMonth>11){calendarMonth=0;calendarYear++;}
    renderCalendar();
  }));
  dateClear.addEventListener('click',()=>{
    dateInput.value='';syncDateText();
    dateInput.dispatchEvent(new Event('change',{bubbles:true}));
    closeCalendar(true);
  });
  document.addEventListener('pointerdown',event=>{
    if(!dateCalendar.hidden && !dateCalendar.contains(event.target) && !dateTrigger.contains(event.target))closeCalendar();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && !dateCalendar.hidden)closeCalendar(true);
  });
  // In a required-date error, focus the visible date trigger rather than an
  // inaccessible native date input. The existing form checks remain unchanged.
  form.addEventListener('submit',event=>{
    if(form.dataset.contactMode !== 'meeting')return;
    if(!dateInput.value){
      event.preventDefault();event.stopImmediatePropagation();
      if(status)status.textContent='Please select a preferred date.';
      dateTrigger.focus();openCalendar();
    }
  },true);
  document.addEventListener('madhi:contact-form-sent',()=>{
    syncDateText();closeCalendar();
  });
  syncDateText();

  dateInput.addEventListener('change', validatePreferredTime);
  timeInput.addEventListener('change', validatePreferredTime);
  timeInput.addEventListener('input', validatePreferredTime);
  form.addEventListener('submit', () => {
    if (form.dataset.contactMode === 'meeting') {
      dateInput.min = easternNow().date;
      validatePreferredTime();
    }
  }, true);

  document.addEventListener('madhi:contact-form-sent', () => {
    meeting = null;
    length = null;
    typeInput.value = '';
    lengthInput.value = '';
    durationButtons.forEach(button => { button.disabled = true; button.setAttribute('aria-pressed', 'false'); });
    form.querySelectorAll('.madhi-meeting-choice').forEach(card => {
      card.classList.remove('is-selected');
      card.querySelector('.madhi-meeting-select')?.setAttribute('aria-pressed', 'false');
    });
    setMode(form.dataset.contactMode);
  });

  setMode('inquiry');
})();
