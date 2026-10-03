const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const directionIcon = expanded => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${expanded ? 'M19 5 5 19M5 7v12h12' : 'M5 19 19 5M7 5h12v12'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 760px)');
let selectedPart = 0, manualSeparation = null, separation = 0, modelAPI = null, tweenFrame = null;
function cancelTween(){if(tweenFrame!==null)cancelAnimationFrame(tweenFrame);tweenFrame=null;}
function animateSeparation(target){
  cancelTween();const from=separation;manualSeparation=from;
  if(reducedMotion.matches){manualSeparation=target;updateScroll();return;}
  const start=performance.now();
  function step(now){const t=Math.min(1,(now-start)/1000);const eased=t*t*(3-2*t);manualSeparation=from+(target-from)*eased;updateScroll();tweenFrame=t<1?requestAnimationFrame(step):null;}
  tweenFrame=requestAnimationFrame(step);
}
function setPart(index, userAction = false) {
  selectedPart = index;
  $$('.part-item').forEach((item, i) => {
    item.classList.toggle('active', i === index);
    item.querySelector('button').setAttribute('aria-expanded', String(i === index));
    item.querySelector('.part-detail').hidden = i !== index;
  });
  $('#callout-number').textContent = `0${index + 1}`;
  $('#callout-name').textContent = ['КОРОНКА', 'АБАТМЕНТ', 'ИМПЛАНТ'][index];
  $('#model-callout').style.top = `${[20, 40, 59][index]}%`;
  $('#lab-progress').textContent = `0${index + 1} / 03`;
  if(userAction) animateSeparation(1);
  updateScroll();
}
$$('[data-part]').forEach(button => button.addEventListener('click', () => setPart(Number(button.dataset.part), true)));
function updateControls(value) {
  $('#separation').value = String(Math.round(value * 100));
  const expanded = value > .5;
  $('#explode').innerHTML = `${expanded ? 'Собрать' : 'Разобрать'} <span>${directionIcon(expanded)}</span>`;
  $('#explode').setAttribute('aria-pressed', String(expanded));
  $('#auto-mode').classList.toggle('active', manualSeparation === null);
  $('#auto-mode').textContent = reducedMotion.matches ? '↻ Сбросить' : '↻ По прокрутке';
}
function updateScroll() {
  const lab = $('#technology'), box = lab.getBoundingClientRect();
  const track = $('.lab-motion-track');
  const available = Math.max(1, mobile.matches ? track.offsetHeight - $('.lab-visual').offsetHeight : lab.offsetHeight - $('.lab-sticky').offsetHeight);
  const top = mobile.matches ? track.getBoundingClientRect().top : box.top;
  const inset = mobile.matches ? 82 : 84;
  const progress = Math.min(1, Math.max(0, (inset - top) / available));
  separation = manualSeparation ?? (reducedMotion.matches ? .7 : progress);
  if (manualSeparation === null && !reducedMotion.matches && !mobile.matches) {
    const index = Math.min(2, Math.floor(progress * 3));
    if(index !== selectedPart) { setPart(index); return; }
  }
  $('.lab-progress-track>div').style.width = `${progress * 100}%`;
  updateControls(separation);
  modelAPI?.update({separation, selectedPart, heroProgress: Math.min(1, window.scrollY / 700)});
}
let scrollFrame = null;
function scheduleScroll() { if(scrollFrame === null) scrollFrame = requestAnimationFrame(() => {scrollFrame = null; updateScroll();}); }
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  if(Math.abs(window.scrollY-lastScrollY)>2 && !reducedMotion.matches){cancelTween();manualSeparation=null;}
  lastScrollY=window.scrollY;
  scheduleScroll();
}, {passive:true});
window.addEventListener('resize', scheduleScroll);
reducedMotion.addEventListener('change', scheduleScroll);
$('#separation').addEventListener('input', e => {cancelTween();manualSeparation = Number(e.target.value) / 100; updateScroll();});
$('#explode').addEventListener('click', () => animateSeparation(separation > .5 ? 0 : 1));
$('#auto-mode').addEventListener('click', () => {cancelTween();manualSeparation = null; updateScroll();});
updateScroll();
import('./media.js').then(module => {modelAPI = module.initMedia(reducedMotion); updateScroll();}).catch(error => {
  console.warn('Motion unavailable; editorial image shown.', error.message);
  $$('.render-label').forEach(label => label.textContent = 'ВИЗУАЛИЗАЦИЯ ИМПЛАНТА');
  $('.lab-intro').textContent='Три элемента. Одна система. Выберите деталь, чтобы узнать о ней больше.';
  $('.model-controls').hidden=true;
});
const menu = $('#navigation'), menuButton = $('#menu-toggle');
function closeMenu(){menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}
menuButton.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
$$('#navigation a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
$$('.journey-list details').forEach((detail,index)=>detail.addEventListener('toggle',()=>{detail.querySelector('i').textContent=detail.open?'−':'+';if(detail.open)$('#journey-digit').textContent=`0${index+1}`;}));
const booking=$('#booking'),form=$('#booking-form'),success=$('#form-success');
$$('[data-book]').forEach(button=>button.addEventListener('click',()=>{closeMenu();form.reset();form.hidden=false;success.hidden=true;$('#phone-error').hidden=true;form.phone.removeAttribute('aria-invalid');booking.showModal();document.body.classList.add('modal-open');}));
$$('dialog').forEach(dialog=>{
  dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
form.addEventListener('submit',event=>{
  event.preventDefault();const digits=form.phone.value.replace(/\D/g,'');
  const valid=digits.length>=10&&digits.length<=15&&/^[+\d\s()\-]+$/.test(form.phone.value);
  $('#phone-error').hidden=valid;
  if(!valid){form.phone.setAttribute('aria-invalid','true');form.phone.setAttribute('aria-describedby','phone-error');form.phone.focus();return;}
  form.phone.removeAttribute('aria-invalid');form.hidden=true;success.hidden=false;$('#done').focus();
});
$('#done').addEventListener('click',()=>booking.close());
$('#about-project').addEventListener('click',()=>{$('#project-dialog').showModal();document.body.classList.add('modal-open');});
// Original lightweight interpretations of scroll reveal and magnetic interaction,
// researched in the public 21st.dev catalog. No React component source is copied.
if(!reducedMotion.matches && 'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}});},{threshold:.15});
  $$('[data-reveal]').forEach(element=>{element.classList.add('reveal-ready');observer.observe(element);});
}
$$('[data-magnetic]').forEach(button=>{
  button.addEventListener('pointermove',event=>{if(reducedMotion.matches||event.pointerType!=='mouse')return;const rect=button.getBoundingClientRect();const x=(event.clientX-rect.left-rect.width/2)*.12,y=(event.clientY-rect.top-rect.height/2)*.12;button.style.transform=`translate(${x}px,${y}px)`;});
  button.addEventListener('pointerleave',()=>button.style.transform='');
});
