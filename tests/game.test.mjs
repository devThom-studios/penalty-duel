import assert from 'node:assert/strict';
import {newGame,kickoff,tick,advance} from '../lib/game.ts';
const now=Date.now();
function playing(){const g=newGame('Home',now);g.names[1]='Away';g.seen=[now,now];g.phase='playing';return g;}
const g=playing();
for(let goal=1;goal<=3;goal++){
 g.phase='playing';g.ball={x:964,y:340,vx:100,vy:0,owner:-1,free:1};tick(g,.01,now);
 assert.equal(g.score[0],goal);assert.equal(g.phase,goal===3?'finished':'goal');
 if(goal<3){tick(g,3,now);assert.equal(g.phase,'countdown');assert.equal(g.kickoff,1);assert.equal(g.ball.owner,1);}
}
const winning=JSON.stringify(g.score);tick(g,10,now);assert.equal(JSON.stringify(g.score),winning);
const miss=playing();miss.ball={x:965,y:190,vx:400,vy:0,owner:-1,free:1};tick(miss,.01,now);assert.equal(miss.score[0],0);assert.ok(miss.ball.vx<0);
const shot=playing();kickoff(shot,0);shot.phase='playing';shot.inputs[0]={x:0,y:0,at:now,shoot:1,tackle:0};tick(shot,.01,now);assert.equal(shot.ball.owner,-1);assert.ok(shot.ball.vx>700);
const stop=playing();stop.inputs[0]={x:1,y:0,at:now-1000,shoot:0,tackle:0};const old=stop.players[0].x;tick(stop,.02,now);assert.equal(stop.players[0].x,old);
const pause=playing();pause.seen[1]=now-4000;const bx=pause.ball.x;advance(pause,now+50);assert.ok(pause.paused);assert.equal(pause.ball.x,bx);
const save=playing();save.ball={x:917,y:300,vx:800,vy:0,owner:-1,free:1};tick(save,.005,now);assert.ok(save.ball.vx<0);assert.equal(save.score[0],0);
console.log('PASS: three-goal victory, no post-win scoring, conceded kickoff, missed shots, shooting, stale input, disconnect pause and goalkeeper saves');
