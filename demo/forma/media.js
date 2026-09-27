// Cinematic asset generated for FORMA with Higgsfield. The second half of the
// clip is a disassembly, scrubbed by scroll or keyboard-accessible range input.
export function initMedia(reducedMotion) {
  const hero=document.getElementById('hero-model'), lab=document.getElementById('lab-model');
  const createVideo=container=>{
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='metadata';video.poster='assets/implant-editorial.jpg';video.setAttribute('aria-hidden','true');video.disablePictureInPicture=true;container.appendChild(video);return video;
  };
  const heroVideo=createVideo(hero), labVideo=createVideo(lab);
  heroVideo.loop=true;
  const playButton=document.getElementById('motion-toggle');
  let heroVisible=false,labVisible=false,userPaused=false,userStarted=false,desired=0;
  let loadedHero=false,loadedLab=false,seeking=false,retries=0,retryTimer=null;
  function load(video,isHero){if(isHero?loadedHero:loadedLab)return;if(isHero)loadedHero=true;else loadedLab=true;video.src='assets/implant-editorial.mp4?v=3';video.load();}
  function playback(){
    const shouldPlay=heroVisible&&!document.hidden&&!userPaused&&(!reducedMotion.matches||userStarted);
    if(shouldPlay){load(heroVideo,true);heroVideo.play().catch(()=>{playButton.textContent='▶ Включить анимацию';playButton.setAttribute('aria-pressed','false');});}
    else heroVideo.pause();
  }
  heroVideo.addEventListener('playing',()=>{hero.classList.add('motion-ready');playButton.textContent='Ⅱ Пауза';playButton.setAttribute('aria-pressed','true');});
  heroVideo.addEventListener('pause',()=>{playButton.textContent='▶ Анимация';playButton.setAttribute('aria-pressed','false');});
  playButton.addEventListener('click',()=>{userPaused=!heroVideo.paused;userStarted=true;playback();});
  function seek(){
    if(!labVisible||!Number.isFinite(labVideo.duration)||labVideo.readyState<1||seeking)return;
    const target=Math.min(labVideo.duration-.06,labVideo.duration*(.5+.49*desired));
    if(Math.abs(labVideo.currentTime-target)>.035){seeking=true;labVideo.currentTime=target;}
  }
  labVideo.addEventListener('loadeddata',()=>{lab.classList.add('motion-ready');seek();});
  labVideo.addEventListener('seeked',()=>{seeking=false;seek();});
  heroVideo.addEventListener('error',()=>{loadedHero=false;hero.classList.remove('motion-ready');playButton.textContent='▶ Повторить';playButton.setAttribute('aria-pressed','false');});
  labVideo.addEventListener('error',()=>{
    lab.classList.remove('motion-ready');seeking=false;loadedLab=false;
    document.querySelector('.model-controls').hidden=false;
    document.querySelector('.lab-intro').textContent='Листайте — имплант разберётся по деталям.';
    if(labVisible&&retries<4){
      clearTimeout(retryTimer);retries+=1;
      labVideo.removeAttribute('src');labVideo.load();
      retryTimer=setTimeout(()=>load(labVideo,false),1200*retries);
    }
  });
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===hero){heroVisible=entry.isIntersecting;playback();}else{labVisible=entry.isIntersecting;if(labVisible){load(labVideo,false);seek();}}}},{rootMargin:'100px'});
  observer.observe(hero);observer.observe(lab);
  document.addEventListener('visibilitychange',playback);reducedMotion.addEventListener('change',playback);
  return {update({separation}){desired=separation;seek();}};
}
