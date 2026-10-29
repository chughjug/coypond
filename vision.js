// One pair of eyes for every game in the arcade.
// Vision is a number from 0 to 100. Games take it away when you lose, and every game
// that loads this file draws its play area through Vision.filter(), so losing in one
// game makes the next one harder to see.
//
//   Vision.get()          -> current vision, 0..100
//   Vision.set(n)         -> overwrite it (clamped to 0..100)
//   Vision.add(n)         -> add (or subtract, with a negative n); returns the new value
//   Vision.filter(v, k)   -> a CSS filter for vision v; k (0..1) scales the damage, e.g. .5 while squinting
//   Vision.vignette(v)    -> 0..1, how dark the edges of the play area should be
//   Vision.onChange(fn)   -> fn(vision) when another tab changes it
(function(){
  const KEY='arcade.vision.v1', START=100;
  const clamp = n => Math.max(0, Math.min(100, n));

  function read(){
    try { const d=JSON.parse(localStorage.getItem(KEY)||'null');
      if(d && typeof d.vision==='number' && isFinite(d.vision)) return clamp(d.vision); } catch(e){}
    return null;
  }
  function write(n){
    try { localStorage.setItem(KEY, JSON.stringify({vision:clamp(n), updated:Date.now()})); } catch(e){}
  }
  // damage rises slowly at first, so the first few losses are felt more than seen
  const loss = (v, k=1) => Math.pow(1-clamp(v)/100, 1.2) * k;

  const Vision = {
    START,
    get(){ const n=read(); if(n===null){ write(START); return START; } return n; },
    set(n){ if(typeof n==='number' && isFinite(n)) write(n); },
    add(n){ this.set(this.get()+n); return this.get(); },
    filter(v, k=1){
      const d=loss(v, k);
      if(d<=0) return 'none';
      return `blur(${(d*6).toFixed(2)}px) contrast(${(1-d*.3).toFixed(3)}) saturate(${(1-d*.45).toFixed(3)})`;
    },
    vignette(v, k=1){ return Math.min(1, loss(v, k)*1.1); },
    onChange(fn){ addEventListener('storage', e=>{ if(e.key===KEY) fn(this.get()); }); },
  };
  window.Vision = Vision;
})();
