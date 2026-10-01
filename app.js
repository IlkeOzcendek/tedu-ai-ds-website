const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let language=new URLSearchParams(location.search).get('lang')==='en'?'en':'tr';
try{if(!new URLSearchParams(location.search).has('lang')&&localStorage.getItem('tedu-ai-ds-lang')==='en')language='en';}catch{}
function setLanguage(lang){
 language=lang;document.documentElement.lang=lang;
 document.querySelectorAll('[data-tr][data-en]').forEach(el=>el.textContent=el.dataset[lang]);
 document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
 document.title=lang==='tr'?'TEDU AI & DS — 2026–2027 Aday Ekibi':'TEDU AI & DS — 2026–2027 Candidate Team';
 document.querySelector('meta[name=description]').content=lang==='tr'?'TEDU AI & DS 2026–2027 yönetim adaylığı. Vizyonumuz, faaliyet planımız ve birlikte üreten aday ekibimiz.':'TEDU AI & DS 2026–2027 leadership candidacy. Our vision, activity plan, and candidate team.';
 document.querySelector('#brand').setAttribute('aria-label',lang==='tr'?'TEDU AI & DS — logoyu canlandır':'TEDU AI & DS — animate the logo');
 document.querySelector('.nav').setAttribute('aria-label',lang==='tr'?'Ana gezinme':'Main navigation');
 try{const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);localStorage.setItem('tedu-ai-ds-lang',lang);}catch{}
 document.dispatchEvent(new CustomEvent('languagechange',{detail:{lang}}));
}
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
setLanguage(language);
let networkBurst=0;
const tabControllers={};
function bindTabs(key){
 const buttons=[...document.querySelectorAll('[data-'+key+']')];
 function select(index,focus=false){
  index=(index+buttons.length)%buttons.length;
  buttons.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;const panel=document.getElementById(b.getAttribute('aria-controls'));panel.hidden=i!==index;if(i===index&&!reduced.matches){panel.classList.remove('is-changing');void panel.offsetWidth;panel.classList.add('is-changing');}});
  if(focus)buttons[index].focus();
  if(key==='step')document.querySelector('.project-flow').style.setProperty('--step-progress',index*25+'%');
  if(key==='discipline'){networkBurst=reduced.matches?0:1;requestNetworkDraw();}
  document.dispatchEvent(new CustomEvent('tabchange',{detail:{key,index}}));
 }
 buttons.forEach((b,index)=>{b.addEventListener('click',()=>select(index));b.addEventListener('keydown',e=>{let i;if(e.key==='ArrowRight')i=index+1;else if(e.key==='ArrowLeft')i=index-1;else if(e.key==='Home')i=0;else if(e.key==='End')i=buttons.length-1;else return;e.preventDefault();select(i,true);});});
 tabControllers[key]={buttons,select};
}
['step','track','discipline'].forEach(bindTabs);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('.member').forEach(member=>{member.hidden=button.dataset.filter!=='all'&&member.dataset.group!==button.dataset.filter;if(!member.hidden)member.classList.add('visible');});}));
const hero=document.querySelector('.hero'),video=document.querySelector('#hero-video'),brand=document.querySelector('#brand');
let heroVisible=true,logoTimer;
function syncVideo(){if(reduced.matches||document.hidden||!heroVisible||window.heroAmbientActive?.())video.pause();else {if(!video.getAttribute('src'))video.src=video.dataset.src;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.play().catch(()=>{if(!reduced.matches&&!document.hidden&&heroVisible)window.setHeroFallback?.(true);});}}
matchMedia('(max-width:800px)').addEventListener('change',syncVideo);
video.addEventListener('error',()=>window.setHeroFallback?.(true));
brand.addEventListener('click',()=>{brand.classList.remove('pulse');hero.classList.remove('spark');clearTimeout(logoTimer);if(!reduced.matches){void brand.offsetWidth;brand.classList.add('pulse');hero.classList.add('spark');video.currentTime=0;logoTimer=setTimeout(()=>{brand.classList.remove('pulse');hero.classList.remove('spark');},1200);}window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});syncVideo();});
document.addEventListener('visibilitychange',syncVideo);reduced.addEventListener('change',()=>{syncVideo();if(reduced.matches)document.documentElement.classList.remove('motion-ready');});
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncVideo();},{threshold:0}).observe(hero);syncVideo();
if(!reduced.matches){document.documentElement.classList.add('motion-ready');const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');reveal.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));}
hero.addEventListener('pointermove',event=>{if(reduced.matches||event.pointerType==='touch')return;const r=hero.getBoundingClientRect();hero.style.setProperty('--hx',((event.clientX-r.left)/r.width-.5)*16+'px');hero.style.setProperty('--hy',((event.clientY-r.top)/r.height-.5)*12+'px');});
hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--hx','0px');hero.style.setProperty('--hy','0px');});
document.querySelectorAll('.why-card').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',e.clientX-r.left+'px');card.style.setProperty('--my',e.clientY-r.top+'px');}));
const canvas=document.querySelector('#network'),ctx=canvas.getContext('2d');
let networkVisible=false,clock=0,last=0,networkFrame=null;
const points=Array.from({length:42},(_,i)=>{const y=1-i/41*2,r=Math.sqrt(1-y*y),a=i*2.399963;return{x:Math.cos(a)*r,y,z:Math.sin(a)*r};});
function requestNetworkDraw(){if(!networkVisible||document.hidden)return;if(networkFrame===null)networkFrame=requestAnimationFrame(drawNetwork);}
function cancelNetworkDraw(){if(networkFrame!==null)cancelAnimationFrame(networkFrame);networkFrame=null;last=0;}
new IntersectionObserver(entries=>{networkVisible=entries[0].isIntersecting;if(networkVisible)requestNetworkDraw();else cancelNetworkDraw();},{threshold:0}).observe(canvas);
new ResizeObserver(requestNetworkDraw).observe(canvas);
document.addEventListener('visibilitychange',()=>document.hidden?cancelNetworkDraw():requestNetworkDraw());
reduced.addEventListener('change',()=>{networkBurst=0;cancelNetworkDraw();requestNetworkDraw();});
function drawNetwork(now){
 networkFrame=null;if(!networkVisible||document.hidden)return;
 if(!reduced.matches&&last&&now-last<32){requestNetworkDraw();return;}
 const dt=last?Math.min((now-last)/1000,.1):.033;last=now;
 if(!reduced.matches){clock+=dt*.09;networkBurst=Math.max(0,networkBurst-dt*.7);}else networkBurst=0;
 const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);
 const size=Math.min(r.width,r.height)*.41*(1+networkBurst*.06),angle=reduced.matches?.4:clock;
 const projected=points.map(p=>{const x=p.x*Math.cos(angle)+p.z*Math.sin(angle),z=-p.x*Math.sin(angle)+p.z*Math.cos(angle);return{x:r.width/2+x*size,y:r.height/2+p.y*size,z,scale:(z+2)/3};});
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const a=points[i],b=points[j],dist=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(dist<.64){const a2=projected[i],b2=projected[j];ctx.beginPath();ctx.moveTo(a2.x,a2.y);ctx.lineTo(b2.x,b2.y);ctx.strokeStyle='rgba(93,223,176,'+(.1+(a2.z+b2.z+2)/4*.22)+')';ctx.lineWidth=.7+networkBurst;ctx.stroke();}}
 projected.sort((a,b)=>a.z-b.z).forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,2+p.scale*2,0,Math.PI*2);ctx.fillStyle=i%3?'#80edc8':'#c3ff82';ctx.globalAlpha=.3+p.scale*.7;ctx.shadowColor='#83ffad';ctx.shadowBlur=i%5===0?10:0;ctx.fill();});ctx.globalAlpha=1;ctx.shadowBlur=0;
 canvas.dataset.renderCount=String(Number(canvas.dataset.renderCount||0)+1);
 if(!reduced.matches)requestNetworkDraw();
}
