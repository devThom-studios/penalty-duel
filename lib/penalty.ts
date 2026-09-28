import type {TeamChoice} from './teams';
export type Choice = { zone:number; power:number };
export type Kick = { kicker:number; zone:number; keeperZone:number; power:number; outcome:'goal'|'saved'|'miss'; at:number; turn:number };
export type Duel = {
 phase:'lobby'|'aim'|'reveal'|'finished'; names:string[]; score:number[]; history:Kick[];
 turn:number; starter:number; choices:(Choice|null)[]; seen:number[]; paused:boolean;
 pausedAt:number; revealAt:number; nextAt:number; last:Kick|null; winner:number|null;
 rematch:boolean[]; gameNumber:number; matchWins:number[]; recordedGame:number; teams:(TeamChoice|null)[]; teamReady:boolean[];
};
export type DuelView = Omit<Duel,'choices'|'seen'|'pausedAt'> & { ready:boolean[]; ownChoice:Choice|null; online:boolean[]; serverTime:number };
export function newDuel(name:string,now=Date.now()):Duel{
 return {phase:'lobby',names:[name,''],score:[0,0],history:[],turn:0,starter:0,choices:[null,null],seen:[now,0],paused:false,pausedAt:0,revealAt:0,nextAt:0,last:null,winner:null,rematch:[false,false],gameNumber:1,matchWins:[0,0],recordedGame:0,teams:[null,null],teamReady:[false,false]};
}
export const striker=(g:Pick<Duel,'turn'|'starter'>)=>(g.turn+g.starter)%2;
export function shootoutWinner(score:number[],attempts:number[]):number|null{
 if(attempts[0]<=5&&attempts[1]<=5){
  if(score[0]>score[1]+5-attempts[1])return 0;
  if(score[1]>score[0]+5-attempts[0])return 1;
 }
 if(attempts[0]>=5&&attempts[0]===attempts[1]&&score[0]!==score[1])return score[0]>score[1]?0:1;
 return null;
}
export function kickOutcome(shot:Choice,keeper:Choice):Kick['outcome']{
 if(shot.power>.97)return 'miss';
 if(shot.zone===keeper.zone)return 'saved';
 if(shot.power<.35 && Math.abs(shot.zone%3-keeper.zone%3)<=1)return 'saved';
 return 'goal';
}
export function lockChoice(g:Duel,side:number,choice:Choice,now:number){
 if(g.phase!=='aim'||g.paused||g.choices[side])return;
 g.choices[side]=choice;
 if(g.choices[0]&&g.choices[1]){
  const kicker=striker(g),shot=g.choices[kicker]!,keeper=g.choices[1-kicker]!;
  const kick:Kick={kicker,zone:shot.zone,keeperZone:keeper.zone,power:shot.power,outcome:kickOutcome(shot,keeper),at:now,turn:g.turn};
  g.last=kick;g.history.push(kick);if(kick.outcome==='goal')g.score[kicker]++;
  const attempts=[g.history.filter(k=>k.kicker===0).length,g.history.filter(k=>k.kicker===1).length];
  g.winner=shootoutWinner(g.score,attempts);g.phase='reveal';g.revealAt=now+750;g.nextAt=now+5450;
 }
}
// Count only a completed shootout, once, regardless of sync/retry frequency.
function recordDuelResult(g:Duel){
 g.matchWins??=[0,0];g.recordedGame??=0;
 if(g.phase==='finished'&&g.winner!==null&&g.recordedGame<g.gameNumber){
  g.matchWins[g.winner]++;g.recordedGame=g.gameNumber;
 }
}
export function updateDuel(g:Duel,now:number){
 const disconnected=!!g.names[1] && g.phase!=='lobby' && g.phase!=='finished' && g.seen.some(t=>now-t>7000);
 if(disconnected&&!g.paused){g.paused=true;g.pausedAt=now;}
 if(!disconnected&&g.paused){if(g.phase==='reveal'){const gap=now-g.pausedAt;g.revealAt+=gap;g.nextAt+=gap;}g.paused=false;g.pausedAt=0;}
 if(!g.paused&&g.phase==='reveal'&&now>=g.nextAt){
  if(g.winner!==null)g.phase='finished';
  else {g.turn++;g.choices=[null,null];g.phase='aim';}
 }
 recordDuelResult(g);
}
export function viewDuel(g:Duel,side:number,now=Date.now()):DuelView{
 const {choices,seen,pausedAt,...safe}=g;
 return {...safe,ready:choices.map(Boolean),ownChoice:choices[side],online:seen.map(t=>now-t<7000),serverTime:now};
}
export function restartDuel(g:Duel,now:number){
 recordDuelResult(g);
 const fresh=newDuel(g.names[0],now);fresh.matchWins=[...g.matchWins];fresh.recordedGame=g.recordedGame;fresh.names=[...g.names];fresh.seen=[...g.seen];fresh.gameNumber=g.gameNumber+1;fresh.starter=1-g.starter;fresh.phase='aim';fresh.teams=[...g.teams];fresh.teamReady=[...g.teamReady];Object.assign(g,fresh);
}

export function setDuelTeam(g:Duel,side:number,choice:TeamChoice){
 if(g.phase!=='lobby')return false;
 g.teams[side]=choice;g.teamReady[side]=false;return true;
}
export function canStartDuel(g:Duel){return g.phase==='lobby'&&!!g.names[1]&&g.teams.every(Boolean)&&g.teamReady.every(Boolean);}
export function returnToTeamSelection(g:Duel,now:number){
 if(g.phase!=='finished')return false;
 restartDuel(g,now);g.phase='lobby';g.teamReady=[false,false];return true;
}
