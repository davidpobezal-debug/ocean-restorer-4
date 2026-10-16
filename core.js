(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=(x,z,seed=1)=>{let n=Math.imul(x+seed*131,374761393)^Math.imul(z+17,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
const upgrades=[
 {id:'range',group:'clean',icon:'◎',name:'Dosah',desc:'+0,35 m k šírke čistenia',cost:120,max:5},
 {id:'power',group:'clean',icon:'ϟ',name:'Výkon',desc:'Tlak 1: olej · tlak 2: ropná kôra',cost:180,max:5},
 {id:'bot',group:'clean',icon:'◈',name:'Robot',desc:'Samostatný čistiaci pomocník',cost:420,max:3},
 {id:'oxygen',group:'clean',icon:'◌',name:'Kyslík',desc:'+35 s kapacity a plná zásoba',cost:240,max:4},
 {id:'speed',group:'clean',icon:'➜',name:'Plutvy',desc:'Rýchlejšie čistenie plôch aj únik',cost:180,max:4},
 {id:'recycle',group:'clean',icon:'♻',name:'Recyklácia',desc:'+1 surovina za každé vyčistené pole',cost:300,max:4},
 {id:'burst',group:'defense',icon:'✹',name:'Sila pulzu',desc:'+1 sila zásahu proti odolným žralokom',cost:230,max:4},
 {id:'charge',group:'defense',icon:'ϟ',name:'Nabíjanie',desc:'Pulz pripravený o 0,9 s skôr',cost:210,max:4},
 {id:'armor',group:'defense',icon:'⬡',name:'Oblek',desc:'+1 život a oprava celého obleku',cost:200,max:3},
 {id:'sonar',group:'defense',icon:'◎',name:'Dosah pulzu',desc:'+0,5 m k obrannej vlne',cost:160,max:4},
 {id:'shield',group:'defense',icon:'◉',name:'Štít',desc:'Pohltí zásah a postupne sa obnovuje',cost:360,max:3},
 {id:'decoy',group:'defense',icon:'✧',name:'Návnada',desc:'Pulz zanechá maják, ktorý láka žralokov',cost:320,max:3}
];
const companionDefs=[
 {id:0,name:'Lumi',kind:'clown',goal:80,radius:.55,power:.85,size:.45,color:[1,.56,.22]},
 {id:1,name:'Nori',kind:'tang',goal:220,radius:.75,power:1.15,size:.62,color:[.22,.65,1]},
 {id:2,name:'Mila',kind:'ray',goal:460,radius:1,power:1.5,size:.95,color:[.69,.55,.98]},
 {id:3,name:'Tobi',kind:'turtle',goal:800,radius:1.15,power:1.8,size:1.05,color:[.42,.85,.52]},
 {id:4,name:'Delfi',kind:'dolphin',goal:1300,radius:1.4,power:2.1,size:1.25,color:[.55,.88,.94]}
];
// Contiguous regions. Only visible chunks are built by the renderer.
const biomes=[
 {id:0,name:'Tropický útes',short:'ÚTES',start:-48,end:48,center:0,goal:180,water:[.025,.17,.23],floor:[.13,.67,.63],corals:[[.95,.36,.63],[.53,.42,.91],[.21,.85,.71],[.98,.6,.32]]},
 {id:1,name:'Jantárové vrakovisko',short:'VRAKOVISKO',start:48,end:144,center:96,goal:260,water:[.06,.18,.21],floor:[.72,.49,.23],corals:[[1,.66,.24],[.93,.35,.37],[.39,.83,.66],[1,.85,.47]]},
 {id:2,name:'Svetielkujúce hlbiny',short:'HLBINY',start:144,end:240,center:192,goal:0,water:[.055,.055,.17],floor:[.30,.25,.65],corals:[[.40,.84,1],[.83,.43,1],[.35,1,.79],[.98,.53,.83]]}
];
const biomeAt=x=>biomes[x>=144?2:x>=48?1:0];
// Keep the familiar opening. Beyond wave 7 another wave starts every 1,200 tiles.
const openingPressure=[80,200,400,750,1200,2000,3200];
function pressureAt(count){return count<3200?openingPressure.filter(n=>count>=n).length:7+Math.floor((count-3200)/1200);}
function sharkStats(tier){const opening=Math.min(tier,7),extra=Math.max(0,tier-7),growth=1-Math.exp(-extra/12);return {
 hp:1+Math.floor(tier/2),cap:Math.min(4,1+Math.floor(tier*.6)),
 chase:1.7+opening*.28+1.8*growth,dash:7.4+opening*.55+3*growth,
 windup:Math.max(.85,1.35-opening*.08),spawn:Math.max(4.5,14-opening*2)-1.5*growth
};}
const nameOf=v=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,20)||'Potápač':'Potápač';
function sanitizeMeta(raw){
 raw=raw&&typeof raw==='object'?raw:{};const m={};
 for(const [key,max]of Object.entries({pearls:1000000,tank:4,suit:4,best:30000,dives:100000,reefs:9,bestScore:5000000,bestAssisted:5000000,collection:31,favorite:4}))m[key]=Number.isFinite(raw[key])?clamp(Math.floor(raw[key]),0,max):0;
 m.pendingBuddy=Number.isInteger(raw.pendingBuddy)&&raw.pendingBuddy>=0&&raw.pendingBuddy<5&&(m.collection&(1<<raw.pendingBuddy))?raw.pendingBuddy:-1;
 m.nickname=nameOf(raw.nickname);if(m.collection&&!(m.collection&(1<<m.favorite)))m.favorite=[0,1,2,3,4].find(i=>m.collection&(1<<i));return m;
}
function checksum(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function encodeResult(r){const a=[8,nameOf(r.name),r.score,r.count,r.kills,r.tier,r.assisted?1:0,r.seconds,r.favorite,r.tank,r.suit];const payload=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(a)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return 'ORX22-'+payload+'.'+checksum(payload);}
function decodeResult(code){
 if(typeof code!=='string'||code.length>900)throw Error('Neplatný kód výsledku.');const m=/^ORX22-([A-Za-z0-9_-]+)\.([a-z0-9]+)$/.exec(code.trim());if(!m||checksum(m[1])!==m[2])throw Error('Použi kód z experimentálnej V2.2. Kód môže byť aj neúplný.');
 let a;try{a=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(m[1].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));}catch{throw Error('Kód sa nedá prečítať.');}
 if(!Array.isArray(a)||a.length!==11||a[0]!==8||typeof a[1]!=='string')throw Error('Nepodporovaná verzia výsledku.');
 const limits={2:[0,5000000],3:[0,30000],4:[0,10000],5:[0,pressureAt(30000)],6:[0,1],7:[0,86400],8:[-1,4],9:[0,4],10:[0,4]};
 for(const [i,[lo,hi]]of Object.entries(limits))if(!Number.isInteger(a[i])||a[i]<lo||a[i]>hi)throw Error('Výsledok obsahuje neplatné hodnoty.');
 return {id:m[2],name:nameOf(a[1]),score:a[2],count:a[3],kills:a[4],tier:a[5],assisted:!!a[6],seconds:a[7],favorite:a[8],tank:a[9],suit:a[10],code:code.trim()};
}
class Game{
 constructor(meta={},emit=()=>{}){this.meta=sanitizeMeta(meta);this.emit=emit;this.run=0;this.reset();}
 reset(){
  this.run++;this.meta.dives++;this.seed=this.meta.dives*19;this.player={x:0,z:0,angle:0};this.camera={x:0,z:0};
  this.cleaned=new Set();this.progress=new Map();this.dirtyChunks=new Set();this.levels=Object.fromEntries(upgrades.map(u=>[u.id,0]));
  Object.assign(this,{coins:0,count:0,score:0,kills:0,elapsed:0,started:false,status:'playing',endReason:'',invulnerable:0,combo:0,comboClock:0,milestone:40,hardHint:0,lowO2:false,earned:0,upgradeCredits:0,nextShark:Infinity,sharkSerial:0,pulseCooldown:0,pulseAge:10,rescues:1,vacuumActive:false,pressureTier:0,encountersEnabled:true,shield:0,shieldTimer:0,lure:null,assisted:false});
  this.hp=3+this.meta.suit;this.maxHp=this.hp;this.maxO2=110+this.meta.tank*20;this.o2=this.maxO2;this.bot={x:-1,z:0,target:null,timer:0};this.sharks=[];this.companions=[];this.hazards=[];this.chests=[];
  this.sites=[{x:3,z:2,name:'Koralová záhrada',target:72,r:5.2,need:0},{x:17,z:-7,name:'Potopený sad',target:105,r:6.6,need:1},{x:-24,z:-18,name:'Srdce priepasti',target:140,r:7.2,need:2}].map(s=>({...s,count:0,restored:false,refilled:false}));
  this.regionCounts=[0,0,0];this.unlockedRegion=0;this.revealedEnd=48;this.expansion=null;this.generatedRegions=[true,false,false];this.visitedRegions=[true,false,false];this.currentRegion=0;this.gateHint=0;this.startBuddy=this.meta.pendingBuddy;
  if(this.startBuddy>=0){this.recruit(this.startBuddy,true);this.assisted=true;this.meta.pendingBuddy=-1;}
  for(let i=0;i<80;i++){const a=i*2.39996,r=8+Math.sqrt(i)*4.2,h={x:Math.cos(a)*r,z:Math.sin(a)*r,type:i%3===0?'mine':'vent',phase:hash(i,3,this.seed)*7,spent:false,arm:0};if(!this.sites.some(s=>Math.hypot(h.x-s.x,h.z-s.z)<2))this.hazards.push(h);}
  for(let i=0;i<15;i++){const a=.7+i*2.39996,r=6+i*2.6;this.chests.push({x:Math.cos(a)*r,z:Math.sin(a)*r,taken:false});}
  // Supplies along the route let a skilled dive continue beyond the old boundary.
  for(const x of [24,38])this.chests.push({x,z:-3,taken:false});
  this.emit('reset',{});
 }
 generateRegion(id){
  if(!biomes[id]||this.generatedRegions[id])return false;const b=biomes[id];this.generatedRegions[id]=true;
  this.sites.push(...[{x:b.start+9,z:-3,name:b.id===1?'Prístav sasankového vraku':'Maják medúz',target:58,r:4.8,need:b.id},{x:b.center+8,z:8,name:b.id===1?'Zlatá záhrada':'Fialová záhrada',target:90,r:6,need:b.id}].map(s=>({...s,count:0,restored:false,refilled:false})));
  for(const x of (id===1?[60,82,106,129]:[154,176,202,225]))this.chests.push({x,z:-3,taken:false});
  for(let i=0;i<28;i++){const x=b.start+8+hash(i,b.id,this.seed)*78,z=(hash(i+51,b.id,this.seed)-.5)*78;if(Math.abs(z+3)<3||this.sites.some(s=>Math.hypot(x-s.x,z-s.z)<3))continue;this.hazards.push({x,z,type:b.id===2?'vent':i%2?'vent':'mine',phase:hash(i,8,this.seed)*7,spent:false,arm:0});}
  return true;
 }
 key(x,z){return x+','+z;} isClean(x,z){return this.cleaned.has(this.key(x,z));}
 biome(x=this.player.x){return biomeAt(x);}
 bounds(){return {minX:-47,maxX:Math.floor(this.revealedEnd)-1,minZ:-47,maxZ:47};}
 canClean(x,z){return x>=-48&&x<Math.floor(this.revealedEnd)&&Math.abs(z)<=48;}
 resistance(x,z){const b=biomeAt(x);if(b.id)return b.id;const d=Math.hypot(x,z);return d>28?2:d>15&&hash(x,z,this.seed)>.45?1:0;} hard(x,z){return this.resistance(x,z)>0;}
 pressure(){return pressureAt(this.count);}
 nextPressure(){const tier=this.pressure();return tier<7?openingPressure[tier]:3200+(tier-6)*1200;}
 regionGoal(id=this.unlockedRegion){const b=biomes[id],site=this.sites.find(s=>this.biome(s.x).id===id);return {site,count:this.regionCounts[id],target:b.goal,ready:id<2&&this.regionCounts[id]>=b.goal&&!!site?.restored};}
 frontierHint(){if(this.expansion)return 'Prúd ustupuje. Nové dno sa práve odhaľuje.';const goal=this.regionGoal();return !goal.site.restored?'Rozšír oceán: najskôr obnov '+goal.site.name+'.':'Rozšír oceán: obnov ešte '+Math.max(0,goal.target-goal.count)+' polí v tejto oblasti.';}
 checkRegionUnlock(){
  if(this.unlockedRegion>=2||this.expansion)return;const goal=this.regionGoal();if(!goal.ready)return;
  this.unlockedRegion++;const next=biomes[this.unlockedRegion];this.generateRegion(next.id);this.expansion={id:next.id,from:this.revealedEnd,to:next.end,age:0,duration:3.6};
  for(let z=-6;z<=6;z++)this.dirtyChunks.add(Math.floor((next.start-4)/8)+','+z);
  this.emit('region_unlocked',{id:next.id,name:next.name,from:this.revealedEnd,to:next.end});
 }
 advanceExpansion(dt){if(!this.expansion)return;const e=this.expansion;e.age=Math.min(e.duration,e.age+dt);this.revealedEnd=e.from+(e.to-e.from)*e.age/e.duration;if(e.age>=e.duration){this.revealedEnd=e.to;this.expansion=null;this.emit('expansion_complete',{id:e.id,name:biomes[e.id].name});}}
 enterRegion(){const b=this.biome();if(b.id===this.currentRegion)return;this.currentRegion=b.id;if(!this.visitedRegions[b.id]){this.visitedRegions[b.id]=true;this.o2=this.maxO2;this.lowO2=false;this.hp=Math.min(this.maxHp,this.hp+1);this.score+=500*b.id;this.coins+=100;this.emit('region_discovered',{id:b.id,name:b.name,score:500*b.id});}else this.emit('region_return',{id:b.id,name:b.name});}
 drawBuddy(random=Math.random){if(this.status!=='ended'||this.meta.pendingBuddy>=0)return false;const owned=companionDefs.filter(d=>this.meta.collection&(1<<d.id));if(!owned.length)return false;this.meta.pendingBuddy=owned[Math.min(owned.length-1,Math.max(0,Math.floor(random()*owned.length)))].id;this.emit('save',{});return this.meta.pendingBuddy;}
 pulseRange(){return 4.2+this.levels.sonar*.5;} pulsePower(){return 1+this.levels.burst;}
 shieldMax(){return this.levels.shield?1+Math.floor(this.levels.shield/2):0;}
 cost(id){const u=upgrades.find(v=>v.id===id);return u?Math.round(u.cost*Math.pow(1.7,this.levels[id])):Infinity;}
 buy(id,free=false){
  const u=upgrades.find(v=>v.id===id);if(this.status!=='playing'||!u||this.levels[id]>=u.max||(!free&&this.coins<this.cost(id)))return false;
  if(!free)this.coins-=this.cost(id);this.levels[id]++;
  if(id==='oxygen'){this.maxO2+=35;this.o2=this.maxO2;this.lowO2=false;}if(id==='armor'){this.maxHp++;this.hp=this.maxHp;}if(id==='shield'){this.shield=this.shieldMax();this.shieldTimer=0;}
  this.emit('upgrade',{id,name:u.name,free,group:u.group});return true;
 }
 purchase(id){const free=this.upgradeCredits>0;if(free)this.upgradeCredits--;if(this.buy(id,free))return true;if(free)this.upgradeCredits++;return false;}
 permanent(id){if(this.status!=='ended'||!['tank','suit'].includes(id))return false;const cost=10+this.meta[id]*10;if(this.meta.pearls<cost||this.meta[id]>=4)return false;this.meta.pearls-=cost;this.meta[id]++;this.emit('save',{});return true;}
 recruit(id,silent=false){
  if(this.companions.some(c=>c.id===id)||!companionDefs[id])return false;const d=companionDefs[id];this.companions.push({id,x:this.player.x-.7,z:this.player.z-.5,target:null,timer:0,angle:0});
  if(!silent){this.meta.collection|=1<<id;if(this.meta.collection===(1<<id))this.meta.favorite=id;this.score+=100;this.emit('save',{});this.emit('companion',{id,name:d.name});}return true;
 }
 award(n){this.meta.pearls+=n;this.earned+=n;this.meta.best=Math.max(this.meta.best,this.count);this.emit('save',{});}
 result(name=this.meta.nickname){return {name:nameOf(name),score:this.score,count:this.count,kills:this.kills,tier:this.pressure(),assisted:this.assisted,seconds:Math.floor(this.elapsed),favorite:this.startBuddy,tank:this.meta.tank,suit:this.meta.suit};}
 end(reason){if(this.status!=='playing')return;this.status='ended';this.endReason=reason;this.meta.best=Math.max(this.meta.best,this.count);const k=this.assisted?'bestAssisted':'bestScore';this.meta[k]=Math.max(this.meta[k],this.score);this.emit('save',{});this.emit('end',{reason,count:this.count,score:this.score,assisted:this.assisted});}
 nearestBase(){return [{x:0,z:0,name:'Základňa'},...this.sites.filter(s=>s.restored)].reduce((a,b)=>Math.hypot(a.x-this.player.x,a.z-this.player.z)<Math.hypot(b.x-this.player.x,b.z-this.player.z)?a:b);}
 clean(p,r,dt,agent=false,rate=1.6){
  if(!agent)this.vacuumActive=false;const ri=Math.ceil(r);
  for(let x=Math.floor(p.x)-ri;x<=Math.floor(p.x)+ri;x++)for(let z=Math.floor(p.z)-ri;z<=Math.floor(p.z)+ri;z++){
   if(!this.canClean(x,z)||Math.hypot(x-p.x,z-p.z)>r||this.isClean(x,z))continue;const resistance=this.resistance(x,z);
   if(resistance>this.levels.power){if(!agent&&this.elapsed>=this.hardHint){this.hardHint=this.elapsed+8;this.emit('hint',{text:resistance===2?'Ropná kôra: potrebuješ Výkon 2.':'Hustý olej: potrebuješ Výkon 1.'});}continue;}
   if(!agent)this.vacuumActive=true;const k=this.key(x,z),h=(this.progress.get(k)||0)+dt*(agent?rate:3)*(1+this.levels.power*.4)/(1+resistance*.3);if(h<1){this.progress.set(k,h);continue;}
   const region=biomeAt(x).id;this.progress.delete(k);this.cleaned.add(k);this.dirtyChunks.add(Math.floor(x/8)+','+Math.floor(z/8));this.count++;this.regionCounts[region]++;this.score+=10+region*5;this.combo++;this.comboClock=2;
   const value=(4+region+(this.combo>=12?2:0)+this.levels.recycle);this.coins+=value;this.emit('clean',{x,z,value});
   if(this.count===1)this.emit('first',{});if(this.count%30===0){this.award(2);this.emit('reward',{pearls:2});}
   for(const s of this.sites)if(!s.restored&&Math.hypot(x-s.x,z-s.z)<=s.r){s.count++;if(s.count>=s.target){s.restored=true;this.coins+=120;this.score+=400;this.award(5);this.meta.reefs=Math.max(this.meta.reefs,this.sites.filter(v=>v.restored).length);this.emit('save',{});this.emit('restored',{name:s.name,x:s.x,z:s.z});}}
   for(const d of companionDefs)if(this.count>=d.goal)this.recruit(d.id);
   this.checkRegionUnlock();
   const pressure=this.pressure();if(pressure!==this.pressureTier){this.pressureTier=pressure;this.nextShark=Math.min(this.nextShark,this.elapsed+3);this.emit('pressure',{tier:pressure,next:this.nextPressure()});}
   if(this.count>=this.milestone){this.milestone+=120+Math.floor(this.count/160)*40;if(upgrades.every(u=>this.levels[u.id]>=u.max))this.coins+=100;else this.upgradeCredits++;this.emit('choice',{credits:this.upgradeCredits});}
  }
 }
 agentStep(b,radius,rate,dt,scan=4){
  b.timer-=dt;const far=Math.hypot(b.x-this.player.x,b.z-this.player.z)>8;if(far){b.target=null;b.timer=Math.max(b.timer,.5);}
  else if(b.timer<=0||(b.target&&this.isClean(b.target.x,b.target.z))){b.timer=.7+(b.id||0)*.08;b.target=null;let best=Infinity;for(let x=Math.floor(this.player.x)-scan;x<=this.player.x+scan;x++)for(let z=Math.floor(this.player.z)-scan;z<=this.player.z+scan;z++){if(!this.canClean(x,z)||this.isClean(x,z)||this.resistance(x,z)>this.levels.power)continue;const d=Math.hypot(x-b.x,z-b.z)+hash(x,z,(b.id||0)+3)*.6;if(d<best){best=d;b.target={x,z};}}}
  const target=b.target||{x:this.player.x+Math.cos((b.id||0)*2)*1.6,z:this.player.z+Math.sin((b.id||0)*2)*1.6},dx=target.x-b.x,dz=target.z-b.z,d=Math.hypot(dx,dz),v=Math.min(d,dt*(far?9:4.5+(b.id||0)*.2));
  if(d>.03){b.x+=dx/d*v;b.z+=dz/d*v;b.angle=Math.atan2(dx,dz);}if(b.target)this.clean(b,radius,dt,true,rate);
 }
 spawnShark(){
  const pressure=this.pressure(),stats=sharkStats(pressure);if(this.status!=='playing'||pressure===0||this.sharks.filter(s=>s.phase!=='retreat').length>=stats.cap)return false;
  const id=++this.sharkSerial,a=hash(id,this.seed)*Math.PI*2,r=8.4,tier=pressure,hp=stats.hp;
  const bounds=this.bounds(),s={id,tier,hp,maxHp:hp,x:clamp(this.player.x+Math.cos(a)*r,bounds.minX,bounds.maxX),z:clamp(this.player.z+Math.sin(a)*r,-47,47),phase:'emerge',timer:0,angle:0,dx:0,dz:0,rewarded:false,stunFor:0};
  s.angle=Math.atan2(this.player.x-s.x,this.player.z-s.z);this.sharks.push(s);this.emit('shark_warning',{id,tier,hp});return s;
 }
 threat(){return this.sharks.filter(s=>s.phase!=='retreat').reduce((a,s)=>!a||Math.hypot(s.x-this.player.x,s.z-this.player.z)<Math.hypot(a.x-this.player.x,a.z-this.player.z)?s:a,null);}
 pulse(){
  if(this.status!=='playing'||!this.started||this.pulseCooldown>0)return false;
  this.pulseCooldown=9-this.levels.charge*.9;this.pulseAge=0;let hits=0;
  if(this.levels.decoy)this.lure={x:this.player.x,z:this.player.z,life:4+this.levels.decoy*1.5};
  for(const s of this.sharks)if(s.phase!=='retreat'&&Math.hypot(s.x-this.player.x,s.z-this.player.z)<=this.pulseRange()){
   s.hp=Math.max(0,s.hp-this.pulsePower());const dx=s.x-this.player.x,dz=s.z-this.player.z,d=Math.hypot(dx,dz)||1;s.dx=dx/d;s.dz=dz/d;s.x=clamp(s.x+s.dx*1.7,-48,this.bounds().maxX);s.z=clamp(s.z+s.dz*1.7,-48,48);s.timer=0;hits++;
   if(s.hp===0){s.phase='retreat';if(!s.rewarded){s.rewarded=true;this.kills++;const value=35+s.tier*10;this.coins+=value;this.score+=120*s.tier;this.award(1);this.emit('shark_defeated',{x:s.x,z:s.z,value,tier:s.tier});}}
   else {s.phase='recover';s.stunFor=1.7;this.emit('shark_stagger',{hp:s.hp,tier:s.tier});}
  }
  this.emit('pulse',{hits,power:this.pulsePower()});return true;
 }
 damage(type,x,z){
  if(this.invulnerable>0)return false;
  if(this.shield>0){this.shield--;this.shieldTimer=0;this.invulnerable=1.2;this.emit('shield_hit',{});return false;}
  this.hp--;this.invulnerable=2.5;this.combo=0;this.emit('hit',{x,z,type});
  if(this.hp<=0){if(type==='shark'&&this.rescues>0){this.rescues--;const lost=Math.ceil(this.coins*.2);this.coins-=lost;this.relocate();this.emit('rescue',{lost});}else this.end('damage');}return true;
 }
 relocate(){const b=this.nearestBase();this.player.x=b.x;this.player.z=b.z;this.hp=Math.min(this.maxHp,2);this.o2=Math.max(this.o2,this.maxO2*.65);this.invulnerable=5;this.pulseCooldown=0;this.nextShark=this.elapsed+8;for(const c of [this.bot,...this.companions]){c.x=b.x-.6;c.z=b.z;c.target=null;}for(const s of this.sharks){s.phase='retreat';s.timer=0;s.dx=-Math.sin(s.angle);s.dz=-Math.cos(s.angle);}}
 sharkHit(s){return this.damage('shark',s.x,s.z);}
 stepSharks(dt,input){
  const currentPressure=this.pressure();
  this.pulseCooldown=Math.max(0,this.pulseCooldown-dt);this.pulseAge+=dt;
  if(this.shield<this.shieldMax()){this.shieldTimer+=dt;if(this.shieldTimer>=18-this.levels.shield*2){this.shield++;this.shieldTimer=0;}}
  if(this.lure){this.lure.life-=dt;if(this.lure.life<=0)this.lure=null;}
  if(this.encountersEnabled&&currentPressure>0&&this.elapsed>=this.nextShark){this.nextShark=this.elapsed+sharkStats(currentPressure).spawn;this.spawnShark();}
  if(Math.hypot(input.x,input.z)<.05&&this.pulseCooldown===0&&this.sharks.some(s=>['chase','windup','dash'].includes(s.phase)&&Math.hypot(s.x-this.player.x,s.z-this.player.z)<=this.pulseRange()))this.pulse();
  for(const s of this.sharks){s.timer+=dt;
   // Surviving sharks tighten pursuit on their next chase, never heal or change a signalled dash.
   if(!s.stats||(s.phase==='chase'&&s.pursuitTier<currentPressure)){s.pursuitTier=Math.max(s.tier,currentPressure);s.stats=sharkStats(s.pursuitTier);}const stats=s.stats;
   if(s.phase==='retreat'){s.x+=s.dx*4*dt;s.z+=s.dz*4*dt;continue;}
   const target=this.lure&&Math.hypot(s.x-this.lure.x,s.z-this.lure.z)<10?this.lure:this.player,dx=target.x-s.x,dz=target.z-s.z,d=Math.hypot(dx,dz)||.001;
   if(s.phase==='emerge'){s.angle=Math.atan2(dx,dz);if(s.timer>=1.8){s.phase='chase';s.timer=0;}}
   else if(s.phase==='chase'){s.angle=Math.atan2(dx,dz);const v=Math.min(d,dt*stats.chase);s.x+=dx/d*v;s.z+=dz/d*v;if(d<=4.4){s.phase='windup';s.timer=0;s.dx=dx/d;s.dz=dz/d;}}
   else if(s.phase==='windup'){if(s.timer>=stats.windup){s.phase='dash';s.timer=0;}}
   else if(s.phase==='dash'){s.x=clamp(s.x+s.dx*stats.dash*dt,-48,this.bounds().maxX);s.z=clamp(s.z+s.dz*stats.dash*dt,-48,48);
    if(this.lure&&Math.hypot(s.x-this.lure.x,s.z-this.lure.z)<1){this.lure=null;s.phase='recover';s.stunFor=1.8;s.timer=0;}
    else if(Math.hypot(s.x-this.player.x,s.z-this.player.z)<1.05){this.sharkHit(s);if(s.phase!=='retreat'){s.phase='recover';s.stunFor=2;s.timer=0;}}
    else if(s.timer>.9){s.phase='recover';s.stunFor=1.2;s.timer=0;}
   }else if(s.phase==='recover'&&s.timer>=(s.stunFor||1.2)){s.phase='chase';s.timer=0;}
  }
  this.sharks=this.sharks.filter(s=>s.phase!=='retreat'||s.timer<2);
 }
 step(dt,input={x:0,z:0}){
  if(this.status!=='playing')return;dt=clamp(dt,0,.05);const len=Math.hypot(input.x,input.z);if(len>.04)this.started=true;if(!this.started)return;
  this.elapsed+=dt;this.advanceExpansion(dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.comboClock-=dt;if(this.comboClock<=0)this.combo=0;
  this.o2=Math.max(0,this.o2-dt*(Math.hypot(this.player.x,this.player.z)>28?1.4:1));if(this.o2<=0){this.end('oxygen');return;}if(this.o2<25&&!this.lowO2){this.lowO2=true;this.emit('hint',{text:'Kyslík <25 s! Poklad, fľaša alebo návrat.'});}
  if(len>.04){const speed=3.6*(1+this.levels.speed*.19),m=Math.min(len,1),bounds=this.bounds(),wantedX=this.player.x+input.x/len*m*speed*dt;this.player.x=clamp(wantedX,bounds.minX,bounds.maxX);this.player.z=clamp(this.player.z+input.z/len*m*speed*dt,-47,47);this.player.angle=Math.atan2(input.x,input.z);if(wantedX>bounds.maxX&&this.unlockedRegion<2&&this.elapsed>this.gateHint){this.gateHint=this.elapsed+6;this.emit('hint',{text:this.frontierHint()});}}
  this.enterRegion();
  this.stepSharks(dt,input);if(this.status!=='playing')return;this.clean(this.player,1.25+this.levels.range*.35,dt);
  if(this.levels.bot)this.agentStep(this.bot,.9+this.levels.bot*.2,1.6,dt,5);
  for(const c of this.companions){const d=companionDefs[c.id];this.agentStep(c,d.radius,d.power,dt,3);}
  for(const c of this.chests)if(this.canClean(c.x,c.z)&&!c.taken&&Math.hypot(c.x-this.player.x,c.z-this.player.z)<1.1){c.taken=true;this.coins+=55;this.o2=Math.min(this.maxO2,this.o2+18);this.award(3);this.emit('chest',{x:c.x,z:c.z});}
  for(const s of this.sites)if(this.canClean(s.x,s.z)&&s.restored&&!s.refilled&&Math.hypot(s.x-this.player.x,s.z-this.player.z)<2.2){s.refilled=true;this.o2=Math.min(this.maxO2,this.o2+30);this.hp=Math.min(this.maxHp,this.hp+1);this.emit('hint',{text:'Stanica: +30 s O₂ · +1 ♥'});}
  for(const h of this.hazards){if(h.spent||!this.canClean(h.x,h.z))continue;const d=Math.hypot(h.x-this.player.x,h.z-this.player.z),phase=(this.elapsed+h.phase)%7;if(h.type==='mine'){const was=h.arm||0;h.arm=d<1.65?Math.min(1,was+dt/.85):0;if(!was&&h.arm>0)this.emit('danger',{});}const active=h.type==='mine'?h.arm>=1:phase>4.2;
   if(d<(h.type==='mine'?1.15:1.12)&&active&&this.elapsed>5&&this.invulnerable===0){if(h.type==='mine')h.spent=true;this.damage(h.type,h.x,h.z);if(this.status!=='playing')break;}}
 }
}
root.OceanCore={Game,upgrades,companionDefs,biomes,biomeAt,hash,clamp,sanitizeMeta,encodeResult,decodeResult,pressureAt,sharkStats};if(typeof module!=='undefined')module.exports=root.OceanCore;
})(typeof window!=='undefined'?window:globalThis);
