/** Diş başına jeton tabanı: orta kesiciler en değerli, molarlar en ucuz. */
export type ToothPriceBand='front'|'middle'|'back';
export function toothPriceBand(id:number):ToothPriceBand{
 if(!Number.isInteger(id)||id<0||id>=32)throw new RangeError('Geçersiz diş');
 const slot=id%16;
 if(slot>=6&&slot<=9)return 'front'; // orta + yan kesici bölgesi
 if(slot>=3&&slot<=12)return 'middle'; // kanin + premolar
 return 'back'; // posterior molarlar
}
export const TOOTH_PRICE={front:20,middle:5,back:1} as const;
export function claimPrice(id:number):number{return TOOTH_PRICE[toothPriceBand(id)];}
export function procedurePrice(id:number,action:string):number{
 const base=claimPrice(id);
 if(action==='implant')return Math.max(30,base*2);
 if(action==='extract')return base*2;
 if(action==='fracture')return Math.max(5,base);
 if(action==='heal'||action==='decayShield'||action==='fractureShield')return base;
 return base;
}
export const SCREENSHOT_GIFTS=[
 {name:'Gül',coins:1},{name:'GG',coins:1},{name:'Dondurma Külahı',coins:1},
 {name:'Finger Heart',coins:5},{name:'Aşırı tepki',coins:5},
 {name:'Kalp',coins:10},{name:'Meraklı Twinkle',coins:10},{name:'Ağır çekim',coins:10},
 {name:'Yıldızıma Tebrikler',coins:15},{name:'Bravo!',coins:15},
 {name:'Parfüm',coins:20},{name:'LOL',coins:20},{name:'Minik Allık',coins:20},
 {name:'Donat',coins:30},{name:'Çay',coins:50},{name:'Harika',coins:88},
 {name:'Şapka ve Bıyık',coins:99},{name:'Konfeti',coins:100},
 {name:'Öpücük',coins:150},{name:'Gece Yıldızı',coins:199},
 {name:'TikTok',coins:1},{name:'Lale',coins:1},{name:'Göz kırpma',coins:1},{name:'Süpersin',coins:1},{name:'Deniz Kabuğu',coins:1},{name:'Denizyıldızı',coins:1},{name:'Rüzgâr gülü',coins:1},{name:'Hazine Yoncası',coins:1},{name:'Karşılama Kahvesi',coins:1},
 {name:'Aşk Kokusu',coins:5},{name:'Dondurma',coins:5},{name:'Tamam',coins:5},{name:'Şeftali',coins:5},{name:'Türk kahvesi',coins:5},
 {name:'Dostluk Kolyesi',coins:10},{name:'Filtre Kahve',coins:10},{name:'Cesaret iksiri',coins:10}
] as const;
