/* IOS-BOTTOM-01: only display geometry; game rules and save keys stay in V2.2. */
(function () {
 'use strict';
 const BUILD = 'V2.2.1 · IOS-BOTTOM-01';
 const root = document.documentElement;
 const app = document.getElementById('ocean-app');
 const standaloneQuery = matchMedia('(display-mode: standalone)');
 const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
 let frame = 0, settleTimer = 0;
 const standalone = () => navigator.standalone === true || standaloneQuery.matches;
 function update() {
  frame = 0;
  const vv = window.visualViewport;
  let height = vv && vv.scale === 1 ? vv.height : innerHeight;
  let source = 'visual-viewport';
  if (isIPhone && standalone()) {
   // Installed WebKit can shorten BOTH innerHeight and viewport units. The
   // screen is in CSS pixels: do not multiply it by devicePixelRatio or add
   // either safe inset. Normalize because older iOS keeps portrait dimensions.
   const angle = typeof window.orientation === 'number' ? window.orientation : null;
   const landscape = angle !== null ? Math.abs(angle) % 180 === 90 : matchMedia('(orientation: landscape)').matches;
   const fullHeight = landscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
   const editing = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
   const keyboard = editing && vv && vv.height < fullHeight * .7;
   if (fullHeight > 0 && !keyboard) { height = fullHeight; source = 'iphone-standalone-screen'; }
  }
  if (!(height > 0)) height = innerHeight || 1;
  const value = Math.ceil(height) + 'px';
  if (root.style.getPropertyValue('--ocean-height') !== value) root.style.setProperty('--ocean-height', value);
  root.dataset.oceanDisplay = source;
 }
 function schedule() { if (!frame) frame = requestAnimationFrame(update); }
 function settle() {
  schedule();
  clearTimeout(settleTimer);
  settleTimer = setTimeout(schedule, 350);
 }
 for (const event of ['resize', 'orientationchange', 'pageshow', 'focus']) addEventListener(event, settle, {passive:true});
 if (window.visualViewport) for (const event of ['resize', 'scroll']) visualViewport.addEventListener(event, settle, {passive:true});
 document.addEventListener('visibilitychange', () => { if (!document.hidden) settle(); });
 for (const event of ['focusin', 'focusout']) document.addEventListener(event, settle);
 standaloneQuery.addEventListener?.('change', settle);
 function snapshot() {
  const canvas = document.getElementById('world'), gl = canvas.getContext('webgl');
  const rect = element => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}; };
  const css = getComputedStyle(root);
  return {build:BUILD,url:location.href,standalone:standalone(),source:root.dataset.oceanDisplay,
   screen:[screen.width,screen.height],inner:[innerWidth,innerHeight],
   visualViewport:window.visualViewport ? {height:visualViewport.height,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale} : null,
   safe:{top:css.getPropertyValue('--app-safe-top'),bottom:css.getPropertyValue('--app-safe-bottom')},
   app:rect(app),canvas:rect(canvas),buffer:[canvas.width,canvas.height],
   drawingBuffer:gl ? [gl.drawingBufferWidth,gl.drawingBufferHeight] : null,
   glViewport:gl ? Array.from(gl.getParameter(gl.VIEWPORT)) : null,
   dock:rect(document.querySelector('.upgrade-dock')),serviceWorker: navigator.serviceWorker?.controller?.scriptURL || null};
 }
 window.oceanDisplay = {build:BUILD,snapshot};
 // The pause screen exposes the actual launch URL, including an old icon's path.
 document.getElementById('pause').addEventListener('click', () => queueMicrotask(() => {
  const body = document.getElementById('sheetBody');
  if (document.getElementById('display-check')) return;
  const details = document.createElement('details'); details.id = 'display-check';
  const summary = document.createElement('summary'); summary.textContent = 'Kontrola verzie a obrazovky';
  const pre = document.createElement('pre');
  details.append(summary, pre);
  details.addEventListener('toggle', () => { if (details.open) pre.textContent = JSON.stringify(snapshot(), null, 2); });
  body.append(details);
 }));
 update();
})();
