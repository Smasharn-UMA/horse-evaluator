(()=>{'use strict';
const K='horseEvaluator3',V='3.1.9',PRE_IMPORT_K='horseEvaluator3_preImportBackup',$=id=>document.getElementById(id);let state=load();
const E={yearFilter:$('yearFilter'),clubFilter:$('clubFilter'),sexFilter:$('sexFilter'),stableAreaFilter:$('stableAreaFilter'),searchInput:$('searchInput'),sortSelect:$('sortSelect'),favoriteOnly:$('favoriteOnly'),dashboard:$('dashboard'),horseList:$('horseList'),resultCount:$('resultCount'),emptyState:$('emptyState'),horseDialog:$('horseDialog'),horseForm:$('horseForm'),detailDialog:$('detailDialog'),detailContent:$('detailContent'),toast:$('toast'),importUrlBtn:$('importUrlBtn'),importStatus:$('importStatus'),importTextBtn:$('importTextBtn'),pageText:$('pageText'),importFormat:$('importFormat'),restoreStatus:$('restoreStatus')};
function base(){return{version:V,app:'Horse Evaluator',horses:[],updatedAt:new Date().toISOString()}}
function uid(){return crypto.randomUUID?crypto.randomUUID():'h-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
function t(v){return(v??'').toString().trim()} function n(v){return v===''||v==null?null:Number(v)}
function esc(v){return t(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmt(d){return d?new Intl.DateTimeFormat('ja-JP',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d)):'―'}
function money(v){return v==null?'―':new Intl.NumberFormat('ja-JP').format(v)}
function internalId(clubName,year,horseNo,fallback){const c=clubName==='ユニオン'?'UNION':clubName==='キャロット'?'CARROT':clubName==='シルク'?'SILK':'OTHER';const no=horseNo==null?t(fallback).slice(-6):String(horseNo).padStart(3,'0');return `${c}-${year}-${no}`}
function save(){state.version=V;state.updatedAt=new Date().toISOString();localStorage.setItem(K,JSON.stringify(state))}
function validDate(v,fallback){const d=new Date(v);return Number.isNaN(d.getTime())?fallback:d.toISOString()}
function pick(...values){for(const v of values)if(v!==undefined&&v!==null&&v!=='')return v;return null}
function normalizeLog(log,createdAt){if(!Array.isArray(log))return[{at:createdAt,action:'移行・登録'}];return log.map(x=>({at:validDate(x?.at,createdAt),action:t(x?.action)||'更新'}))}
function load(){try{const r=localStorage.getItem(K);if(!r)return base();const parsed=JSON.parse(r),m=migrate(parsed);return m.horses.length||Array.isArray(parsed?.horses)?m:base()}catch(e){console.error('localStorage読込失敗',e);return base()}}
function club(v){const s=t(v);if(/carrot|キャロット/i.test(s))return'キャロット';if(/silk|シルク/i.test(s))return'シルク';if(/union|ユニオン/i.test(s))return'ユニオン';return s||'その他'}
function sex(v){const s=t(v);if(/牡|male|colt/i.test(s))return'牡';if(/牝|female|filly/i.test(s))return'牝';if(/せん|騸|gelding/i.test(s))return'せん';return s}
function area(v){const s=t(v);if(/美浦/.test(s))return'美浦';if(/栗東/.test(s))return'栗東';if(/地方/.test(s))return'地方';return s}
function sourceArray(x){if(Array.isArray(x))return x;if(!x||typeof x!=='object')throw new Error('JSONの最上位が配列またはオブジェクトではありません。');if(Array.isArray(x.horses))return x.horses;if(Array.isArray(x.records))return x.records;if(Array.isArray(x.items))return x.items;if(x.horseName||x.name)return[x];throw new Error('horses / records / items のいずれにも馬データがありません。')}
function migrate(x){
  const a=sourceArray(x),now=new Date().toISOString();
  return {
    version:V,sourceVersion:t(x?.version)||'unknown',app:'Horse Evaluator',updatedAt:now,
    horses:a.map((h,i)=>{
      if(!h||typeof h!=='object')throw new Error(`${i+1}件目の馬データが不正です。`);
      const m=h.measurements||h.measurement||h.sizes||{};
      const createdAt=validDate(pick(h.createdAt,h.registeredAt),now);
      const updatedAt=validDate(pick(h.updatedAt,h.modifiedAt),createdAt);
      const yearRaw=pick(h.year,h.recruitmentYear,h.recruitYear,new Date().getFullYear());
      const year=Number(yearRaw);
      if(!Number.isFinite(year))throw new Error(`${i+1}件目の年度が不正です。`);
      const normalizedClub=club(pick(h.club,h.clubName));
      const horseNo=n(pick(h.horseNo,h.number,h.recruitmentNumber));
      const id=t(pick(h.id,h.uuid,h.internalId))||uid();
      return {
        id,year,club:normalizedClub,horseNo,
        name:t(pick(h.name,h.horseName,h.recruitmentName))||`名称未設定 ${i+1}`,
        sex:sex(h.sex),coatColor:t(pick(h.coatColor,h.color,h.coat)),birthDate:t(pick(h.birthDate,h.birthday)),
        sire:t(pick(h.sire,h.father)),dam:t(pick(h.dam,h.mother)),
        broodmareSire:t(pick(h.broodmareSire,h.damsire,h.damSire)),
        stableArea:area(pick(h.stableArea,h.affiliation,h.region)),
        trainer:t(pick(h.trainer,h.stable)),breeder:t(pick(h.breeder,h.farm,h.productionFarm)),
        trainingFarm:t(pick(h.trainingFarm,h.trainingCenter)),currentLocation:t(pick(h.currentLocation,h.location)),horseClass:t(pick(h.horseClass,h.className,h.class)),
        price:n(pick(h.price,h.totalPrice)),shareCount:n(pick(h.shareCount,h.recruitmentShares,h.numberOfShares)),
        sharePrice:n(pick(h.sharePrice,h.unitPrice)),recruitmentPr:t(pick(h.recruitmentPr,h.pr,h.promotion)),
        internalId:t(h.internalId)||internalId(normalizedClub,year,horseNo,id),
        measurements:{
          weight:n(pick(m.weight,m.bodyWeight,h.weight,h.bodyWeight)),
          height:n(pick(m.height,m.bodyHeight,h.height,h.bodyHeight)),
          girth:n(pick(m.girth,m.chest,h.girth,h.chest)),
          cannon:n(pick(m.cannon,m.cannonBone,h.cannon,h.cannonBone))
        },
        sourceUrl:t(pick(h.sourceUrl,h.pageUrl)),photoUrl:t(pick(h.photoUrl,h.photo,h.files?.photo)),
        videoUrl:t(pick(h.videoUrl,h.video,h.files?.video)),favorite:Boolean(h.favorite),notes:t(pick(h.notes,h.memo)),
        createdAt,updatedAt,changeLog:normalizeLog(h.changeLog,createdAt)
      };
    })
  };
}
function validateImport(raw,m){const warnings=[];if(!m.horses.length)throw new Error('馬データが0件です。');const ids=new Set();m.horses.forEach((h,i)=>{if(ids.has(h.id))warnings.push(`${i+1}件目: ID重複`);ids.add(h.id);if(!h.name)warnings.push(`${i+1}件目: 馬名なし`)});return{sourceVersion:t(raw?.version)||'不明',count:m.horses.length,warnings}}
function toast(s){E.toast.textContent=s;E.toast.classList.add('show');clearTimeout(toast.x);toast.x=setTimeout(()=>E.toast.classList.remove('show'),1800)}
function refreshFilters(){const y=E.yearFilter.value,c=E.clubFilter.value,ys=[...new Set(state.horses.map(h=>h.year))].sort((a,b)=>b-a),cs=[...new Set(state.horses.map(h=>h.club))].sort();E.yearFilter.innerHTML='<option value="">すべて</option>'+ys.map(v=>`<option>${v}</option>`).join('');E.clubFilter.innerHTML='<option value="">すべて</option>'+cs.map(v=>`<option>${esc(v)}</option>`).join('');if(ys.map(String).includes(y))E.yearFilter.value=y;if(cs.includes(c))E.clubFilter.value=c}
function list(){const y=E.yearFilter.value,c=E.clubFilter.value,sx=E.sexFilter.value,a=E.stableAreaFilter.value,q=E.searchInput.value.toLowerCase(),fav=E.favoriteOnly.checked,s=E.sortSelect.value;return state.horses.filter(h=>(!y||String(h.year)===y)&&(!c||h.club===c)&&(!sx||h.sex===sx)&&(!a||h.stableArea===a)&&(!fav||h.favorite)&&(!q||[h.name,h.sire,h.dam,h.broodmareSire,h.stableArea,h.trainer,h.breeder,h.trainingFarm,h.recruitmentPr,h.internalId,h.notes].join(' ').toLowerCase().includes(q))).sort((x,z)=>s==='updatedAt'?new Date(z.updatedAt)-new Date(x.updatedAt):s==='name'?x.name.localeCompare(z.name,'ja'):s==='price'?(z.price||0)-(x.price||0):(x.horseNo??9999)-(z.horseNo??9999))}
function metric(l,v,u){return`<div class="metric"><b>${v==null?'―':esc(v)}</b><span>${l}${v==null?'':' '+u}</span></div>`}
function card(h){const m=h.measurements||{},bg=h.photoUrl?`style="background-image:url('${esc(h.photoUrl)}')"`:'';return`<article class="horse-card"><div class="photo" ${bg}>${h.photoUrl?'':'NO PHOTO'}</div><div class="body"><div class="topline"><div><span class="badge">${h.year} ${esc(h.club)}</span>${h.horseNo!=null?`<span class="badge">No.${h.horseNo}</span>`:''}${h.stableArea?`<span class="badge">${esc(h.stableArea)}</span>`:''}<h3>${esc(h.name)}</h3></div><button class="favorite ${h.favorite?'on':''}" data-a="favorite" data-id="${h.id}">★</button></div><div class="pedigree">父：${esc(h.sire)||'―'}<br>母：${esc(h.dam)||'―'}<br>母父：${esc(h.broodmareSire)||'―'}<br>厩舎：${esc(h.trainer)||'―'}</div><div class="price-box"><b>総額 ${h.price==null?'―':money(h.price)+'万円'}</b><span>${h.shareCount==null?'募集口数 ―':money(h.shareCount)+'口'} ／ 1口 ${h.sharePrice==null?'―':money(h.sharePrice)+'円'}</span></div><div class="metrics">${metric('体重',m.weight,'kg')}${metric('体高',m.height,'cm')}${metric('胸囲',m.girth,'cm')}${metric('管囲',m.cannon,'cm')}</div><div class="card-actions"><button data-a="detail" data-id="${h.id}">詳細</button><button data-a="edit" data-id="${h.id}">編集</button><button data-a="delete" data-id="${h.id}" class="danger">削除</button></div><div class="updated">更新：${fmt(h.updatedAt)}</div></div></article>`}
function render(){refreshFilters();const a=list();E.dashboard.innerHTML=[['登録頭数',state.horses.length],['年度数',new Set(state.horses.map(h=>h.year)).size],['クラブ数',new Set(state.horses.map(h=>h.club)).size],['お気に入り',state.horses.filter(h=>h.favorite).length]].map(([l,v])=>`<div class="stat"><div class="num">${v}</div><div class="label">${l}</div></div>`).join('');E.resultCount.textContent=`${a.length}頭`;E.horseList.innerHTML=a.map(card).join('');E.emptyState.classList.toggle('hidden',a.length!==0)}
function setImportStatus(msg,type=''){E.importStatus.textContent=msg;E.importStatus.className='muted '+(type==='ok'?'import-status-ok':type==='error'?'import-status-error':'')}
function openNew(){E.horseForm.reset();$('horseId').value='';$('year').value=new Date().getFullYear();$('dialogTitle').textContent='新規登録';setImportStatus('');if(E.pageText)E.pageText.value='';E.horseDialog.showModal()}
function openEdit(id){const h=state.horses.find(x=>x.id===id);if(!h)return;['year','club','horseNo','name','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','currentLocation','horseClass','price','shareCount','sharePrice','sourceUrl','photoUrl','videoUrl','recruitmentPr','notes'].forEach(k=>$(k).value=h[k]??'');['weight','height','girth','cannon'].forEach(k=>$(k).value=h.measurements?.[k]??'');$('favorite').checked=h.favorite;$('horseId').value=h.id;$('dialogTitle').textContent='募集馬を編集';setImportStatus('');if(E.pageText)E.pageText.value='';E.horseDialog.showModal()}
function readForm(){const id=$('horseId').value||uid(),old=state.horses.find(h=>h.id===id),now=new Date().toISOString();return{id,year:Number($('year').value),club:$('club').value,horseNo:n($('horseNo').value),name:t($('name').value),sex:$('sex').value,coatColor:t($('coatColor').value),birthDate:$('birthDate').value,sire:t($('sire').value),dam:t($('dam').value),broodmareSire:t($('broodmareSire').value),stableArea:$('stableArea').value,trainer:t($('trainer').value),breeder:t($('breeder').value),trainingFarm:t($('trainingFarm').value),currentLocation:t($('currentLocation').value),horseClass:t($('horseClass').value),price:n($('price').value),shareCount:n($('shareCount').value),sharePrice:n($('sharePrice').value),recruitmentPr:t($('recruitmentPr').value),internalId:old?.internalId||internalId($('club').value,Number($('year').value),n($('horseNo').value),id),measurements:{weight:n($('weight').value),height:n($('height').value),girth:n($('girth').value),cannon:n($('cannon').value)},sourceUrl:t($('sourceUrl').value),photoUrl:t($('photoUrl').value),videoUrl:t($('videoUrl').value),favorite:$('favorite').checked,notes:t($('notes').value),createdAt:old?.createdAt||now,updatedAt:now,changeLog:[...(old?.changeLog||[]),{at:now,action:old?'更新':'登録'}]}}
function detail(id){const h=state.horses.find(x=>x.id===id),m=h.measurements||{},d=(l,v)=>`<div class="detail-item"><span>${l}</span><b>${esc(v)||'―'}</b></div>`;E.detailContent.innerHTML=`<div class="dialog-head"><div><div class="eyebrow">${h.year} ${esc(h.club)} ${h.horseNo!=null?'No.'+h.horseNo:''}</div><h2>${esc(h.name)}</h2></div></div>${h.photoUrl?`<div class="detail-photo" style="background-image:url('${esc(h.photoUrl)}')"></div>`:''}<div class="detail-grid">${d('性別',h.sex)}${d('毛色',h.coatColor)}${d('生年月日',h.birthDate)}${d('父',h.sire)}${d('母',h.dam)}${d('母父',h.broodmareSire)}${d('所属',h.stableArea)}${d('厩舎',h.trainer)}${d('生産牧場',h.breeder)}${d('育成牧場',h.trainingFarm)}${d('在厩場所',h.currentLocation)}${d('クラス',h.horseClass)}${d('内部管理ID',h.internalId)}${d('募集総額',h.price==null?'':money(h.price)+'万円')}${d('募集口数',h.shareCount==null?'':money(h.shareCount)+'口')}${d('1口価格',h.sharePrice==null?'':money(h.sharePrice)+'円')}${d('馬体重',m.weight==null?'':m.weight+'kg')}${d('体高',m.height==null?'':m.height+'cm')}${d('胸囲',m.girth==null?'':m.girth+'cm')}${d('管囲',m.cannon==null?'':m.cannon+'cm')}</div>${h.sourceUrl?`<a class="source-link" href="${esc(h.sourceUrl)}" target="_blank" rel="noopener">募集馬ページを開く</a>`:''}${h.videoUrl?`<p><a href="${esc(h.videoUrl)}" target="_blank" rel="noopener">歩様動画を開く</a></p>`:''}<h3>募集時PR</h3><div class="notes">${esc(h.recruitmentPr)||'―'}</div><h3>メモ</h3><div class="notes">${esc(h.notes)||'―'}</div><h3>更新履歴</h3><div class="notes">${(h.changeLog||[]).slice().reverse().map(x=>fmt(x.at)+'　'+esc(x.action)).join('\n')}</div>`;E.detailDialog.showModal()}
function cleanText(s){return t(s).replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\r/g,'')}
function first(text,re,group=1){const m=text.match(re);return m?t(m[group]):''}
function numberFrom(text,re){const s=first(text,re).replace(/,/g,'');return s?Number(s):null}
function parseUnion(text,url){
 const x=cleanText(text),ls=lines(x);
 const labelValue=(labels)=>{for(const label of labels){const exact=afterLabel(ls,label);if(exact)return exact;const row=ls.find(v=>v.startsWith(label+'：')||v.startsWith(label+':'));if(row)return row.replace(new RegExp('^'+label+'[：:]\\s*'),'').trim()}return''};
 const numberAny=(patterns)=>{for(const re of patterns){const v=numberFrom(x,re);if(v!=null)return v}return null};
 const horseNo=numberAny([/PEGASUS\s*([0-9]+)/i,/募集番号\s*[：:]?\s*([0-9]+)/,/^\s*([0-9]+)[\.．]\s*[^\n]+/m]);
 const birthText=labelValue(['生年月日','年齢 / 生年月日','年齢／生年月日'])||first(x,/(20\d{2})年\s*([0-9]{1,2})月\s*([0-9]{1,2})日/,0)||first(x,/(20\d{2})[\/.-]([0-9]{1,2})[\/.-]([0-9]{1,2})/,0);
 const bm=birthText.match(/(20\d{2})(?:年|[\/.-])\s*([0-9]{1,2})(?:月|[\/.-])\s*([0-9]{1,2})日?/);
 const birthDate=bm?`${bm[1]}-${bm[2].padStart(2,'0')}-${bm[3].padStart(2,'0')}`:'';
 const birthYear=bm?bm[1]:'';
 const sire=labelValue(['父'])||first(x,/父\s+([^\n]+?)(?=\s+母\s|\n)/);
 const dam=(labelValue(['母'])||first(x,/母\s+([^\n]+?)(?=\s+母の父|\n)/)).replace(/^\*/,'').trim();
 const broodmareSire=(labelValue(['母の父','母父'])||first(x,/母の父\s+([^\n]+?)(?=\s+5代血統表|\s+生年月日|\n)/)).replace(/^\*/,'').trim();
 // ユニオン本文には募集馬名がない形式があるため、常に『母名＋出生年』で統一する。
 // 兄姉・近親欄や本文中の固有名詞は馬名候補として一切使用しない。
 const name=dam&&birthYear?`${dam}の${birthYear}`:'';
 const sexColor=labelValue(['性別 / 毛色','性別／毛色']);
 const sc=sexColor.split(/[\/／]/).map(v=>v.trim());
 const sexValue=sex(sc[0]||labelValue(['性別'])||first(x,/性別\s*[：:]?\s*(牡|牝|せん|騸)/));
 const coatColor=sc[1]||labelValue(['毛色'])||first(x,/毛色\s*[：:]?\s*([^\n]+)/);
 const trainerRaw=labelValue(['予定厩舎','厩舎'])||first(x,/(?:予定厩舎|厩舎)\s*([^\n]+?)(?=\s+測尺|\n)/);
 const stableArea=area(labelValue(['所属'])||trainerRaw);
 const trainer=trainerRaw.replace(/^(美浦|栗東|地方)\s*/,'').replace(/厩舎$/,'').trim();
 const breeder=labelValue(['生産牧場','生産'])||first(x,/生産牧場\s*([^\n]+?)(?=\s+所属|\n)/);
 const trainingFarm=labelValue(['育成牧場','育成']);
 const price=numberAny([/総額\s*[：:]?\s*([0-9,]+)万円/,/募集総額\s*[：:]?\s*([0-9,]+)万円/]);
 const shareCount=numberAny([/募集口数\s*[：:]?\s*([0-9,]+)口/,/口数\s*[：:]?\s*([0-9,]+)口/]);
 let sharePrice=numberAny([/一口(?:価格|出資額)?\s*[：:]?\s*([0-9,]+)円/,/1口\s*[：:]?\s*([0-9,]+)円/]);
 const measureSection=(x.match(/(?:測尺|馬体重)[\s\S]*?(?:募集時のPR|近況|ムービー|フォトギャラリー|ポイント|主な兄姉・近親|$)/)||['',x])[0];
 const all=(label,unit)=>[...measureSection.matchAll(new RegExp(label+'[：:\\s]*([0-9.]+)\\s*'+unit,'g'))].map(m=>Number(m[1]));
 const latest=a=>a.length?a[a.length-1]:null;
 const statedYears=[...measureSection.matchAll(/[【〖\[]?(20\d{2})年/g)].map(m=>Number(m[1]));
 const year=latest(statedYears)||(birthYear?Number(birthYear)+1:new Date().getFullYear());
 // ユニオンのPRはページ構造が一定でないため自動取込しない。
 const recruitmentPr='';
 const data={year,club:'ユニオン',horseNo,name,sex:sexValue,coatColor,birthDate,sire,dam,broodmareSire,stableArea,trainer,breeder,trainingFarm,currentLocation:'',horseClass:'',price,shareCount,sharePrice,recruitmentPr,measurements:{weight:latest(all('馬体重','kg')),height:latest(all('体高','cm')),girth:latest(all('胸囲','cm')),cannon:latest(all('管囲','cm'))},sourceUrl:url};
 if(data.sharePrice==null&&data.price!=null&&data.shareCount){data.sharePrice=Math.round((data.price*10000/data.shareCount)/100)*100}
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data
}
function lines(text){return cleanText(text).split('\n').map(v=>v.trim()).filter(Boolean)}
function afterLabel(ls,label){const i=ls.findIndex(v=>v===label);return i>=0?(ls[i+1]||''):''}
function yenToMan(v){const s=t(v).replace(/,/g,'');if(!s)return null;if(/億/.test(s)){const m=s.match(/([0-9.]+)億(?:円)?/);return m?Math.round(Number(m[1])*10000):null}const m=s.match(/([0-9.]+)万円?/);if(m)return Number(m[1]);const y=s.match(/([0-9]+)円?/);return y?Number(y[1])/10000:null}
function parseSilk(text){
 const x=cleanText(text),ls=lines(x);
 const top=ls.find(v=>/^\d+[\.．]\s*.+/.test(v))||'';
 const horseNo=top?Number((top.match(/^(\d+)/)||[])[1]):null;
 const name=afterLabel(ls,'募集馬名')||top.replace(/^\d+[\.．]\s*/,'').replace(/募集中.*$/,'').trim();
 const sexColor=afterLabel(ls,'性別 / 毛色')||afterLabel(ls,'性別／毛色');
 const sc=sexColor.split(/[\/／]/).map(v=>v.trim());
 const ageBirth=afterLabel(ls,'年齢 / 生年月日')||afterLabel(ls,'年齢／生年月日');
 const bm=ageBirth.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/);
 const birthDate=bm?`${bm[1]}-${bm[2].padStart(2,'0')}-${bm[3].padStart(2,'0')}`:'';
 const trainerRaw=afterLabel(ls,'厩舎');
 const stableArea=area(trainerRaw);
 const trainer=trainerRaw.replace(/^(美浦|栗東|地方)\s*/,'').trim();
 const farms=afterLabel(ls,'生産 / 育成')||afterLabel(ls,'生産／育成');
 const fp=farms.split(/[\/／]/).map(v=>v.trim());
 const totalShare=afterLabel(ls,'募集総額 / 一口出資額')||afterLabel(ls,'募集総額／一口出資額');
 const tsp=totalShare.split(/[\/／]/).map(v=>v.trim());
 let price=yenToMan(tsp[0]||afterLabel(ls,'総額'));
 let sharePrice=numberFrom(tsp[1]||'',/([0-9,]+)円/) ?? numberFrom(x,/一口\s*\n?\s*([0-9,]+)円/);
 if(price==null)price=yenToMan(afterLabel(ls,'総額'));
 const year=bm?Number(bm[1])+1:new Date().getFullYear();
 const data={year,club:'シルク',horseNo,name,sex:sex(sc[0]),coatColor:sc[1]||'',birthDate,
 sire:afterLabel(ls,'父'),dam:afterLabel(ls,'母'),broodmareSire:afterLabel(ls,'母の父'),stableArea,trainer,
 breeder:fp[0]||'',trainingFarm:fp[1]||'',currentLocation:afterLabel(ls,'在厩場所'),horseClass:afterLabel(ls,'クラス'),
 price,sharePrice,shareCount:(price!=null&&sharePrice)?Math.round(price*10000/sharePrice):null,recruitmentPr:'',sourceUrl:'',measurements:{weight:null,height:null,girth:null,cannon:null}};
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data
}
function detectFormat(text){const x=cleanText(text),silkScore=[/募集馬名/,/性別\s*[\/／]\s*毛色/,/募集総額\s*[\/／]\s*一口出資額/,/在厩場所/,/クラス/].filter(r=>r.test(x)).length,unionScore=[/PEGASUS/i,/ユニオン/,/募集時のPR/,/生産者からのPR/,/測尺/,/馬体重[：:\s]*[0-9.]+\s*kg/].filter(r=>r.test(x)).length;if(silkScore>=2&&silkScore>unionScore)return'silk';if(unionScore>=1&&unionScore>=silkScore)return'union';return''}
async function fetchPageText(url){let lastError;try{const r=await fetch(url,{mode:'cors',credentials:'omit'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const html=await r.text();return new DOMParser().parseFromString(html,'text/html').body?.innerText||html}catch(e){lastError=e}try{const clean=url.replace(/^https?:\/\//,'');const proxy=`https://r.jina.ai/https://${clean}`;const r=await fetch(proxy,{headers:{Accept:'text/plain'}});if(!r.ok)throw new Error(`Reader HTTP ${r.status}`);return await r.text()}catch(e){console.error(lastError,e);throw new Error('ページを取得できませんでした。通信状態または外部取得サービスの制限を確認してください。')}}
function applyImported(d){const fields=['year','club','horseNo','name','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','currentLocation','horseClass','price','shareCount','sharePrice','recruitmentPr','sourceUrl'];fields.forEach(k=>{if(d[k]!==''&&d[k]!=null)$(k).value=d[k]});['weight','height','girth','cannon'].forEach(k=>{if(d.measurements?.[k]!=null)$(k).value=d.measurements[k]})}
function importedCount(d){return[d.horseNo,d.name,d.sire,d.dam,d.trainer,d.breeder,d.trainingFarm,d.price,d.shareCount,d.sharePrice,d.measurements.weight].filter(v=>v!==''&&v!=null).length}
function importFromText(){const text=t(E.pageText?.value);const url=t($('sourceUrl').value);if(!text){setImportStatus('募集ページの本文を貼り付けてください。','error');return}try{let format=E.importFormat?.value||'auto';if(format==='auto')format=detectFormat(text);if(!format)throw new Error('シルク／ユニオン形式を判定できませんでした。形式を選択してください。');const d=format==='silk'?parseSilk(text):parseUnion(text,url);const count=importedCount(d);if(count<5)throw new Error('必要な項目を十分に抽出できませんでした。ページ全体をコピーして貼り付けてください。');applyImported(d);const missing=[];if(!d.name)missing.push('馬名');if(!d.sire)missing.push('父');if(!d.dam)missing.push('母');setImportStatus(`${format==='silk'?'シルク':'ユニオン'}形式として${count}項目を取得しました。${missing.length?' 未取得：'+missing.join('・')+'。':''} 内容を確認して保存してください。`,'ok');toast('貼り付け本文から基本情報を取得しました')}catch(e){console.error(e);setImportStatus(e.message||'本文からの取込に失敗しました。','error')}}
async function importFromUrl(){const url=t($('sourceUrl').value);if(!url){setImportStatus('URLを入力してください。','error');return}let u;try{u=new URL(url)}catch{setImportStatus('URLの形式を確認してください。','error');return}if(!/(^|\.)union-oc\.co\.jp$/i.test(u.hostname)){setImportStatus('ユニオン募集馬ページ専用です。','error');return}E.importUrlBtn.disabled=true;setImportStatus('URL取得を試行しています…');try{const text=await fetchPageText(u.origin+u.pathname+u.search);const d=parseUnion(text,url);const count=importedCount(d);if(count<5)throw new Error('必要な項目を十分に抽出できませんでした。');applyImported(d);setImportStatus(`${count}項目を取得しました。内容を確認して保存してください。`,'ok');toast('ユニオン基本情報を取得しました')}catch(e){console.error(e);setImportStatus('URL取得は端末・通信環境により失敗します。下の「ページ本文から取得」を使用してください。','error')}finally{E.importUrlBtn.disabled=false}}
function exportJ(){const b=new Blob([JSON.stringify({...state,version:V,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`horse-evaluator-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(u);toast('バックアップを書き出しました')}
async function importJ(f){try{if(E.restoreStatus){E.restoreStatus.textContent='JSONを検証しています…';E.restoreStatus.className='muted'}const text=await f.text();let raw;try{raw=JSON.parse(text)}catch{throw new Error('JSONの構文が不正です。ファイルが途中で切れていないか確認してください。')}const m=migrate(raw),report=validateImport(raw,m);localStorage.setItem(PRE_IMPORT_K,JSON.stringify(state));const replace=confirm(`バックアップを検証しました。\n\n元バージョン: ${report.sourceVersion}\n馬データ: ${report.count}頭\n警告: ${report.warnings.length}件\n\n「OK」= 現在のデータを置換\n「キャンセル」= 現在のデータへ追加・更新`);if(replace){state=m}else{const map=new Map(state.horses.map(h=>[h.id,h]));m.horses.forEach(h=>map.set(h.id,h));state={...base(),horses:[...map.values()]}}save();const persisted=JSON.parse(localStorage.getItem(K)||'{}'),roundTrip=migrate(persisted);if(roundTrip.horses.length!==state.horses.length)throw new Error('保存後の再読込検証で件数が一致しませんでした。');state=roundTrip;render();const msg=`${report.count}頭を${replace?'置換復元':'追加・更新'}しました（保存後検証済み）`;if(E.restoreStatus){E.restoreStatus.textContent=msg;E.restoreStatus.className='muted import-status-ok'}toast(msg)}catch(e){console.error(e);const msg=`JSONを読み込めませんでした。${e?.message?' '+e.message:''}`;if(E.restoreStatus){E.restoreStatus.textContent=msg;E.restoreStatus.className='muted import-status-error'}alert(msg)}}
$('newHorseBtn').onclick=openNew;$('closeDialogBtn').onclick=$('cancelBtn').onclick=()=>E.horseDialog.close();$('detailCloseBtn').onclick=()=>E.detailDialog.close();E.importUrlBtn.onclick=importFromUrl;E.importTextBtn.onclick=importFromText;
E.horseForm.onsubmit=e=>{e.preventDefault();const h=readForm(),i=state.horses.findIndex(x=>x.id===h.id);i>=0?state.horses[i]=h:state.horses.push(h);save();E.horseDialog.close();render();toast(i>=0?'更新しました':'登録しました')};
[E.yearFilter,E.clubFilter,E.sexFilter,E.stableAreaFilter,E.sortSelect,E.favoriteOnly].forEach(x=>x.onchange=render);E.searchInput.oninput=render;
E.horseList.onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const h=state.horses.find(x=>x.id===b.dataset.id);if(b.dataset.a==='edit')openEdit(h.id);if(b.dataset.a==='detail')detail(h.id);if(b.dataset.a==='favorite'){h.favorite=!h.favorite;h.updatedAt=new Date().toISOString();save();render()}if(b.dataset.a==='delete'&&confirm(`「${h.name}」を削除しますか？`)){state.horses=state.horses.filter(x=>x.id!==h.id);save();render()}};
$('exportBtn').onclick=exportJ;$('importInput').onchange=e=>{if(e.target.files[0])importJ(e.target.files[0]);e.target.value=''};
$('seedBtn').onclick=()=>{const now=new Date().toISOString();state.horses.push({id:uid(),year:2026,club:'ユニオン',horseNo:14,name:'リフレイムの2025',sex:'牝',birthDate:'2025-03-29',sire:'エピファネイア',dam:'リフレイム',broodmareSire:'アメリカンファラオ',stableArea:'美浦',trainer:'黒岩陽一',breeder:'千里ファーム',trainingFarm:'山口ステーブル',price:8800,shareCount:800,sharePrice:110000,recruitmentPr:'Sprint 1.3動作確認用の募集時PRです。',internalId:'UNION-2026-014',measurements:{weight:436,height:150,girth:172,cannon:20.5},sourceUrl:'https://www.union-oc.co.jp/id/4014#open_PHOTO',photoUrl:'',videoUrl:'',favorite:false,notes:'Sprint 1.2動作確認用',createdAt:now,updatedAt:now,changeLog:[{at:now,action:'サンプル登録'}]});save();render();toast('サンプルを追加しました')};
$('clearBtn').onclick=()=>{if(confirm('全データを削除しますか？')){state=base();save();render()}};render();})();
