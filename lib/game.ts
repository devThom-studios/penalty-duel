export type Vec = { x: number; y: number };
export type Input = Vec & { shoot: number; tackle: number; at: number };
export type Player = Vec & { fx: number; fy: number; cooldown: number; kick: number; tackled: number };
export type Game = {
  phase: 'lobby' | 'countdown' | 'playing' | 'goal' | 'finished';
  players: Player[]; keepers: Vec[]; ball: Vec & { vx: number; vy: number; owner: number; free: number };
  score: number[]; names: string[]; inputs: Input[]; seen: number[];
  time: number; clock: number; scorer: number; kickoff: number; rematch: boolean[]; paused: boolean;
};
export const W = 1000, H = 600;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const blankInput = (): Input => ({x:0,y:0,shoot:0,tackle:0,at:0});
export function newGame(name: string, now = Date.now()): Game {
  return {phase:'lobby', players:[{x:330,y:300,fx:1,fy:0,cooldown:0,kick:0,tackled:0},{x:670,y:300,fx:-1,fy:0,cooldown:0,kick:0,tackled:0}],keepers:[{x:86,y:300},{x:914,y:300}],ball:{x:500,y:300,vx:0,vy:0,owner:-1,free:0},score:[0,0],names:[name,''],inputs:[blankInput(),blankInput()],seen:[now,0],time:now,clock:3,scorer:-1,kickoff:0,rematch:[false,false],paused:false};
}
export function kickoff(g: Game, team: number) {
  g.kickoff=team; g.players[0].x=team===0?478:320;g.players[1].x=team===1?522:680;
  for(let i=0;i<2;i++){g.players[i].y=300;g.players[i].fx=i===0?1:-1;g.players[i].fy=0;g.players[i].cooldown=0;g.players[i].kick=g.inputs[i].shoot;g.players[i].tackled=g.inputs[i].tackle;g.keepers[i].y=300;}
  g.ball={x:500,y:300,vx:0,vy:0,owner:team,free:0};g.phase='countdown';g.clock=3;
}
export function tick(g: Game, dt: number, now: number) {
  if(g.paused || g.phase==='lobby' || g.phase==='finished') return;
  if(g.phase==='goal' || g.phase==='countdown') {
    g.clock-=dt;
    if(g.clock<=0){if(g.phase==='goal')kickoff(g,1-g.scorer);else g.phase='playing';}
    return;
  }
  const b=g.ball;
  for(let i=0;i<2;i++){
    const p=g.players[i], input=g.inputs[i];
    let mx=now-input.at<500?input.x:0, my=now-input.at<500?input.y:0;
    const mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;}
    if(mag>.12){p.fx=mx/(Math.hypot(mx,my)||1);p.fy=my/(Math.hypot(mx,my)||1);}
    p.x+=mx*238*dt;p.y+=my*238*dt;p.cooldown=Math.max(0,p.cooldown-dt);
    if(input.tackle!==p.tackled){const pressed=input.tackle>p.tackled;p.tackled=input.tackle;if(pressed&&p.cooldown<=0){p.cooldown=.9;const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy)||1;
      p.x+=dx/d*28;p.y+=dy/d*28;
      if(d<78 && b.owner!==i){b.owner=i;b.free=0;}
    }}
    p.x=clamp(p.x,60,940);p.y=clamp(p.y,55,545);
    if(input.shoot!==p.kick){const pressed=input.shoot>p.kick;p.kick=input.shoot;if(pressed&&(b.owner===i || (b.owner===-1&&Math.hypot(b.x-p.x,b.y-p.y)<46))){
      // Aim in the direction of movement; stationary players face the other goal.
      let dx=p.fx,dy=p.fy;const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
      b.owner=-1;b.x=p.x+dx*30;b.y=p.y+dy*30;b.vx=dx*800;b.vy=dy*800;b.free=.22;
    }}
  }
  const a=g.players[0],c=g.players[1],dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy);
  if(d<36&&d>0){const push=(36-d)/2;a.x-=dx/d*push;a.y-=dy/d*push;c.x+=dx/d*push;c.y+=dy/d*push;}
  for(let i=0;i<2;i++){
    const k=g.keepers[i], target=clamp(b.y,223,377);
    k.y+=clamp(target-k.y,-125*dt,125*dt);
  }
  b.free=Math.max(0,b.free-dt);
  if(b.owner>=0){const p=g.players[b.owner];b.x=p.x+p.fx*26;b.y=p.y+p.fy*26;b.vx=0;b.vy=0;}
  else{b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.exp(-.65*dt);b.vy*=Math.exp(-.65*dt);}
  for(let i=0;i<2;i++){
    const k=g.keepers[i],kx=b.x-k.x,ky=b.y-k.y;
    if(Math.hypot(kx,ky)<29){b.owner=-1;b.free=.3;b.x=k.x+(i===0?31:-31);b.vx=i===0?460:-460;b.vy=(b.y-300)*2.7;}
  }
  if(b.y<43){b.y=43;b.vy=Math.abs(b.vy)*.8;}if(b.y>557){b.y=557;b.vy=-Math.abs(b.vy)*.8;}
  if(b.x<37 || b.x>963){
    if(b.y>232 && b.y<368){
      g.scorer=b.x>963?0:1;g.score[g.scorer]++;g.phase=g.score[g.scorer]>=3?'finished':'goal';g.clock=2.4;b.vx=0;b.vy=0;b.owner=-1;return;
    }
    b.x=clamp(b.x,37,963);b.vx*=-.8;
  }
  if(b.owner===-1 && b.free<=0){
    let closest=-1,dist=33;
    g.players.forEach((p,i)=>{const q=Math.hypot(p.x-b.x,p.y-b.y);if(q<dist){closest=i;dist=q;}});
    if(closest>=0)b.owner=closest;
  }
}
export function advance(g: Game, now: number) {
  let dt=clamp((now-g.time)/1000,0,.25);g.time=now;
  g.paused=!!g.names[1]&&g.phase!=='finished'&&(now-g.seen[0]>3500||now-g.seen[1]>3500);
  while(dt>0){const step=Math.min(dt,1/120);tick(g,step,now);dt-=step;}
}
export function publicGame(g: Game){ return g; }
