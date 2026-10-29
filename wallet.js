// One purse for every game in the arcade.
// Each game reads its balance from here on boot and writes it back when it saves,
// so coins won in one game can be spent in another.
//
//   Wallet.get()        -> current coins
//   Wallet.set(n)       -> overwrite the balance
//   Wallet.add(n)       -> add (or subtract, with a negative n); returns the new balance
//   Wallet.spend(n)     -> true and deducts if affordable, false otherwise
//   Wallet.onChange(fn) -> fn(coins) when another tab changes the balance
(function(){
  const KEY='arcade.wallet.v1', START=100;
  const LEGACY='koipondstakes.v1'; // the pond kept its own coins before the arcade existed
  const ok = n => typeof n==='number' && isFinite(n) && n>=0;

  function read(){
    try { const d=JSON.parse(localStorage.getItem(KEY)||'null'); if(d && ok(d.coins)) return d.coins; } catch(e){}
    return null;
  }
  function write(n){
    try { localStorage.setItem(KEY, JSON.stringify({coins:n, updated:Date.now()})); } catch(e){}
  }
  function seed(){
    let n=START;
    try { const d=JSON.parse(localStorage.getItem(LEGACY)||'null'); if(d && ok(d.coins)) n=d.coins; } catch(e){}
    write(n); return n;
  }

  const Wallet = {
    START,
    get(){ const n=read(); return n===null ? seed() : n; },
    set(n){ if(typeof n==='number' && isFinite(n)) write(Math.max(0, n)); },
    add(n){ this.set(this.get()+n); return this.get(); },
    spend(n){ const c=this.get(); if(n>c) return false; this.set(c-n); return true; },
    onChange(fn){ addEventListener('storage', e=>{ if(e.key===KEY) fn(this.get()); }); },
  };
  window.Wallet = Wallet;
})();
