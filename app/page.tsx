'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Check,Copy,Crosshair,HelpCircle,LoaderCircle,LogOut,Shield,Trophy,Users,Volume2,VolumeX,Zap} from 'lucide-react';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription,AlertDialogAction,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {Progress} from '@/components/ui/progress';
import PenaltyScene,{zoneNames} from '@/components/penalty-scene';
import {striker,type DuelView} from '@/lib/penalty';
import TeamSelection from '@/components/team-selection';
import {getTeam,matchKits} from '@/lib/teams';
import {CLIENT_RELEASE} from '@/lib/release';
import {useStadiumAudio} from '@/hooks/use-stadium-audio';
type Session={code:string;token:string;side:number};
type Packet={code:string;token?:string;side:number;revision:number;game:DuelView;error?:string;release?:string};
async function request(data:Record<string,unknown>):Promise<Packet>{
 const r=await fetch('/api/penalty',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(8000)});
 const p=await r.json() as Packet;
 if(p.release&&p.release!==CLIENT_RELEASE){
  const url=new URL(location.href);
  if(url.searchParams.get('v')!==p.release){url.searchParams.set('v',p.release);location.replace(url.toString());}
  throw new Error('The game has been updated. Refresh this page to continue.');
 }
 if(!r.ok)throw new Error(p.error||'Could not connect. Try again.');return p;
}
export default function Home(){
 const [name,setName]=useState(''),[code,setCode]=useState(''),[tab,setTab]=useState('create'),[session,setSession]=useState<Session|null>(null),[game,setGame]=useState<DuelView|null>(null);
 const [zone,setZone]=useState(-1),[busy,setBusy]=useState(false),[error,setError]=useState(''),[network,setNetwork]=useState(false),[help,setHelp]=useState(false),[leaveOpen,setLeaveOpen]=useState(false),[copied,setCopied]=useState(false);
 const [now,setNow]=useState(0),[power,setPower]=useState(0),[holding,setHolding]=useState(false),[announced,setAnnounced]=useState('');
 const gameRef=useRef<DuelView|null>(null),sessionRef=useRef<Session|null>(null),revision=useRef(-1),received=useRef(0),serverTime=useRef(0),chargeAt=useRef<number|null>(null),busyRef=useRef(false),zoneRef=useRef(-1),lastSound=useRef('');
 zoneRef.current=zone;
 const stadiumSound=useStadiumAudio(game,now,session?.code,network);
 const accept=useCallback((p:Packet)=>{if(p.revision<revision.current)return;revision.current=p.revision;gameRef.current=p.game;setGame(p.game);received.current=performance.now();serverTime.current=p.game.serverTime;setNow(p.game.serverTime);},[]);
 const enter=useCallback(async(action:string,playerName=name,roomCode=code)=>{
  if(!playerName.trim()){setError('Enter your player name.');return;}
  setBusy(true);setError('');try{const p=await request({action,name:playerName,code:roomCode});const s={code:p.code,token:p.token!,side:p.side};sessionRef.current=s;revision.current=-1;setSession(s);accept(p);try{sessionStorage.setItem('pd-room',JSON.stringify(s));localStorage.setItem('f3-name',playerName);}catch{}return {room:s.code,side:s.side};}
  catch(e){setError(e instanceof Error?e.message:'Could not join.');throw e;}finally{setBusy(false);}
 },[name,code,accept]);
 const mutate=useCallback(async(action:string,extra:Record<string,unknown>={})=>{
  const s=sessionRef.current;if(!s||busyRef.current)return;busyRef.current=true;setBusy(true);setError('');
  try{const p=await request({...s,action,...extra});if(sessionRef.current?.token===s.token)accept(p);}
  catch(e){setError(e instanceof Error?e.message:'Connection interrupted. Please try again.');}
  finally{busyRef.current=false;setBusy(false);}
 },[accept]);
 useEffect(()=>{
  try{setName(localStorage.getItem('f3-name')||'');const old=sessionStorage.getItem('pd-room');if(old){const s=JSON.parse(old);if(s.code&&s.token){sessionRef.current=s;setSession(s);}}}catch{}
  const c=new URLSearchParams(location.search).get('room');if(c){setCode(c.toUpperCase().slice(0,6));setTab('join');}
 },[]);
 useEffect(()=>{
  if(!session)return;let stopped=false,timer:ReturnType<typeof setTimeout>;
  async function poll(){if(stopped)return;try{const p=await request({...session,action:'sync'});if(stopped)return;setNetwork(false);accept(p);}
   catch(e){if(stopped)return;const message=e instanceof Error?e.message:'Connection lost.';setNetwork(true);if(/not found|expired|session has ended/.test(message)){sessionStorage.removeItem('pd-room');sessionRef.current=null;setSession(null);gameRef.current=null;setGame(null);setError(message);return;}}
   timer=setTimeout(poll,gameRef.current?.phase==='reveal'?220:650);
  }void poll();return()=>{stopped=true;clearTimeout(timer);};
 },[session,accept]);
 useEffect(()=>{let raf=0,last=0;const frame=(time:number)=>{if(time-last>32){last=time;setNow(serverTime.current?serverTime.current+time-received.current:Date.now());if(chargeAt.current!==null)setPower(Math.min(1,.15+(time-chargeAt.current)/1150));}raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);},[]);
 useEffect(()=>{setZone(game?.ownChoice?.zone??-1);chargeAt.current=null;setHolding(false);setPower(0);},[game?.turn,game?.gameNumber]);
 const kits=useMemo(()=>matchKits(game?.teams??[null,null]),[game?.teams?.[0]?.id,game?.teams?.[0]?.kit,game?.teams?.[1]?.id,game?.teams?.[1]?.kit]);
 const side=session?.side??0,active=!!game&&game.phase!=='lobby',isStriker=game?striker(game)===side:true,locked=!!game?.ready[side],canChoose=!!game&&game.phase==='aim'&&!locked&&!game.paused&&!network&&!busy;
 const choose=(z:number)=>{if(canChoose){setZone(z);setError('');}};
 const startCharge=useCallback(()=>{const g=gameRef.current,s=sessionRef.current;if(!g||!s||g.phase!=='aim'||g.paused||g.ready[s.side]||busyRef.current||zoneRef.current<0)return;chargeAt.current=performance.now();setPower(.15);setHolding(true);},[]);
 const release=useCallback(()=>{if(chargeAt.current===null)return;const p=Math.min(1,.15+(performance.now()-chargeAt.current)/1150);chargeAt.current=null;setHolding(false);setPower(p);const g=gameRef.current;if(g)void mutate('lock',{turn:g.turn,zone:zoneRef.current,power:p});},[mutate]);
 const cancelCharge=useCallback(()=>{chargeAt.current=null;setHolding(false);setPower(0);},[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)||help||leaveOpen)return;const g=gameRef.current,s=sessionRef.current;if(!g||!s||g.phase!=='aim'||g.paused||g.ready[s.side])return;
   if(/^[1-6]$/.test(e.key)){setZone(Number(e.key)-1);return;}
   if(e.code==='Space'&&!e.repeat){e.preventDefault();if(striker(g)===s.side)startCharge();else if(zoneRef.current>=0)void mutate('lock',{turn:g.turn,zone:zoneRef.current,power:.75});}
  };const up=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();release();}};window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',cancelCharge);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',cancelCharge);};
 },[startCharge,release,cancelCharge,mutate,help,leaveOpen]);
 useEffect(()=>{if(active||session)window.scrollTo({top:0});},[active,session?.code]);
 const elapsed=game?.phase==='reveal'||game?.phase==='finished'?(now-(game?.revealAt??0))/1000:0;
 useEffect(()=>{if(!game?.last||elapsed<1.55||game.phase==='aim'||game.phase==='lobby')return;const key=session?.code+'-'+game.gameNumber+'-'+game.last.turn;if(lastSound.current===key)return;lastSound.current=key;setAnnounced(`${game.names[game.last.kicker]}: ${game.last.outcome}. Score ${game.score[0]} to ${game.score[1]}.`);},[elapsed,game]);
 async function copy(){try{await navigator.clipboard.writeText(session?.code||'');setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setError('Copy the six-character code shown here and send it to your friend.');}}
 async function leave(){const s=sessionRef.current;sessionRef.current=null;setSession(null);gameRef.current=null;setGame(null);setZone(-1);cancelCharge();setLeaveOpen(false);setError('');setNetwork(false);sessionStorage.removeItem('pd-room');if(s)try{await request({...s,action:'leave'});}catch{}}
 useEffect(()=>{
  const mc=(document as unknown as {modelContext?:{registerTool:(t:unknown,o:unknown)=>Promise<void>}}).modelContext;if(!mc?.registerTool)return;const c=new AbortController();
  const register=(tool:unknown)=>{try{void Promise.resolve(mc.registerTool(tool,{signal:c.signal})).catch(()=>{});}catch{}};
  register({name:'get_penalty_match',description:'Read the current penalty shootout, score and whose turn it is.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({room:sessionRef.current?.code??null,phase:gameRef.current?.phase??'setup',score:gameRef.current?.score,matchWins:gameRef.current?.matchWins,kicker:gameRef.current?gameRef.current.names[striker(gameRef.current)]:null})});
  register({name:'create_penalty_room',description:'Create a new two-player penalty room and show its invitation code.',inputSchema:{type:'object',properties:{name:{type:'string',minLength:1,maxLength:16}},required:['name'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async(v:{name:string})=>{if(typeof v.name!=='string'||!v.name.trim()||v.name.length>16)throw new Error('Enter a name of 1–16 characters.');if(sessionRef.current)throw new Error('Leave your current room first.');setName(v.name);return enter('create',v.name);}});
  return()=>c.abort();
 },[enter]);
 const score=game?[...game.score]:[0,0];if(game?.phase==='reveal'&&elapsed<1.55&&game.last?.outcome==='goal')score[game.last.kicker]--;
 const resultVisible=game?.phase==='reveal'&&elapsed>=1.55,finished=game?.phase==='finished';
 const round=game?Math.floor(game.turn/2)+1:1;
 const matchWins=game?.matchWins??[0,0];
 const matchRecord=(i:number)=> <div className={'series-player series-player-'+i}><span>{game?.names[i]||'Your rival'}{session?.side===i?' (you)':''}</span><p><b>{matchWins[i]}</b> {matchWins[i]===1?'win':'wins'} <i>·</i> <b>{matchWins[1-i]}</b> {matchWins[1-i]===1?'loss':'losses'}</p></div>;
 const shotHistory=(i:number)=>{let h=game?.history.filter(k=>k.kicker===i)??[];if(game?.phase==='reveal'&&elapsed<1.55)h=h.filter(k=>k.turn!==game.turn);const recent=h.length>5?h.slice(-5):h;return <div className="kick-track" aria-label={`${game?.names[i]||'Player'} penalties: ${h.map(k=>k.outcome).join(', ')||'none taken'}`}>{Array.from({length:5},(_,j)=><span key={j} className={recent[j]?.outcome||'pending'}>{recent[j]?(recent[j].outcome==='goal'?<Check size={11}/>:<span>×</span>):''}</span>)}{h.length>5&&<small>SD {h.length-5}</small>}</div>;};
 return <main className={'duel-app '+(active?'in-match':session?'selecting-teams':'')}>
  <header className="site-header"><a href="/" className="wordmark" aria-label="Penalty Duel home"><span className="logo-symbol"><Crosshair size={24}/></span><span>PENALTY<span className="logo-duel">DUEL</span></span></a><span className="header-tag">THE SHOOTOUT STARTS HERE.</span><div className="header-tools"><button className="icon-button sound-button" data-stadium-sound aria-label={stadiumSound.soundOn?'Mute stadium sound':'Enable stadium sound'} aria-pressed={stadiumSound.soundOn} onClick={stadiumSound.toggle}>{stadiumSound.soundOn?<Volume2 size={19}/>:<VolumeX size={19}/>}<span>{stadiumSound.label}</span></button><button className="rules-button" onClick={()=>setHelp(true)}><HelpCircle size={18}/><span>How to play</span></button>{session&&<button className="icon-button" aria-label="Leave room" onClick={()=>setLeaveOpen(true)}><LogOut size={18}/></button>}</div></header>
  <div className={active?'match-layout':'lobby-layout'}>
   {!active&&<aside className="setup-panel">{!session&&<><div className="eyebrow"><span/> TWO PLAYERS. ALL THE PRESSURE.</div><h1>HOLD YOUR<br/>NERVE<span>.</span></h1><p className="setup-intro">Choose your club or country.<br/>Five penalties. One winner.</p></>}
    {!session?<div className="entry-card"><Tabs value={tab} onValueChange={v=>{setTab(v);setError('');}}><TabsList className="entry-tabs"><TabsTrigger value="create">Create a room</TabsTrigger><TabsTrigger value="join">Join a room</TabsTrigger></TabsList><label htmlFor="player-name">YOUR PLAYER NAME</label><input id="player-name" maxLength={16} value={name} placeholder="Enter your name" onChange={e=>setName(e.target.value)} autoComplete="nickname"/><TabsContent value="create"><button className="primary-button" disabled={busy||!name.trim()} onClick={()=>void enter('create').catch(()=>{})}>{busy?<LoaderCircle className="spin" size={18}/>:<Zap size={18}/>}Challenge a friend<ArrowRight size={18}/></button><p className="form-note">Create a room. Share the code. Settle it.</p></TabsContent><TabsContent value="join"><label htmlFor="room-code">ROOM CODE</label><input id="room-code" className="code-input" value={code} maxLength={6} placeholder="ABC234" autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))}/><button className="primary-button" disabled={busy||!name.trim()||code.length!==6} onClick={()=>void enter('join').catch(()=>{})}>{busy?<LoaderCircle className="spin" size={18}/>:<Users size={18}/>}Join shootout<ArrowRight size={18}/></button></TabsContent></Tabs></div>:<div className="entry-card"><div className="room-heading"><span>MATCH LOBBY</span><span>{game?.names[1]?'2':'1'} / 2 PLAYERS</span></div><label>SHARE THIS ROOM CODE</label><button className="room-code" onClick={copy}>{session.code}{copied?<Check size={18}/>:<Copy size={18}/>}</button><p className="form-note">Your friend opens this link and joins with the code.</p><div className="roster"><div><span className="player-badge blue">01</span><span>{game?.names[0]} {side===0&&<small>(you)</small>}</span><small>HOST</small></div><div><span className="player-badge coral">02</span><span>{game?.names[1]||'Waiting for your friend…'}</span>{game?.names[1]?<Check size={17}/>:<LoaderCircle className="spin" size={17}/>}</div></div><button className={'ready-button '+(game?.teamReady[side]?'is-ready':'')} disabled={!game?.teams[side]||busy||network} onClick={()=>void mutate('team-ready',{ready:!game?.teamReady[side]})}><Check size={19}/>{game?.teamReady[side]?'Ready — click to change':'Ready with this team'}</button>{side===0?<button className="primary-button" disabled={!game?.names[1]||!game?.teamReady.every(Boolean)||busy||network} onClick={()=>void mutate('start')}>Start shootout<ArrowRight size={18}/></button>:null}<p className="waiting-note">{!game?.teams[side]?'Choose your team, then press Ready.':game?.teamReady.every(Boolean)?side===0?'Both teams are ready. Kick off!':'Both teams ready. Waiting for the host.':game?.teamReady[side]?'Waiting for your rival to be ready.':'Happy with your team? Press Ready.'}</p></div>}
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="mini-rules"><span><Crosshair size={16}/>Aim & shoot</span><span><Shield size={16}/>Read & save</span><span><Trophy size={16}/>Best of five</span></div>
   </aside>}
   <section className="arena-column" aria-label="Penalty shootout">
    <div className="arena-meta"><span><span className="live-dot"/>{finished?'FULL TIME':active?(round>5?'SUDDEN DEATH':`ROUND ${round} OF 5`):'UNDER THE LIGHTS'}</span><span>{session?`ROOM ${session.code}`:'ROOM CODE · 2 PLAYERS'}</span></div>
    <div className="game-arena">
     {session&&game&&<div className="series-record" role="group" aria-label="Match wins and losses in this room">{matchRecord(0)}<span className="series-label">MATCH<br/>RECORD</span>{matchRecord(1)}</div>}
     <div className="match-score"><div className="score-team home-team"><span className="team-stripe" style={{background:kits[0].shirt}}/><div><b>{getTeam(game?.teams[0]?.id)?.name||game?.names[0]||'YOU'}</b>{game?.teams[0]&&<small className="score-player">{game.names[0]}</small>}{shotHistory(0)}</div></div><div className="score-numbers"><span>{score[0]}</span><i>:</i><span>{score[1]}</span><small>{round>5?'SUDDEN DEATH':'PENALTY SHOOTOUT'}</small></div><div className="score-team away-team"><div><b>{getTeam(game?.teams[1]?.id)?.name||game?.names[1]||'YOUR RIVAL'}</b>{game?.teams[1]&&<small className="score-player">{game.names[1]}</small>}{shotHistory(1)}</div><span className="team-stripe" style={{background:kits[1].shirt}}/></div></div>
     {session&&game?.phase==='lobby'?<TeamSelection game={game} side={side} busy={busy} onSelect={team=>void mutate('team',{team})}/>:<div className="scene-container"><PenaltyScene game={game} now={now} side={side} zone={zone} onZone={choose} canChoose={canChoose}/>
      {!active&&<div className="scene-caption"><span className="scene-tag">HEAD-TO-HEAD</span><h2>ONE SHOT.<br/>MAKE IT COUNT.</h2><span>YOU TAKE THE SHOT. THEY MAKE THE CALL.</span></div>}
      {active&&game.phase==='aim'&&!game.paused&&!network&&<div className={'role-pill '+(isStriker?'shooter-role':'keeper-role')}>{isStriker?<Crosshair size={16}/>:<Shield size={16}/>} {isStriker?'YOU ARE THE STRIKER':'YOU ARE THE KEEPER'}</div>}
      {locked&&game?.phase==='aim'&&!game.paused&&!network&&<div className="locked-notice"><Check size={22}/><b>{isStriker?'SHOT LOCKED':'DIVE LOCKED'}</b><span>Waiting for {game.names[1-side]} to choose…</span></div>}
      {game?.phase==='reveal'&&elapsed<1.55&&<div className="shot-call">{game.names[game.last?.kicker??0]} steps up…</div>}
      {resultVisible&&<div className={'kick-result '+game.last?.outcome}><span>{game.last?.outcome==='goal'?'IN THE BACK OF THE NET':game.last?.outcome==='saved'?'THE KEEPER READ IT':'TOO MUCH POWER'}</span><h2>{game.last?.outcome==='goal'?'GOOOAL!':game.last?.outcome==='saved'?'SAVED!':'OVER THE BAR!'}</h2><p>{game.winner!==null?'Shootout decided.':`Next up: ${game.names[1-(game.last?.kicker??0)]}`}</p></div>}
      {finished&&<div className="winner-overlay"><Trophy size={42}/><span>SHOOTOUT CHAMPION</span><h2>{getTeam(game.teams[game.winner??0]?.id)?.name||game.names[game.winner??0]}</h2><p>{game.names[game.winner??0]} wins the shootout</p><strong>{game.score[0]} <i>—</i> {game.score[1]}</strong><button className="primary-button" disabled={busy||game.rematch[side]} onClick={()=>void mutate('rematch')}>{game.rematch[side]?'Waiting for your rival…':'Demand a rematch'}<ArrowRight size={18}/></button><button className="change-teams-button" disabled={busy} onClick={()=>void mutate('change-teams')}>Change teams</button>{game.rematch[1-side]&&!game.rematch[side]&&<p>Your rival wants another shootout.</p>}</div>}
      {active&&(game.paused||network)&&<div className="connection-overlay"><LoaderCircle className="spin" size={28}/><h2>HOLD THAT THOUGHT.</h2><p>{network?'Reconnecting you…':'Waiting for your opponent to reconnect…'}</p><span>Your score and locked choices are safe.</span></div>}
     </div>}
     {active?<div className="play-controls">
      {game.phase==='aim'?<><div className="turn-instruction"><span className={isStriker?'blue-text':'gold-text'}>{locked?'CHOICE LOCKED':zone<0?'01 / PICK YOUR TARGET':isStriker?'02 / TIME YOUR SHOT':'02 / COMMIT TO THE SAVE'}</span><h3>{locked?'Your move is a secret.':zone<0?(isStriker?'Where are you putting it?':'Where will your rival shoot?'):zoneNames[zone]}</h3><p>{locked?'Both choices are revealed together.':isStriker?'Hold Shoot. Release when the power reaches green.':'Pick a zone in the goal, then lock your dive.'}</p></div><div className="action-panel"><div className="direct-targets" role="group" aria-label={isStriker?'Choose your shot direction':'Choose your save direction'}>{zoneNames.map((label,i)=><button key={label} disabled={!canChoose} aria-label={`Choose ${label.toLowerCase()}`} aria-pressed={zone===i} onClick={()=>choose(i)}><span>{i+1}</span>{label}</button>)}</div>{isStriker?<><div className="power-label"><span>SHOT POWER</span><span>{Math.round(power*100)}%</span></div><div className="power-meter"><span className="sweet-spot"/><Progress value={power*100} className={'charge-progress '+(power>.97?'overpowered':'')}/><span className="power-tick" style={{left:`${power*100}%`}}/></div><button className={'shoot-button '+(holding?'charging':'')} disabled={!canChoose||zone<0} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);startCharge();}} onPointerUp={release} onPointerCancel={cancelCharge} onLostPointerCapture={()=>{if(chargeAt.current!==null)cancelCharge();}}><Crosshair size={20}/>{locked?'SHOT LOCKED':holding?'RELEASE TO SHOOT':'HOLD TO SHOOT'}<ArrowUpRight size={20}/></button></>:<button className="keeper-button" disabled={!canChoose||zone<0} onClick={()=>void mutate('lock',{turn:game.turn,zone,power:.75})}><Shield size={21}/>{locked?'DIVE LOCKED':'LOCK YOUR DIVE'}<ArrowRight size={20}/></button>}</div></>:<div className="between-kicks"><span>{finished?'Bragging rights secured.':'The pressure changes sides.'}</span><span>{finished?'Rematch when you’re ready.':game.winner!==null?'Final result coming up…':'Switching striker and keeper…'}</span></div>}
     </div>:<div className="arena-footer"><span><span/> EVERY SHOT IS A MIND GAME.</span><span>5 PENALTIES EACH</span></div>}
    </div>
    {active&&error&&<p className="error" role="alert">{error}</p>}
    <div className="under-arena"><span>{active?'Tap a goal target or use keys 1–6. Space to shoot / lock.':'Take turns shooting and saving on your own devices.'}</span><span>{active&&game?.ready[1-side]&&game.phase==='aim'?'OPPONENT LOCKED IN':active?'NO ONE SEES YOUR CHOICE':'PHONE + DESKTOP'}</span></div>
   </section>
  </div>
  <footer className="site-footer"><span>PENALTY DUEL <i>/</i> FRIENDS OFF THE PITCH.</span><span>FIVE SHOTS. ONE WINNER.</span></footer>
  <span className="sr-only" role="status" aria-live="polite">{announced}</span>
  <Dialog open={help} onOpenChange={setHelp}><DialogContent className="rules-dialog"><DialogHeader><DialogTitle>THE SHOOTOUT RULES.</DialogTitle><DialogDescription>Two players. Five penalties each. Every goal counts as one.</DialogDescription></DialogHeader><ol><li><b>Choose your side.</b><p>Pick a club or national team from any continent. Both players press Ready, then the host starts. Team colours appear on the pitch; clashing kits change automatically.</p></li><li><b>Take turns.</b><p>One player is the striker; the other controls the goalkeeper. Switch roles after every kick.</p></li><li><b>Aim, then hold Shoot.</b><p>Pick one of the six goal targets. Hold the button or Space, then release in the green power zone. Above 97% flies over the bar; below 35% is easier to save.</p></li><li><b>Read your rival.</b><p>The keeper secretly chooses a target and locks their dive. A matching zone saves the shot. Weak shots can also be saved from a nearby zone.</p></li><li><b>Win the shootout.</b><p>After five penalties each, the higher score wins. It ends early if the other player cannot catch up. A tie goes to sudden death: one penalty each until a pair produces a winner.</p></li></ol><div className="rules-note">Choices stay hidden until both players lock them. Stadium sound starts after your first tap; use the speaker button to mute. Stay on the game screen; disconnected matches pause. Both players must choose Rematch to restart. Match wins and losses carry over through rematches and team changes in this room; a new room starts a new record.</div></DialogContent></Dialog>
  <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}><AlertDialogContent className="rules-dialog"><AlertDialogTitle>Leave this shootout?</AlertDialogTitle><AlertDialogDescription>This closes the room for both players.</AlertDialogDescription><AlertDialogAction className="primary-button" onClick={()=>void leave()}>Leave room</AlertDialogAction><AlertDialogCancel>Keep playing</AlertDialogCancel></AlertDialogContent></AlertDialog>
 </main>;
}
