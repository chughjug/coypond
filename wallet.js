// Every game in the arcade is played for the same thing: your sight.
// You arrive with 100. Bet it, win more, or lose it, and the less you have
// the less of the screen you can see. Each game reads the balance from here
// on boot and writes it back when it saves.
//
//   Wallet.get()        -> current sight
//   Wallet.set(n)       -> overwrite the balance (and refresh how blurry things are)
//   Wallet.add(n)       -> add (or subtract, with a negative n); returns the new balance
//   Wallet.spend(n)     -> true and deducts if affordable, false otherwise
//   Wallet.onChange(fn) -> fn(sight) when another tab changes the balance
//   Wallet.unit(n)      -> 'sight' (the word to print next to a number)
//   Wallet.see(n)       -> applies the loss of vision for a balance of n to the page
//   Wallet.PACKS        -> the sight packs every shop sells (all prices are pretend)
//   Wallet.charge(usd)  -> record a pretend purchase; returns the new lifetime total
//   Wallet.spent()      -> pretend dollars spent across the whole arcade
//   Wallet.onSpend(fn)  -> fn(total) when another tab records a purchase
//
// Pages style the loss with two CSS variables Wallet.see() sets on <html>:
//   --loss  0 (perfect sight, START or more) .. 1 (nothing left)
//   --blur  a ready-made blur length for filter: blur(var(--blur))
(function(){
  const KEY='arcade.wallet.v1', START=100;
  const LEGACY='koipondstakes.v1'; // the pond kept its own balance before the arcade existed
  const SPENT='arcade.spent.v1';   // lifetime pretend dollars, in cents so the sums stay exact
  function readCents(){
    try { const d=JSON.parse(localStorage.getItem(SPENT)||'null'); if(d && ok(d.cents)) return d.cents; } catch(e){}
    // first time: start from whatever the pond already counted before the arcade kept a total
    let c=0; try { const d=JSON.parse(localStorage.getItem(LEGACY)||'null'); if(d && ok(d.spent)) c=Math.round(d.spent*100); } catch(e){}
    writeCents(c); return c;
  }
  function writeCents(c){ try { localStorage.setItem(SPENT, JSON.stringify({cents:c, updated:Date.now()})); } catch(e){} }
  const ok = n => typeof n==='number' && isFinite(n) && n>=0;

  function read(){
    try { const d=JSON.parse(localStorage.getItem(KEY)||'null'); if(d && ok(d.coins)) return d.coins; } catch(e){}
    return null;
  }
  function write(n){
    // stored as "coins" so balances saved before the switch to sight carry over
    try { localStorage.setItem(KEY, JSON.stringify({coins:n, updated:Date.now()})); } catch(e){}
    // the vision meter (vision.js) remembers the lowest balance ever reached: losses never heal there
    try { const v=JSON.parse(localStorage.getItem('arcade.vision.v1')||'null');
      if(!v || typeof v.low!=='number' || n<v.low) localStorage.setItem('arcade.vision.v1', JSON.stringify({low:n})); } catch(e){}
  }
  function seed(){
    let n=START;
    try { const d=JSON.parse(localStorage.getItem(LEGACY)||'null'); if(d && ok(d.coins)) n=d.coins; } catch(e){}
    write(n); return n;
  }

  // one catalogue, so the shop on home.html and the shops inside games sell the same thing
  const PACKS=[
    {name:'Pouch of sight', coins:500, price:0.99, note:'A little treat.'},
    {name:'Bucket of sight', coins:2000, price:4.99, badge:'Most popular', note:'Chosen by people who also chose this.'},
    {name:'Pond of sight', coins:12000, price:49.99, badge:'Best value', note:'Only 4.1¢ per point of sight, which sounds small.'},
    {name:'Ocean of sight', coins:100000, price:999.99, badge:'For whales', note:'First purchase bonus: double sight! (This pack only.)', hot:true},
  ];

  const Wallet = {
    START, PACKS,
    get(){ const n=read(); return n===null ? seed() : n; },
    set(n){ if(typeof n==='number' && isFinite(n)){ write(Math.max(0, n)); this.see(); } },
    add(n){ this.set(this.get()+n); return this.get(); },
    spend(n){ const c=this.get(); if(n>c) return false; this.set(c-n); return true; },
    onChange(fn){ addEventListener('storage', e=>{ if(e.key===KEY){ this.see(); fn(this.get()); } }); },
    unit(){ return 'sight'; },
    spent(){ return readCents()/100; },
    charge(usd){ if(ok(usd)) writeCents(readCents()+Math.round(usd*100)); return this.spent(); },
    resetSpent(){ writeCents(0); },
    onSpend(fn){ addEventListener('storage', e=>{ if(e.key===SPENT) fn(this.spent()); }); },
    loss(n=this.get()){ return Math.min(1, Math.max(0, 1 - n/START)); },
    see(n=this.get()){
      const l=this.loss(n), s=document.documentElement.style;
      s.setProperty('--loss', l.toFixed(3));
      s.setProperty('--blur', (l*l*7).toFixed(2)+'px'); // a little loss barely shows; the last of it is a fog
    },
  };
  window.Wallet = Wallet;
  Wallet.see();
})();
