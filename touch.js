/* Safari gesture guard. UI taps still activate once; sheet scrolling stays native. */
(function(){
 'use strict';
 const world=document.getElementById('world');
 const prevent=e=>{if(e.cancelable)e.preventDefault();};
 for(const name of ['touchstart','touchmove','touchend'])world.addEventListener(name,prevent,{passive:false});
 let tap=null,lastButton=null,lastActivation=0;
 document.addEventListener('touchstart',e=>{
  if(e.touches.length>1){tap=null;prevent(e);return;}
  const button=e.target.closest?.('button');
  const p=e.changedTouches[0];
  tap=button&&p?{button,id:p.identifier,x:p.clientX,y:p.clientY,moved:false}:null;
 },{passive:false});
 document.addEventListener('touchmove',e=>{
  if(e.touches.length>1){tap=null;prevent(e);return;}
  if(!tap)return;const p=Array.from(e.changedTouches).find(t=>t.identifier===tap.id);
  if(p&&Math.hypot(p.clientX-tap.x,p.clientY-tap.y)>12)tap.moved=true;
 },{passive:false});
 document.addEventListener('touchend',e=>{
  if(!tap)return;const current=tap;tap=null;
  const p=Array.from(e.changedTouches).find(t=>t.identifier===current.id);
  if(!p)return;
  // Cancel Safari's double-tap interpretation and its emulated click.
  prevent(e);
  const under=document.elementFromPoint(p.clientX,p.clientY);
  if(!current.moved&&!current.button.disabled&&current.button.isConnected&&current.button.contains(under)){
   lastButton=current.button;lastActivation=performance.now();current.button.click();
  }
 },{passive:false});
 document.addEventListener('touchcancel',()=>{tap=null;},{passive:true});
 document.addEventListener('click',e=>{
  if(e.isTrusted&&e.detail>0&&performance.now()-lastActivation<500&&lastButton?.contains(e.target)){prevent(e);e.stopImmediatePropagation();}
 },true);
 document.addEventListener('dblclick',e=>{if(!e.target.closest?.('input,textarea'))prevent(e);},{passive:false});
 for(const name of ['gesturestart','gesturechange','gestureend'])document.addEventListener(name,prevent,{passive:false});
})();

/* Keep messages above the actual upgrade dock, including the home indicator inset. */
(function(){
 const dock=document.querySelector('.upgrade-dock');if(!dock)return;
 const root=document.documentElement;let lastClearance=-1;
 const update=()=>{const clearance=Math.ceil(dock.getBoundingClientRect().height);if(clearance!==lastClearance){root.style.setProperty('--dock-clearance','calc('+clearance+'px + 6px + var(--app-safe-bottom))');lastClearance=clearance;}};
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(update);observer.observe(dock);}
 window.addEventListener('resize',update,{passive:true});
 if(window.visualViewport)visualViewport.addEventListener('resize',update,{passive:true});
 update();
})();
