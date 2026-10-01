const smallScreen=matchMedia('(max-width:800px)'),touchDevice=matchMedia('(hover:none)');
const stage=document.querySelector('#hero-touch'),sparkCanvas=document.querySelector('#hero-sparks'),sparkCtx=sparkCanvas.getContext('2d');
const dock=document.querySelector('.mobile-dock'),sheet=document.querySelector('#section-menu'),openSections=document.querySelector('#open-sections'),closeSections=document.querySelector('#close-sections');
const sectionIds=['discover','community','incubator','program','campus','roadmap','connections','team','approach','questions'];
const pageSections=sectionIds.map(id=>document.getElementById(id));
let activeSection=-1,updateFrame=null,bodyOverflow='',sparkFrame=null,sparkTimer=null;

function interactionLanguage(){
 const en=document.documentElement.lang==='en';
 stage.setAttribute('aria-label',en?'Tap the network to spark connections':'Ağa dokun ve bağlantıları canlandır');
 dock.setAttribute('aria-label',en?'Navigate between sections':'Bölümler arasında gezinme');
 closeSections.setAttribute('aria-label',en?'Close section menu':'Bölüm menüsünü kapat');
 document.querySelector('.section-menu-links').setAttribute('aria-label',en?'All sections':'Tüm bölümler');
 updatePositionLabel();schedulePageUpdate();
}
document.addEventListener('languagechange',interactionLanguage);
function updatePositionLabel(){
 const en=document.documentElement.lang==='en',link=sheet.querySelector('[aria-current=location]');
 document.querySelector('#menu-position').textContent=link?String(activeSection+1).padStart(2,'0')+' / 10 · '+link.querySelector('[data-tr]').textContent:(en?'10 sections. One shared vision.':'10 bölüm. Ortak bir vizyon.');
}
function syncStagePosition(){if(smallScreen.matches)hero.style.setProperty('--hero-art-top',stage.offsetTop+'px');else hero.style.removeProperty('--hero-art-top');}
new ResizeObserver(syncStagePosition).observe(document.querySelector('.hero-content'));
new ResizeObserver(syncStagePosition).observe(stage);
syncStagePosition();

function updatePage(){
 updateFrame=null;
 const top=window.scrollY,max=document.documentElement.scrollHeight-innerHeight;
 document.documentElement.style.setProperty('--read-progress',String(Math.max(0,Math.min(1,max>0?top/max:0))));
 let index=-1;pageSections.forEach((section,i)=>{if(section.getBoundingClientRect().top<innerHeight*.34)index=i;});
 if(index!==activeSection){
  activeSection=index;const id=sectionIds[index];
  document.querySelectorAll('[data-dock-link],[data-menu-section]').forEach(link=>{if((link.dataset.dockLink||link.dataset.menuSection)===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  openSections.classList.toggle('is-current',index>=0&&!['discover','program','team'].includes(id));updatePositionLabel();
 }
 if(!reduced.matches&&!smallScreen.matches&&top<hero.offsetHeight)hero.style.setProperty('--scroll-shift',Math.min(top*.045,28)+'px');
}
function schedulePageUpdate(){if(updateFrame===null)updateFrame=requestAnimationFrame(updatePage);}
addEventListener('scroll',schedulePageUpdate,{passive:true});addEventListener('resize',()=>{syncStagePosition();schedulePageUpdate();},{passive:true});
document.addEventListener('tabchange',schedulePageUpdate);
document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',schedulePageUpdate));
document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',schedulePageUpdate));

openSections.addEventListener('click',()=>{
 if(sheet.open)return;bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';sheet.showModal();openSections.setAttribute('aria-expanded','true');updatePositionLabel();
 const current=sheet.querySelector('[aria-current=location]');if(current)current.scrollIntoView({block:'nearest',behavior:'instant'});closeSections.focus();
});
closeSections.addEventListener('click',()=>sheet.close());
sheet.addEventListener('close',()=>{document.body.style.overflow=bodyOverflow;openSections.setAttribute('aria-expanded','false');openSections.focus({preventScroll:true});});
sheet.addEventListener('click',event=>{if(event.target!==sheet)return;const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();});
sheet.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const target=document.querySelector(link.getAttribute('href'));sheet.close();requestAnimationFrame(()=>{target.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});try{history.replaceState(null,'',location.pathname+location.search+link.getAttribute('href'));}catch{}});}));
smallScreen.addEventListener('change',()=>{if(sheet.open&&!smallScreen.matches)sheet.close();syncStagePosition();});

// Horizontal gestures are optional; vertical scrolling and pinch zoom stay native.
function makeSwipeArea(area,key){
 let start=null;
 area.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.target.closest('a,button,summary,input,select'))return;start={id:e.pointerId,x:e.clientX,y:e.clientY};},{passive:true});
 function finish(e){if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.6)return;const group=tabControllers[key],index=group.buttons.findIndex(b=>b.getAttribute('aria-selected')==='true');const next=index+(dx<0?1:-1);group.select(key==='step'?Math.max(0,Math.min(group.buttons.length-1,next)):next);}
 addEventListener('pointerup',finish,{passive:true});addEventListener('pointercancel',()=>start=null,{passive:true});
}
makeSwipeArea(document.querySelector('.step-panels'),'step');
document.querySelectorAll('.track-panel').forEach(panel=>makeSwipeArea(panel,'track'));
makeSwipeArea(document.querySelector('.campus-visual'),'discipline');

// Card light follows the reader on touch screens, without requiring an extra tap.
const focusCards=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('in-focus',touchDevice.matches&&entry.isIntersecting)),{rootMargin:'-28% 0px -28% 0px',threshold:.12});
document.querySelectorAll('.why-card,.member,.timeline-item').forEach(el=>focusCards.observe(el));

function clearSparks(){if(sparkFrame!==null)cancelAnimationFrame(sparkFrame);sparkFrame=null;sparkCtx.clearRect(0,0,sparkCanvas.width,sparkCanvas.height);}
stage.addEventListener('click',event=>{
 stage.dataset.pulses=String(Number(stage.dataset.pulses||0)+1);clearTimeout(sparkTimer);stage.classList.add('is-sparking');sparkTimer=setTimeout(()=>stage.classList.remove('is-sparking'),1300);
 if(reduced.matches)return;
 clearSparks();const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 sparkCanvas.width=Math.round(r.width*dpr);sparkCanvas.height=Math.round(r.height*dpr);sparkCtx.setTransform(dpr,0,0,dpr,0,0);
 const x=event.detail===0?r.width*.5:event.clientX-r.left,y=event.detail===0?r.height*.48:event.clientY-r.top;
 const begin=performance.now(),radius=Math.min(r.width,r.height)*.32;
 const particles=Array.from({length:20},(_,i)=>({angle:i*Math.PI*2/20+(i%3)*.1,spread:radius*(.55+(i%5)*.1),color:i%3?'#79ebc9':'#b6ff6e'}));
 function draw(now){
  const t=Math.min((now-begin)/1250,1),ease=1-Math.pow(1-t,3);sparkCtx.clearRect(0,0,r.width,r.height);
  if(document.hidden||reduced.matches||t>=1){clearSparks();return;}
  sparkCtx.lineWidth=1;
  for(let i=0;i<3;i++){const progress=Math.max(0,(t-i*.08)/.84);if(progress<=0||progress>=1)continue;sparkCtx.beginPath();sparkCtx.arc(x,y,8+radius*1.15*progress,0,Math.PI*2);sparkCtx.strokeStyle='rgba(153,245,183,'+((1-progress)*.48)+')';sparkCtx.stroke();}
  const ps=particles.map(p=>({...p,x:x+Math.cos(p.angle)*p.spread*ease,y:y+Math.sin(p.angle)*p.spread*ease*.72}));
  ps.forEach((p,i)=>{const next=ps[(i+1)%ps.length];sparkCtx.beginPath();sparkCtx.moveTo(p.x,p.y);sparkCtx.lineTo(next.x,next.y);sparkCtx.strokeStyle='rgba(97,233,201,'+((1-t)*.2)+')';sparkCtx.stroke();sparkCtx.beginPath();sparkCtx.arc(p.x,p.y,1.6+(1-t)*1.7,0,Math.PI*2);sparkCtx.globalAlpha=1-t;sparkCtx.fillStyle=p.color;sparkCtx.shadowBlur=10;sparkCtx.shadowColor=p.color;sparkCtx.fill();sparkCtx.shadowBlur=0;sparkCtx.globalAlpha=1;});
  sparkFrame=requestAnimationFrame(draw);
 }
 sparkFrame=requestAnimationFrame(draw);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearSparks();});
reduced.addEventListener('change',()=>{clearSparks();hero.style.removeProperty('--scroll-shift');});
interactionLanguage();schedulePageUpdate();
