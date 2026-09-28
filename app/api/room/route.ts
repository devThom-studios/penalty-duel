import { getDB } from '@/lib/db';
import { advance, blankInput, kickoff, newGame, type Game, clamp } from '@/lib/game';
export const dynamic='force-dynamic';
type Row={code:string;host_token:string;guest_token:string|null;state:string;revision:number;expires:number};
function out(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
  try{
    const raw=await req.text();if(raw.length>3000)return out({error:'Request too large.'},413);
    let data;try{data=JSON.parse(raw);}catch{return out({error:'Invalid request.'},400);}
    const db=getDB(),now=Date.now();
    const name=String(data.name||'').trim().slice(0,16);
    if(data.action==='create'){
      if(!name)return out({error:'Choose your player name first.'},400);
      const token=crypto.randomUUID();
      for(let attempt=0;attempt<5;attempt++){
        const bytes=crypto.getRandomValues(new Uint8Array(6));const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
        const g=newGame(name,now);
        const r=await db.prepare('INSERT OR IGNORE INTO rooms (code,host_token,state,revision,expires) VALUES (?,?,?,0,?)').bind(code,token,JSON.stringify(g),now+7200000).run();
        if(r.meta.changes)return out({code,token,side:0,game:g});
      }
      return out({error:'Could not open a room. Please try again.'},503);
    }
    const code=String(data.code||'').trim().toUpperCase();
    if(!/^[A-Z2-9]{6}$/.test(code))return out({error:'Enter the 6-character room code.'},400);
    const guestToken=crypto.randomUUID();
    for(let tries=0;tries<8;tries++){
      const now=Date.now();
      const row=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first<Row>();
      if(!row||row.expires<now)return out({error:'Room not found or expired. Check the code or create a new room.'},404);
      const g=JSON.parse(row.state) as Game;
      let side=data.token===row.host_token?0:data.token===row.guest_token?1:-1;
      if(data.action==='join'){
        if(!name)return out({error:'Choose your player name first.'},400);
        if(row.guest_token && side!==1)return out({error:'This room already has two players.'},409);
        if(side===1)return out({code,token:row.guest_token,side,game:g});
        g.names[1]=name;g.seen[1]=now;
        const r=await db.prepare('UPDATE rooms SET guest_token=?,state=?,revision=revision+1 WHERE code=? AND revision=? AND guest_token IS NULL').bind(guestToken,JSON.stringify(g),code,row.revision).run();
        if(r.meta.changes)return out({code,token:guestToken,side:1,game:g});
        continue;
      }
      if(side<0)return out({error:'Your room session has ended. Join a new room.'},403);
      if(data.action==='leave'){
        await db.prepare('DELETE FROM rooms WHERE code=? AND (host_token=? OR guest_token=?)').bind(code,data.token,data.token).run();
        return out({left:true});
      }
      const wasAway=now-g.seen[side]>3500;g.seen[side]=now;
      // Never simulate a gap after a device reconnects.
      if(wasAway)g.time=now;
      advance(g,now);
      if(data.action==='start'){
        if(side!==0)return out({error:'Only the room creator can start the match.'},403);
        if(!g.names[1]||now-g.seen[1]>3500)return out({error:'Wait for your opponent to connect.'},409);
        if(g.phase==='lobby')kickoff(g,0);
      }else if(data.action==='rematch'){
        if(g.phase!=='finished')return out({error:'Finish this match first.'},409);
        g.rematch[side]=true;
        if(g.rematch.every(Boolean)){g.score=[0,0];g.rematch=[false,false];kickoff(g,1);}
      }else if(data.action==='sync'){
        const input=data.input||{};
        const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:0;
        g.inputs[side]={x:clamp(finite(input.x),-1,1),y:clamp(finite(input.y),-1,1),shoot:clamp(Math.floor(finite(input.shoot)),0,1e9),tackle:clamp(Math.floor(finite(input.tackle)),0,1e9),at:now};
      }else return out({error:'Unknown room action.'},400);
      const r=await db.prepare('UPDATE rooms SET state=?,revision=revision+1,expires=? WHERE code=? AND revision=?').bind(JSON.stringify(g),now+7200000,code,row.revision).run();
      if(r.meta.changes)return out({game:g,side,code,revision:row.revision+1});
    }
    return out({error:'The pitch is busy. Reconnecting…'},503);
  }catch(e){console.error('room',e);return out({error:'Could not connect to the pitch. Please try again.'},503);}
}
