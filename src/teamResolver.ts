import {TEAMS} from './engine';
const aliasByTeam:Record<string,string[]>={
 'Galatasaray':['gs','cimbom','aslan'],
 'Fenerbahçe':['fb','fener','kanarya'],
 'Beşiktaş':['bjk','besiktas','kartal'],
 'Trabzonspor':['ts','trabzon'],
 'Başakşehir':['ibfk','basaksehir'],
 'Samsunspor':['samsun'],
 'Göztepe':['goztepe','gozgoz'],
 'Konyaspor':['konya'],
 'Rizespor':['rize'],
 'Antalyaspor':['antalya'],
 'Kasımpaşa':['kasimpasa'],
 'Alanyaspor':['alanya'],
 'Kayserispor':['kayseri'],
 'Gaziantep FK':['gaziantep','antep'],
 'Eyüpspor':['eyup'],
 'Gençlerbirliği':['gencler'],
 'Amedspor':['amed'],
 'Ankaragücü':['ankaragucu'],
 'Sakaryaspor':['sakarya'],
 'Kocaelispor':['kocaeli'],
 'Erzurumspor':['erzurum'],
 'Boluspor':['bolu'],
 'Bandırmaspor':['bandirma'],
 'Çorum FK':['corum'],
 'Iğdır FK':['igdir'],
 'Sivasspor':['sivas'],
 'Adana Demirspor':['ads','adanademir'],
 'Hatayspor':['hatay'],
 'Pendikspor':['pendik'],
 'Ümraniyespor':['umraniye'],
 'Manisa FK':['manisa'],
 'İstanbulspor':['istanbulspor']
};
export const normalizeTeamText=(text:string)=>text.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,' ').trim();
const aliases=TEAMS.flatMap((team,id)=>[team,...(aliasByTeam[team]??[])].map(a=>({id,alias:normalizeTeamText(a)}))).sort((a,b)=>b.alias.length-a.alias.length);
export function resolveTeam(comment:string):number|null{
 const normalized=' '+normalizeTeamText(comment)+' ';
 const hits=new Set<number>();
 for(const {id,alias} of aliases)if(alias&&normalized.includes(' '+alias+' '))hits.add(id);
 return hits.size===1?[...hits][0]:null;
}
