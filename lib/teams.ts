export const continents=['Africa','Europe','South America','North America','Asia','Oceania'] as const;
export type Continent=typeof continents[number];
export type Kit={shirt:string;shorts:string;socks:string;trim:string};
export type Team={id:string;name:string;short:string;country:string;flag:string;continent:Continent;type:'club'|'national';home:Kit;away:Kit};
export type TeamChoice={id:string;kit:'home'|'away'};
type Row=[string,string,string,string,string,string?,string?];
const kit=(shirt:string,trim:string,shorts=shirt,socks=shirt):Kit=>({shirt,trim,shorts,socks});
function group(type:Team['type'],continent:Continent,rows:Row[]):Team[]{return rows.map(([id,name,short,country,flag,shirt='#ffffff',trim='#162136'])=>({id,name,short,country,flag,type,continent,home:kit(shirt,trim),away:kit(shirt==='#ffffff'?'#172a48':'#f0f3f7',shirt)}));}
// Classic team-inspired colours; no season-specific kits, badges or player likenesses.
export const teams:Team[]=[
 ...group('national','Africa',[
 ['gha','Ghana','GHA','Ghana','🇬🇭','#ffffff','#e2ad2e'],['nga','Nigeria','NGA','Nigeria','🇳🇬','#209458','#ffffff'],['sen','Senegal','SEN','Senegal','🇸🇳','#ffffff','#188a5b'],['mar','Morocco','MAR','Morocco','🇲🇦','#c92739','#116d4d'],['egy','Egypt','EGY','Egypt','🇪🇬','#d82939','#171b25'],['civ','Côte d’Ivoire','CIV','Côte d’Ivoire','🇨🇮','#f18c27','#178e5a'],['cmr','Cameroon','CMR','Cameroon','🇨🇲','#19774b','#efc93b'],['rsa','South Africa','RSA','South Africa','🇿🇦','#edbf24','#226e48']]),
 ...group('national','Europe',[
 ['eng','England','ENG','England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#ffffff','#17346f'],['fra','France','FRA','France','🇫🇷','#193c86','#ffffff'],['ger','Germany','GER','Germany','🇩🇪','#ffffff','#181c25'],['esp','Spain','ESP','Spain','🇪🇸','#c72734','#eabf35'],['por','Portugal','POR','Portugal','🇵🇹','#b62635','#1a7859'],['ita','Italy','ITA','Italy','🇮🇹','#2074c3','#ffffff'],['ned','Netherlands','NED','Netherlands','🇳🇱','#f58227','#172a48'],['bel','Belgium','BEL','Belgium','🇧🇪','#be2f37','#edc539']]),
 ...group('national','South America',[
 ['bra','Brazil','BRA','Brazil','🇧🇷','#f6cf3b','#168651'],['arg','Argentina','ARG','Argentina','🇦🇷','#79c5e4','#ffffff'],['uru','Uruguay','URU','Uruguay','🇺🇾','#78bde3','#162136'],['col','Colombia','COL','Colombia','🇨🇴','#efce30','#1b3d84'],['chi','Chile','CHI','Chile','🇨🇱','#d83342','#1d4381'],['ecu','Ecuador','ECU','Ecuador','🇪🇨','#ecd130','#1b3d84'],['per','Peru','PER','Peru','🇵🇪','#ffffff','#d9303d'],['par','Paraguay','PAR','Paraguay','🇵🇾','#d63142','#ffffff']]),
 ...group('national','North America',[
 ['can','Canada','CAN','Canada','🇨🇦','#d12b40','#ffffff'],['usa','United States','USA','United States','🇺🇸','#ffffff','#183b72'],['mex','Mexico','MEX','Mexico','🇲🇽','#187d50','#e6e8ef'],['jam','Jamaica','JAM','Jamaica','🇯🇲','#efcd30','#188655'],['crc','Costa Rica','CRC','Costa Rica','🇨🇷','#cc3044','#203e77'],['pan','Panama','PAN','Panama','🇵🇦','#ce3141','#24417e']]),
 ...group('national','Asia',[
 ['jpn','Japan','JPN','Japan','🇯🇵','#204cb4','#ffffff'],['kor','South Korea','KOR','South Korea','🇰🇷','#ed4b55','#15213c'],['ksa','Saudi Arabia','KSA','Saudi Arabia','🇸🇦','#147b52','#ffffff'],['irn','Iran','IRN','Iran','🇮🇷','#ffffff','#c33546'],['qat','Qatar','QAT','Qatar','🇶🇦','#79253e','#ffffff'],['chn','China','CHN','China','🇨🇳','#d92e36','#edce38'],['ind','India','IND','India','🇮🇳','#2582d0','#f79835'],['uzb','Uzbekistan','UZB','Uzbekistan','🇺🇿','#ffffff','#258ec6']]),
 ...group('national','Oceania',[
 ['aus','Australia','AUS','Australia','🇦🇺','#eac635','#25734b'],['nzl','New Zealand','NZL','New Zealand','🇳🇿','#ffffff','#20242e'],['fij','Fiji','FIJ','Fiji','🇫🇯','#ffffff','#52afdf'],['sol','Solomon Islands','SOL','Solomon Islands','🇸🇧','#e9c931','#258e5d']]),
 ...group('club','Europe',[
 ['real','Real Madrid','RMA','Spain','🇪🇸','#ffffff','#dfb858'],['barca','Barcelona','BAR','Spain','🇪🇸','#23428b','#af294c'],['atleti','Atlético Madrid','ATM','Spain','🇪🇸','#ce3549','#ffffff'],['city','Manchester City','MCI','England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#79bfdf','#ffffff'],['united','Manchester United','MUN','England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#ce2a3b','#ffffff'],['arsenal','Arsenal','ARS','England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#da3442','#ffffff'],['chelsea','Chelsea','CHE','England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#2356b4','#ffffff'],['liverpool','Liverpool','LIV','England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','#c52d36','#ffffff'],['bayern','Bayern Munich','BAY','Germany','🇩🇪','#d33447','#ffffff'],['dortmund','Borussia Dortmund','BVB','Germany','🇩🇪','#f1d13b','#20242e'],['psg','Paris Saint-Germain','PSG','France','🇫🇷','#1d3159','#d53f4b'],['juve','Juventus','JUV','Italy','🇮🇹','#ffffff','#1a1f29'],['milan','AC Milan','MIL','Italy','🇮🇹','#be2f41','#191f2d'],['inter','Inter Milan','INT','Italy','🇮🇹','#2765b7','#171d27'],['ajax','Ajax','AJA','Netherlands','🇳🇱','#ffffff','#c93649'],['benfica','Benfica','BEN','Portugal','🇵🇹','#d33442','#ffffff']]),
 ...group('club','Africa',[
 ['hearts','Hearts of Oak','HEA','Ghana','🇬🇭','#edc53a','#b93444'],['kotoko','Asante Kotoko','KOT','Ghana','🇬🇭','#c82c3b','#ffffff'],['ahly','Al Ahly','AHL','Egypt','🇪🇬','#d02d3b','#ffffff'],['zamalek','Zamalek','ZAM','Egypt','🇪🇬','#ffffff','#d03042'],['sundowns','Mamelodi Sundowns','SUN','South Africa','🇿🇦','#ecd034','#2e7a52'],['chiefs','Kaizer Chiefs','KAI','South Africa','🇿🇦','#eeb230','#20242e'],['raja','Raja Casablanca','RCA','Morocco','🇲🇦','#1a865a','#ffffff'],['esperance','Espérance de Tunis','EST','Tunisia','🇹🇳','#edc037','#be3445']]),
 ...group('club','South America',[
 ['flamengo','Flamengo','FLA','Brazil','🇧🇷','#c93040','#1c202a'],['palmeiras','Palmeiras','PAL','Brazil','🇧🇷','#1f7853','#ffffff'],['santos','Santos','SAN','Brazil','🇧🇷','#ffffff','#20242e'],['corinthians','Corinthians','COR','Brazil','🇧🇷','#ffffff','#20242e'],['boca','Boca Juniors','BOC','Argentina','🇦🇷','#214990','#e9c337'],['river','River Plate','RIV','Argentina','🇦🇷','#ffffff','#cf3445'],['penarol','Peñarol','PEN','Uruguay','🇺🇾','#e8c936','#20242e'],['colo','Colo-Colo','COL','Chile','🇨🇱','#ffffff','#20242e']]),
 ...group('club','North America',[
 ['miami','Inter Miami','MIA','United States','🇺🇸','#f1a8c4','#242232'],['galaxy','LA Galaxy','LAG','United States','🇺🇸','#ffffff','#213961'],['lafc','Los Angeles FC','LAFC','United States','🇺🇸','#20242e','#c5a958'],['toronto','Toronto FC','TOR','Canada','🇨🇦','#c73046','#e4e9ef'],['america','Club América','AME','Mexico','🇲🇽','#f3e3a0','#223963'],['chivas','Guadalajara','GDL','Mexico','🇲🇽','#c93647','#ffffff']]),
 ...group('club','Asia',[
 ['hilal','Al Hilal','HIL','Saudi Arabia','🇸🇦','#2d59bf','#ffffff'],['nassr','Al Nassr','NAS','Saudi Arabia','🇸🇦','#eed035','#2760b8'],['ittihad','Al Ittihad','ITT','Saudi Arabia','🇸🇦','#edc334','#24242b'],['urawa','Urawa Red Diamonds','URA','Japan','🇯🇵','#d13243','#20242e'],['kobe','Vissel Kobe','VIS','Japan','🇯🇵','#972e43','#ffffff'],['ulsan','Ulsan HD','ULS','South Korea','🇰🇷','#2261b8','#ecc636'],['jeonbuk','Jeonbuk Motors','JEO','South Korea','🇰🇷','#378342','#ffffff'],['mohun','Mohun Bagan','MBS','India','🇮🇳','#247953','#7e2e3d']]),
 ...group('club','Oceania',[
 ['auckland','Auckland City','AKL','New Zealand','🇳🇿','#254c8c','#ffffff'],['wellington','Wellington Phoenix','WEL','New Zealand','🇳🇿','#edce38','#24242e'],['sydney','Sydney FC','SYD','Australia','🇦🇺','#75b9de','#193655'],['melbourne','Melbourne Victory','MVC','Australia','🇦🇺','#213960','#ffffff']]),
];
// Familiar contrasting shorts for the classic national looks.
for(const t of teams){if(t.id==='bra')t.home.shorts='#2456ac';if(['eng','ger','arg','uru'].includes(t.id))t.home.shorts='#17283f';if(t.id==='gha')t.away=kit('#c82e3d','#e8bc34','#c82e3d');if(t.id==='hearts')t.home.shorts='#253e8c';}
export const getTeam=(id?:string|null)=>teams.find(t=>t.id===id);
export function validTeamChoice(value:unknown):value is TeamChoice{if(!value||typeof value!=='object')return false;const v=value as TeamChoice;return !!getTeam(v.id)&&(v.kit==='home'||v.kit==='away');}
export function colourDistance(a:string,b:string){const rgb=(x:string)=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const x=rgb(a),y=rgb(b);return Math.hypot(...x.map((n,i)=>n-y[i]));}
const keeperColours=['#ffd137','#db55de','#41dca4','#42cce9','#f28b36','#f0f3f7','#192239'];
export type MatchKit=Kit&{label:string;adjusted:boolean;keeper:Kit};
export function matchKits(choices:(TeamChoice|null)[]):MatchKit[]{
 const defaults=[kit('#4a8dff','#ffffff'),kit('#ff806c','#ffffff')];
 const selected=choices.map((c,i)=>{const t=getTeam(c?.id);return {...(t&&c?t[c.kit]:defaults[i]),label:c?.kit==='away'?'Away':'Home',adjusted:false};});
 while(selected.length<2)selected.push({...defaults[selected.length],label:'Home',adjusted:false});
 if(colourDistance(selected[0].shirt,selected[1].shirt)<135){
  const t=getTeam(choices[1]?.id),other=choices[1]?.kit==='away'?'home':'away';
  const alternatives=[...(t?[{...t[other],label:other==='away'?'Away':'Home'}]:[]),{...kit('#f0f3f7','#203149'),label:'Light'},{...kit('#17253d','#e9eef7'),label:'Dark'}];
  const best=alternatives.find(a=>colourDistance(selected[0].shirt,a.shirt)>=135)??alternatives.sort((a,b)=>colourDistance(selected[0].shirt,b.shirt)-colourDistance(selected[0].shirt,a.shirt))[0];
  Object.assign(selected[1],best,{adjusted:true});
 }
 const used=selected.map(k=>k.shirt);
 return selected.map(k=>{const colour=[...keeperColours].sort((a,b)=>Math.min(...used.map(c=>colourDistance(b,c)))-Math.min(...used.map(c=>colourDistance(a,c))))[0];used.push(colour);return {...k,keeper:kit(colour,'#142035',colour,colour)};});
}

export function kitInk(colour:string){const rgb=[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.18?'#101d31':'#ffffff';}
