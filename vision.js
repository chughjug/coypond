// The vision meter: Chicago skyline as a 96 x 72 grid of brightness values (0 to 255),
// regressed on height (brightness = a + b * row). Every coin the purse drops below its
// starting balance adds random error to every cell. The line stays confident; R squared
// (how much of the city the line still explains) falls. Losses never heal.
//
//   Vision.sigma()        -> noise sd for the current low-water mark (0 clear, 150 blind)
//   Vision.level()        -> 0 to 5, one level per 30 sigma
//   Vision.note(coins)    -> record a balance (wallet.js calls this on every write)
//   Vision.mount(canvas, onStats) -> draw the skyline into a canvas; onStats({r2, a, b, sigma, level})
//   Vision.reset()        -> clear vision (for test runs); home.html?fresh resets coins too
(function(){
  const KEY='arcade.vision.v1', COLS=96, ROWS=72, START=100, MAX_SIGMA=150;
  const SKY='hYqLk5GLj5WWl5WNgHRzcnd5gYKFgXl3eHd0c3R0c3NzdHR4eYGLj5GOjpepp5aPlZuXl5qTj46Sk46Wp6Sgqa+npKSjo6Omp6Kfn56enZ2no6Opn5qempaWi4KBfn5+hoqLm6OTkpOWm52elYWGhXt7gYWFfXh3eXt5eHh5eHd3d3h5fYKFhYeJi5OaoJaLi4+Rj5GRkY+SkY+frqmsr7Grp6OfpKqnpKOhoaCgoqOnoKCho6afmpWSjYeFhYWCipGRoMOxrK+inaCmp6Cblo+FgoWBe3h4eHl5eXdzd3d3d3d3eHh+hYeNkZOXnZKJhYKAgIqSjYaLkZKbpqyvr6yrqaCeqaymn6SkpKKkpKOnpKOkpqehmpaRkYuNjYmCnZWaq8zMv8PAta+xrqOhn5uRiomFgX14d3h4eHNzdHd3dHRzc3OFkYmLjo6Wl42FgX14eHiFi4WGl5+fpLG2ta+vr6yrrKynoqKkoaCmoaGjoqSnoaOinZeTj46NioWAy8O4zNbDztrUzMPCuqegoaOXjYuKh4KAe3l4eHh3eHh3dHN0c3iAi4WCiY2OjoeAgH14d3R+ioeBiZKftr+6r6+ysa+xr6yuqqamo6enpKOmpKSno5+foJ6Ri4qGhYB56Ojo4dfT4OPi4dTUz8Oyp6ehl5aRi4qNh4KAfX17fXt3dHdzd3t7foKFkZKLhYWBfnd4eHiAh4mCgoqhu7q4uLq2travq6u2s7Kvrq+qq6mnp6anpqmqopqNioeFhYF99/Hx8/Hw8Ozn5+Xl3MzEusK0qrWjl4uFhYKCgoKAgIB7eXdzeH1+iYWAhYmHhoWRhXR0dHh9gIaLi5q4v7/GsqqvsbWjoJ+hoKGnsa+0ta+urKq1qqennpWRjouLh4KB9fHt7u3r6Oz08evgxq+koK/M0b6vppWFhYaFgoJ+foB+eXh4fYKGkX17fnh7hYJ9d3d4eXt5foaWqbHDwrihjoudqbKmk4+al5emqaSip7Svr7O4rqefl5aTj46NhoKC9PP18/Dx69bL0MzFyLOglZOjq6qzr6mjnZeenZKCeXt5eHR4gIB4dHR3c3JzeX19e4CCiYuJiouaosPFu7Sil5aXoLKvmpu2tKeqo56qtLG0uLu7sauim5aPjYuFh4+L+Pn5+Pfw1rqjpquyzNe7pp+bl5Grp6enmpOVp6eXjoV9eHd3e355e3t3d3l7fYCFhYaKkZaXmqOssr/OyL+sop+aoKGej5qvo6KvuK+rsa+ysrOvtrKjoJqRioWChYmH8/j4+Pvx6N7Kv8fQ5PDRr6egpJ6WlZGWko6OkZWRkpGRhX54cniBgX17e3t9fYKCkZaWjZWnrLK+yMXQ0cu+opaar5uGfXuBgoKVtqqXm6Sstbi4v66jpJWJhYaJioeF////+/759ffo2t/l8fTIp6+prLWuopual5aPiYJ9foKPkYuCe3h9fn15e3t7e3l7hpeXmqG2yMrO09DT1LipmpaRmoV3dHRzeYGBi56Xnau4ura7u6qinZKSkpOfoJGK2Nr/////8+zs5Ovu6PDLr7Gvrq6poZaaj4aRi35+goGCi5Wai4qFfYKHfXt9foWFeYCLmrG/x8/T0dbYu5qNjYqAfnd3dHRycnd+fYedrrW4u8LAtKOamqOxp6OkopqWqbvM59/t////9OTs++PZxq6fk5ORkpejn4KSoYt7e3mCiYGCgH57dHiJi4J+gYKKh4qap8DP1NTU0+jYr6GSioV+e3l4cXF7fXhyeYWRrKOywMzKwripoaKnpq6rq6ShxuXw1r+25+v4/////OXo7tOimpOSmqnI07u7qpJ+cm9vc3Nyb29xc3mAgYGLl4+OipGWpLjG2eDc3ujZvrGjkYqNi4KBfnl0cm1scYeWr7K7xMTGv7Onsrixsq+usbSxmr7o//W/ppaa0f/+/////+fQ0J+dpJvAqZ2iio2Rgntxb3Fyb29xdIKFho2WnZGPko+Ro7LI3N7g5OHe2Mu4npKSkY+LhYqFhXlxdIaPm7rFz8q4tbOjtr+7uru7u7i2jaS/8OHQx7imk5+Tn7jD7f//+Ni7qaKPgnh5gomKjYt7cnNycXF3eYKCi5OXlp64wLGbna/M4ujj4eDf2L+nl5GLh4aFhYmHhoF4d4aStsvKxMW6tb++u7SvsrW7vru6hZKansLe48+2louKio2Nl8P9///gr5KGfnh3e4KCe359eHd0dHN5gX15gYePnaezxriaio+zy9jh4OPi0LWbkpGdmpGLi4eBgIaRmrG1u8DHu7u+wK+vpJqRl5quuri/l6PU1LvFzMDIx7Wqm5eTjoaVqbjEpJ6Rh3h0dHd4eXd3eHd5fn6CjpuGgYKFkbqxp52Rkaq0zNjf5ePZ0czFuLGnoaGgi4WJlp6iwNbTw7+/sbWpo5KJj6KuuL62srG0o8/l8//85/H1////8eGvnpqNhn2Rnp2Sj4WAgHdzdHFvc3l7eXt+l6mRhYuRlrvTzL6vuNTe5OXk6+vl4tzKzL+nrKemnZqapra7xsrLztTGu7+zqaCnrLbDs52FeXJmw8C+vuH///////nu///97b+um5WCeX14e4WHhomAfYGCgoGCe36Bi5KVlY+XoMjZ7evn5evx6+7z8e3h3sqxppOaoaSdn5exwKqap6+kpLbEurOnn6OakY1+a2FdX11fyp2KqeT//+ja/uLC0P3349i/uq+LgYF+e3uBi56v0KmGgoKAfoCChZajr6aqy8bL1tzs+P7++/T1+OTc597Rv6uuoKOfnZGPh3dxgIlzbXeGfXFsbWtmaGZkaGNhYGZs3vGpeHuRq8WkqtPr8eHKn6+4r6mbj42LhoKFh4KLoZ2CgYaCh4uHj6+4r7ivo7L5/Pj118Wvp5aRqdPozMy7opago6GXi35xbG9xa3h3bWxkaGZgYGhraWZhYFxfbHFs//Grgm9mZGFra2hsfoaHiYKFipGXiYGBgoKGi4eCfZKRgYWLk5uvzMCnpO3s7vj77evInYuFhouGdIW/17uxv7qno5d7eHhxaGRpeYmAcWtmZmRhX19cWVlZV2FvdHh3lXltb21sa2tkZmtraGtteHd9hXuFhnl9e3l+gYCCh561oZ2mu9btxZeLkbv///vl6Niplo6CeHN0eHiXwtni9fPYu6GamoBpY2ZxgXtsZF9cXV1dXFtbY2xvcn15cW1xi3dtcXN0d3iHjYtzcXFxcoKLh46Pl4uKi5OVhYJ9h6q22vH4/+S2nZGPq97////fv5qCeXRrbGlja4WHjZKSlqrg4NC+oZeCgIB4aGNmYGFgW1ZgcXOBjoqHiYV5c3Foa4B0d3R9hYudmouGh4KJhqqvlZKLkZeSp9/AxuPkyPH/////9Ne2mpKTj6uuxd/r49O/sodzbXF3jYuWiYF3eH2WuriPhomFgHRxbGttfqOmkaOkm5eTjYF5eX59dHJsEVmJgYCCiomFhYuhi3l+m7+rhX6Bi6a64v/////8rJ64y/T////4xZuPq6+Torb3////7dbMnZKSlaCvkYB9hYeKiZV7jaGWgnFpaG1ygKC22deynZWCdGxkZmhscWlmH1x3d3t5fYWGiZGV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LDInLEBGQkdMODxCPj1DQ0JCQD5AQUFDQUFBQkdHRkNCQkJDSEpKTlJRXZ2SY19fXV1ZfoJbX2ZmcW9tcXdsZGRjXF1gY2RjYV9cX2FhX1ZTUU5NSkpHRkNDQUdISkZGQ0FAQDg2NjQyNjc2bWZmaWlkZGZhYGZfYGFhYV1cU05OTUxMSlFOTlJUUlNUU1NOUVRTU1FUVFdcYGNjX2BhWVtXV1tdXFtXXFdZW1tZVFFNTEpGQ0NBQUFAQUJGRkdGQkFAQEFBQEBAPT08WVdgXVxdX1xdW1dZW1ZTU1FSSE1DRkZDQ0JGQ0dKTU5RTVFOTk5RTk1MUllTXF1gYTxRX1xcXFtdYGBfU1lXWVdTU0xKR0I+Ozc7ODg0MjY2NDIyMSwrKysnIyUiHx4dW1xfVltWTVJgYFxWVFNcTU5GTEdMRkdCPkhMSkNNRlFSTEdGUU5NU01ITlNRU01DKREVIiElIyIjIyEeEhgTEREMCwcGBgUDBQEAAAEAAAAAAAAAAAMFBwYIDQsLDREPVlRdXFdRTVlbXFxWXFNNTlFOSEBGQ0dHR0xSSltcUVFkU1RUTk1NSExIRjtMUkcYAAAAAAAAAAAAAAUHBgYHBggREhIZGRUSGx8hIiMsKSMlJyswMTEyNjIyNjY0NDc0V1ZWVlJTVltbW1NNTlRKTVNMR0xDQkdGSENISkpRTVZdTlJRSkxNRzxGSE1ZXWlWNzQxMTA2PDw4PkJHR0dMSkhUTkdMQ0I+QkBAPDw+ODc7Ozs4Nzc3NjIyMjAsLTEtVFdTWV1XV1RTW1lRWU1NVE5GR0ZDR0JDSkJHR0ZNTU5MQ0JHPEFKQTs9Q0ZKQlZZVFZZVE5RUlNHVlRMTkxNTlFKTUxCPjxAQDcxNjY2NjQ4ODY4NjI0NjExMjIwKywtRkpCSGBXVFtWVFNXUkpCUU44QEY+O0BHQj1ARjg8PTdDSEc4MT0xPEdCPkBISEpSTkhSTVFMQ01DSFFKRkNGSEpMSkY+PDs8Ozc2MjY0NDIxNzYxMjYwMjIxMTIyLSstW1NXVlJRR0pRR0FHRkhAPUpNPTs2Ozs4Ozc7Njw0NDw+QD08NjQwNDc9QUZKRkdKSEZKSkNMRzhDRkdMQ0dCQ0NASjg8Pj5ANjc4NjAwMjE0MDQ2MSwwMjI0MTEwMC0oUU5KQ0hGQEJHQlNKTkpNR0FIRjQ7Pj1GPD09PTsxNkA9PkBDQ0A8QDg8Qj42OEBAQEI7O0dDR0ZBQjY0O0I+QDZCQD1AODYwLC0sMSstMC0wLSsoLCUlKSsrKSgsKykoNDQyNDY2NkM9QWZDOD08PDg4PDw9PFlKPUFBQkJBPT1AQUE+QUZDQkJCQUE7Tl9fSEdHPkZDQ0dKSFtIRkdGQTxAPDw8NzQyMiswLCswLCspLCgpMCkjKS0pLSgoJSglQ0FCQ0A+ODs3PTsyMSEwODc3MS0wLTIwLSwrKyksNDEtMTY2NDIxMTQ0Njg3XWxrQTY4Ozc3ODc3O01APDw+QEBAQEBBQkNDQ0ZDQ0FDQkJDRkNMRkJBQUNBQEA+PT04R0hKWVFISEJISEE8QCk3QUc9LDAsLS0pKCMwNjcyPjs2NDg4MDE7Mh4yNjdISkE7MjIsMTI2MS0nIhYiMjg0NDQ0ODQwLSssKyksKywsMTQ0NDYwMjg3Nzg4ODg4Ozs8TEMwNDAySExMTUY3Oy0xMDA3ODY2LTAyNjAwMis0Nzg+NCwxJygxNDAxODAsNjYsND42Nj1BPEBBPTY4PUA3LTc8Piw9NislJyUnJyUoKCchIScfIicjIiUiIyghISUjRjg4QEFHR05OTUFCPSk0Pjs3NiEwMDEyNC0rKDEwISUxMC0tKzA2JyEhIR4tMSg3OzE4NyksNj07Pjs4PTY9MjA2MSxDNzA2NCgpJyciIichGyMnJygpLCwoJScfHyEiQUNOTEg9OzQ4QD4wMS0oIykjJSgwKywrKyksKy0pLDYrIis3Nzg+PCgbJzI+OCk3NzE2PjQwND00MTgyOyElMjIsMjZINysrKSklKSUeIh8hKCsjJysnJykiIiMlJSIhQjIxNjgyMDAyLDchLSsjIygnKS0wKDIyMS0tKy0yNzw3KScyLCMnMC0tKTQ7PUEwMjAyLTA4PTcnFSEoJTAyMS0yHx5DMikpKCgjLSkfKCUiIiMeHSElHx4dIigoJSclIhsSHyUlKTIoKCgdMikhGx4dISghISclJysxMCw2JSUeIygxLS0pIi0xISgtMDYiLTcxMDAwKywsMTQ3MSs3NjQxLChDNignKCUlKCMjJSEWGyInHx8dJScoJyMlJSMdHR4fHh4WGBkeJzAwGxUwPTAtJRYdGxkYGR0bHhgbHhsVFRMYGBgYGBkZGRsZGx4hIx0bHx0eGRseHh4fHx0fIh8fIR02LB4fIyUfHR8eHyIiIh0eHh0bGx8eGxkeHx0eHyEiHyMfHx0ZHiktGB80LTQxHxsTEx8ZGBYbHyElIxsbIh8fHRYYIx0WHRsZHyIpSFE7KB8bISUjISMnKyghIighIh8ZEx8eHR0eHh0bHR0eHh0dHR4fHR4eGx8fHRsbIiMdHyMiHRgbHSEhIiIbHjQnHiMbIRseHR0eHSUYFhgeHiEeHxsbHxgZHyEeHyEsPFdBKCMiIisjHyIlLTQrKTAiKCMZHR8hIR8fHx4eIR4dHh0dHh4eHh8fHx4dGx8fIR8dHyEfGRseHSEiHR4iLTAoIRsjKSEiKCgjJSIiIR0jIR0ZHyEfGx0eIiEhIyMrPkc2JSEjIy0sIiMoKykoKCshKSIfIiIiIyIiHyEjIyEhHx8fHyEhIR8fHx4fHRseHx4eIR8iHR8iHh8lJSElMTAiIh0iHyIiIyMfISEiHiIjIiEfKCgiHh0hIyMjKScrPko7IiMlIyUoJygrJyknIywiJS0nIiIjJSMjISMlJSIiIR8hISEhISEhIR8fHh0eIh4iHyEhISUfISMhIh0pNCsfGB4eHh0hKCciJScnHiMlISMlMCshIx8lIiIlIyUrMkpKKyEnJSwnKCUnKSkoIykpIzgpJSMlJSMhIiIjJSIhHx8fIiUhHyEfHx8fHRsdHhsiHh4YJSgeIR8eHxseIh4ZHxkdHR0hJyMiKCcnIygnHyIjIyMlKCMlIiMnJScrPEA8LSgnJy0oJSUoJygpJysrKT0sKCUsLSklKyknKCsoIycjJSgoKSMiJScoJSEf';
  const bin=atob(SKY), base=new Float32Array(COLS*ROWS);
  for(let i=0;i<base.length;i++) base[i]=bin.charCodeAt(i);

  // conditional-format color scale from the spreadsheet: navy -> slate blue -> sunset tan
  const D=[10,16,34], M=[72,98,140], L=[242,205,149];
  function color(v){
    const t=Math.max(0,Math.min(255,v))/255, [a,b,s]= t<.5 ? [D,M,t*2] : [M,L,(t-.5)*2];
    return [a[0]+(b[0]-a[0])*s, a[1]+(b[1]-a[1])*s, a[2]+(b[2]-a[2])*s];
  }

  function low(){ try{ const d=JSON.parse(localStorage.getItem(KEY)||'null'); if(d && typeof d.low==='number') return d.low; }catch(e){} return null; }
  function setLow(n){ try{ localStorage.setItem(KEY, JSON.stringify({low:n})); }catch(e){} }

  const Vision = {
    note(coins){ const l=low(); if(l===null || coins<l) setLow(coins); },
    sigma(){
      const l=low(); if(l===null) return 0;
      const lost=Math.max(0, Math.min(START, START-l));
      return MAX_SIGMA*lost/START;           // 20 coins lost = +30 sigma, 0 coins = blind
    },
    level(){ return Math.min(5, Math.floor(this.sigma()/30+1e-9)); },
    reset(){ try{ localStorage.removeItem(KEY); }catch(e){} },

    mount(canvas, onStats){
      const ctx=canvas.getContext('2d');
      const grid=document.createElement('canvas'); grid.width=COLS; grid.height=ROWS;
      const gctx=grid.getContext('2d'), img=gctx.createImageData(COLS,ROWS);
      const noisy=new Float32Array(base.length);
      const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
      let fit={a:0,b:0,r2:0}, last=0, seed=1;

      // seeded gaussian so reduced-motion users get one fixed frame of static
      function rand(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
      function gauss(){ let u=0; while(!u) u=rand(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rand()); }

      function regress(){
        // OLS of brightness on row, on the noisy data (unclamped: the error term is the data)
        const n=noisy.length; let sx=0, sy=0, sxx=0, sxy=0;
        for(let i=0;i<n;i++){ const x=(i/COLS)|0, y=noisy[i]; sx+=x; sy+=y; sxx+=x*x; sxy+=x*y; }
        const b=(n*sxy-sx*sy)/(n*sxx-sx*sx), a=(sy-b*sx)/n, my=sy/n;
        let ssr=0, sst=0;
        for(let i=0;i<n;i++){ const x=(i/COLS)|0, e=noisy[i]-(a+b*x), d=noisy[i]-my; ssr+=e*e; sst+=d*d; }
        return {a, b, r2:1-ssr/sst};
      }

      function roll(){
        const s=Vision.sigma();
        for(let i=0;i<base.length;i++){
          const v=base[i]+(s?gauss()*s:0); noisy[i]=v;
          const c=color(v), j=i*4; img.data[j]=c[0]; img.data[j+1]=c[1]; img.data[j+2]=c[2]; img.data[j+3]=255;
        }
        gctx.putImageData(img,0,0);
        fit=regress();
        onStats && onStats({...fit, sigma:s, level:Vision.level()});
      }

      function paint(){
        const dpr=Math.min(2, devicePixelRatio||1), W=innerWidth, H=innerHeight;
        if(canvas.width!==Math.round(W*dpr) || canvas.height!==Math.round(H*dpr)){ canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr); }
        ctx.setTransform(dpr,0,0,dpr,0,0);
        // cover the screen, keep whole cells
        const k=Math.max(W/COLS, H/ROWS), w=COLS*k, h=ROWS*k, x0=(W-w)/2, y0=(H-h)/2;
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(grid, x0, y0, w, h);
        // regression line: x axis = brightness (0 to 255 across the city), y axis = row
        const px=v=>x0+Math.max(0,Math.min(255,v))/255*w, py=r=>y0+(r+.5)*k;
        const r0=0, r1=ROWS-1;
        ctx.lineWidth=2.5; ctx.strokeStyle='rgba(255,246,228,.92)'; ctx.setLineDash([]);
        ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.moveTo(px(fit.a+fit.b*r0), py(r0)); ctx.lineTo(px(fit.a+fit.b*r1), py(r1)); ctx.stroke();
        ctx.shadowBlur=0;
      }

      function frame(t){
        if(!still && t-last>140){ last=t; roll(); paint(); }
        requestAnimationFrame(frame);
      }
      roll(); paint();
      addEventListener('resize', paint);
      addEventListener('storage', ()=>{ roll(); paint(); });
      addEventListener('pageshow', ()=>{ roll(); paint(); });
      if(!still) requestAnimationFrame(frame);
      return { refresh(){ roll(); paint(); } };
    },
  };
  window.Vision = Vision;
})();
