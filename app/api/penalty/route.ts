import {getDB} from '@/lib/db';
import {newDuel,viewDuel,updateDuel,lockChoice,restartDuel,setDuelTeam,canStartDuel,returnToTeamSelection,type Duel} from '@/lib/penalty';
import {validTeamChoice} from '@/lib/teams';
import {CLIENT_RELEASE} from '@/lib/release';
export const dynamic='force-dynamic';
type Row={code:string;host_token:string;guest_token:string|null;state:string;revision:number;expires:number};
const out=(data:Record<string,unknown>,status=200)=>Response.json({...data,release:CLIENT_RELEASE},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 try{
  const raw=await req.text();if(raw.length>2000)return out({error:'Request too large.'},413);
  let data;try{data=JSON.parse(raw);if(!data||typeof data!=='object')throw 0;}catch{return out({error:'Invalid request.'},400);}
  const db=getDB(),name=typeof data.name==='string'?data.name.trim().slice(0,16):'';
  if(data.action==='create'){
   if(!name)return out({error:'Enter your player name.'},400);
   const token=crypto.randomUUID();
   for(let i=0;i<5;i++){
    const now=Date.now(),abc='BCDFGHJKLMNPQRSTVWXYZ23456789';
    const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>abc[b%abc.length]).join('');
    const game=newDuel(name,now);
    const r=await db.prepare('INSERT OR IGNORE INTO penalty_rooms (code,host_token,state,revision,expires) VALUES (?,?,?,0,?)').bind(code,token,JSON.stringify(game),now+7200000).run();
    if(r.meta.changes)return out({code,token,side:0,revision:0,game:viewDuel(game,0,now)});
   }
   return out({error:'Could not create your room. Please try again.'},503);
  }
  const code=typeof data.code==='string'?data.code.trim().toUpperCase():'';
  if(!/^[A-Z2-9]{6}$/.test(code))return out({error:'Enter the six-character room code.'},400);
  for(let retry=0;retry<8;retry++){
   const row=await db.prepare('SELECT * FROM penalty_rooms WHERE code=?').bind(code).first<Row>();
   const now=Date.now();if(!row||row.expires<now)return out({error:'Room not found or expired. Create a new one or check the code.'},404);
   const g=JSON.parse(row.state) as Duel;
   g.teams??=[null,null];g.teamReady??=[false,false];g.matchWins??=[0,0];g.recordedGame??=0;
   const side=data.token===row.host_token?0:row.guest_token&&data.token===row.guest_token?1:-1;
   if(data.action==='join'){
    if(!name)return out({error:'Enter your player name.'},400);
    if(row.guest_token)return out({error:'This room already has two players.'},409);
    const token=crypto.randomUUID();g.names[1]=name;g.seen[1]=now;
    const r=await db.prepare('UPDATE penalty_rooms SET guest_token=?,state=?,revision=revision+1 WHERE code=? AND revision=? AND guest_token IS NULL').bind(token,JSON.stringify(g),code,row.revision).run();
    if(r.meta.changes)return out({code,token,side:1,revision:row.revision+1,game:viewDuel(g,1,now)});continue;
   }
   if(side<0)return out({error:'This session has ended. Join a new room.'},403);
   if(data.action==='leave'){
    await db.prepare('DELETE FROM penalty_rooms WHERE code=? AND (host_token=? OR guest_token=?)').bind(code,data.token,data.token).run();return out({left:true});
   }
   // Evaluate absence before refreshing presence so an entire offline gap is paused.
   updateDuel(g,now);g.seen[side]=now;updateDuel(g,now);
   if(data.action==='start'){
    if(side!==0)return out({error:'The host starts the shootout.'},403);
    if(!g.names[1]||!g.seen[1]||now-g.seen[1]>7000)return out({error:'Wait for your opponent to connect.'},409);
    if(!canStartDuel(g))return out({error:'Both players must choose a team and press Ready.'},409);
    g.phase='aim';
   }else if(data.action==='team'){
    if(!validTeamChoice(data.team))return out({error:'Choose a team and a home or away kit.'},400);
    if(!setDuelTeam(g,side,data.team))return out({error:'Teams can only change before a match.'},409);
   }else if(data.action==='team-ready'){
    if(g.phase!=='lobby'||!g.teams[side])return out({error:'Choose your team first.'},409);
    g.teamReady[side]=data.ready===true;
   }else if(data.action==='change-teams'){
    if(!returnToTeamSelection(g,now))return out({error:'Finish the shootout first.'},409);
   }else if(data.action==='lock'){
    if(!Number.isInteger(data.turn)||data.turn!==g.turn)return out({error:'A new penalty has started. Choose again.'},409);
    if(g.paused)return out({error:'Waiting for your opponent to reconnect.'},409);
    if(!Number.isInteger(data.zone)||data.zone<0||data.zone>5||typeof data.power!=='number'||!Number.isFinite(data.power)||data.power<0||data.power>1)return out({error:'Choose a target and a valid shot power.'},400);
    lockChoice(g,side,{zone:data.zone,power:data.power},now);
   }else if(data.action==='rematch'){
    if(g.phase!=='finished')return out({error:'Finish the shootout first.'},409);
    g.rematch[side]=true;if(g.rematch.every(Boolean))restartDuel(g,now);
   }else if(data.action!=='sync')return out({error:'Unknown room action.'},400);
   const result=await db.prepare('UPDATE penalty_rooms SET state=?,revision=revision+1,expires=? WHERE code=? AND revision=?').bind(JSON.stringify(g),now+7200000,code,row.revision).run();
   if(result.meta.changes)return out({code,side,revision:row.revision+1,game:viewDuel(g,side,now)});
  }
  return out({error:'Connection is busy. Try again.'},503);
 }catch(e){console.error('Penalty Duel',e);return out({error:'Could not connect. Please try again.'},503);}
}
