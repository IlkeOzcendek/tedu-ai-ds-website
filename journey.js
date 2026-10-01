const journeyPrev=document.querySelector('#step-previous'),journeyNext=document.querySelector('#step-next'),journeyFinish=document.querySelector('#step-finish'),journeyPosition=document.querySelector('#journey-position');
function currentJourneyStep(){return tabControllers.step.buttons.findIndex(b=>b.getAttribute('aria-selected')==='true');}
function updateJourney(){
 const index=currentJourneyStep(),en=document.documentElement.lang==='en';
 journeyPrev.disabled=index===0;journeyNext.hidden=index===3;journeyFinish.hidden=index!==3;
 journeyPosition.textContent=String(index+1).padStart(2,'0')+' / 04';
 journeyPosition.setAttribute('aria-label',(en?'Step ':'Adım ')+(index+1)+(en?' of 4':' / 4'));
 document.querySelector('.project-flow').setAttribute('aria-label',en?'Project stages':'Proje aşamaları');
}
journeyPrev.addEventListener('click',()=>tabControllers.step.select(Math.max(0,currentJourneyStep()-1)));
journeyNext.addEventListener('click',()=>{tabControllers.step.select(Math.min(3,currentJourneyStep()+1));if(journeyNext.hidden)journeyFinish.focus({preventScroll:true});});
document.addEventListener('tabchange',e=>{if(e.detail.key==='step')updateJourney();});
document.addEventListener('languagechange',updateJourney);updateJourney();
const ambientDetails=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting)),{threshold:.03});
document.querySelectorAll('.why-card,.timeline-item,.step-panels').forEach(el=>ambientDetails.observe(el));
