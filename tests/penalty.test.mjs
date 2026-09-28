import assert from 'node:assert/strict';
import {newDuel,lockChoice,viewDuel,shootoutWinner,kickOutcome,updateDuel,restartDuel,striker} from '../lib/penalty.ts';
const now=Date.now();
assert.deepEqual(newDuel('A',now).score,[0,0]);
assert.equal(shootoutWinner([3,0],[3,3]),0);
assert.equal(shootoutWinner([2,0],[2,2]),null);
assert.equal(shootoutWinner([4,3],[5,5]),0);
assert.equal(shootoutWinner([5,5],[5,5]),null);
assert.equal(shootoutWinner([6,5],[6,5]),null);
assert.equal(shootoutWinner([6,5],[6,6]),0);
assert.equal(shootoutWinner([0,3],[2,3]),null);
assert.equal(kickOutcome({zone:0,power:.75},{zone:0,power:.75}),'saved');
assert.equal(kickOutcome({zone:0,power:1},{zone:0,power:.75}),'miss');
assert.equal(kickOutcome({zone:0,power:.75},{zone:2,power:.75}),'goal');
assert.equal(kickOutcome({zone:0,power:.2},{zone:1,power:.75}),'saved');
const g=newDuel('A',now);g.names[1]='B';g.seen=[now,now];g.phase='aim';
lockChoice(g,0,{zone:5,power:.8},now);
const rival=viewDuel(g,1,now);assert.equal(rival.ownChoice,null);assert.equal('choices' in rival,false);assert.deepEqual(rival.ready,[true,false]);assert.equal(rival.last,null);
lockChoice(g,0,{zone:1,power:1},now);assert.equal(g.choices[0].zone,5);
lockChoice(g,1,{zone:0,power:.7},now);assert.equal(g.phase,'reveal');assert.equal(g.score[0],1);assert.equal(g.history.length,1);
lockChoice(g,1,{zone:2,power:.7},now);assert.equal(g.history.length,1);
updateDuel(g,now+5500);assert.equal(g.turn,1);assert.equal(striker(g),1);assert.equal(g.phase,'aim');assert.deepEqual(g.choices,[null,null]);
updateDuel(g,now+8000);assert.equal(g.paused,true);
g.seen=[now+9000,now+9000];updateDuel(g,now+9000);assert.equal(g.paused,false);
restartDuel(g,now+10000);assert.deepEqual(g.score,[0,0]);assert.equal(g.starter,1);assert.equal(g.gameNumber,2);assert.equal(g.phase,'aim');
console.log('PASS: score starts at zero, early wins, sudden-death pairs, power, saves, secret choices, immutable locks, alternating turns, pause and rematch');
const full=newDuel('A',now);full.names[1]='B';full.phase='aim';
let t=now;
for(let n=0;n<6;n++){
 full.seen=[t,t];const k=striker(full);
 lockChoice(full,k,{zone:k===0?5:0,power:.8},t);
 lockChoice(full,1-k,{zone:0,power:.75},t);
 assert.equal(full.phase,'reveal');full.seen=[t+5500,t+5500];updateDuel(full,t+5500);t+=6000;
}
assert.equal(full.phase,'finished');assert.equal(full.winner,0);assert.deepEqual(full.score,[3,0]);assert.equal(full.history.length,6);
console.log('PASS: complete six-kick shootout ends early at 3–0 after equal attempts');
const {setDuelTeam,canStartDuel,returnToTeamSelection}=await import('../lib/penalty.ts');
const {teams,continents,validTeamChoice,matchKits,colourDistance}=await import('../lib/teams.ts');
const lobby=newDuel('A',now);lobby.names[1]='B';
assert.equal(canStartDuel(lobby),false);
assert.equal(validTeamChoice({id:'gha',kit:'home'}),true);
assert.equal(validTeamChoice({id:'not-a-team',kit:'home'}),false);
assert.equal(validTeamChoice({id:'gha',kit:'custom'}),false);
setDuelTeam(lobby,0,{id:'gha',kit:'home'});setDuelTeam(lobby,1,{id:'gha',kit:'home'});
lobby.teamReady=[true,true];assert.equal(canStartDuel(lobby),true);
setDuelTeam(lobby,0,{id:'bra',kit:'away'});assert.equal(canStartDuel(lobby),false);assert.deepEqual(lobby.teamReady,[false,true]);
lobby.phase='aim';assert.equal(setDuelTeam(lobby,0,{id:'eng',kit:'home'}),false);assert.equal(lobby.teams[0].id,'bra');
restartDuel(lobby,now);assert.equal(lobby.teams[0].id,'bra');assert.equal(lobby.teams[1].id,'gha');
lobby.phase='finished';assert.equal(returnToTeamSelection(lobby,now),true);assert.equal(lobby.phase,'lobby');assert.deepEqual(lobby.teamReady,[false,false]);
assert.equal(new Set(teams.map(t=>t.id)).size,teams.length);
for(const continent of continents)for(const type of ['club','national'])assert.ok(teams.some(t=>t.continent===continent&&t.type===type));
// Every pairing, including mirrors, must have distinct shirts and keeper kits.
for(const a of teams)for(const b of teams){
 const k=matchKits([{id:a.id,kit:'home'},{id:b.id,kit:'home'}]);
 assert.ok(colourDistance(k[0].shirt,k[1].shirt)>=135,`${a.name} vs ${b.name}`);
 const colours=[k[0].shirt,k[1].shirt,k[0].keeper.shirt,k[1].keeper.shirt];assert.equal(new Set(colours).size,4);
}
console.log(`PASS: ${teams.length} teams, six continents, validated selection, independent ready states, locked match teams, rematch persistence, and all home-kit pairings`);

// A record counts shootouts, not goals, and belongs to players across rematches.
assert.deepEqual(newDuel('New player',now).matchWins,[0,0]);
assert.deepEqual(full.matchWins,[1,0]);
for(let i=0;i<10;i++)updateDuel(full,t+i);
assert.deepEqual(full.matchWins,[1,0], 'Repeated sync must never award extra wins');
const series=JSON.parse(JSON.stringify(full));
updateDuel(series,t+20);assert.deepEqual(series.matchWins,[1,0], 'Reload keeps totals without recounting');
series.rematch=[true,true];restartDuel(series,t+30);
assert.deepEqual(series.score,[0,0]);assert.deepEqual(series.matchWins,[1,0]);
assert.equal(series.gameNumber,2);
function finishWithWinner(duel,winner,start){
 let time=start;
 for(let n=0;n<6;n++){
  duel.seen=[time,time];const kicker=striker(duel);
  lockChoice(duel,kicker,{zone:kicker===winner?5:0,power:.8},time);
  lockChoice(duel,1-kicker,{zone:0,power:.75},time);
  duel.seen=[time+5500,time+5500];updateDuel(duel,time+5500);time+=6000;
 }
 assert.equal(duel.phase,'finished');assert.equal(duel.winner,winner);return time;
}
let seriesTime=finishWithWinner(series,1,t+50);
assert.deepEqual(series.matchWins,[1,1], 'Each player now has one win and one loss');
restartDuel(series,seriesTime);seriesTime=finishWithWinner(series,0,seriesTime);
assert.deepEqual(series.matchWins,[2,1], 'Winner has two wins/one loss; rival has one win/two losses');
assert.deepEqual(viewDuel(series,0,seriesTime).matchWins,viewDuel(series,1,seriesTime).matchWins);
assert.equal(returnToTeamSelection(series,seriesTime),true);
assert.deepEqual(series.matchWins,[2,1], 'Changing teams keeps the player record');
const legacy=JSON.parse(JSON.stringify(full));delete legacy.matchWins;delete legacy.recordedGame;
updateDuel(legacy,t);updateDuel(legacy,t+1);
assert.deepEqual(legacy.matchWins,[1,0], 'Older completed rooms initialize and count once');
const unfinished=newDuel('A',now);unfinished.names[1]='B';unfinished.phase='reveal';unfinished.winner=null;unfinished.nextAt=now+100;unfinished.seen=[now,now];
updateDuel(unfinished,now+150);assert.deepEqual(unfinished.matchWins,[0,0]);
console.log('PASS: cumulative match records, alternating winners, repeated sync, reload, rematches, team changes, and older rooms');
