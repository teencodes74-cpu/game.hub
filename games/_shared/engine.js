(function(){
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function rand(n){return Math.floor(Math.random()*n)}
window.GameHubEngine = function init(cfg){
  const key=`gamehub_${cfg.slug}_best`;
  const scoreEl=document.getElementById('score'); const bestEl=document.getElementById('best');
  const restartBtn=document.getElementById('restartBtn'); const fullscreenBtn=document.getElementById('fullscreenBtn');
  const arena=document.getElementById('arena'); const ins=document.getElementById('instructions');
  let score=0,best=Number(localStorage.getItem(key)||0),cleanup=()=>{}; bestEl.textContent=best;
  const setScore=(v)=>{score=Math.max(0,v);scoreEl.textContent=score;if(score>best){best=score;bestEl.textContent=best;localStorage.setItem(key,String(best));}};
  const add=(d)=>setScore(score+d);
  const setIns=(t)=>ins.textContent=t;
  function start(){cleanup(); arena.innerHTML=''; setScore(0); cleanup = modes[cfg.mode](arena,{add,setScore,setIns})||(()=>{});} 
  restartBtn.onclick=start;
  fullscreenBtn.onclick=async()=>{if(!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen();};
  document.addEventListener('fullscreenchange',()=>{fullscreenBtn.textContent=document.fullscreenElement?'Exit Fullscreen':'Fullscreen'});
  start();
};
const modes={
maze(arena,api){
  api.setIns('Use arrow keys to reach the goal square.');
  const layout=['########','#S #   #','# ### ##','#   #  #','### ## #','#     G#','########'];
  const board=el('div','grid'); board.style.gridTemplateColumns=`repeat(${layout[0].length},26px)`;
  let px=0,py=0,gx=0,gy=0,cells=[];
  layout.forEach((row,y)=>[...row].forEach((ch,x)=>{const c=el('div','cell');if(ch=='#')c.classList.add('wall');if(ch=='S'){px=x;py=y}if(ch=='G'){gx=x;gy=y;c.classList.add('goal')}cells.push({x,y,c,wall:ch=='#'});board.append(c)}));
  const paint=()=>cells.forEach(o=>{o.c.classList.toggle('player',o.x===px&&o.y===py)}); paint(); arena.append(board);
  const on=(e)=>{const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key]; if(!d)return; const nx=px+d[0],ny=py+d[1]; const hit=cells.find(c=>c.x===nx&&c.y===ny); if(hit&&!hit.wall){px=nx;py=ny;paint(); if(px===gx&&py===gy) api.add(10);} };
  window.addEventListener('keydown',on); return ()=>window.removeEventListener('keydown',on);
},
shooter(arena,api){
  api.setIns('← → to move, Space to shoot enemies.');
  const c=el('canvas','canvas'); c.width=480;c.height=360; arena.append(c); const x=c.getContext('2d');
  let ship=220,shots=[],en=[],run=true;
  const key={}; const kd=e=>key[e.code]=1, ku=e=>key[e.code]=0; window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
  let t=setInterval(()=>en.push({x:rand(450),y:-20}),900);
  function loop(){ if(!run)return; ship+=key.ArrowLeft?-4:key.ArrowRight?4:0; ship=Math.max(10,Math.min(450,ship)); if(key.Space&&Math.random()<.2)shots.push({x:ship+10,y:320});
    shots.forEach(s=>s.y-=6); en.forEach(e=>e.y+=2); shots=shots.filter(s=>s.y>-10); en=en.filter(e=>e.y<370);
    for(const s of shots) for(const e of en) if(Math.abs(s.x-e.x)<16&&Math.abs(s.y-e.y)<16){e.dead=s.dead=true;api.add(1)}
    en=en.filter(e=>!e.dead); shots=shots.filter(s=>!s.dead);
    if(en.some(e=>Math.abs(e.x-ship)<18&&e.y>320)){api.setScore(0);en=[];shots=[];}
    x.fillStyle='#050b18';x.fillRect(0,0,480,360); x.fillStyle='#60a5fa';x.fillRect(ship,335,24,18); x.fillStyle='#f8fafc';shots.forEach(s=>x.fillRect(s.x,s.y,4,8)); x.fillStyle='#f87171';en.forEach(e=>x.fillRect(e.x,e.y,18,18));
    requestAnimationFrame(loop);
  } loop(); return ()=>{run=false;clearInterval(t);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)}
},
puzzle(arena,api){
  api.setIns('Slide tiles into order 1-8.');
  let arr=[1,2,3,4,5,6,7,8,0]; for(let i=0;i<120;i++){const z=arr.indexOf(0),opts=[z-1,z+1,z-3,z+3].filter(n=>n>=0&&n<9&&!(z%3===0&&n===z-1)&&!(z%3===2&&n===z+1)); const n=opts[rand(opts.length)]; [arr[z],arr[n]]=[arr[n],arr[z]];}
  const g=el('div','puzzle-grid'); arena.append(g);
  const draw=()=>{g.innerHTML='';arr.forEach((v,i)=>{const t=el('button','tile'+(v? '':' empty'),v||'');t.onclick=()=>{const z=arr.indexOf(0); if([z-1,z+1,z-3,z+3].includes(i)&&!(z%3===0&&i===z-1)&&!(z%3===2&&i===z+1)){[arr[z],arr[i]]=[arr[i],arr[z]];api.add(1);draw(); if(arr.join()==='1,2,3,4,5,6,7,8,0') api.add(20);}};g.append(t)});
  }; draw();
},
penalty(arena,api){
  api.setIns('Press Shoot when marker is in green zone.');
  const wrap=el('div','bar-wrap'),target=el('div','bar-target'),m=el('div','bar-marker'),btn=el('button','btn primary','Shoot'); wrap.append(target,m); arena.append(wrap,btn); let x=0,v=3;
  const timer=setInterval(()=>{x+=v;if(x<0||x>400)v*=-1;m.style.left=x+'px';},16);
  btn.onclick=()=>{if(x>170&&x<240)api.add(5);else api.add(-2)}; return ()=>clearInterval(timer);
},
platformer(arena,api){
  api.setIns('Press Space to jump over blocks.');
  const c=el('canvas','canvas'); c.width=520;c.height=240; arena.append(c);const x=c.getContext('2d'); let y=190,vy=0,obs=[],run=true; const jump=e=>{if(e.code==='Space'&&y>=190)vy=-10}; window.addEventListener('keydown',jump);
  const spawn=setInterval(()=>obs.push({x:530,w:20+rand(20)}),1200);
  function loop(){if(!run)return; vy+=.5;y=Math.min(190,y+vy);obs.forEach(o=>o.x-=4);obs=obs.filter(o=>o.x>-40); if(obs.some(o=>o.x<60&&o.x+o.w>30&&y>170)){api.setScore(0);obs=[];} else api.add(.02);
    x.fillStyle='#050b18';x.fillRect(0,0,520,240);x.fillStyle='#9ca3af';x.fillRect(0,210,520,4);x.fillStyle='#34d399';x.fillRect(30,y,24,24);x.fillStyle='#f97316';obs.forEach(o=>x.fillRect(o.x,188,o.w,22)); requestAnimationFrame(loop);
  } loop(); return ()=>{run=false;clearInterval(spawn);window.removeEventListener('keydown',jump)}
},
memory(arena,api){
  api.setIns('Match all pairs.');
  const vals=[1,1,2,2,3,3,4,4].sort(()=>Math.random()-.5),g=el('div','card-grid'); arena.append(g); let open=[];
  vals.forEach((v,i)=>{const b=el('button','card','?'); b.onclick=()=>{if(b.classList.contains('revealed')||open.length===2)return; b.textContent=v; b.classList.add('revealed'); open.push({b,v}); if(open.length===2){if(open[0].v===open[1].v){api.add(3);open=[]; if([...g.children].every(c=>c.classList.contains('revealed')))api.add(10);} else setTimeout(()=>{open.forEach(o=>{o.b.classList.remove('revealed');o.b.textContent='?'});open=[];},600)}}; g.append(b)});
},
snake(arena,api){
  api.setIns('Arrow keys to eat food and grow.');
  const c=el('canvas','canvas'); c.width=360;c.height=360; arena.append(c); const x=c.getContext('2d'); let d=[1,0],s=[[5,5]],food=[10,8];
  const key=e=>{if(e.key==='ArrowUp')d=[0,-1];if(e.key==='ArrowDown')d=[0,1];if(e.key==='ArrowLeft')d=[-1,0];if(e.key==='ArrowRight')d=[1,0]}; window.addEventListener('keydown',key);
  const t=setInterval(()=>{const h=[s[0][0]+d[0],s[0][1]+d[1]]; if(h[0]<0||h[1]<0||h[0]>=18||h[1]>=18||s.some(p=>p[0]===h[0]&&p[1]===h[1])){api.setScore(0);s=[[5,5]];d=[1,0];}
    s.unshift(h); if(h[0]===food[0]&&h[1]===food[1]){api.add(2);food=[rand(18),rand(18)]} else s.pop(); x.fillStyle='#050b18';x.fillRect(0,0,360,360); x.fillStyle='#22c55e';s.forEach(p=>x.fillRect(p[0]*20,p[1]*20,18,18)); x.fillStyle='#f43f5e';x.fillRect(food[0]*20,food[1]*20,18,18);},120);
  return ()=>{clearInterval(t);window.removeEventListener('keydown',key)}
},
tetris(arena,api){
  api.setIns('Arrow keys move block, fill rows to score.');
  const c=el('canvas','canvas'); c.width=240;c.height=360; arena.append(c);const x=c.getContext('2d'); const W=10,H=16; let g=[...Array(H)].map(()=>Array(W).fill(0)),p={x:4,y:0};
  const key=e=>{if(e.key==='ArrowLeft')p.x--;if(e.key==='ArrowRight')p.x++;if(e.key==='ArrowDown')step()}; window.addEventListener('keydown',key);
  function spawn(){p={x:rand(W),y:0}; if(g[0][p.x]){g=[...Array(H)].map(()=>Array(W).fill(0));api.setScore(0);}}
  function step(){if(p.y+1>=H||g[p.y+1][p.x]){g[p.y][p.x]=1; spawn(); const kept=g.filter(r=>r.some(v=>!v)); const cleared=H-kept.length; while(kept.length<H)kept.unshift(Array(W).fill(0)); g=kept; if(cleared)api.add(cleared*5);} else p.y++;}
  spawn(); const t=setInterval(()=>{step();x.fillStyle='#050b18';x.fillRect(0,0,240,360); for(let y=0;y<H;y++)for(let i=0;i<W;i++)if(g[y][i]){x.fillStyle='#60a5fa';x.fillRect(i*24,y*22,22,20)} x.fillStyle='#fbbf24';x.fillRect(p.x*24,p.y*22,22,20);},250);
  return ()=>{clearInterval(t);window.removeEventListener('keydown',key)}
},
flappy(arena,api){
  api.setIns('Click to flap through pipe gaps.');
  const c=el('canvas','canvas'); c.width=420;c.height=300; arena.append(c); const x=c.getContext('2d'); let y=150,vy=0,pipes=[],run=true;
  const flap=()=>vy=-6; c.addEventListener('click',flap); const sp=setInterval(()=>pipes.push({x:430,g:60+rand(160)}),1400);
  function loop(){if(!run)return; vy+=.35;y+=vy; pipes.forEach(p=>p.x-=2.5); pipes=pipes.filter(p=>p.x>-40); if(pipes.some(p=>p.x<90&&p.x>50&&(y<p.g-45||y>p.g+45))||y<0||y>300){api.setScore(0);pipes=[];y=150;vy=0;} pipes.forEach(p=>{if(!p.scored&&p.x<70){p.scored=1;api.add(1)}});
    x.fillStyle='#0b132b';x.fillRect(0,0,420,300);x.fillStyle='#84cc16';pipes.forEach(p=>{x.fillRect(p.x,0,26,p.g-45);x.fillRect(p.x,p.g+45,26,300)});x.fillStyle='#facc15';x.fillRect(70,y,20,16); requestAnimationFrame(loop);
  } loop(); return ()=>{run=false;clearInterval(sp);c.removeEventListener('click',flap)}
},
breakout(arena,api){
  api.setIns('Move mouse to bounce ball and break bricks.');
  const c=el('canvas','canvas'); c.width=480;c.height=320; arena.append(c); const x=c.getContext('2d'); let mx=220,b={x:240,y:200,vx:3,vy:-3},br=[]; for(let r=0;r<4;r++)for(let i=0;i<8;i++)br.push({x:20+i*56,y:20+r*24,h:1});
  const mm=e=>{const r=c.getBoundingClientRect();mx=e.clientX-r.left-35}; window.addEventListener('mousemove',mm);
  const t=setInterval(()=>{b.x+=b.vx;b.y+=b.vy; if(b.x<6||b.x>474)b.vx*=-1;if(b.y<6)b.vy*=-1; if(b.y>292&&b.x>mx&&b.x<mx+70)b.vy=-Math.abs(b.vy); if(b.y>330){b={x:240,y:200,vx:3,vy:-3};api.setScore(0);} br.forEach(k=>{if(k.h&&b.x>k.x&&b.x<k.x+48&&b.y>k.y&&b.y<k.y+16){k.h=0;b.vy*=-1;api.add(1)}});
    x.fillStyle='#050b18';x.fillRect(0,0,480,320);x.fillStyle='#38bdf8';x.fillRect(mx,300,70,10);x.fillStyle='#f59e0b';x.beginPath();x.arc(b.x,b.y,6,0,7);x.fill();x.fillStyle='#a78bfa';br.filter(k=>k.h).forEach(k=>x.fillRect(k.x,k.y,48,16));
    if(br.every(k=>!k.h)){api.add(20);br.forEach(k=>k.h=1)}
  },16); return ()=>{clearInterval(t);window.removeEventListener('mousemove',mm)}
}
};
})();
