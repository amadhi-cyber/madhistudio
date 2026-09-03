(() => {
  'use strict';

  function onReady(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function setupReveal(){
    const rows=[...document.querySelectorAll('.print-row')];
    if(!rows.length) return;
    if(!('IntersectionObserver' in window)){ rows.forEach(r=>r.classList.add('reveal')); return; }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('reveal'); observer.unobserve(entry.target); } });
    },{threshold:.12});
    rows.forEach(row=>observer.observe(row));
  }

  // ---------------- Split-flap ----------------
  function setupSplitFlap(){
    const host=document.getElementById('splitFlapInline');
    const input=document.getElementById('cityInput');
    if(!host || !input) return;

    const cityField=host.querySelector('#cityFlaps');
    const statusField=host.querySelector('#statusFlaps');
    const stairField=host.querySelector('#stairFlaps');
    const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const DIGITS='0123456789';
    const tickMs=45;
    let runToken=0;

    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

    const normalize=(value,slots)=>String(value||'')
      .toUpperCase()
      .replace(/[^A-Z0-9 -]/g,' ')
      .slice(0,slots)
      .padEnd(slots,' ');

    const boardValue=(field,value)=>{
      const slots=Math.max(1,Number(field?.dataset.slots)||1);
      const pad=Math.max(0,Number(field?.dataset.pad)||0);
      const core=normalize(value,slots);
      return `${' '.repeat(pad)}${core}${' '.repeat(pad)}`;
    };

    function cellMarkup(ch){
      const safe=ch===' ' ? '&nbsp;' : ch;
      return `
        <div class="solari-half top"><span class="solari-glyph">${safe}</span></div>
        <div class="solari-half bottom"><span class="solari-glyph">${safe}</span></div>
        <div class="solari-motion top"><span class="solari-glyph">${safe}</span></div>
        <div class="solari-motion bottom"><span class="solari-glyph">${safe}</span></div>`;
    }

    function buildField(field){
      if(!field) return;
      const value=boardValue(field,field.dataset.solariValue);
      field.innerHTML='';
      [...value].forEach(ch=>{
        // Every character position is its own independent split-flap pair.
        const cell=document.createElement('span');
        cell.className='solari-cell';
        cell.dataset.char=ch;
        cell.innerHTML=cellMarkup(ch);
        field.appendChild(cell);
      });
    }

    function setGlyph(node,ch){
      if(node) node.textContent=ch===' ' ? '\u00A0' : ch;
    }

    function setCellImmediate(cell,ch){
      if(!cell) return;
      cell.classList.remove('is-flipping');
      cell.dataset.char=ch;
      cell.querySelectorAll('.solari-glyph').forEach(node=>setGlyph(node,ch));
    }

    async function flipOne(cell,next,token){
      if(!cell || token!==runToken) return false;
      const old=cell.dataset.char||' ';
      if(old===next) return true;

      const staticTop=cell.querySelector('.solari-half.top .solari-glyph');
      const staticBottom=cell.querySelector('.solari-half.bottom .solari-glyph');
      const motionTop=cell.querySelector('.solari-motion.top .solari-glyph');
      const motionBottom=cell.querySelector('.solari-motion.bottom .solari-glyph');

      // Each slot owns its own top/bottom pair. The outgoing top half flips away
      // while the incoming bottom half receives the next character.
      setGlyph(staticTop,next);
      setGlyph(staticBottom,old);
      setGlyph(motionTop,old);
      setGlyph(motionBottom,next);

      cell.classList.remove('is-flipping');
      void cell.offsetWidth;
      cell.classList.add('is-flipping');
      await wait(tickMs);
      if(token!==runToken) return false;

      cell.dataset.char=next;
      setGlyph(staticTop,next);
      setGlyph(staticBottom,next);
      setGlyph(motionTop,next);
      setGlyph(motionBottom,next);
      cell.classList.remove('is-flipping');
      return true;
    }

    function orderedSequence(from,to){
      if(from===to) return [];

      // Letters advance only through A → B → ... → Z → A.
      if(LETTERS.includes(to)){
        let index=LETTERS.indexOf(from);
        if(index<0) index=LETTERS.length-1; // next step becomes A
        const target=LETTERS.indexOf(to);
        const sequence=[];
        let guard=0;
        while(index!==target && guard<LETTERS.length){
          index=(index+1)%LETTERS.length;
          sequence.push(LETTERS[index]);
          guard++;
        }
        return sequence;
      }

      // Numbers advance only through 0 → 1 → ... → 9 → 0.
      if(DIGITS.includes(to)){
        let index=DIGITS.indexOf(from);
        if(index<0) index=DIGITS.length-1; // next step becomes 0
        const target=DIGITS.indexOf(to);
        const sequence=[];
        let guard=0;
        while(index!==target && guard<DIGITS.length){
          index=(index+1)%DIGITS.length;
          sequence.push(DIGITS[index]);
          guard++;
        }
        return sequence;
      }

      // Blank and hyphen are terminal board positions rather than part of either wheel.
      return [to];
    }

    async function animateFieldOneCellAtATime(field,value,token){
      if(!field) return true;
      const cells=[...field.querySelectorAll('.solari-cell')];
      const target=boardValue(field,value);

      for(let index=0; index<cells.length; index++){
        if(token!==runToken) return false;
        const cell=cells[index];
        const targetChar=target[index];
        const sequence=orderedSequence(cell.dataset.char||' ',targetChar);

        // Finish the complete A-Z or 0-9 sequence for this character before
        // the next character position starts moving.
        for(let step=0; step<sequence.length; step++){
          if(token!==runToken) return false;
          const ok=await flipOne(cell,sequence[step],token);
          if(!ok) return false;
        }
      }

      field.dataset.solariValue=String(value||'').toUpperCase();
      return true;
    }

    host.querySelectorAll('.solari-field[data-solari-value]').forEach(buildField);

    window.updateBoard=async()=>{
      const token=++runToken;
      const city=(input.value.trim()||'PHILADELPHIA').toUpperCase();
      const statuses=['BOARDING','ON TIME','DELAYED','ARRIVING'];
      const status=statuses[Math.floor(Math.random()*statuses.length)];
      const stair=String(Math.floor(Math.random()*9)+1);

      statusField?.classList.toggle('is-yellow',status==='BOARDING');

      // One physical character card moves at a time across the editable row.
      if(!await animateFieldOneCellAtATime(cityField,city,token)) return;
      if(!await animateFieldOneCellAtATime(statusField,status,token)) return;
      if(!await animateFieldOneCellAtATime(stairField,stair,token)) return;
    };

    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        window.updateBoard();
      }
    });
  }

  // ---------------- Turntable ----------------
  function setupTurntable(){
    const host=document.getElementById('turntableInline');
    const scene=host?.querySelector('#turntableScene');
    const tonearm=host?.querySelector('#tonearm');
    const physical=host?.querySelector('#startStopPhysical');
    const buttonMessage=host?.querySelector('#buttonMessage');
    const button=document.getElementById('turntableStartButton');
    const audio=document.getElementById('recordAudio');
    if(!host||!scene||!tonearm||(!physical&&!button)) return;

    const style=document.createElement('style');
    style.textContent=`
      #turntableInline{width:90%;height:90%;display:flex;align-items:center;justify-content:center}
      #turntableInline>svg{width:100%;height:100%;display:block}
      #turntableScene #platterSpin{transform-origin:248px 258px;transform-box:view-box}
      #turntableScene.is-playing #platterSpin,#turntableScene.is-starting #platterSpin{animation:madhiRecordSpin 2.4s linear infinite}
      @keyframes madhiRecordSpin{to{transform:rotate(360deg)}}
      #turntableScene #tonearm{transform-origin:465px 163px;transform-box:view-box;transition:transform 1.35s cubic-bezier(.22,.8,.22,1)}
      #turntableScene .button-face{fill:#9FDEA8!important;animation:madhiButtonBlink 1.1s ease-in-out infinite}
      #turntableScene.is-playing .button-face,#turntableScene.is-starting .button-face{fill:#EC8585!important}
      @keyframes madhiButtonBlink{0%,100%{opacity:1}50%{opacity:.55}}
      #turntableScene.arm-lifted #tonearm{transform:translateY(-12px) rotate(0deg)}
      #turntableScene.arm-over #tonearm{transform:translateY(-12px) rotate(24deg)}
      #turntableScene.arm-dropped #tonearm{transform:translateY(0) rotate(24deg)}
    `;
    document.head.appendChild(style);

    let playing=false,moving=false,timers=[];
    const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);};
    const clear=()=>{timers.forEach(clearTimeout);timers=[]};
    async function primeAudio(){
      if(!audio) return;
      try{audio.muted=true; await audio.play(); audio.pause(); audio.currentTime=0; audio.muted=false;}catch(e){audio.muted=false;}
    }
    function stopAudio(){if(!audio)return; audio.pause(); audio.currentTime=0;}
    function setArm(state){scene.classList.remove('arm-lifted','arm-over','arm-dropped'); if(state) scene.classList.add(state);}
    function setExternalButton(text){ if(button) button.textContent=text; }
    function setPhysicalText(text){ if(buttonMessage) buttonMessage.textContent=text; }
    async function start(){
      if(moving||playing)return; clear(); moving=true; await primeAudio();
      scene.classList.add('is-starting'); setExternalButton('Starting…'); setPhysicalText('START'); setArm('arm-lifted');
      later(()=>setArm('arm-over'),800);
      later(()=>setArm('arm-dropped'),2400);
      later(async()=>{moving=false;playing=true;scene.classList.remove('is-starting');scene.classList.add('is-playing');setExternalButton('STOP');setPhysicalText('STOP'); if(audio){audio.muted=false;try{await audio.play();}catch(e){console.warn('Audio could not play:',e);}}},3550);
    }
    function stop(){
      if(moving||!playing)return; clear(); moving=true;playing=false;stopAudio();scene.classList.remove('is-playing');scene.classList.add('is-starting');setExternalButton('Stopping…');setPhysicalText('STOP');setArm('arm-over');
      later(()=>setArm('arm-lifted'),1150);
      later(()=>{setArm('');scene.classList.remove('is-starting');moving=false;setExternalButton('START');setPhysicalText('START');},2400);
    }
    const toggle=()=>playing?stop():start();
    button?.addEventListener('click',toggle); physical?.addEventListener('click',toggle);
  }

  // ---------------- Evacuation plan ----------------
  function setupEvacuation(){
    const host=document.getElementById('evacuationInline');
    const svg=host?.querySelector('#evacuationPlan');
    const demo=document.getElementById('evacuationDemo');
    const buttons=[...document.querySelectorAll('.evacuation-room-btn[data-room]')];
    const dark=document.getElementById('evacuationDarkBtn');
    const reset=document.getElementById('evacuationResetBtn');
    if(!host||!svg||!demo)return;
    host.style.width='100%';host.style.height='100%';host.style.display='flex';
    svg.style.width='100%';svg.style.height='100%';svg.style.display='block';
    const rooms=[...svg.querySelectorAll('.evac-room[data-room]')];
    const select=(name)=>{
      rooms.forEach(r=>r.classList.toggle('active',r.dataset.room===name));
      buttons.forEach(b=>b.classList.toggle('active',b.dataset.room===name));
    };
    rooms.forEach(room=>{
      room.addEventListener('click',()=>select(room.dataset.room));
      room.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(room.dataset.room)}});
    });
    buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.room)));
    dark?.addEventListener('click',()=>{const on=svg.classList.toggle('dark');demo.classList.toggle('dark',on);dark.textContent=on?'Light':'Dark';});
    reset?.addEventListener('click',()=>select(''));
  }

  // ---------------- Soccer pitch ----------------
  function setupSoccer(){
    const host=document.getElementById('soccerPitchInline');
    const svg=host?.querySelector('svg');
    const button=document.getElementById('soccerPitchStartButton');
    if(!host||!svg||!button)return;
    host.style.width='100%';host.style.height='100%';host.style.display='flex';host.style.alignItems='center';host.style.justifyContent='center';
    svg.style.width='100%';svg.style.height='100%';svg.style.display='block';

    const NS='http://www.w3.org/2000/svg';
    const layer=document.createElementNS(NS,'g'); layer.setAttribute('id','formationLayer');
    svg.appendChild(layer);

    const mkText=(x,y,text,anchor='middle')=>{
      const t=document.createElementNS(NS,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('text-anchor',anchor);t.setAttribute('font-family','Arial,sans-serif');t.setAttribute('font-size','8');t.setAttribute('font-weight','700');t.setAttribute('fill','#fff');t.textContent=text;return t;
    };
    const formations={
      red:[
        [28,134,'GK'],
        [88,48,''],[88,104,''],[88,165,''],[88,221,''],
        [150,72,''],[150,134,''],[150,198,''],
        [210,62,''],[210,134,''],[210,208,'']
      ],
      blue:[
        [465,134,'GK'],
        [404,76,''],[404,134,''],[404,192,''],
        [346,42,''],[346,88,''],[346,134,''],[346,180,''],[346,226,''],
        [288,98,''],[288,172,'']
      ],
      /* After the whistle the goalkeepers stay home while the six outfield
         lines interleave evenly across the pitch:
         RED 4 → BLUE 2 → RED 3 → BLUE 5 → RED 3 → BLUE 3. */
      
redFace:[
        [28,134,'GK'],
        /* RED 4 stays in its original back-line position. */
        [88,48,''],[88,104,''],[88,165,''],[88,221,''],
        /* RED 3 becomes the third alternating line. */
        [214.4,72,''],[214.4,134,''],[214.4,198,''],
        /* RED 3 becomes the fifth alternating line. */
        [340.8,62,''],[340.8,134,''],[340.8,208,'']
      ],
      blueFace:[
        [465,134,'GK'],
        /* BLUE 3 stays in its original back-line position. */
        [404,76,''],[404,134,''],[404,192,''],
        /* BLUE 5 becomes the fourth alternating line. */
        [277.6,42,''],[277.6,88,''],[277.6,134,''],[277.6,180,''],[277.6,226,''],
        /* BLUE 2 becomes the second alternating line. */
        [151.2,98,''],[151.2,172,'']
      ]
    };

    const players=[];
    function addTeam(team,color,positions,label,xLabel,anchor){
      const labelText=document.createElementNS(NS,'text');labelText.setAttribute('x',xLabel);labelText.setAttribute('y','20');labelText.setAttribute('text-anchor',anchor);labelText.setAttribute('font-family','Arial,sans-serif');labelText.setAttribute('font-size','12');labelText.setAttribute('font-weight','800');labelText.setAttribute('fill',color);labelText.textContent=label;layer.appendChild(labelText);
      positions.forEach((pos,i)=>{
        const g=document.createElementNS(NS,'g');g.dataset.team=team;g.dataset.index=i;
        const c=document.createElementNS(NS,'circle');c.setAttribute('r',i===0?'7':'6');c.setAttribute('fill',color);c.setAttribute('stroke','#fff');c.setAttribute('stroke-width','1.6');
        g.appendChild(c);if(pos[2])g.appendChild(mkText(0,2.7,pos[2]));
        layer.appendChild(g);players.push({g,team,index:i,x:pos[0],y:pos[1]});
        g.setAttribute('transform',`translate(${pos[0]} ${pos[1]})`);
      });
    }
    addTeam('red','#e03131',formations.red,'4-3-3',123.25,'middle');
    addTeam('blue','#2563eb',formations.blue,'3-5-2',369.75,'middle');

    let facing=false,raf=0;
    function animateTo(targetRed,targetBlue){
      cancelAnimationFrame(raf);
      const start=performance.now();const duration=950;
      const starts=players.map(p=>({x:p.x,y:p.y}));
      const targets=players.map(p=> (p.team==='red'?targetRed:targetBlue)[p.index]);
      const ease=t=>1-Math.pow(1-t,3);
      const frame=now=>{
        const t=Math.min(1,(now-start)/duration),e=ease(t);
        players.forEach((p,i)=>{
          const tx=targets[i][0],ty=targets[i][1];const x=starts[i].x+(tx-starts[i].x)*e;const y=starts[i].y+(ty-starts[i].y)*e;
          p.g.setAttribute('transform',`translate(${x} ${y})`);if(t===1){p.x=tx;p.y=ty;}
        });
        if(t<1) raf=requestAnimationFrame(frame);
      };raf=requestAnimationFrame(frame);
    }
    function whistle(){
      try{
        const ctx=new (window.AudioContext||window.webkitAudioContext)();const now=ctx.currentTime;
        const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(1850,now);osc.frequency.linearRampToValueAtTime(2250,now+.15);osc.frequency.linearRampToValueAtTime(1780,now+.42);
        gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.07,now+.02);gain.gain.setValueAtTime(.07,now+.28);gain.gain.exponentialRampToValueAtTime(.0001,now+.5);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.52);
      }catch(e){}
    }
    button.textContent='Blow Whistle';
    button.addEventListener('click',()=>{
      facing=!facing; whistle();
      animateTo(facing?formations.redFace:formations.red,facing?formations.blueFace:formations.blue);
      button.textContent=facing?'Reset Formations':'Blow Whistle';button.classList.toggle('is-active',facing);
    });
  }

  onReady(()=>{setupReveal();setupSplitFlap();setupTurntable();setupEvacuation();setupSoccer();});
})();
