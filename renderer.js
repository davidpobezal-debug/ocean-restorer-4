(function(root){'use strict';
const {hash,companionDefs,biomes,biomeAt}=root.OceanCore;
class Mesh{constructor(){this.v=[];}ellipsoid(x,y,z,rx,ry,rz,c,angle=0,n=8,k=4){const ca=Math.cos(angle),sa=Math.sin(angle),p=(u,v)=>{const ax=Math.cos(v)*Math.cos(u)*rx,zz=Math.cos(v)*Math.sin(u)*rz;return[x+ax*ca+zz*sa,y+Math.sin(v)*ry,z-ax*sa+zz*ca];};for(let j=0;j<k;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,v=-Math.PI/2+j/k*Math.PI,w=-Math.PI/2+(j+1)/k*Math.PI;this.quad(p(a,v),p(a,w),p(b,w),p(b,v),c);}}disc(x,y,z,r,c,n=12){for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;this.tri([x,y,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],c);}}tri(a,b,c,color){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;let shade=.68+.32*Math.max(0,(-nx*.35+ny*.8+nz*.45)/l);for(const p of[a,b,c])this.v.push(...p,color[0]*shade,color[1]*shade,color[2]*shade);}quad(a,b,c,d,col){this.tri(a,b,c,col);this.tri(a,c,d,col);}box(x,y,z,sx,sy,sz,c,angle=0,pitch=0,roll=0){const ca=Math.cos(angle),sa=Math.sin(angle),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll),p=(a,b,d)=>{const ax=a*cr-b*sr,by=a*sr+b*cr,yy=by*cp-d*sp,zz=by*sp+d*cp;return [x+ax*ca+zz*sa,y+yy,z-ax*sa+zz*ca];},a=sx/2,b=sz/2;this.quad(p(-a,0,-b),p(-a,sy,-b),p(a,sy,-b),p(a,0,-b),c);this.quad(p(a,0,b),p(a,sy,b),p(-a,sy,b),p(-a,0,b),c);this.quad(p(-a,0,b),p(-a,sy,b),p(-a,sy,-b),p(-a,0,-b),c);this.quad(p(a,0,-b),p(a,sy,-b),p(a,sy,b),p(a,0,b),c);this.quad(p(-a,sy,-b),p(-a,sy,b),p(a,sy,b),p(a,sy,-b),c);}gem(x,y,z,r,h,c){let top=[x,y+h,z],bottom=[x,y,z];for(let i=0;i<5;i++){const a=i/5*Math.PI*2,b=(i+1)/5*Math.PI*2;this.tri([x+Math.cos(a)*r,y+h*.4,z+Math.sin(a)*r],[x+Math.cos(b)*r,y+h*.4,z+Math.sin(b)*r],top,c);this.tri(bottom,[x+Math.cos(b)*r,y+h*.4,z+Math.sin(b)*r],[x+Math.cos(a)*r,y+h*.4,z+Math.sin(a)*r],c);}}ring(x,y,z,r,width,c,n=20){for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;this.quad([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(a)*(r+width),y,z+Math.sin(a)*(r+width)],[x+Math.cos(b)*(r+width),y,z+Math.sin(b)*(r+width)],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],c);}}}

// Shared low-poly creatures: few rings, bounded count, no texture downloads.
function creature(m,x,y,z,size,angle,kind,color,t,friendly=false){
 const ca=Math.cos(angle),sa=Math.sin(angle),p=(a,b,c)=>[x+(a*ca+c*sa)*size,y+b*size,z+(-a*sa+c*ca)*size],ell=(a,b,c,rx,ry,rz,col)=>m.ellipsoid(...p(a,b,c),rx*size,ry*size,rz*size,col,angle);
 const wag=Math.sin(t*6+size)*.15;
 if(kind==='ray'){
  ell(0,0,0,.42,.13,.5,color);m.tri(p(-.15,.02,.28),p(-1,Math.sin(t*4)*.15,-.1),p(-.2,0,-.45),color);m.tri(p(.15,.02,.28),p(1,Math.sin(t*4)*.15,-.1),p(.2,0,-.45),color);m.tri(p(-.05,0,-.35),p(wag,-.04,-1.2),p(.05,0,-.35),color);
 }else if(kind==='turtle'){
  ell(0,.02,-.05,.43,.24,.53,[.21,.55,.39]);ell(0,.02,.51,.2,.14,.25,color);for(const side of [-1,1])for(const front of [-1,1]){const q=p(side*.43,-.05,front*.28);m.box(...q,.37*size,.07*size,.22*size,color,angle+side*(.4+Math.sin(t*3+front)*.2));}m.gem(...p(0,.16,-.05),.19*size,.21*size,[.72,.87,.47]);
 }else{
  const tall=kind==='tang'?.34:.25;ell(0,0,0,.27,tall,.56,color);
  if(kind==='clown'){for(const zz of [-.22,.16])ell(0,0,zz,.263,.238,.035,[1,.92,.74]);}
  if(kind==='dolphin')ell(0,-.01,.61,.13,.1,.3,color);
  const fin=kind==='tang'?[1,.78,.25]:color;m.tri(p(0,.15,-.3),p(0,.5,-.1),p(0,.15,.18),fin);m.tri(p(0,0,-.45),p(-.29,0,-.8+wag),p(.29,0,-.8-wag),fin);
  for(const side of [-1,1])m.tri(p(side*.13,0,.17),p(side*.48,Math.sin(t*7)*.04,-.06),p(side*.15,-.07,-.16),color);
 }
 for(const side of [-1,1]){const eyeZ=kind==='turtle'?.62:.34,eyeX=kind==='turtle'?.13:.235,eyeY=kind==='ray'?.08:.1;ell(side*eyeX,eyeY,eyeZ,.074,.08,.076,[1,.98,.89]);ell(side*(eyeX+.035),eyeY+.005,eyeZ+.035,.036,.046,.04,[.035,.14,.2]);}
 if(friendly){m.ring(x,.045,z,.45*size,.018,[.97,.84,.41],16);m.gem(x,y+.45*size,z,.045,.1,[1,.89,.48]);}
}

class Renderer{
constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});if(!this.gl)throw Error('Tento prehliadač nemá dostupné WebGL. Otvor hru v Chrome alebo Safari so zapnutou hardvérovou akceleráciou.');const gl=this.gl;const shader=(type,source)=>{let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,'attribute vec3 p;attribute vec3 c;uniform vec2 camera;uniform vec2 screen;uniform float zoom;uniform float horizon;varying vec3 color;void main(){vec2 d=p.xz-camera;vec2 v=vec2((d.x-d.y)*0.82,(d.x+d.y)*0.46-p.y)*zoom;gl_Position=vec4(v.x/screen.x*2.,-v.y/screen.y*2.+horizon,-((d.x+d.y)*0.5+p.y)/500.,1.);color=c;}'));gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 color;void main(){gl_FragColor=vec4(color,1.);}'));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);this.p=gl.getAttribLocation(this.program,'p');this.c=gl.getAttribLocation(this.program,'c');this.cam=gl.getUniformLocation(this.program,'camera');this.screen=gl.getUniformLocation(this.program,'screen');this.zoomLoc=gl.getUniformLocation(this.program,'zoom');this.horizonLoc=gl.getUniformLocation(this.program,'horizon');gl.enableVertexAttribArray(this.p);gl.enableVertexAttribArray(this.c);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.025,.17,.23,1);this.chunks=new Map();this.dynamic=gl.createBuffer();this.mesh=new Mesh();this.capacity=0;this.quality='auto';this.low=false;this.vertices=0;this.builds=0;this.resize();}
resize(){const rect=this.canvas.getBoundingClientRect?.();this.w=Math.max(1,rect?.width||innerWidth);this.h=Math.max(1,rect?.height||innerHeight);const d=Math.min(devicePixelRatio||1,this.low?1:1.5);const width=Math.round(this.w*d),height=Math.round(this.h*d);if(this.canvas.width!==width)this.canvas.width=width;if(this.canvas.height!==height)this.canvas.height=height;this.gl.viewport(0,0,this.gl.drawingBufferWidth,this.gl.drawingBufferHeight);this.focus=this.w<600?(this.h<650?.45:.5):.5;this.zoom=this.w<600?Math.max(30,Math.min(39,this.w/10)):48;}
setQuality(low){this.low=low;this.resize();}
reset(){for(const c of this.chunks.values())this.gl.deleteBuffer(c.buffer);this.chunks.clear();}
upload(mesh,buffer){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.v),gl.STATIC_DRAW);return mesh.v.length/6;}
drawBuffer(buffer,count){const g=this.gl;g.bindBuffer(g.ARRAY_BUFFER,buffer);g.vertexAttribPointer(this.p,3,g.FLOAT,false,24,0);g.vertexAttribPointer(this.c,3,g.FLOAT,false,24,12);g.drawArrays(g.TRIANGLES,0,count);}
chunk(cx,cz,game){const key=cx+','+cz,clip=Math.min(cx*8+8,Math.floor(game.revealedEnd));let cached=this.chunks.get(key);if(cached&&cached.clip===clip&&!game.dirtyChunks.has(key))return cached;const m=new Mesh();for(let x=cx*8;x<clip;x++)for(let z=cz*8;z<cz*8+8;z++){
 if(x< -48||x>=240||Math.abs(z)>48)continue;
 const b=biomeAt(x),palette=b.corals,clean=game.isClean(x,z),s=hash(x,z,game.seed);let floor=b.floor;
 for(let j=1;j<=game.unlockedRegion;j++){const next=biomes[j];if(Math.abs(x-next.start)<4){const t=(x-next.start+4)/8,prev=biomes[j-1];floor=prev.floor.map((v,i)=>v+(next.floor[i]-v)*t);}}
 const col=clean?floor.map(v=>Math.min(1,v+s*.09)):[.055+s*.025,.10+s*.025,.135+s*.03];
 m.quad([x-.5,0,z-.5],[x-.5,0,z+.5],[x+.5,0,z+.5],[x+.5,0,z-.5],col);
 if(clean){if(s>.62){const c=palette[Math.floor(s*30)%4];if(b.id===2){m.gem(x,.01,z,.19,.55+s*.45,c);m.disc(x,.035,z,.25,[c[0]*.55,c[1]*.55,c[2]*.55],8);m.gem(x+.25,.01,z-.1,.09,.34,palette[(Math.floor(s*30)+1)%4]);}else{m.box(x,.01,z,.13,.4+s*.4,.13,c);m.box(x+.18,.2,z,.13,.25,.13,c);m.gem(x-.19,.01,z+.13,.13,.4,c);}}
  if(b.id===1&&s>.91){m.box(x,.015,z,.75,.07,.22,[.50,.31,.16],s*8);m.box(x+.15,.02,z+.13,.65,.06,.14,[.66,.46,.24],s*8+.3);}
 }else{if(s>.62)m.disc(x,.012,z,.4+s*.18,game.resistance(x,z)===2?[.055,.045,.07]:[.035,.065,.085],10);if(s>.76)m.box(x,.01,z,.5,.07+s*.12,.4,[.07,.12,.16],s*3);if(s>.92)m.box(x,.15,z,.15,.18,.14,[.38,.48,.42],s*3);if(game.hard(x,z)&&s>.7)m.gem(x,.02,z,.17,.3,[.32,.24,.37]);}
}
if(!cached){cached={buffer:this.gl.createBuffer()};this.chunks.set(key,cached);}cached.clip=clip;cached.count=this.upload(m,cached.buffer);this.builds++;game.dirtyChunks.delete(key);return cached;}
project(x,y,z,cam){return{x:this.w/2+((x-cam.x)-(z-cam.z))*.82*this.zoom,y:this.h*this.focus+((x-cam.x)+(z-cam.z))*.46*this.zoom-y*this.zoom};}
draw(game,dt,t,particles,input){const g=this.gl;let follow=1-Math.exp(-dt*8);game.camera.x+=(game.player.x-game.camera.x)*follow;game.camera.z+=(game.player.z-game.camera.z)*follow;const water=game.biome(game.camera.x).water;this.water??=[...water];for(let i=0;i<3;i++)this.water[i]+=(water[i]-this.water[i])*(1-Math.exp(-dt*1.6));g.clearColor(...this.water,1);g.useProgram(this.program);g.uniform2f(this.cam,game.camera.x,game.camera.z);g.uniform2f(this.screen,this.w,this.h);g.uniform1f(this.zoomLoc,this.zoom);g.uniform1f(this.horizonLoc,1-2*this.focus);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);const r=Math.ceil((this.w/this.zoom+this.h/this.zoom)/1.6/8)+1,cx=Math.floor(game.camera.x/8),cz=Math.floor(game.camera.z/8);let draws=0;this.vertices=0;
for(let x=cx-r;x<=cx+r;x++)for(let z=cz-r;z<=cz+r;z++){if(x<-6||x>29||x*8>=Math.floor(game.revealedEnd)||z<-6||z>6)continue;let p=this.project(x*8+4,0,z*8+4,game.camera);if(p.x<-this.zoom*7||p.x>this.w+this.zoom*10||p.y<-this.zoom*5||p.y>this.h+this.zoom*6)continue;const c=this.chunk(x,z,game);this.drawBuffer(c.buffer,c.count);this.vertices+=c.count;draws++;}
const m=this.mesh;m.v.length=0;const base=[.12,.69,.78],gold=[1,.73,.28];m.box(0,.01,0,2.6,.18,2.6,[.15,.4,.47]);m.box(-.7,.18,-.7,.45,1.5,.45,base);m.gem(-.7,1.68,-.7,.28,.65,[.35,1,.86]);m.ring(0,.2,0,1.7,.08,[.3,.9,.84]);
const visible=(x,z)=>{if(x>=Math.floor(game.revealedEnd))return false;const q=this.project(x,0,z,game.camera);return q.x>-90&&q.x<this.w+90&&q.y>-90&&q.y<this.h+90;};
// A short ribbon of mist is the actual frontier. Future ground is absent.
if(game.revealedEnd<240){const edge=Math.floor(game.revealedEnd)-.5,z0=Math.max(-48,Math.floor(game.camera.z)-23),z1=Math.min(48,Math.ceil(game.camera.z)+23),q=this.project(edge,0,game.camera.z,game.camera);
 if(q.x>-this.zoom*24&&q.x<this.w+this.zoom*24){for(let i=0;i<7;i++){const mix=i/7,c=this.water.map((v,k)=>v*mix+[.17,.39,.44][k]*(1-mix)),x=edge+i*1.5;m.quad([x,.025,z0],[x,.025,z1],[x+1.5,.025,z1],[x+1.5,.025,z0],c);}for(let z=z0;z<z1;z+=2){m.gem(edge+Math.sin(t*1.5+z)*.12,.03,z,.10,.2,[.48,.78,.79]);}}
}
// Recovered borders stay marked after the world grows, without level transitions.
for(let i=1;i<=game.unlockedRegion;i++){const b=biomes[i],col=b.corals[0];for(const z of [-8,2])if(visible(b.start,z)){m.gem(b.start,.03,z,.25,1.1,col);}if(visible(b.start,-3))m.ring(b.start,.025,-3,2,.05,col,24);}
// A few cached-looking landmarks, bounded by the same visibility check.
if(visible(65,-9)){const wood=[.47,.29,.15];m.box(65,.02,-9,5,.22,2.2,wood,.14);for(let i=0;i<5;i++){m.box(63+i,.2,-10,.13,1.25,.13,wood,.14);m.box(63+i,.2,-8,.13,.8,.13,wood,.14);}m.box(65,.25,-9,.17,2.1,.17,[.68,.47,.24]);m.tri([65,2.3,-9],[65,1,-9],[66.4,1,-9],[.82,.71,.43]);}
if(visible(158,-10)){for(let i=0;i<5;i++){const a=i*1.256;m.gem(158+Math.cos(a)*1.5,.01,-10+Math.sin(a)*1.5,.35,1.3,biomes[2].corals[i%4]);}}
for(const h of game.hazards){if(h.spent||!visible(h.x,h.z))continue;let phase=(game.elapsed+h.phase)%7,active=phase>4.2,c=active?[1,.24,.27]:phase>3?[1,.65,.2]:[.38,.27,.31];if(h.type==='mine'){m.box(h.x,.05,h.z,.65,.35,.65,[.32,.17,.22]);m.gem(h.x,.4,h.z,.14,.3,[1,.3,.28]);m.ring(h.x,.025,h.z,1.15,.04,h.arm>0?[1,.65-.4*h.arm,.15]:[.7,.28,.29],18);if(h.arm>0)m.ring(h.x,.04,h.z,.15+h.arm,.09,[1,.3,.15],16);}else{m.box(h.x,.01,h.z,.85,.3,.85,[.21,.29,.33]);m.ring(h.x,.035,h.z,1.1,.07,c);if(active){m.gem(h.x,.2,h.z,.45,1.4+Math.sin(t*8)*.25,[.85,.38,.45]);m.gem(h.x+.25,.4,h.z-.25,.2,1.7,[.97,.59,.49]);}}}
for(const c of game.chests){if(c.taken||!visible(c.x,c.z))continue;m.box(c.x,.1,c.z,.65,.4,.5,[.82,.53,.19]);m.box(c.x,.5,c.z,.7,.14,.55,gold);m.gem(c.x,.9+Math.sin(t*2)*.15,c.z,.15,.45,[.6,1,.85]);m.ring(c.x,.025,c.z,.8,.035,gold,18);}
for(const s of game.sites){if(!visible(s.x,s.z))continue;const col=s.restored?[.35,1,.77]:s.need>game.levels.power?[.55,.36,.49]:[.95,.74,.36];m.ring(s.x,.03,s.z,s.r,.035,col,32);m.box(s.x,.03,s.z,.65,.24,.65,[.17,.38,.43]);m.gem(s.x,.35,s.z,.25,s.restored?1.3:.7,col);if(s.restored)m.ring(s.x,.27,s.z,.7,.08,col);}
// Only a small school near restored tiles is animated; no map traversal.
for(let i=0;i<(this.low?5:10);i++){const x=Math.floor(game.camera.x/4)*4+(i%4-1.5)*3+Math.sin(t*.7+i)*.7,z=Math.floor(game.camera.z/4)*4+(Math.floor(i/4)-1)*3+Math.cos(t*.6+i)*.8;if(!game.isClean(Math.round(x),Math.round(z))||!visible(x,z))continue;const kind=game.count>300&&i%4===0?'turtle':i%3===0?'clown':i%3===1?'tang':'ray',col=i%3===0?[1,.57,.28]:i%3===1?[.27,.68,.95]:[.71,.54,.91];creature(m,x,.55+Math.sin(t*2+i)*.1,z,kind==='turtle'?.55:kind==='ray'?.45:.5,Math.sin(t*.3+i)*.7+1,kind,col,t);}
for(const c of game.companions){if(!visible(c.x,c.z))continue;const d=companionDefs[c.id];creature(m,c.x,.72+Math.sin(t*3+c.id)*.09,c.z,d.size,c.angle,d.kind,d.color,t,true);if(c.target){for(let i=0;i<3;i++){const q=(t*1.8+i*.33)%1;m.box(c.x+Math.cos(i*2.1)*(1-q)*d.radius,.03+q*.2,c.z+Math.sin(i*2.1)*(1-q)*d.radius,.045,.045,.045,[.8,.99,.65]);}}}
// Bounded shark meshes and a fixed charge lane make the attack readable before contact.
for(const s of game.sharks){if(!visible(s.x,s.z))continue;const emerge=s.phase==='emerge',y=emerge?-.24+Math.min(1,s.timer/1.8)*.64:s.phase==='retreat'?.4-s.timer*.3:.43,ca=Math.cos(s.angle),sa=Math.sin(s.angle),p=(x,h,z)=>[s.x+x*ca+z*sa,y+h,s.z-x*sa+z*ca],c=s.phase==='dash'?[.43,.39,.55]:s.tier>=3?[.25,.34,.51]:[.3,.47,.58];
 const segments=Math.min(6,s.maxHp);for(let life=0;life<segments;life++)m.box(s.x+(life-(segments-1)/2)*.22,y+1.05,s.z,.14,.07,.12,life/segments<s.hp/s.maxHp?[1,.68,.35]:[.22,.29,.34]);m.disc(s.x,.02,s.z,.72,[.025,.07,.1],12);if(s.phase!=='retreat')m.ring(s.x,.03,s.z,emerge?.85+Math.sin(t*5)*.12:1,.04,s.phase==='dash'?[1,.3,.28]:[1,.65,.32],20);
 if(s.phase==='windup'){const d=Math.min(9,Math.hypot(game.player.x-s.x,game.player.z-s.z)+1),q=(x,z)=>[s.x+x*ca+z*sa,.035,s.z-x*sa+z*ca];m.quad(q(-.35,0),q(.35,0),q(.35,d),q(-.35,d),[.55,.23,.22]);}
 m.box(s.x,y,s.z,.62,.36,1.55,c,s.angle);const head=p(0,.03,.86);m.box(...head,.43,.25,.65,c,s.angle);const belly=p(0,-.015,.1);m.box(...belly,.51,.045,1.4,[.68,.78,.77],s.angle);
 m.tri(p(0,.25,-.32),p(0,.85,-.18),p(0,.25,.42),c);m.tri(p(-.2,.15,.1),p(-.86,.11,-.5),p(-.14,.1,-.45),c);m.tri(p(.2,.15,.1),p(.86,.11,-.5),p(.14,.1,-.45),c);
 const wag=Math.sin(t*9+s.id)*.2;m.tri(p(0,.15,-.78),p(wag,.7,-1.3),p(wag,-.13,-1.3),c);for(const side of [-1,1]){const e=p(side*.24,.19,.82);m.box(...e,.06,.07,.1,[.025,.065,.08],s.angle);}
}
if(game.lure){m.box(game.lure.x,.05,game.lure.z,.35,.35,.35,[.62,.55,.94]);m.gem(game.lure.x,.4,game.lure.z,.17,.35,[.76,.79,1]);m.ring(game.lure.x,.035,game.lure.z,.8+Math.sin(t*5)*.2,.05,[.66,.68,.95]);}
const p=game.player,moving=Math.min(Math.hypot(input.x,input.z),1);this.diverYaw??=p.angle;this.diverYaw+=Math.atan2(Math.sin(p.angle-this.diverYaw),Math.cos(p.angle-this.diverYaw))*(1-Math.exp(-dt*12));const a=this.diverYaw,ca=Math.cos(a),sa=Math.sin(a),lean=.65+moving*.4,bob=.08*Math.sin(t*3)+moving*.035*Math.sin(t*9),cp=Math.cos(lean),sp=Math.sin(lean);
const part=(x,y,z,sx,sy,sz,c,pitch=0,roll=0)=>{const yy=(y-.65)*cp-z*sp+.65+.12+bob,zz=(y-.65)*sp+z*cp;m.box(p.x+x*ca+zz*sa,yy,p.z-x*sa+zz*ca,sx,sy,sz,c,a,lean+pitch,roll);};
m.ring(p.x,.035,p.z,1.25+game.levels.range*.35,.025,[.32,.79,.73]);
if(game.invulnerable===0||Math.floor(t*12)%2===0){
 const kick=Math.sin(t*(moving>0?9:3))*(.12+moving*.35),suit=[.98,.67,.22],dark=[.07,.23,.31],fin=[.1,.63,.67];
 part(-.18,.22,-.08,.21,.44,.24,dark,kick);part(.18,.22,-.08,.21,.44,.24,dark,-kick);part(-.18,.09,-.23,.27,.07,.61,fin,kick);part(.18,.09,-.23,.27,.07,.61,fin,-kick);
 part(0,.65,0,.62,.56,.39,suit);part(0,.73,-.29,.4,.57,.24,[.1,.43,.51]);part(0,1.23,.02,.64,.44,.56,[1,.79,.38]);part(0,1.3,.32,.5,.23,.07,[.13,.73,.87]);
 part(-.37,.77,.14,.17,.34,.22,dark,.22+Math.sin(t*5)*.08);part(.37,.77,.18,.17,.34,.22,dark,.35);
 // Low nozzle sweeps over the seabed while the articulated body hovers above it.
 const sweep=game.vacuumActive?Math.sin(t*6)*.16:0,nx=p.x+Math.sin(a+sweep)*.92,nz=p.z+Math.cos(a+sweep)*.92;
 m.box(nx,.16+bob*.2,nz,.56,.13,.26,[.43,.95,.85],a+sweep);m.box(p.x+sa*.61,.32+bob*.4,p.z+ca*.61,.14,.15,.6,[.12,.44,.5],a,.3);
 if(game.vacuumActive){const r=1.25+game.levels.range*.35,particles=this.low?6:12;for(let i=0;i<particles;i++){const phase=(t*2.2+i/particles)%1,ang=i*2.399+t*.4,bx=p.x+Math.cos(ang)*r,bz=p.z+Math.sin(ang)*r,q=phase*phase;m.box(bx+(nx-bx)*q,.03+phase*.17,bz+(nz-bz)*q,.055,.045,.055,i%3?[.42,.9,.81]:[.14,.25,.27]);}m.ring(nx,.035,nz,.23+Math.sin(t*12)*.04,.025,[.7,1,.87],12);}
 for(let i=0;i<(this.low?2:4);i++){const b=(t*.65+i*.24)%1;m.gem(p.x-sa*.3+(i%2?-.09:.09),1.05+b*.8,p.z-ca*.3,.025+b*.018,.065,[.57,.86,.91]);}
}
if(game.shield>0)m.ring(p.x,.15,p.z,.8+Math.sin(t*3)*.05,.05,[.66,.83,1]);
if(game.pulseAge<.65){const q=game.pulseAge/.65;m.ring(p.x,.09,p.z,.2+q*game.pulseRange(),.1*(1-q)+.025,[.32+q*.15,.92-q*.4,.93-q*.3],this.low?24:40);}
if(game.levels.bot){const b=game.bot;m.box(b.x,.7+Math.sin(t*3)*.08,b.z,.55,.35,.5,[.42,.89,.86]);m.gem(b.x,1,b.z,.12,.18,[.9,1,.94]);m.ring(b.x,.03,b.z,1,.02,[.23,.67,.69],16);}
for(const q of particles){m.box(q.x,q.y,q.z,q.size,q.size,q.size,q.color);}
const n=m.v.length/6;g.bindBuffer(g.ARRAY_BUFFER,this.dynamic);if(!this.array||this.array.length<m.v.length){this.capacity=Math.ceil(m.v.length/8192)*8192;this.array=new Float32Array(this.capacity);g.bufferData(g.ARRAY_BUFFER,this.array.byteLength,g.DYNAMIC_DRAW);}this.array.set(m.v);g.bufferSubData(g.ARRAY_BUFFER,0,this.array.subarray(0,m.v.length));this.drawBuffer(this.dynamic,n);this.vertices+=n;this.draws=draws+1;
// Discard distant cached chunks so walking across the world cannot grow GPU memory without bound.
if(this.chunks.size>70)for(const[key,c]of this.chunks){const[x,z]=key.split(',').map(Number);if(Math.abs(x-cx)>r+1||Math.abs(z-cz)>r+1){g.deleteBuffer(c.buffer);this.chunks.delete(key);}}
}}
root.OceanRenderer=Renderer;
})(window);
