'use client';
import {useEffect,useState} from 'react';
import {Check,Search,Shirt,Shield} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {continents,teams,getTeam,matchKits,kitInk,type TeamChoice,type MatchKit} from '@/lib/teams';
import type {DuelView} from '@/lib/penalty';
export function KitPair({kit}:{kit:MatchKit}){return <div className="kit-pair"><span><Shirt size={26} fill={kit.shirt} color={kit.trim} strokeWidth={1.4}/><small>{kit.label} kit</small></span><span><Shirt size={26} fill={kit.keeper.shirt} color={kit.keeper.trim} strokeWidth={1.4}/><small>Keeper</small></span></div>;}
export default function TeamSelection({game,side,busy,onSelect}:{game:DuelView;side:number;busy:boolean;onSelect:(team:TeamChoice)=>void}){
 const current=game.teams[side],selected=getTeam(current?.id);
 const [type,setType]=useState(selected?.type||'national'),[region,setRegion]=useState<string>(selected?.continent||'Africa'),[query,setQuery]=useState('');
 const [pickerOpen,setPickerOpen]=useState(!current);
 useEffect(()=>{if(current)setPickerOpen(false);},[current?.id,current?.kit]);
 const select=(team:TeamChoice)=>{onSelect(team);if(current?.id===team.id)setPickerOpen(false);};
 const kits=matchKits(game.teams),list=teams.filter(t=>t.type===type&&(region==='all'||t.continent===region)&&(!query||`${t.name} ${t.country}`.toLowerCase().includes(query.toLowerCase())));
 const teamBrowser=<div className="team-browser">
  <div className="team-filters"><Tabs value={type} onValueChange={v=>{setType(v as typeof type);setQuery('');}}><TabsList className="team-type-tabs"><TabsTrigger value="national">National teams</TabsTrigger><TabsTrigger value="club">Clubs</TabsTrigger></TabsList></Tabs><Select value={region} onValueChange={setRegion}><SelectTrigger className="continent-select" aria-label="Continent"><SelectValue/></SelectTrigger><SelectContent position="popper"><SelectItem value="all">All continents</SelectItem>{continents.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><div className="team-search"><Search size={17}/><input aria-label="Search teams" placeholder="Search teams" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
  <div className="team-grid" aria-label="Available teams">{list.map(t=><button key={t.id} disabled={busy} aria-pressed={current?.id===t.id} className={'team-option '+(current?.id===t.id?'chosen':'')} onClick={()=>select({id:t.id,kit:'home'})}><span className="team-emblem" style={{background:t.home.shirt,color:kitInk(t.home.shirt)}}>{t.short}</span><span className="team-option-name"><b>{t.name}</b><small>{t.flag} {t.country}</small></span>{current?.id===t.id&&<Check size={17}/>}</button>)}{!list.length&&<p className="no-teams">No teams match. Try another name or continent.</p>}</div>
 </div>;
 return <div className="team-selection">
  <div className="selection-title"><div><span>EXHIBITION · TEAM SELECT</span><h2>WHO ARE YOU PLAYING AS?</h2></div><span className="catalog-count">{teams.length} TEAMS</span></div>
  <div className="matchup-cards">{[0,1].map(i=>{const team=getTeam(game.teams[i]?.id);return <div key={i} className={'matchup-card '+(side===i?'your-team':'')} style={{borderTopColor:team?kits[i].shirt:undefined}}><div className="matchup-owner"><span>{side===i?'YOU':game.names[i]||'YOUR RIVAL'}</span>{game.teamReady[i]?<span className="ready-tag"><Check size={13}/>Ready</span>:<small>{game.names[i]?'Choosing…':'Not joined'}</small>}</div><div className="matchup-team"><span aria-hidden="true">{team?.flag||'⚽'}</span><div><h3>{team?.name||'Choose a team'}</h3><p>{team?`${team.type==='club'?team.country:'National team'} · ${team.continent}`:'Club or country. Your call.'}</p></div></div>{team?<KitPair kit={kits[i]}/>:<div className="kit-placeholder"><Shirt size={23}/><span>Your kits appear here</span></div>}{side===i?<button className="choose-team-button" onClick={()=>setPickerOpen(true)}>{team?'Change your team':'Choose your team'}</button>:<p className="opponent-selects">Your opponent chooses on their device.</p>}</div>;})}<span className="versus">VS</span></div>
  {pickerOpen?<Dialog open={pickerOpen} onOpenChange={setPickerOpen}><DialogContent className="team-picker-dialog"><DialogHeader><DialogTitle>Choose your team, {game.names[side]}.</DialogTitle><DialogDescription>Pick a club or country for your side. Your opponent chooses separately.</DialogDescription></DialogHeader>{teamBrowser}</DialogContent></Dialog>:teamBrowser}
  <div className="kit-choice"><div><Shield size={17}/><span>{kits.some(k=>k.adjusted)?'Kit clash resolved automatically.':'Each side has a distinct player and keeper kit.'}</span></div>{current&&<Select value={current.kit} disabled={busy} onValueChange={v=>onSelect({...current,kit:v as 'home'|'away'})}><SelectTrigger aria-label="Preferred kit"><SelectValue/></SelectTrigger><SelectContent position="popper"><SelectItem value="home">Prefer home kit</SelectItem><SelectItem value="away">Prefer away kit</SelectItem></SelectContent></Select>}</div>
  <p className="catalog-note">Classic team-inspired colours. Regions are geographical. All teams play on equal terms.</p>
 </div>;
}
