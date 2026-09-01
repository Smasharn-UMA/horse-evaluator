
// === AI DATA STRUCTURE v1.8.17 ===
const DEFAULT_AI_DATA = {
 version:"1.0",analysisDate:"",model:"",overallScore:null,
 photoAi:{overall:null,hindquarter:null,explosion:null,shoulder:null,chest:null,back:null,neck:null,bone:null,balance:null,growth:null,summary:""},
 gaitAi:{overall:null,rhythm:null,stride:null,flexibility:null,impulsion:null,stability:null,hindquarter:null,summary:""},
 measurementAi:{score:null,weight:null,height:null,girth:null,cannon:null,growthRate:null,summary:""},
 pedigreeAi:{score:null,sire:null,broodmareSire:null,nick:null,summary:""},
 femaleFamilyAi:{score:null,familyStrength:null,siblings:null,production:null,summary:""},
 trainerAi:{score:null,trainerPerformance:null,twoYearOld:null,strikeRate:null,summary:""},
 breederAi:{score:null,breederPerformance:null,successRate:null,summary:""},
 similarity:{calculated:false,overall:null,topMatches:[]}
};
function ensureAiData(horse){
 if(!horse.ai){
   horse.ai=JSON.parse(JSON.stringify(DEFAULT_AI_DATA));
 }
 return horse;
}
// === END AI DATA STRUCTURE ===

(()=>{'use strict';
const K='horseEvaluator3',V='3.1.45',SCHEMA_VERSION=6,UI_K='horseEvaluator3_ui',PRE_IMPORT_K='horseEvaluator3_preImportBackup',PHOTO_DB='horseEvaluator3_photos',PHOTO_STORE='photos',VIDEO_DB='horseEvaluator3_videos',VIDEO_STORE='videos',$=id=>document.getElementById(id);let state;
const E={yearFilter:$('yearFilter'),clubFilter:$('clubFilter'),sexFilter:$('sexFilter'),stableAreaFilter:$('stableAreaFilter'),searchInput:$('searchInput'),sortSelect:$('sortSelect'),favoriteOnly:$('favoriteOnly'),dataViewFilter:$('dataViewFilter'),dashboard:$('dashboard'),horseList:$('horseList'),resultCount:$('resultCount'),emptyState:$('emptyState'),horseDialog:$('horseDialog'),horseForm:$('horseForm'),detailDialog:$('detailDialog'),detailContent:$('detailContent'),toast:$('toast'),importUrlBtn:$('importUrlBtn'),importStatus:$('importStatus'),importTextBtn:$('importTextBtn'),pageText:$('pageText'),importFormat:$('importFormat'),restoreStatus:$('restoreStatus'),resetFiltersBtn:$('resetFiltersBtn'),carrotCsvInput:$('carrotCsvInput'),carrotCsvStatus:$('carrotCsvStatus')};
const DEFAULT_MODEL={name:'標準モデル',weights:{gait:30,body:25,growth:15,measurement:10,pedigree:10,connections:10},thresholds:{s:90,a:80,b:70}};
const GROUP_LABELS={gait:'歩様',body:'馬体',growth:'成長性',measurement:'測尺',pedigree:'血統・配合',connections:'厩舎・牧場'};
const GROUP_FIELDS={gait:['frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness'],body:['hindquarter','hindShape','chest','shoulder','back','bone','balance'],growth:['growth'],pedigree:['pedigree'],connections:['trainer','farm']};
const EVAL_FIELDS=['hindquarter','hindShape','chest','shoulder','back','bone','balance','growth','frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness','pedigree','trainer','farm'];
const EVAL_IDS={hindquarter:'evHindquarter',hindShape:'evHindShape',chest:'evChest',shoulder:'evShoulder',back:'evBack',bone:'evBone',balance:'evBalance',growth:'evGrowth',frontRange:'evFrontRange',hindStep:'evHindStep',propulsion:'evPropulsion',flexibility:'evFlexibility',stride:'evStride',rhythm:'evRhythm',symmetry:'evSymmetry',lightness:'evLightness',pedigree:'evPedigree',trainer:'evTrainer',farm:'evFarm'};
const PHOTO_AI_FIELDS=['hindquarter','explosion','shoulder','chest','back','neck','bone','balance','growth','overall'];
const PHOTO_AI_IDS={hindquarter:'aiPhotoHindquarter',explosion:'aiPhotoExplosion',shoulder:'aiPhotoShoulder',chest:'aiPhotoChest',back:'aiPhotoBack',neck:'aiPhotoNeck',bone:'aiPhotoBone',balance:'aiPhotoBalance',growth:'aiPhotoGrowth',overall:'aiPhotoOverall'};
const PHOTO_AI_LABELS={hindquarter:'トモ容量',explosion:'トモの爆発力',shoulder:'肩の角度',chest:'胸前',back:'背中・腰',neck:'首差し',bone:'骨量',balance:'全体バランス',growth:'成長期待度',overall:'総合馬体評価'};
let editPhotos=[],editVideos=[],pendingImportedExtras=null;
const GAIT_AI_FIELDS=['frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness','overall'];
const GAIT_AI_IDS={frontRange:'aiGaitFrontRange',hindStep:'aiGaitHindStep',propulsion:'aiGaitPropulsion',flexibility:'aiGaitFlexibility',stride:'aiGaitStride',rhythm:'aiGaitRhythm',symmetry:'aiGaitSymmetry',lightness:'aiGaitLightness',overall:'aiGaitOverall'};
const GAIT_AI_LABELS={frontRange:'前肢の可動域',hindStep:'後肢の踏み込み',propulsion:'推進力',flexibility:'柔軟性',stride:'ストライド',rhythm:'リズム',symmetry:'左右対称性',lightness:'歩様の軽さ',overall:'総合歩様評価'};
const EVAL_LABELS={hindquarter:'トモ容量',hindShape:'トモの形・厚み',chest:'胸前・胸の深さ',shoulder:'肩の構造',back:'背中・腰の連結',bone:'骨量',balance:'全体バランス',growth:'成長余地',frontRange:'前肢の可動域',hindStep:'後肢の踏み込み',propulsion:'推進力',flexibility:'柔軟性',stride:'ストライド',rhythm:'リズム',symmetry:'左右対称性',lightness:'歩様の軽さ',pedigree:'配合評価',trainer:'厩舎評価',farm:'生産・育成評価'};
const TEACHER_DATASET_SCHEMA='horse-evaluator-teacher-dataset-2.0';
const ANALYSIS_LABEL_ORDER=['GⅠ勝利','重賞勝利','重賞出走','オープン','2勝以上','勝ち上がり','未勝利','未出走'];

// === 2026 Body Profile v2 / Important 5 metrics ===
// 馬体解析は競走実績・血統・厩舎・生産育成・価格を参照しない。
// 一覧は重要5項目を簡潔に表示し、詳細では教師データ内の相対位置も示す。
const BODY_PROFILE_THRESHOLDS={standout:4.75,high:4.50,good:4.25,caution:4.00,bottleneck:3.50};
const BODY_PROFILE_GROUPS={
 hind:{label:'後肢の力',fields:['hindquarter','hindShape','hindStep','propulsion']},
 core:{label:'背腰・体幹',fields:['back','balance']},
 front:{label:'肩・前肢',fields:['shoulder','chest','frontRange','stride']},
 motion:{label:'歩様の質',fields:['rhythm','symmetry','flexibility','lightness']},
 growth:{label:'骨格・成長',fields:['bone','growth']}
};
const BODY_PROFILE_ORDER=['hind','core','front','motion','growth'];
const IMPORTANT5=[
 {key:'propulsion',label:'推進力',short:'推進',fields:['propulsion']},
 {key:'coreLink',label:'体幹・連動',short:'体幹',fields:['back','balance']},
 {key:'explosion',label:'トモ爆発力',short:'トモ',fields:['hindShape']},
 {key:'frontMobility',label:'前肢可動',short:'前肢',fields:['shoulder','frontRange','stride']},
 {key:'gaitStability',label:'歩様安定',short:'歩様',fields:['rhythm','symmetry','flexibility','lightness']}
];
function physicalScore(h,key){
 const ev=normalizeEvaluation(h?.evaluation).scores||{},v=scoreValue(ev[key]);if(v!=null)return v;
 const pa=normalizePhotos(h||{}).photoAi?.scores||{},ga=normalizeVideos(h||{}).gaitAi?.scores||{};
 const photoMap={hindquarter:'hindquarter',hindShape:'explosion',chest:'chest',shoulder:'shoulder',back:'back',bone:'bone',balance:'balance',growth:'growth'};
 if(photoMap[key]){const x=scoreValue(pa[photoMap[key]]);if(x!=null)return x}
 return scoreValue(ga[key]);
}
function averagePhysical(h,fields){const a=fields.map(k=>physicalScore(h,k)).filter(v=>v!=null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function important5Values(h){return IMPORTANT5.map(d=>({...d,value:averagePhysical(h,d.fields)}))}
function teacherMetricValues(def){return (state?.horses||[]).filter(x=>x.teacherData?.enabled).map(x=>averagePhysical(x,def.fields)).filter(v=>v!=null).sort((a,b)=>a-b)}
function metricRelative(def,value){if(value==null)return{symbol:'―',label:'未評価',top:null,n:0,key:'missing'};const vals=teacherMetricValues(def);if(vals.length<10)return{symbol:'―',label:'比較不足',top:null,n:vals.length,key:'missing'};const below=vals.filter(v=>v<value).length,equal=vals.filter(v=>v===value).length,percentile=(below+equal*.5)/vals.length,top=Math.max(1,Math.min(99,Math.round((1-percentile)*100)));if(percentile>=.80)return{symbol:'◎',label:'上位水準',top,n:vals.length,key:'standout'};if(percentile>=.60)return{symbol:'↑',label:'平均以上',top,n:vals.length,key:'high'};if(percentile>=.40)return{symbol:'＝',label:'平均水準',top,n:vals.length,key:'good'};if(percentile>=.20)return{symbol:'↓',label:'平均以下',top,n:vals.length,key:'caution'};return{symbol:'⚠',label:'下位水準',top,n:vals.length,key:'bottleneck'}}
function important5Score(h,key){const d=IMPORTANT5.find(x=>x.key===key);return d?averagePhysical(h,d.fields):null}
function bodyBand(v){const t=BODY_PROFILE_THRESHOLDS;if(v==null)return{key:'missing',label:'未評価'};if(v>=t.standout)return{key:'standout',label:'突出'};if(v>=t.high)return{key:'high',label:'高水準'};if(v>=t.good)return{key:'good',label:'良好'};if(v>=t.caution)return{key:'caution',label:'軽度注意'};if(v>=t.bottleneck)return{key:'bottleneck',label:'ボトルネック'};return{key:'weak',label:'強い弱点'}}
function bodyProfile(h){
 const groups=BODY_PROFILE_ORDER.map(key=>{const def=BODY_PROFILE_GROUPS[key],values=def.fields.map(f=>physicalScore(h,f)).filter(v=>v!=null),value=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;return{key,label:def.label,value,count:values.length,total:def.fields.length,band:bodyBand(value)}});
 const valid=groups.filter(g=>g.value!=null),standout=valid.filter(g=>g.value>=BODY_PROFILE_THRESHOLDS.standout),high=valid.filter(g=>g.value>=BODY_PROFILE_THRESHOLDS.high),bottlenecks=valid.filter(g=>g.value<BODY_PROFILE_THRESHOLDS.caution),strongWeak=valid.filter(g=>g.value<BODY_PROFILE_THRESHOLDS.bottleneck),cautions=valid.filter(g=>g.value>=BODY_PROFILE_THRESHOLDS.caution&&g.value<BODY_PROFILE_THRESHOLDS.good);
 const movement=groups.filter(g=>['hind','core','front'].includes(g.key));const movementValid=movement.every(g=>g.value!=null);let linkage={grade:'―',label:'評価不足',key:'missing'};
 if(movementValid){const min=Math.min(...movement.map(g=>g.value));linkage=min>=4.75?{grade:'S',label:'非常に良い',key:'standout'}:min>=4.5?{grade:'A',label:'良い',key:'high'}:min>=4.25?{grade:'B',label:'おおむね良好',key:'good'}:min>=4.0?{grade:'C',label:'一部に注意',key:'caution'}:{grade:'D',label:'弱点あり',key:'bottleneck'}}
 const other=valid.filter(g=>!bottlenecks.some(b=>b.key===g.key));let compensation='―';if(bottlenecks.length===0)compensation='不要';else if(bottlenecks.length===1&&other.length>=3&&other.filter(g=>g.value>=4.75).length>=3)compensation='非常に高い';else if(bottlenecks.length===1&&other.filter(g=>g.value>=4.5).length>=3)compensation='あり';else compensation='限定的';
 const m=h?.measurements||{},measurementCount=['weight','height','girth','cannon'].filter(k=>m[k]!=null&&m[k]!=='').length;
 return{groups,validCount:valid.length,standoutCount:standout.length,highCount:high.length,bottlenecks,strongWeak,cautions,linkage,compensation,measurementCount,measurements:m,compound:bottlenecks.length>=2,posteriorGrowth:bottlenecks.some(g=>g.key==='hind')&&bottlenecks.some(g=>g.key==='growth')};
}
function important5Mini(h){const vals=important5Values(h);if(vals.filter(x=>x.value!=null).length<2)return'';return`<div class="important5-mini">${vals.map(x=>{const r=metricRelative(x,x.value);return`<div class="i5 i5-${r.key}" title="${esc(x.label)} ${x.value==null?'未評価':x.value.toFixed(2)} ${esc(r.label)}"><span>${esc(x.short)}</span><b>${r.symbol}</b></div>`}).join('')}</div>`}
function bodyProfileMini(h){const p=bodyProfile(h);if(p.validCount<3)return'';const weak=p.bottlenecks.length?`弱点 ${p.bottlenecks.map(x=>x.label).join('・')}`:'弱点なし';return`<div class="body-profile-mini ${p.bottlenecks.length?'has-weak':'no-weak'}"><div class="body-mini-title"><b>馬体・歩様</b><span class="body-mini-linkage">全身連動 ${esc(p.linkage.grade)} ${esc(p.linkage.label)}</span></div>${important5Mini(h)}<div class="body-mini-weak">${esc(weak)}</div></div>`}
function bodyProfileHtml(h){const p=bodyProfile(h);if(!p.validCount)return'';const vals=important5Values(h);const i5=vals.map(x=>{const r=metricRelative(x,x.value);return`<div class="important5-detail i5-${r.key}"><div><b>${esc(x.label)}</b><small>${r.top==null?esc(r.label):`教師データ ${r.n}頭中・上位${r.top}%`}</small></div><strong>${x.value==null?'―':x.value.toFixed(2)}</strong><span class="i5-symbol">${r.symbol}</span></div>`}).join('');const rows=p.groups.map(g=>`<div class="body-domain body-band-${g.band.key}"><div><b>${esc(g.label)}</b><small>${g.count}/${g.total}項目</small></div><strong>${g.value==null?'―':g.value.toFixed(2)}</strong><span>${g.band.label}</span></div>`).join('');const bottleneck=p.bottlenecks.length?p.bottlenecks.map(g=>g.label).join('・'):'なし';const m=p.measurements||{};const measure=`${m.weight==null?'―':m.weight+'kg'} / ${m.height==null?'―':m.height+'cm'} / ${m.girth==null?'―':m.girth+'cm'} / ${m.cannon==null?'―':m.cannon+'cm'}`;return`<section class="body-profile-card"><div class="body-profile-head"><div><div class="eyebrow">Physical Analysis 2026</div><h3>馬体・歩様総合評価</h3><p>写真・歩様・測尺のみで評価。価格・血統・厩舎・競走実績は身体評価に使用しません。</p></div><div class="linkage-grade body-band-${p.linkage.key}"><strong>${p.linkage.grade}</strong><span>全身連動</span></div></div><h4 class="i5-heading">重要5項目 <small>教師データ内の相対位置</small></h4><div class="important5-detail-grid">${i5}</div><div class="body-plain-summary"><b>強み：</b>${vals.filter(x=>metricRelative(x,x.value).symbol==='◎').map(x=>x.label).join('・')||'突出した項目なし'}　 <b>弱点：</b>${esc(bottleneck)}</div><details class="body-research"><summary>5領域・研究用数値を表示</summary><div class="body-domain-grid">${rows}</div><div class="body-profile-summary"><div><span>突出領域</span><b>${p.standoutCount}/5</b></div><div><span>高水準領域</span><b>${p.highCount}/5</b></div><div><span>補償力</span><b>${esc(p.compensation)}</b></div></div></details><div class="body-profile-notes"><p><b>全身のつながり：${esc(p.linkage.grade)} ${esc(p.linkage.label)}</b></p><p><b>測尺 ${p.measurementCount}/4</b>：${esc(measure)}</p></div><p class="body-profile-rule">記号：◎ 上位水準 / ↑ 平均以上 / ＝ 平均水準 / ↓ 平均以下 / ⚠ 下位水準。詳細の「上位○%」は重賞勝利確率ではなく、登録教師データ内での身体評価の相対位置です。</p></section>`}
// === END 2026 Body Profile v2 ===

function scoreValue(v){const x=Number(v);return Number.isFinite(x)&&x>=1&&x<=5?x:null}
function normalizeEvaluation(e={}){const scores={};EVAL_FIELDS.forEach(k=>scores[k]=scoreValue(e?.scores?.[k]??e?.[k]));return{scores,achievement:t(e.achievement),distanceCategory:t(e.distanceCategory),healthRisk:scoreValue(e.healthRisk),comment:t(e.comment)}}
function classAchievement(h){
 const raw=t(h?.currentStatus?.className||h?.horseClass).replace(/\s+/g,'');
 const wins=Number(h?.currentStatus?.wins);
 const starts=Number(h?.currentStatus?.starts);
 if(/G[ⅠI1]|GI|G1|G[ⅡI2]|GII|G2|G[ⅢI3]|GIII|G3|重賞/.test(raw))return'オープン';
 if(/オープン|\bOP\b/i.test(raw))return'オープン';
 if(/3勝クラス|1600万|準オープン/.test(raw))return'2勝以上';
 if(/2勝クラス|1000万/.test(raw))return'2勝以上';
 if(/1勝クラス|500万/.test(raw))return'勝ち上がり';
 if(/未勝利/.test(raw))return'未勝利';
 if(/新馬/.test(raw))return Number.isFinite(starts)&&starts>0?'未勝利':'未出走';
 if(Number.isFinite(wins)&&wins>=2)return'2勝以上';
 if(Number.isFinite(wins)&&wins===1)return'勝ち上がり';
 if(Number.isFinite(starts)&&starts>0&&(!Number.isFinite(wins)||wins===0))return'未勝利';
 return'';
}
function resolvedTeacherAchievement(h){
 const td=h?.teacherData||{};
 if(td.g1Winner)return'GⅠ勝利';
 if(td.gradedWinner)return'重賞勝利';
 const byClass=classAchievement(h);
 if(byClass)return byClass;
 return t(h?.evaluation?.achievement);
}
function evaluationAverage(e){const vals=EVAL_FIELDS.map(k=>scoreValue(e?.scores?.[k])).filter(v=>v!=null);return vals.length?{average:vals.reduce((a,b)=>a+b,0)/vals.length,count:vals.length}:{average:null,count:0}}
function measurementScore(h){const m=h.measurements||{},vals=[];if(m.weight!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.weight)-430)/40)));if(m.height!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.height)-153)/5)));if(m.girth!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.girth)-175)/8)));if(m.cannon!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.cannon)-20)/1.5)));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}
function groupAverage(h,group){if(group==='measurement')return measurementScore(h);const ev=normalizeEvaluation(h.evaluation),vals=(GROUP_FIELDS[group]||[]).map(k=>scoreValue(ev.scores[k])).filter(v=>v!=null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}
function weightedScore(h){const model=normalizeModel(state?.modelSettings),parts=[];Object.entries(model.weights).forEach(([g,w])=>{const a=groupAverage(h,g);if(a!=null&&w>0)parts.push({g,w,a})});const used=parts.reduce((s,p)=>s+p.w,0);if(!used)return{score:null,coverage:0};const score=parts.reduce((s,p)=>s+p.a*p.w,0)/used*20;const total=Object.values(model.weights).reduce((a,b)=>a+Number(b||0),0)||100;return{score,coverage:Math.round(used/total*100)}}
function scoreBreakdown(h){const model=normalizeModel(state?.modelSettings),rows=[];let usedWeight=0,rawTotal=0;Object.entries(model.weights).forEach(([group,weightRaw])=>{const weight=Number(weightRaw||0),average=groupAverage(h,group),fields=group==='measurement'?[]:(GROUP_FIELDS[group]||[]);const items=fields.map(k=>({key:k,label:EVAL_LABELS[k],score:scoreValue(normalizeEvaluation(h.evaluation).scores[k])}));if(average!=null&&weight>0){usedWeight+=weight;rawTotal+=average/5*weight}rows.push({group,label:GROUP_LABELS[group]||group,weight,average,points:average==null?null:average/5*weight,items})});const adjustedTotal=usedWeight?rawTotal/usedWeight*100:null;return{rows,rawTotal,usedWeight,adjustedTotal,totalWeight:Object.values(model.weights).reduce((a,b)=>a+Number(b||0),0)||100}}
function groupCompletion(h,group){if(group==='measurement'){const m=h.measurements||{},vals=['weight','height','girth','cannon'];return vals.filter(k=>m[k]!=null&&m[k]!=='').length/vals.length}const ev=normalizeEvaluation(h.evaluation),fields=GROUP_FIELDS[group]||[];if(!fields.length)return 0;return fields.filter(k=>scoreValue(ev.scores[k])!=null).length/fields.length}
function confidenceScore(h){const model=normalizeModel(state?.modelSettings),total=Object.values(model.weights).reduce((a,b)=>a+Number(b||0),0)||100;let weightedFields=0,coveredWeight=0;Object.entries(model.weights).forEach(([g,w])=>{if(w<=0)return;const c=groupCompletion(h,g);weightedFields+=w*c;if(c>0)coveredWeight+=w});const fieldCoverage=weightedFields/total*100,groupCoverage=coveredWeight/total*100;return Math.round(fieldCoverage*.7+groupCoverage*.3)}
function recommendation(h){const q=weightedScore(h);if(q.score==null)return{grade:'―',score:null,confidence:confidenceScore(h),className:'grade-none'};const th=normalizeModel(state?.modelSettings).thresholds;const grade=q.score>=th.s?'S':q.score>=th.a?'A':q.score>=th.b?'B':'C';return{grade,score:q.score,confidence:confidenceScore(h),className:'grade-'+grade.toLowerCase()}}
function stars(v){const x=Math.max(0,Math.min(5,Math.round(Number(v)||0)));return '★'.repeat(x)+'☆'.repeat(5-x)}
function averageSimilarity(pairs){const vals=pairs.filter(([a,b])=>a!=null&&b!=null).map(([a,b])=>Math.max(0,1-Math.abs(Number(a)-Number(b))/4));return vals.length?{value:vals.reduce((x,y)=>x+y,0)/vals.length,count:vals.length}:null}
function measurementSimilarity(a,b){const am=a.measurements||{},bm=b.measurements||{},scales={weight:80,height:10,girth:15,cannon:2.5},vals=[];Object.keys(scales).forEach(k=>{if(am[k]!=null&&bm[k]!=null){vals.push(Math.max(0,1-Math.abs(Number(am[k])-Number(bm[k]))/scales[k]))}});return vals.length?{value:vals.reduce((x,y)=>x+y,0)/vals.length,count:vals.length}:null}
function horseSimilarity(target,candidate){
 const te=normalizeEvaluation(target.evaluation).scores,ce=normalizeEvaluation(candidate.evaluation).scores;
 const tp=normalizePhotos(target).photoAi.scores,cp=normalizePhotos(candidate).photoAi.scores;
 const tg=normalizeVideos(target).gaitAi.scores,cg=normalizeVideos(candidate).gaitAi.scores;
 const categories=[];
 const add=(key,label,weight,result)=>{if(result&&result.count)categories.push({key,label,weight,value:result.value,count:result.count})};
 add('gait','歩様',30,averageSimilarity(GAIT_AI_FIELDS.map(k=>[tg[k]??te[k],cg[k]??ce[k]])));
 add('body','馬体',25,averageSimilarity(PHOTO_AI_FIELDS.filter(k=>k!=='growth').map(k=>[tp[k]??te[k],cp[k]??ce[k]])));
 add('growth','成長性',10,averageSimilarity([[tp.growth??te.growth,cp.growth??ce.growth]]));
 add('measurement','測尺',15,measurementSimilarity(target,candidate));
 add('pedigree','血統・配合',10,averageSimilarity([[te.pedigree,ce.pedigree]]));
 add('connections','厩舎・牧場',10,averageSimilarity([[te.trainer,ce.trainer],[te.farm,ce.farm]]));
 const used=categories.reduce((s,x)=>s+x.weight,0);if(used<35||categories.length<2)return null;
 let score=categories.reduce((s,x)=>s+x.value*x.weight,0)/used;
 const exact=[];
 if(target.sire&&candidate.sire&&target.sire===candidate.sire)exact.push('父');
 if(target.broodmareSire&&candidate.broodmareSire&&target.broodmareSire===candidate.broodmareSire)exact.push('母父');
 if(target.trainer&&candidate.trainer&&target.trainer===candidate.trainer)exact.push('厩舎');
 if(target.breeder&&candidate.breeder&&target.breeder===candidate.breeder)exact.push('生産牧場');
 if(exact.length)score=Math.min(1,score+Math.min(.04,exact.length*.01));
 const ranked=categories.slice().sort((a,b)=>b.value-a.value);
 const reasons=ranked.filter(x=>x.value>=.75).slice(0,3).map(x=>`${x.label} ${Math.round(x.value*100)}%`);
 exact.slice(0,2).forEach(x=>reasons.push(`${x}一致`));
 return{horseId:candidate.id,horseName:candidate.name,score:Math.round(score*1000)/10,coverage:used,categories,reason:reasons.slice(0,4).join('・')||'入力済み項目の総合比較'};
}
function horseYearValue(h){const y=Number(h?.year);return Number.isFinite(y)?y:null}
function similarHorseCandidates(h){return(state?.horses||[]).filter(candidate=>candidate.id!==h.id&&candidate.teacherData?.enabled&&!candidate.management?.comparisonExcluded)}
function similarHorseMatches(h,limit=5){return similarHorseCandidates(h).map(x=>horseSimilarity(h,x)).filter(Boolean).sort((a,b)=>b.score-a.score||b.coverage-a.coverage).slice(0,limit)}
function similarityHtml(h){
 const candidates=similarHorseCandidates(h),matches=similarHorseMatches(h);
 const scope='教師データ';
 if(!matches.length){
   const message=candidates.length?'教師データ候補はありますが、共通する評価項目が不足しています。対象馬と教師データの評価シートを入力してください。':'教師データがまだ登録されていません。馬の編集画面から「教師データとして使用」を設定してください。';
   return`<section class="similarity-card"><div class="similarity-head"><div><h3>類似馬エンジン</h3><p>${esc(scope)}だけを比較</p></div><span class="similarity-badge">比較待ち</span></div><p class="similarity-empty">${esc(message)}</p></section>`;
 }
 return`<section class="similarity-card"><div class="similarity-head"><div><h3>類似馬エンジン</h3><p>${esc(scope)}の入力済み評価・測尺を数値比較</p></div><span class="similarity-badge">上位${matches.length}頭</span></div><div class="similarity-list">${matches.map((m,i)=>`<button type="button" class="similarity-row" data-similar-id="${esc(m.horseId)}"><span class="similarity-rank">${i+1}</span><span class="similarity-main"><b>${esc(m.horseName)}</b><small>${esc(m.reason)}／比較配点 ${m.coverage}%</small></span><strong>${m.score.toFixed(1)}<small>%</small></strong></button>`).join('')}</div><p class="similarity-note">教師データに設定された馬だけを比較し、「比較対象外」の馬は除外しています。類似度は競走能力や活躍を保証するものではなく、登録済みデータ間の形態的・評価上の近さを示します。</p></section>`;
}
function investmentJudgment(h){
 const r=recommendation(h),ev=normalizeEvaluation(h.evaluation),entries=EVAL_FIELDS.map(k=>({key:k,label:EVAL_LABELS[k],score:scoreValue(ev.scores[k])})).filter(x=>x.score!=null);
 if(r.score==null)return{summary:'評価シートを入力すると、出資判断の根拠を自動生成します。',strengths:[],risks:[],reason:'現時点では判断材料が不足しています。',skipReason:'',stance:'評価待ち'};
 const strengths=entries.filter(x=>x.score>=4).sort((a,b)=>b.score-a.score||EVAL_FIELDS.indexOf(a.key)-EVAL_FIELDS.indexOf(b.key)).slice(0,4);
 const risks=entries.filter(x=>x.score<=2).sort((a,b)=>a.score-b.score||EVAL_FIELDS.indexOf(a.key)-EVAL_FIELDS.indexOf(b.key)).slice(0,4);
 if(ev.healthRisk>=4)risks.push({key:'healthRisk',label:'体質リスク',score:6-ev.healthRisk,note:`リスク評価 ${ev.healthRisk} / 5`});
 if(h.sharePrice!=null&&h.sharePrice>=150000)risks.push({key:'sharePrice',label:'一口価格',score:null,note:`${money(h.sharePrice)}円の高額募集`});
 const groupScores=Object.keys(GROUP_LABELS).map(g=>({g,label:GROUP_LABELS[g],score:groupAverage(h,g)})).filter(x=>x.score!=null).sort((a,b)=>b.score-a.score);
 const top=groupScores.slice(0,2).map(x=>x.label),low=groupScores.filter(x=>x.score<3).slice(-2).map(x=>x.label);
 const stance=r.grade==='S'?'最上位の出資候補':r.grade==='A'?'有力な出資候補':r.grade==='B'?'比較検討候補':'見送り寄り';
 let summary=`${stance}です。`;
 if(top.length)summary+=`${top.join('・')}が相対的な強みです。`;
 if(risks.length)summary+=`一方、${risks.slice(0,2).map(x=>x.label).join('・')}は確認が必要です。`;
 else summary+='大きな減点項目は現時点で見当たりません。';
 summary+=`入力充足に基づく自信度は${r.confidence}%です。`;
 const strengthText=strengths.length?strengths.slice(0,3).map(x=>x.label).join('・'):'突出項目は未確定';
 const riskText=risks.length?risks.slice(0,3).map(x=>x.label).join('・'):'明確な低評価項目なし';
 const reason=(r.grade==='S'||r.grade==='A')?`${strengthText}を中心に総合評価が高く、${r.grade==='S'?'優先順位を上げて検討できる水準':'出資候補として残せる水準'}です。最終判断では募集価格と体質面を確認してください。`:`${strengthText}は評価できますが、総合点は${r.score.toFixed(1)}点です。${riskText}を許容できるかを比較対象と照合してください。`;
 const skipReason=(r.grade==='C')?`${riskText}が減点要因です。現状の入力では、他馬を優先する判断が妥当です。`:(r.grade==='B'&&risks.length?`${riskText}が改善・許容できない場合は見送り候補です。`:'');
 return{summary,strengths,risks,reason,skipReason,stance};
}
function judgmentHtml(h){const r=recommendation(h),j=investmentJudgment(h);if(r.score==null)return`<section class="judgment-card judgment-empty"><div class="judgment-title"><span>出資判断カルテ</span><strong>評価待ち</strong></div><p>${esc(j.summary)}</p></section>`;const strengthHtml=j.strengths.length?j.strengths.map(x=>`<li><span>${esc(x.label)}</span><b>${stars(x.score)} <small>${x.score}/5</small></b></li>`).join(''):'<li class="judgment-none">4点以上の項目はまだありません。</li>';const riskHtml=j.risks.length?j.risks.map(x=>`<li><span>${esc(x.label)}</span><b>${x.note?esc(x.note):stars(x.score)+' '+x.score+'/5'}</b></li>`).join(''):'<li class="judgment-none">明確な低評価・高リスク項目はありません。</li>';return`<section class="judgment-card"><div class="judgment-title"><div><span>出資判断カルテ</span><h3>${esc(j.stance)}</h3></div><div class="recommend-badge large ${r.className}">${r.grade}</div></div><div class="judgment-kpis"><div><span>総合点</span><strong>${r.score.toFixed(1)}<small>/100</small></strong></div><div><span>自信度</span><strong>${r.confidence}<small>%</small></strong></div><div><span>推奨度</span><strong>${r.grade}</strong></div></div><div class="ai-summary"><span>AI総括（入力評価から自動生成）</span><p>${esc(j.summary)}</p></div><div class="judgment-columns"><section><h4>◎ 強み</h4><ul class="judgment-list strengths">${strengthHtml}</ul></section><section><h4>△ 気になる点</h4><ul class="judgment-list risks">${riskHtml}</ul></section></div><section class="reason-box"><h4>${r.grade==='C'?'判断理由':'出資推奨理由'}</h4><p>${esc(j.reason)}</p></section>${j.skipReason?`<section class="reason-box skip"><h4>見送り理由</h4><p>${esc(j.skipReason)}</p></section>`:''}</section>`}

function scoreOptions(){return '<option value="">未評価</option>'+[1,2,3,4,5].map(v=>`<option value="${v}">${v}</option>`).join('')}
function initEvaluationControls(){EVAL_FIELDS.forEach(k=>{const el=$(EVAL_IDS[k]);if(el)el.innerHTML=scoreOptions()});PHOTO_AI_FIELDS.forEach(k=>{const el=$(PHOTO_AI_IDS[k]);if(el)el.innerHTML=scoreOptions()});GAIT_AI_FIELDS.forEach(k=>{const el=$(GAIT_AI_IDS[k]);if(el)el.innerHTML=scoreOptions()})}

function normalizeModel(m={}){const w=m.weights||{},q=m.thresholds||{};return{name:t(m.name)||DEFAULT_MODEL.name,weights:{gait:Number(w.gait??30),body:Number(w.body??25),growth:Number(w.growth??15),measurement:Number(w.measurement??10),pedigree:Number(w.pedigree??10),connections:Number(w.connections??10)},thresholds:{s:Number(q.s??90),a:Number(q.a??80),b:Number(q.b??70)}}}
function normalizePhotoAi(x={}){const scores={};PHOTO_AI_FIELDS.forEach(k=>scores[k]=scoreValue(x?.scores?.[k]??x?.[k]));return{scores,summary:t(x.summary),updatedAt:t(x.updatedAt)}}
function normalizePhotos(h={}){const src=Array.isArray(h.photos)?h.photos:[];const photos=src.map((x,i)=>typeof x==='string'?{id:uid(),src:x,type:x.startsWith('data:')?'file':'url',createdAt:new Date().toISOString()}:{id:t(x?.id)||uid(),src:t(x?.src||x?.url||x?.dataUrl),dbKey:t(x?.dbKey),type:t(x?.type)||(t(x?.src).startsWith('data:')?'file':'url'),createdAt:t(x?.createdAt)||new Date().toISOString()}).filter(x=>x.src||x.dbKey);if(!photos.length&&t(h.photoUrl))photos.push({id:uid(),src:t(h.photoUrl),type:'url',createdAt:new Date().toISOString()});let main=t(h.mainPhotoId);if(!photos.some(x=>x.id===main))main=photos[0]?.id||'';return{photos,mainPhotoId:main,photoComment:t(h.photoComment),photoAi:normalizePhotoAi(h.photoAi)}}

function normalizeGaitAi(x={}){const scores={};GAIT_AI_FIELDS.forEach(k=>scores[k]=scoreValue(x?.scores?.[k]??x?.[k]));return{scores,summary:t(x.summary),updatedAt:t(x.updatedAt)}}
function normalizeVideos(h={}){const src=Array.isArray(h.videos)?h.videos:[];let videos=src.map(x=>typeof x==='string'?{id:uid(),url:t(x),type:'url',label:'歩様動画',createdAt:new Date().toISOString()}:{id:t(x?.id)||uid(),url:t(x?.url),src:t(x?.src),dbKey:t(x?.dbKey),type:t(x?.type)||(x?.dbKey?'file':'url'),name:t(x?.name),mimeType:t(x?.mimeType),size:Number(x?.size)||0,label:t(x?.label)||'歩様動画',createdAt:t(x?.createdAt)||new Date().toISOString()}).filter(x=>x.url||x.src||x.dbKey);if(!videos.length&&t(h.videoUrl))videos=[{id:uid(),url:t(h.videoUrl),type:'url',label:'歩様動画',createdAt:new Date().toISOString()}];videos=videos.slice(0,1);return{videos,gaitComment:t(h.gaitComment),gaitAi:normalizeGaitAi(h.gaitAi)}}
function videoHref(v){return t(v?.src||v?.url)}
function renderVideoEditor(){const box=$('videoEditorList');if(!box)return;const v=editVideos[0];$('videoCount').textContent=v?(v.type==='file'?'添付済み':'URL登録済み'):'未登録';if(!v){box.innerHTML='<div class="photo-empty">歩様動画はまだ登録されていません。</div>';return}const href=videoHref(v),label=v.type==='file'?(v.name||'添付動画'):'動画URL',meta=v.type==='file'?`${v.mimeType||'動画'}${v.size?`・${(v.size/1024/1024).toFixed(1)}MB`:''}`:v.url;box.innerHTML=`<div class="video-edit-row"><div><b>${esc(label)}</b>${href?`<a href="${esc(href)}" target="_blank" rel="noopener">再生・確認</a>`:''}<small>${esc(meta)}</small></div><button type="button" data-video-delete="${v.id}" class="danger">削除</button></div>`}
function gaitAiHtml(h){const vm=normalizeVideos(h),ai=vm.gaitAi,rows=GAIT_AI_FIELDS.filter(k=>ai.scores[k]!=null).map(k=>`<div><span>${GAIT_AI_LABELS[k]}</span><b>${stars(ai.scores[k])} ${ai.scores[k]}/5</b></div>`).join(''),v=vm.videos[0],href=videoHref(v);if(!v&&!vm.gaitComment&&!rows&&!ai.summary)return'';const media=v?(v.type==='file'&&href?`<video class="detail-video" controls playsinline preload="metadata" src="${esc(href)}"></video>`:href?`<div class="video-links"><a href="${esc(href)}" target="_blank" rel="noopener">歩様動画を開く</a></div>`:'<div class="photo-empty">添付動画はこの端末にありません。</div>'):'';return`<section class="photo-ai-detail"><h3>歩様動画・AI歩様評価</h3>${media}${vm.gaitComment?`<div class="notes"><b>歩様コメント</b>
${esc(vm.gaitComment)}</div>`:''}${rows?`<div class="photo-ai-score-grid">${rows}</div>`:''}${ai.summary?`<div class="ai-summary"><span>AI歩様総括</span><p>${esc(ai.summary)}</p></div>`:''}</section>`}
function normalizeJsonText(raw){return String(raw??'').replace(/[“”„‟]/g,'"').replace(/[‘’‚‛]/g,"'").replace(/\u00a0/g,' ').replace(/^\s*```(?:json|horse-evaluator)?\s*/i,'').replace(/\s*```\s*$/,'').trim()}
function extractJsonObject(raw){const text=normalizeJsonText(raw);if(!text)throw new Error('貼り付け内容が空です。');const candidates=[];const fenced=/```(?:json|horse-evaluator)?\s*([\s\S]*?)```/gi;let m;while((m=fenced.exec(text)))candidates.push(normalizeJsonText(m[1]));candidates.push(text);for(const candidate of candidates){try{return JSON.parse(candidate)}catch{}let depth=0,start=-1,inString=false,escape=false;for(let i=0;i<candidate.length;i++){const ch=candidate[i];if(inString){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')inString=false;continue}if(ch==='"'){inString=true;continue}if(ch==='{'){if(depth===0)start=i;depth++}else if(ch==='}'&&depth>0){depth--;if(depth===0&&start>=0){const fragment=candidate.slice(start,i+1);try{return JSON.parse(fragment)}catch{start=-1}}}}}throw new Error('回答内から有効なJSONオブジェクトを抽出できませんでした。')}
function clearAiImportInputs(){['aiPhotoJson','aiGaitJson','fullAiJson'].forEach(id=>{const el=$(id);if(el)el.value=''})}
function transferGaitScoresToEvaluation(sourceScores=null){
  const keys=['frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness'];
  let count=0;
  const missing=[];
  keys.forEach(k=>{
    const sourceEl=document.getElementById(GAIT_AI_IDS[k]);
    const targetEl=document.getElementById(EVAL_IDS[k]);
    const raw=sourceScores?(sourceScores[k]??sourceScores.scores?.[k]):(sourceEl?sourceEl.value:null);
    const value=scoreValue(raw);
    if(!targetEl){missing.push(EVAL_IDS[k]);return}
    if(value==null)return;
    targetEl.value=String(value);
    targetEl.dispatchEvent(new Event('input',{bubbles:true}));
    targetEl.dispatchEvent(new Event('change',{bubbles:true}));
    count++;
  });
  if(missing.length)console.error('歩様評価シートの転記先が見つかりません:',missing);
  return count;
}
function applyGaitAiJson(){try{const x=extractJsonObject($('aiGaitJson').value);GAIT_AI_FIELDS.forEach(k=>{const v=x[k]??x.scores?.[k];if(v!=null){const el=$(GAIT_AI_IDS[k]);if(el)el.value=scoreValue(v)??''}});if(x.summary!=null)$('aiGaitSummary').value=t(x.summary);const count=transferGaitScoresToEvaluation(x);$('aiGaitJson').value='';toast(count?`AI歩様評価を反映し、評価シートへ${count}項目転記しました`:'AI歩様評価を反映しました')}catch(e){console.error(e);alert('AI歩様評価JSONの形式が正しくありません。')}}
function applyGaitToEvaluation(){const count=transferGaitScoresToEvaluation();if(!count){alert('転記できる歩様評価がありません。先にAI歩様評価JSONを反映するか、歩様評価を入力してください。');return}toast(`歩様評価シートへ${count}項目転記しました`)}
function copyGaitAiTemplate(){const payload={horse:t($('name').value)||'募集馬',instruction:'添付した歩様動画を解析し、JSONのみ返してください。',scale:'1=低い、3=標準、5=非常に高い',fields:GAIT_AI_LABELS,output:Object.fromEntries([...GAIT_AI_FIELDS.map(k=>[k,null]),['summary','']])};navigator.clipboard?.writeText(JSON.stringify(payload,null,2)).then(()=>toast('動画AIテンプレートをコピーしました')).catch(()=>alert(JSON.stringify(payload,null,2)))}
function fullAiTemplate(){return{schema:'horse-evaluator-ai-1',horse:{name:t($('name').value),club:$('club').value,horseNo:n($('horseNo').value),sex:$('sex').value,birthDate:$('birthDate').value,sire:t($('sire').value),dam:t($('dam').value),broodmareSire:t($('broodmareSire').value),trainer:t($('trainer').value),breeder:t($('breeder').value)},measurements:{weight:n($('weight').value),height:n($('height').value),girth:n($('girth').value),cannon:n($('cannon').value)},photoAi:{...Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,null])),summary:''},gaitAi:{...Object.fromEntries(GAIT_AI_FIELDS.map(k=>[k,null])),summary:''},evaluation:{scores:Object.fromEntries(EVAL_FIELDS.map(k=>[k,null])),healthRisk:null,comment:''}}}
function copyFullAiTemplate(){const x=fullAiTemplate();x.instruction='写真・歩様動画・測尺を解析し、このJSON構造を維持して値を入力し、JSONのみ返してください。';navigator.clipboard?.writeText(JSON.stringify(x,null,2)).then(()=>toast('統合AIテンプレートをコピーしました')).catch(()=>alert(JSON.stringify(x,null,2)))}
function applyFullAiJson(){try{const x=extractJsonObject($('fullAiJson').value),h=x.horse||x.profile||{},editingId=t($('horseId').value),currentName=t($('name').value),jsonName=t(h.name);if(editingId&&jsonName&&currentName&&jsonName!==currentName&&!confirm(`JSONの馬名「${jsonName}」は編集中の「${currentName}」と一致しません。\nAI評価だけをこの馬へ反映しますか？`))return;if(!editingId){const fields=['name','club','horseNo','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','price','shareCount','sharePrice','sourceUrl'];fields.forEach(k=>{if(h[k]!=null&&$(k))$(k).value=h[k]})}Object.entries(x.measurements||{}).forEach(([k,v])=>{if(['weight','height','girth','cannon'].includes(k)&&v!=null)$(k).value=v});const pa=x.photoAi||{};PHOTO_AI_FIELDS.forEach(k=>{const v=pa[k]??pa.scores?.[k];if(v!=null)$(PHOTO_AI_IDS[k]).value=scoreValue(v)??''});if(pa.summary!=null)$('aiPhotoSummary').value=t(pa.summary);const ga=x.gaitAi||x.videoAi||{};GAIT_AI_FIELDS.forEach(k=>{const v=ga[k]??ga.scores?.[k];if(v!=null)$(GAIT_AI_IDS[k]).value=scoreValue(v)??''});if(ga.summary!=null)$('aiGaitSummary').value=t(ga.summary);const gaitTransferred=transferGaitScoresToEvaluation(ga);const ev=x.evaluation||{};EVAL_FIELDS.forEach(k=>{const v=ev[k]??ev.scores?.[k];if(v!=null)$(EVAL_IDS[k]).value=scoreValue(v)??''});if(ev.healthRisk!=null)$('healthRisk').value=scoreValue(ev.healthRisk)??'';if(ev.comment!=null)$('evaluationComment').value=t(ev.comment);$('fullAiJson').value='';toast(gaitTransferred?`ChatGPT統合JSONを反映し、歩様評価シートへ${gaitTransferred}項目転記しました`:'ChatGPT統合JSONを反映しました')}catch(e){console.error(e);alert('統合JSONの形式が正しくありません。')}}

function mainPhoto(h){const p=normalizePhotos(h);return p.photos.find(x=>x.id===p.mainPhotoId)?.src||p.photos[0]?.src||t(h.photoUrl)}
function base(){return{version:V,schemaVersion:SCHEMA_VERSION,app:'Horse Evaluator',modelSettings:normalizeModel(DEFAULT_MODEL),analysisMeta:{datasetSchema:TEACHER_DATASET_SCHEMA,lastAnalyzedAt:'',lastTeacherCount:0},horses:[],updatedAt:new Date().toISOString()}}
function uid(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():'h-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
function teacherCompleteness(h){const td=h.teacherData||{},checks=[Boolean(td.enabled),Boolean(td.rank),td.finalRating!=null,td.satisfaction!=null,Boolean(t(td.retrospective)),Boolean(t(td.comment)),(h.management?.tags||[]).length>0,Boolean(resolvedTeacherAchievement(h)),Boolean(mainPhoto(h)),Boolean((normalizeVideos(h).videos||[]).length||h.videoUrl),Object.values(h.measurements||{}).some(v=>v!=null&&v!=='')];const done=checks.filter(Boolean).length;return{done,total:checks.length,percent:Math.round(done/checks.length*100)}}
function t(v){return(v??'').toString().trim()} function n(v){return v===''||v==null?null:Number(v)}
function esc(v){return t(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmt(d){return d?new Intl.DateTimeFormat('ja-JP',{dateStyle:'medium',timeStyle:'short'}).format(new Date(d)):'―'}
function money(v){return v==null?'―':new Intl.NumberFormat('ja-JP').format(v)}
function internalId(clubName,year,horseNo,fallback){const c=clubName==='ユニオン'?'UNION':clubName==='キャロット'?'CARROT':clubName==='シルク'?'SILK':'OTHER';const no=horseNo==null?t(fallback).slice(-6):String(horseNo).padStart(3,'0');return `${c}-${year}-${no}`}
function openPhotoDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(PHOTO_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE))db.createObjectStore(PHOTO_STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('写真保存領域を開けませんでした。'))})}
async function photoDbPut(id,data){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put({id,data,updatedAt:new Date().toISOString()});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error||new Error('写真を保存できませんでした。'))};tx.onabort=()=>{db.close();reject(tx.error||new Error('写真保存が中断されました。'))}})}
async function photoDbGet(id){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readonly'),req=tx.objectStore(PHOTO_STORE).get(id);req.onsuccess=()=>resolve(req.result?.data||'');req.onerror=()=>reject(req.error||new Error('写真を読み込めませんでした。'));tx.oncomplete=()=>db.close();tx.onabort=()=>db.close()})}
async function photoDbDelete(id){if(!id)return;const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
async function photoDbClear(){const db=await openPhotoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).clear();tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
function openVideoDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(VIDEO_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(VIDEO_STORE))db.createObjectStore(VIDEO_STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('動画保存領域を開けませんでした。'))})}
async function videoDbPut(id,data){const db=await openVideoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(VIDEO_STORE,'readwrite');tx.objectStore(VIDEO_STORE).put({id,data,updatedAt:new Date().toISOString()});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error||new Error('動画を保存できませんでした。'))};tx.onabort=()=>{db.close();reject(tx.error||new Error('動画保存が中断されました。'))}})}
async function videoDbGet(id){const db=await openVideoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(VIDEO_STORE,'readonly'),req=tx.objectStore(VIDEO_STORE).get(id);req.onsuccess=()=>resolve(req.result?.data||null);req.onerror=()=>reject(req.error||new Error('動画を読み込めませんでした。'));tx.oncomplete=()=>db.close();tx.onabort=()=>db.close()})}
async function videoDbDelete(id){if(!id)return;const db=await openVideoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(VIDEO_STORE,'readwrite');tx.objectStore(VIDEO_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
async function videoDbClear(){const db=await openVideoDb();return new Promise((resolve,reject)=>{const tx=db.transaction(VIDEO_STORE,'readwrite');tx.objectStore(VIDEO_STORE).clear();tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
function persistableState(input){const out=typeof structuredClone==='function'?structuredClone(input):JSON.parse(JSON.stringify(input));(out.horses||[]).forEach(h=>{if(Array.isArray(h.photos))h.photos=h.photos.map(p=>{const q={...p};if(q.type==='file'||String(q.src||'').startsWith('data:')){q.dbKey=q.dbKey||q.id;delete q.src;delete q.dataUrl}return q});if(Array.isArray(h.videos))h.videos=h.videos.slice(0,1).map(v=>{const q={...v};if(q.type==='file'||q.dbKey){q.dbKey=q.dbKey||q.id;delete q.src;delete q._blob}return q})});return out}
async function persistHorsePhotos(h){for(const p of h.photos||[]){if((p.type==='file'||String(p.src||'').startsWith('data:'))&&p.src){await photoDbPut(p.dbKey||p.id,p.src);p.dbKey=p.dbKey||p.id}}return h}
async function persistHorseVideos(h){for(const v of h.videos||[]){if(v.type==='file'&&v._blob){await videoDbPut(v.dbKey||v.id,v._blob);v.dbKey=v.dbKey||v.id;delete v._blob}}return h}
async function persistHorsePhotosForState(input){for(const h of input.horses||[])await persistHorsePhotos(h);return input}
async function hydrateStatePhotos(input){for(const h of input.horses||[]){for(const p of h.photos||[]){if(!p.src&&p.dbKey){try{p.src=await photoDbGet(p.dbKey)}catch(e){console.warn('写真読込失敗',p.dbKey,e)}}}}return input}
async function hydrateStateVideos(input){for(const h of input.horses||[]){for(const v of h.videos||[]){if(v.type==='file'&&v.dbKey&&!v.src){try{const blob=await videoDbGet(v.dbKey);if(blob)v.src=URL.createObjectURL(blob)}catch(e){console.warn('動画読込失敗',v.dbKey,e)}}}}return input}
async function migrateLegacyPhotos(input){let changed=false;for(const h of input.horses||[]){for(const p of h.photos||[]){if(String(p.src||'').startsWith('data:')){await photoDbPut(p.id,p.src);p.dbKey=p.id;changed=true}}}if(changed)save(input);return input}
function save(nextState=state){const candidate={...nextState,version:V,updatedAt:new Date().toISOString()},stored=persistableState(candidate),nextJson=JSON.stringify(stored),previousJson=localStorage.getItem(K);try{localStorage.removeItem(PRE_IMPORT_K);localStorage.removeItem(K);localStorage.setItem(K,nextJson);const check=localStorage.getItem(K);if(check!==nextJson)throw new Error('保存後のデータ確認に失敗しました。');return candidate}catch(error){try{localStorage.removeItem(K);if(previousJson!==null)localStorage.setItem(K,previousJson)}catch(rollbackError){console.error('保存データの復旧にも失敗しました',rollbackError)}const quota=error?.name==='QuotaExceededError'||/quota/i.test(error?.message||'');throw new Error(quota?'ブラウザの基本データ保存容量が不足しています。JSONバックアップ後に不要なデータを整理してください。':(error?.message||'保存処理に失敗しました。'))}}
function validDate(v,fallback){const d=new Date(v);return Number.isNaN(d.getTime())?fallback:d.toISOString()}
function pick(...values){for(const v of values)if(v!==undefined&&v!==null&&v!=='')return v;return null}
function normalizeLog(log,createdAt){if(!Array.isArray(log))return[{at:createdAt,action:'移行・登録'}];return log.map(x=>({at:validDate(x?.at,createdAt),action:t(x?.action)||'更新'}))}
function load(){try{const r=localStorage.getItem(K);if(!r)return base();const parsed=JSON.parse(r),m=migrate(parsed);return m.horses.length||Array.isArray(parsed?.horses)?m:base()}catch(e){console.error('localStorage読込失敗',e);return base()}}
function club(v){const s=t(v);if(/carrot|キャロット/i.test(s))return'キャロット';if(/silk|シルク/i.test(s))return'シルク';if(/union|ユニオン/i.test(s))return'ユニオン';return s||'その他'}
function sex(v){const s=t(v);if(/牡|male|colt/i.test(s))return'牡';if(/牝|female|filly/i.test(s))return'牝';if(/せん|騸|gelding/i.test(s))return'せん';return s}
function area(v){const s=t(v);if(/美浦/.test(s))return'美浦';if(/栗東/.test(s))return'栗東';if(/地方/.test(s))return'地方';return s}
function sourceArray(x){if(Array.isArray(x))return x;if(!x||typeof x!=='object')throw new Error('JSONの最上位が配列またはオブジェクトではありません。');if(Array.isArray(x.horses))return x.horses;if(Array.isArray(x.records))return x.records;if(Array.isArray(x.items))return x.items;if(x.horseName||x.name)return[x];throw new Error('horses / records / items のいずれにも馬データがありません。')}
function migrate(x){
  const a=sourceArray(x),now=new Date().toISOString(),seenIds=new Set();
  return {
    version:V,schemaVersion:SCHEMA_VERSION,sourceVersion:t(x?.version)||'unknown',app:'Horse Evaluator',modelSettings:normalizeModel(x?.modelSettings),analysisMeta:{datasetSchema:TEACHER_DATASET_SCHEMA,lastAnalyzedAt:t(x?.analysisMeta?.lastAnalyzedAt),lastTeacherCount:Number(x?.analysisMeta?.lastTeacherCount||0)},updatedAt:now,
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
      let id=t(pick(h.id,h.uuid));if(!id||seenIds.has(id))id=uid();seenIds.add(id);
      return {
        id,year,club:normalizedClub,horseNo,
        name:t(pick(h.name,h.horseName,h.recruitmentName))||`名称未設定 ${i+1}`,motherPriority:Boolean(h.motherPriority),
        sex:sex(h.sex),coatColor:t(pick(h.coatColor,h.color,h.coat)),birthDate:t(pick(h.birthDate,h.birthday)),
        sire:t(pick(h.sire,h.father)),dam:t(pick(h.dam,h.mother)),
        broodmareSire:t(pick(h.broodmareSire,h.damsire,h.damSire)),
        stableArea:area(pick(h.stableArea,h.affiliation,h.region)),
        trainer:t(pick(h.trainer,h.stable)),breeder:t(pick(h.breeder,h.farm,h.productionFarm)),
        trainingFarm:t(pick(h.trainingFarm,h.trainingCenter)),currentLocation:t(pick(h.currentLocation,h.location)),horseClass:t(pick(h.horseClass,h.className,h.class)),
        englishName:t(pick(h.englishName,h.nameEnglish,h.spelling)),nameOrigin:t(pick(h.nameOrigin,h.nameMeaning,h.meaning)),pedigreeCross:t(pick(h.pedigreeCross,h.cross)),
        currentStatus:{surface:t(pick(h.currentStatus?.surface,h.raceSurface)),className:t(pick(h.currentStatus?.className,h.currentStatus?.class,h.horseClass,h.className)),recordText:t(pick(h.currentStatus?.recordText,h.raceRecord,h.record)),wins:n(pick(h.currentStatus?.wins,h.wins)),seconds:n(pick(h.currentStatus?.seconds,h.seconds)),thirds:n(pick(h.currentStatus?.thirds,h.thirds)),others:n(pick(h.currentStatus?.others,h.others)),starts:n(pick(h.currentStatus?.starts,h.starts))},
        price:n(pick(h.price,h.totalPrice)),shareCount:n(pick(h.shareCount,h.recruitmentShares,h.numberOfShares)),
        sharePrice:n(pick(h.sharePrice,h.unitPrice)),recruitmentPr:t(pick(h.recruitmentPr,h.pr,h.promotion)),
        internalId:t(h.internalId)||internalId(normalizedClub,year,horseNo,id),
        measurements:latestMeasurements(h.measurementHistory||h.measurementsHistory||[],{
          weight:n(pick(m.weight,m.bodyWeight,h.weight,h.bodyWeight)),
          height:n(pick(m.height,m.bodyHeight,h.height,h.bodyHeight)),
          girth:n(pick(m.girth,m.chest,h.girth,h.chest)),
          cannon:n(pick(m.cannon,m.cannonBone,h.cannon,h.cannonBone))
        }),
        measurementHistory:(()=>{const legacy={weight:n(pick(m.weight,m.bodyWeight,h.weight,h.bodyWeight)),height:n(pick(m.height,m.bodyHeight,h.height,h.bodyHeight)),girth:n(pick(m.girth,m.chest,h.girth,h.chest)),cannon:n(pick(m.cannon,m.cannonBone,h.cannon,h.cannonBone))};const rows=normalizeMeasurementHistory(h.measurementHistory||h.measurementsHistory||[]);return rows.length?rows:mergeMeasurementHistory([],[],legacy,'legacy',pick(h.sourceUrl,h.pageUrl))})(),
        measurementSource:{type:t(h.measurementSource?.type)||'legacy',url:t(h.measurementSource?.url||pick(h.sourceUrl,h.pageUrl)),importedAt:t(h.measurementSource?.importedAt)},
        sourceUrl:t(pick(h.sourceUrl,h.pageUrl)),photoUrl:t(pick(h.photoUrl,h.photo,h.files?.photo)),...normalizePhotos(h),
        videoUrl:t(pick(h.videoUrl,h.video,h.files?.video)),...normalizeVideos(h),favorite:Boolean(h.favorite),notes:t(pick(h.notes,h.memo)),management:{owned:Boolean(h.management?.owned??h.ownedHorse),comparisonExcluded:Boolean(h.management?.comparisonExcluded??h.comparisonExcluded),tags:Array.isArray(h.management?.tags)?h.management.tags.map(t).filter(Boolean):Array.isArray(h.tags)?h.tags.map(t).filter(Boolean):[]},teacherData:{enabled:Boolean(h.teacherData?.enabled??h.isTeacherData),rank:t(h.teacherData?.rank??h.teacherRank),registeredAt:t(h.teacherData?.registeredAt),finalRating:scoreValue(h.teacherData?.finalRating??h.finalRating),satisfaction:n(h.teacherData?.satisfaction??h.satisfaction),retrospective:t(h.teacherData?.retrospective??h.retrospective),comment:t(h.teacherData?.comment??h.teacherComment),gradedWinner:Boolean(h.teacherData?.gradedWinner||(t(h.evaluation?.achievement)==='重賞勝利')||(t(h.evaluation?.achievement)==='GⅠ勝利')),g1Winner:Boolean(h.teacherData?.g1Winner||(t(h.evaluation?.achievement)==='GⅠ勝利'))},evaluation:normalizeEvaluation(h.evaluation),
        createdAt,updatedAt,changeLog:normalizeLog(h.changeLog,createdAt)
      };
    })
  };
}
function validateImport(raw,m){const warnings=[];if(!m.horses.length)throw new Error('馬データが0件です。');const ids=new Set();m.horses.forEach((h,i)=>{if(ids.has(h.id))warnings.push(`${i+1}件目: ID重複`);ids.add(h.id);if(!h.name)warnings.push(`${i+1}件目: 馬名なし`)});return{sourceVersion:t(raw?.version)||'不明',count:m.horses.length,warnings}}
function toast(s){E.toast.textContent=s;E.toast.classList.add('show');clearTimeout(toast.x);toast.x=setTimeout(()=>E.toast.classList.remove('show'),1800)}
function refreshFilters(){const y=E.yearFilter.value,c=E.clubFilter.value,ys=[...new Set(state.horses.map(h=>h.year))].sort((a,b)=>b-a),cs=[...new Set(state.horses.map(h=>h.club))].sort();E.yearFilter.innerHTML='<option value="">すべて</option>'+ys.map(v=>`<option>${v}</option>`).join('');E.clubFilter.innerHTML='<option value="">すべて</option>'+cs.map(v=>`<option>${esc(v)}</option>`).join('');if(ys.map(String).includes(y))E.yearFilter.value=y;if(cs.includes(c))E.clubFilter.value=c}
function uiState(){return{year:E.yearFilter.value,club:E.clubFilter.value,sex:E.sexFilter.value,area:E.stableAreaFilter.value,query:E.searchInput.value,sort:E.sortSelect.value,favoriteOnly:E.favoriteOnly.checked,dataView:E.dataViewFilter?.value||'all'}}
function saveUi(){localStorage.setItem(UI_K,JSON.stringify(uiState()))}
function loadUi(){try{const u=JSON.parse(localStorage.getItem(UI_K)||'{}');E.yearFilter.value=u.year||'';E.clubFilter.value=u.club||'';E.sexFilter.value=u.sex||'';E.stableAreaFilter.value=u.area||'';E.searchInput.value=u.query||'';E.sortSelect.value=u.sort||'horseNo';E.favoriteOnly.checked=Boolean(u.favoriteOnly);if(E.dataViewFilter)E.dataViewFilter.value=u.dataView||'all'}catch(e){console.warn('表示条件の復元に失敗',e)}}
function list(){const y=E.yearFilter.value,c=E.clubFilter.value,sx=E.sexFilter.value,a=E.stableAreaFilter.value,q=E.searchInput.value.trim().toLowerCase(),fav=E.favoriteOnly.checked,s=E.sortSelect.value,view=E.dataViewFilter?.value||'all';const metricKey={propulsionDesc:'propulsion',coreLinkDesc:'coreLink',explosionDesc:'explosion',frontMobilityDesc:'frontMobility',gaitStabilityDesc:'gaitStability'}[s];const filtered=state.horses.filter(h=>(!y||String(h.year)===y)&&(!c||h.club===c)&&(!sx||h.sex===sx)&&(!a||h.stableArea===a)&&(!fav||h.favorite)&&(view==='all'||(view==='teacher'&&h.teacherData?.enabled)||(view==='recruitment'&&!h.teacherData?.enabled)||(view==='owned'&&h.management?.owned)||(view==='excluded'&&h.management?.comparisonExcluded))&&(!q||[h.horseNo,h.name,h.club,h.sire,h.dam,h.broodmareSire,h.stableArea,h.trainer,h.breeder,h.trainingFarm,h.currentLocation,h.horseClass,h.internalId,h.notes,(h.management?.tags||[]).join(' '),h.teacherData?.retrospective].join(' ').toLowerCase().includes(q)));return filtered.sort((x,z)=>metricKey?((important5Score(z,metricKey)??-1)-(important5Score(x,metricKey)??-1)||(x.horseNo??9999)-(z.horseNo??9999)):s==='overallDesc'?((recommendation(z).score??-1)-(recommendation(x).score??-1)||(x.horseNo??9999)-(z.horseNo??9999)):s==='updatedAt'?new Date(z.updatedAt)-new Date(x.updatedAt):s==='name'?x.name.localeCompare(z.name,'ja'):s==='priceDesc'?(z.price??-1)-(x.price??-1):s==='priceAsc'?(x.price??Number.MAX_SAFE_INTEGER)-(z.price??Number.MAX_SAFE_INTEGER):s==='sharePriceAsc'?(x.sharePrice??Number.MAX_SAFE_INTEGER)-(z.sharePrice??Number.MAX_SAFE_INTEGER):(x.horseNo??9999)-(z.horseNo??9999)||x.name.localeCompare(z.name,'ja'))}
function metric(l,v,u){return`<div class="metric"><b>${v==null?'―':esc(v)}</b><span>${l}${v==null?'':' '+u}</span></div>`}
function card(h){const m=h.measurements||{},mp=mainPhoto(h),bg=mp?`style="background-image:url('${esc(mp)}')"`:'',r=recommendation(h);return`<article class="horse-card"><div class="photo" ${bg}>${mp?'':'NO PHOTO'}</div><div class="body"><div class="topline"><div><span class="badge">${h.year} ${esc(h.club)}</span>${h.horseNo!=null?`<span class="badge">No.${h.horseNo}</span>`:''}${h.stableArea?`<span class="badge">${esc(h.stableArea)}</span>`:''}${h.motherPriority?`<span class="badge mother-priority-badge">母馬優先</span>`:''}${h.teacherData?.enabled?`<span class="badge teacher-badge">教師データ${h.teacherData.rank?' '+esc(h.teacherData.rank):''}</span><span class="badge completeness-badge">充足 ${teacherCompleteness(h).percent}%</span>`:''}${h.management?.owned?`<span class="badge owned-badge">出資馬</span>`:''}<h3>${esc(h.name)}</h3><div class="horse-meta">${esc(h.sex)||'性別未設定'}${h.coatColor?'・'+esc(h.coatColor):''}${h.breeder?' ／ '+esc(h.breeder):''}</div>${(()=>{const q=evaluationAverage(h.evaluation);return q.average==null?'':`<div class="horse-meta">評価平均 <b>${q.average.toFixed(2)}</b>（${q.count}項目）</div>`})()}${r.score==null?bodyProfileMini(h):`<div class="decision-body-row"><div class="decision-strip"><div class="recommend-badge ${r.className}">${r.grade}</div><div class="decision-score"><span>総合点</span><strong>${r.score.toFixed(1)}</strong></div></div>${bodyProfileMini(h)}</div>`}</div><button class="favorite ${h.favorite?'on':''}" data-a="favorite" data-id="${h.id}">★</button></div><div class="pedigree">父：${esc(h.sire)||'―'}<br>母：${esc(h.dam)||'―'}<br>母父：${esc(h.broodmareSire)||'―'}<br>厩舎：${esc(h.trainer)||'―'}</div><div class="price-box"><b>総額 ${h.price==null?'―':money(h.price)+'万円'}</b><span>${h.shareCount==null?'募集口数 ―':money(h.shareCount)+'口'} ／ 1口 ${h.sharePrice==null?'―':money(h.sharePrice)+'円'}</span></div><div class="metrics">${metric('体重',m.weight,'kg')}${metric('体高',m.height,'cm')}${metric('胸囲',m.girth,'cm')}${metric('管囲',m.cannon,'cm')}</div><div class="card-actions"><button data-a="detail" data-id="${h.id}">詳細</button><button data-a="edit" data-id="${h.id}">編集</button><button data-a="teacher" data-id="${h.id}">${h.teacherData?.enabled?'教師解除':'教師追加'}</button><button data-a="delete" data-id="${h.id}" class="danger">削除</button></div><div class="updated">更新：${fmt(h.updatedAt)}</div></div></article>`}

function render(){refreshFilters();renderModelSummary();const a=list();E.dashboard.innerHTML=[['登録頭数',state.horses.length],['年度数',new Set(state.horses.map(h=>h.year)).size],['クラブ数',new Set(state.horses.map(h=>h.club)).size],['教師データ',state.horses.filter(h=>h.teacherData?.enabled).length],['お気に入り',state.horses.filter(h=>h.favorite).length]].map(([l,v])=>`<div class="stat"><div class="num">${v}</div><div class="label">${l}</div></div>`).join('');E.resultCount.textContent=state.horses.length===a.length?`${a.length}頭`:`${a.length}頭 / 全${state.horses.length}頭`;E.horseList.innerHTML=a.map(card).join('');E.emptyState.classList.toggle('hidden',a.length!==0)}
function setImportStatus(msg,type=''){E.importStatus.textContent=msg;E.importStatus.className='muted '+(type==='ok'?'import-status-ok':type==='error'?'import-status-error':'')}
function renderPhotoEditor(){const box=$('photoEditorGallery');if(!box)return;$('photoCount').textContent=`${editPhotos.length}枚`;box.innerHTML=editPhotos.length?editPhotos.map((p,i)=>`<article class="photo-edit-card"><img src="${esc(p.src)}" alt="写真${i+1}"><div><label class="radio-line"><input type="radio" name="mainPhoto" data-photo-main="${p.id}" ${p.main||(!editPhotos.some(x=>x.main)&&i===0)?'checked':''}>代表写真</label><div class="photo-edit-actions"><button type="button" data-photo-move="up" data-id="${p.id}" ${i===0?'disabled':''}>↑</button><button type="button" data-photo-move="down" data-id="${p.id}" ${i===editPhotos.length-1?'disabled':''}>↓</button><button type="button" data-photo-delete="${p.id}" class="danger">削除</button></div></div></article>`).join(''):'<div class="photo-empty">写真はまだ登録されていません。</div>'}
async function compressPhoto(file){if(!file.type.startsWith('image/'))throw new Error('画像ファイルではありません。');const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data});const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.78)}
async function addPhotoFiles(files){for(const file of [...files]){if(editPhotos.length>=8){alert('写真は1頭8枚までです。');break}try{const src=await compressPhoto(file);editPhotos.push({id:uid(),src,type:'file',createdAt:new Date().toISOString(),main:editPhotos.length===0})}catch(e){alert(`${file.name}: ${e.message}`)}}renderPhotoEditor()}
function photoGalleryHtml(h){const pm=normalizePhotos(h);if(!pm.photos.length)return'';return`<section class="detail-gallery"><div class="detail-main-photo"><img src="${esc(pm.photos.find(x=>x.id===pm.mainPhotoId)?.src||pm.photos[0].src)}" alt="代表写真" id="detailMainPhoto"></div><div class="detail-thumbs">${pm.photos.map((p,i)=>`<button type="button" data-detail-photo="${i}"><img src="${esc(p.src)}" alt="写真${i+1}"></button>`).join('')}</div></section>`}
function photoAiHtml(h){const pm=normalizePhotos(h),ai=pm.photoAi,rows=PHOTO_AI_FIELDS.filter(k=>ai.scores[k]!=null).map(k=>`<div><span>${PHOTO_AI_LABELS[k]}</span><b>${stars(ai.scores[k])} ${ai.scores[k]}/5</b></div>`).join('');if(!pm.photos.length&&!pm.photoComment&&!rows&&!ai.summary)return'';return`<section class="photo-ai-detail"><h3>写真・AI馬体評価</h3>${pm.photoComment?`<div class="notes"><b>写真コメント</b>\n${esc(pm.photoComment)}</div>`:''}${rows?`<div class="photo-ai-score-grid">${rows}</div>`:''}${ai.summary?`<div class="ai-summary"><span>AI写真総括</span><p>${esc(ai.summary)}</p></div>`:''}</section>`}
function applyPhotoAiJson(){try{const x=extractJsonObject($('aiPhotoJson').value);PHOTO_AI_FIELDS.forEach(k=>{if(x[k]!=null||x.scores?.[k]!=null)$(PHOTO_AI_IDS[k]).value=scoreValue(x[k]??x.scores[k])??''});if(x.summary!=null)$('aiPhotoSummary').value=t(x.summary);$('aiPhotoJson').value='';toast('AI写真評価を反映しました')}catch(e){console.error(e);alert('AI写真評価を反映できませんでした。\n'+(e.message||'入力内容を確認してください。'))}}
function copyPhotoAiTemplate(){const name=t($('name').value)||'募集馬',payload={horse:name,instruction:'添付した募集写真を評価し、1〜5点でJSONのみ返してください。',scale:'1=低い、3=標準、5=非常に高い',fields:Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,PHOTO_AI_LABELS[k]])),output:{hindquarter:null,explosion:null,shoulder:null,chest:null,back:null,neck:null,bone:null,balance:null,growth:null,overall:null,summary:''}};navigator.clipboard?.writeText(JSON.stringify(payload,null,2)).then(()=>toast('AI連携テンプレートをコピーしました')).catch(()=>alert(JSON.stringify(payload,null,2)))}
function openNew(){E.horseForm.reset();pendingImportedExtras=null;clearAiImportInputs();editPhotos=[];editVideos=[];renderPhotoEditor();renderVideoEditor();EVAL_FIELDS.forEach(k=>{const el=$(EVAL_IDS[k]);if(el)el.value=''});$('horseId').value='';$('year').value=new Date().getFullYear();$('dialogTitle').textContent='新規登録';setImportStatus('');if(E.pageText)E.pageText.value='';E.horseDialog.showModal()}
function openEdit(id){const h=state.horses.find(x=>x.id===id);if(!h)return;pendingImportedExtras=null;clearAiImportInputs();const pm=normalizePhotos(h),vm=normalizeVideos(h);editPhotos=pm.photos.map(x=>({...x,main:x.id===pm.mainPhotoId}));$('photoComment').value=pm.photoComment;PHOTO_AI_FIELDS.forEach(k=>{$(PHOTO_AI_IDS[k]).value=pm.photoAi.scores[k]??''});$('aiPhotoSummary').value=pm.photoAi.summary;editVideos=vm.videos.map(x=>({...x}));$('gaitComment').value=vm.gaitComment;GAIT_AI_FIELDS.forEach(k=>{$(GAIT_AI_IDS[k]).value=vm.gaitAi.scores[k]??''});$('aiGaitSummary').value=vm.gaitAi.summary;renderPhotoEditor();renderVideoEditor();['year','club','horseNo','name','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','currentLocation','horseClass','price','shareCount','sharePrice','sourceUrl','photoUrl','videoUrl','recruitmentPr','notes'].forEach(k=>$(k).value=h[k]??'');['weight','height','girth','cannon'].forEach(k=>$(k).value=h.measurements?.[k]??'');$('favorite').checked=h.favorite;$('motherPriority').checked=Boolean(h.motherPriority);$('teacherEnabled').checked=Boolean(h.teacherData?.enabled);$('ownedHorse').checked=Boolean(h.management?.owned);$('comparisonExcluded').checked=Boolean(h.management?.comparisonExcluded);$('teacherRank').value=h.teacherData?.rank||'';$('teacherGradedWinner').checked=Boolean(h.teacherData?.gradedWinner);$('teacherG1Winner').checked=Boolean(h.teacherData?.g1Winner);$('finalRating').value=h.teacherData?.finalRating??'';$('satisfaction').value=h.teacherData?.satisfaction??'';$('horseTags').value=(h.management?.tags||[]).join(', ');$('retrospective').value=h.teacherData?.retrospective||'';$('teacherComment').value=h.teacherData?.comment||'';const ev=normalizeEvaluation(h.evaluation);EVAL_FIELDS.forEach(k=>{const el=$(EVAL_IDS[k]);if(el)el.value=ev.scores[k]??''});$('achievement').value=ev.achievement;$('distanceCategory').value=ev.distanceCategory;$('healthRisk').value=ev.healthRisk??'';$('evaluationComment').value=ev.comment;$('horseId').value=h.id;$('dialogTitle').textContent='募集馬を編集';setImportStatus('');if(E.pageText)E.pageText.value='';E.horseDialog.showModal()}
function readForm(){const id=$('horseId').value||uid(),old=state.horses.find(h=>h.id===id),now=new Date().toISOString();return{id,year:Number($('year').value),club:$('club').value,horseNo:n($('horseNo').value),name:t($('name').value),motherPriority:$('motherPriority').checked,sex:$('sex').value,coatColor:t($('coatColor').value),birthDate:$('birthDate').value,sire:t($('sire').value),dam:t($('dam').value),broodmareSire:t($('broodmareSire').value),stableArea:$('stableArea').value,trainer:t($('trainer').value),breeder:t($('breeder').value),trainingFarm:t($('trainingFarm').value),currentLocation:t($('currentLocation').value),horseClass:t($('horseClass').value),englishName:t(pendingImportedExtras?.englishName??old?.englishName),nameOrigin:t(pendingImportedExtras?.nameOrigin??old?.nameOrigin),pedigreeCross:t(pendingImportedExtras?.pedigreeCross??old?.pedigreeCross),currentStatus:(()=>{const src=pendingImportedExtras?.currentStatus??old?.currentStatus??{};return{surface:t(src.surface),className:t(src.className||$('horseClass').value),recordText:t(src.recordText),wins:n(src.wins),seconds:n(src.seconds),thirds:n(src.thirds),others:n(src.others),starts:n(src.starts)}})(),price:n($('price').value),shareCount:n($('shareCount').value),sharePrice:n($('sharePrice').value),recruitmentPr:t($('recruitmentPr').value),internalId:old?.internalId||internalId($('club').value,Number($('year').value),n($('horseNo').value),id),measurements:(()=>({weight:n($('weight').value),height:n($('height').value),girth:n($('girth').value),cannon:n($('cannon').value)}))(),measurementHistory:(()=>{const values={weight:n($('weight').value),height:n($('height').value),girth:n($('girth').value),cannon:n($('cannon').value)};return mergeMeasurementHistory(old?.measurementHistory||[],pendingImportedExtras?.measurementHistory||[],values,pendingImportedExtras?.measurementSource?.type||'manual',pendingImportedExtras?.measurementSource?.url||$('sourceUrl').value)})(),measurementSource:pendingImportedExtras?.measurementSource||old?.measurementSource||{type:'manual',url:t($('sourceUrl').value),importedAt:now},sourceUrl:t($('sourceUrl').value),photoUrl:t($('photoUrl').value),photos:editPhotos.map(x=>({...x})),mainPhotoId:editPhotos.find(x=>x.main)?.id||editPhotos[0]?.id||'',photoComment:t($('photoComment').value),photoAi:{scores:Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,scoreValue($(PHOTO_AI_IDS[k]).value)])),summary:t($('aiPhotoSummary').value),updatedAt:now},videoUrl:t($('videoUrl').value),videos:editVideos.slice(0,1).map(x=>({...x})),gaitComment:t($('gaitComment').value),gaitAi:{scores:Object.fromEntries(GAIT_AI_FIELDS.map(k=>[k,scoreValue($(GAIT_AI_IDS[k]).value)])),summary:t($('aiGaitSummary').value),updatedAt:now},favorite:$('favorite').checked,notes:t($('notes').value),management:{owned:$('ownedHorse').checked,comparisonExcluded:$('comparisonExcluded').checked,tags:t($('horseTags').value).split(/[,、]/).map(t).filter(Boolean)},teacherData:{enabled:$('teacherEnabled').checked,rank:$('teacherRank').value,registeredAt:$('teacherEnabled').checked?(old?.teacherData?.registeredAt||now):'',gradedWinner:$('teacherGradedWinner').checked||$('teacherG1Winner').checked,g1Winner:$('teacherG1Winner').checked,finalRating:scoreValue($('finalRating').value),satisfaction:n($('satisfaction').value),retrospective:t($('retrospective').value),comment:t($('teacherComment').value)},evaluation:{scores:Object.fromEntries(EVAL_FIELDS.map(k=>[k,scoreValue($(EVAL_IDS[k]).value)])),achievement:$('achievement').value,distanceCategory:$('distanceCategory').value,healthRisk:scoreValue($('healthRisk').value),comment:t($('evaluationComment').value)},createdAt:old?.createdAt||now,updatedAt:now,changeLog:[...(old?.changeLog||[]).slice(-49),{at:now,action:old?'更新':'登録'}]}}
function detail(id){E.detailDialog.dataset.horseId=id;const h=state.horses.find(x=>x.id===id),m=h.measurements||{},ev=normalizeEvaluation(h.evaluation),avg=evaluationAverage(ev),r=recommendation(h),bd=scoreBreakdown(h),d=(l,v)=>`<div class="detail-item"><span>${l}</span><b>${esc(v)||'―'}</b></div>`;const scores=EVAL_FIELDS.map(k=>d(EVAL_LABELS[k],ev.scores[k]==null?'':ev.scores[k]+' / 5')).join('');const breakdownRows=bd.rows.map(row=>{const detailItems=row.group==='measurement'?`<div class="breakdown-subgrid">${['weight','height','girth','cannon'].map((k,i)=>{const labels=['馬体重','体高','胸囲','管囲'];const units=['kg','cm','cm','cm'];const value=m[k];return `<div><span>${labels[i]}</span><b>${value==null?'未入力':esc(value)+units[i]}</b></div>`}).join('')}</div>`:`<div class="breakdown-subgrid">${row.items.map(item=>`<div><span>${esc(item.label)}</span><b>${item.score==null?'未評価':item.score+' / 5'}</b></div>`).join('')}</div>`;return `<details class="breakdown-row"><summary><span class="breakdown-name">${esc(row.label)}</span><span class="breakdown-average">${row.average==null?'未評価':row.average.toFixed(2)+' / 5'}</span><strong>${row.points==null?'―':row.points.toFixed(1)} <small>/ ${row.weight}</small></strong></summary>${detailItems}</details>`}).join('');E.detailContent.innerHTML=`<div class="dialog-head detail-sticky-head"><div><div class="eyebrow">${h.year} ${esc(h.club)} ${h.horseNo!=null?'No.'+h.horseNo:''}</div><h2>${esc(h.name)}</h2></div><button type="button" class="icon-btn detail-top-close" aria-label="詳細を閉じる">×</button></div>${photoGalleryHtml(h)}${bodyProfileHtml(h)}${judgmentHtml(h)}${similarityHtml(h)}${r.score==null?'':`<section class="score-breakdown"><div class="breakdown-head"><div><h3>総合点の内訳</h3><p>${esc(normalizeModel(state.modelSettings).name)}・未評価分類は総合点計算から除外</p></div><strong>${r.score.toFixed(1)}<small> / 100</small></strong></div>${breakdownRows}<div class="breakdown-total"><span>入力済み分類の配点</span><b>${bd.usedWeight} / ${bd.totalWeight}</b></div></section>`}<div class="detail-grid">${d('母馬優先',h.motherPriority?'対象':'―')}${d('性別',h.sex)}${d('毛色',h.coatColor)}${d('生年月日',h.birthDate)}${d('父',h.sire)}${d('母',h.dam)}${d('母父',h.broodmareSire)}${d('所属',h.stableArea)}${d('厩舎',h.trainer)}${d('生産牧場',h.breeder)}${d('育成牧場',h.trainingFarm)}${d('在厩場所',h.currentLocation)}${d('クラス',h.horseClass)}${d('英語名',h.englishName)}${d('馬名の由来',h.nameOrigin)}${d('クロス',h.pedigreeCross)}${d('戦績',h.currentStatus?.recordText)}${d('通算出走数',h.currentStatus?.starts==null?'':h.currentStatus.starts+'戦')}${d('内部管理ID',h.internalId)}${d('募集総額',h.price==null?'':money(h.price)+'万円')}${d('募集口数',h.shareCount==null?'':money(h.shareCount)+'口')}${d('1口価格',h.sharePrice==null?'':money(h.sharePrice)+'円')}${d('馬体重',m.weight==null?'':m.weight+'kg')}${d('体高',m.height==null?'':m.height+'cm')}${d('胸囲',m.girth==null?'':m.girth+'cm')}${d('管囲',m.cannon==null?'':m.cannon+'cm')}</div>${h.sourceUrl?`<a class="source-link" href="${esc(h.sourceUrl)}" target="_blank" rel="noopener">募集馬ページを開く</a>`:''}${h.videoUrl?`<p><a href="${esc(h.videoUrl)}" target="_blank" rel="noopener">歩様動画を開く</a></p>`:''}${photoAiHtml(h)}${gaitAiHtml(h)}${h.teacherData?.enabled?`<section class="teacher-detail"><h3>教師データ情報</h3><div class="detail-grid">${d('解析用実績',resolvedTeacherAchievement(h)||'未設定')}${d('クラス参照',classAchievement(h)||'判定不能')}${d('重賞勝利',h.teacherData.gradedWinner?'手動ON':'―')}${d('GⅠ勝利',h.teacherData.g1Winner?'手動ON':'―')}${d('教師ランク',h.teacherData.rank)}${d('最終評価',h.teacherData.finalRating?`${'★'.repeat(h.teacherData.finalRating)}${'☆'.repeat(5-h.teacherData.finalRating)}`:'')}${d('満足度',h.teacherData.satisfaction==null?'':h.teacherData.satisfaction+' / 100')}${d('登録日',h.teacherData.registeredAt?fmt(h.teacherData.registeredAt):'')}${d('データ充足度',teacherCompleteness(h).percent+'%（'+teacherCompleteness(h).done+'/'+teacherCompleteness(h).total+'）')}</div><div class="notes"><b>タグ</b>
${esc((h.management?.tags||[]).join('・'))||'―'}</div><div class="notes"><b>振り返り</b>
${esc(h.teacherData.retrospective)||'―'}</div><div class="notes"><b>教師コメント</b>
${esc(h.teacherData.comment)||'―'}</div></section>`:''}<h3 class="detail-section-title">評価シート</h3><div class="evaluation-summary"><strong>${avg.average==null?'未評価':avg.average.toFixed(2)+' / 5'}</strong><span class="score-badge">${avg.count}項目入力</span>${(()=>{const q=weightedScore(h);return q.score==null?'':`<div class="detail-total-score">重み付き総合点 <b>${q.score.toFixed(1)} / 100</b>（充足 ${q.coverage}%）</div>`})()}</div><div class="detail-grid">${scores}${d('競走実績',ev.achievement)}${d('主戦場',ev.distanceCategory)}${d('体質リスク',ev.healthRisk==null?'':ev.healthRisk+' / 5')}</div><h3>評価コメント</h3><div class="notes">${esc(ev.comment)||'―'}</div><h3>募集時PR</h3><div class="notes">${esc(h.recruitmentPr)||'―'}</div><h3>メモ</h3><div class="notes">${esc(h.notes)||'―'}</div><h3>更新履歴</h3><div class="notes">${(h.changeLog||[]).slice().reverse().map(x=>fmt(x.at)+'　'+esc(x.action)).join('\n')}</div>`;E.detailDialog.scrollTop=0;E.detailDialog.showModal();requestAnimationFrame(()=>{E.detailDialog.scrollTop=0;E.detailContent.scrollTop=0})}
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
 const pedigreeValue=(value)=>t(value).replace(/^\*/,'').split(/[、，,]|(?:\s|^)(?:兄|姉|弟|妹|半兄|半姉|全兄|全姉|母|父)[：:]|主な兄姉・近親/)[0].trim();
 const sire=pedigreeValue(labelValue(['父'])||first(x,/父\s+([^\n]+?)(?=\s+母\s|\n)/));
 const dam=pedigreeValue(labelValue(['母'])||first(x,/母\s+([^\n]+?)(?=\s+母の父|\n)/));
 const broodmareSire=pedigreeValue(labelValue(['母の父','母父'])||first(x,/母の父\s+([^\n]+?)(?=\s+5代血統表|\s+生年月日|\n)/));
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
 const measurementParsed=parseMeasurements(measureSection,'union-text',url);
 const statedYears=[...measureSection.matchAll(/[【〖\[]?(20\d{2})年/g)].map(m=>Number(m[1]));
 const year=(statedYears.length?statedYears[statedYears.length-1]:null)||(birthYear?Number(birthYear)+1:new Date().getFullYear());
 // ユニオンのPRはページ構造が一定でないため自動取込しない。
 const recruitmentPr='';
 const data={year,club:'ユニオン',horseNo,name,sex:sexValue,coatColor,birthDate,sire,dam,broodmareSire,stableArea,trainer,breeder,trainingFarm,currentLocation:'',horseClass:'',price,shareCount,sharePrice,recruitmentPr,measurements:measurementParsed.measurements,measurementHistory:measurementParsed.history,measurementSource:measurementParsed.source,sourceUrl:url};
 if(data.sharePrice==null&&data.price!=null&&data.shareCount){data.sharePrice=Math.round((data.price*10000/data.shareCount)/100)*100}
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data
}
function lines(text){return cleanText(text).split('\n').map(v=>v.trim()).filter(Boolean)}
function afterLabel(ls,label){const i=ls.findIndex(v=>v===label);return i>=0?(ls[i+1]||''):''}
function yenToMan(v){const s=t(v).replace(/,/g,'');if(!s)return null;if(/億/.test(s)){const m=s.match(/([0-9.]+)億(?:円)?/);return m?Math.round(Number(m[1])*10000):null}const m=s.match(/([0-9.]+)万円?/);if(m)return Number(m[1]);const y=s.match(/([0-9]+)円?/);return y?Number(y[1])/10000:null}
function parseSilk(text){
 const x=cleanText(text),ls=lines(x);
 const valueFor=(labels)=>{for(const label of labels){const exact=afterLabel(ls,label);if(exact)return exact;const re=new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[：:]?\\s*(.+)$');const row=ls.find(v=>re.test(v));if(row){const m=row.match(re);if(m?.[1])return m[1].trim()}}return''};
 const top=ls.find(v=>/^\d+[\.．]\s*.+/.test(v))||'';
 const horseNo=top?Number((top.match(/^(\d+)/)||[])[1]):numberFrom(x,/(?:募集番号|No\.?)[：:\s]*([0-9]+)/i);
 const name=valueFor(['募集馬名','馬名'])||top.replace(/^\d+[\.．]\s*/,'').replace(/募集中.*$/,'').trim();
 const sexColor=valueFor(['性別 / 毛色','性別／毛色','性別・毛色']);
 const sc=sexColor.split(/[\/／・]/).map(v=>v.trim());
 const ageBirth=valueFor(['年齢 / 生年月日','年齢／生年月日','生年月日']);
 const bm=(ageBirth||x).match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/);
 const birthDate=bm?`${bm[1]}-${bm[2].padStart(2,'0')}-${bm[3].padStart(2,'0')}`:'';
 const trainerRaw=valueFor(['厩舎','預託予定厩舎','予定厩舎']);
 const stableArea=area(trainerRaw||valueFor(['所属']));
 const trainer=trainerRaw.replace(/^(美浦|栗東|地方)\s*/,'').replace(/厩舎$/,'').trim();
 const farms=valueFor(['生産 / 育成','生産／育成','生産・育成']);
 const fp=farms.split(/[\/／]/).map(v=>v.trim()).filter(Boolean);
 const breeder=valueFor(['生産牧場','生産者','生産'])||fp[0]||'';
 const trainingFarm=valueFor(['育成牧場','育成'])||fp[1]||'';
 const totalShare=valueFor(['募集総額 / 一口出資額','募集総額／一口出資額','募集総額・一口出資額']);
 const tsp=totalShare.split(/[\/／]/).map(v=>v.trim());
 let price=yenToMan(tsp[0]||valueFor(['募集総額','総額']));
 let sharePrice=numberFrom(tsp[1]||'',/([0-9,]+)円/) ?? numberFrom(x,/(?:一口出資額|一口価格|1口価格|一口)\s*[：:]?\s*([0-9,]+)円/);
 if(price==null)price=yenToMan(valueFor(['募集総額','総額']));
 const measurementParsed=parseMeasurements(x,'silk-text','');
 const year=bm?Number(bm[1])+1:new Date().getFullYear();
 const data={year,club:'シルク',horseNo,name,sex:sex(sc[0]||valueFor(['性別'])),coatColor:sc[1]||valueFor(['毛色']),birthDate,
 sire:valueFor(['父']),dam:valueFor(['母']),broodmareSire:valueFor(['母の父','母父']),stableArea,trainer,
 breeder,trainingFarm,currentLocation:valueFor(['在厩場所','現在地']),horseClass:valueFor(['クラス']),
 price,sharePrice,shareCount:(price!=null&&sharePrice)?Math.round(price*10000/sharePrice):null,recruitmentPr:valueFor(['募集馬紹介','募集時のPR','コメント']),sourceUrl:'',measurements:measurementParsed.measurements,measurementHistory:measurementParsed.history,measurementSource:measurementParsed.source};
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data
}

function valueByLabels(text,labels){
 const ls=lines(text);
 for(const label of labels){
  const exact=afterLabel(ls,label);if(exact)return exact.replace(/^\|\s*/,'').trim();
  const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patterns=[new RegExp('^'+escaped+'\\s*[：:]?\\s*[|｜]?\\s*(.+)$','i'),new RegExp('^'+escaped+'\\s*[|｜]\\s*(.+)$','i')];
  for(const row of ls){for(const re of patterns){const m=row.match(re);if(m?.[1])return m[1].replace(/\s*\|\s*$/,'').trim()}}
 }
 return'';
}
function normalizeBirthDate(text){const m=t(text).match(/(20\d{2})(?:年|[\/.\-])\s*(\d{1,2})(?:月|[\/.\-])\s*(\d{1,2})日?/);return m?`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`:''}
function normalizeMeasurementHistory(history=[]){
 if(!Array.isArray(history))return[];
 return history.map((r,i)=>({
  date:t(r?.date),label:t(r?.label),source:t(r?.source)||'legacy',sourceUrl:t(r?.sourceUrl),order:Number.isFinite(Number(r?.order))?Number(r.order):i,
  weight:n(r?.weight),height:n(r?.height),girth:n(r?.girth),cannon:n(r?.cannon)
 })).filter(r=>['weight','height','girth','cannon'].some(k=>r[k]!=null)).sort((a,b)=>a.order-b.order);
}
function latestMeasurements(history=[],fallback={}){const rows=normalizeMeasurementHistory(history);const out={weight:null,height:null,girth:null,cannon:null};for(const row of rows){for(const k of Object.keys(out))if(row[k]!=null)out[k]=row[k]}for(const k of Object.keys(out))if(out[k]==null)out[k]=n(fallback?.[k]);return out}
function measurementDateFromLine(line){const full=t(line).match(/(20\d{2})年\s*(\d{1,2})月(?:\s*(\d{1,2})日)?/);if(full)return`${full[1]}-${full[2].padStart(2,'0')}-${(full[3]||'01').padStart(2,'0')}`;const slash=t(line).match(/(20\d{2})[\/.\-](\d{1,2})(?:[\/.\-](\d{1,2}))?/);return slash?`${slash[1]}-${slash[2].padStart(2,'0')}-${(slash[3]||'01').padStart(2,'0')}`:''}
function parseMeasurements(text,source='text',sourceUrl=''){
 const x=cleanText(text),ls=x.split('\n'),rows=[];let current=null,currentDate='',currentLabel='';
 const aliases={weight:['馬体重','体重'],height:['体高'],girth:['胸囲'],cannon:['管囲','管骨囲']},units={weight:'kg',height:'cm',girth:'cm',cannon:'cm'};
 const hasMeasure=line=>Object.values(aliases).flat().some(label=>new RegExp(label+'\\s*[：:]?\\s*[0-9]').test(line));
 const push=()=>{if(current&&['weight','height','girth','cannon'].some(k=>current[k]!=null))rows.push(current);current=null};
 ls.forEach((raw,index)=>{
  const line=t(raw);if(!line)return;const d=measurementDateFromLine(line);if(d){currentDate=d;currentLabel=line.replace(/\s+/g,' ').slice(0,80)}
  if(!hasMeasure(line))return;
  if(!current||current.date!==currentDate){push();current={date:currentDate,label:currentLabel,source,sourceUrl:t(sourceUrl),order:index,weight:null,height:null,girth:null,cannon:null}}
  for(const [key,names] of Object.entries(aliases))for(const label of names){const re=new RegExp(label+'\\s*[：:]?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*'+units[key]+'?', 'i');const m=line.match(re);if(m){current[key]=Number(m[1]);break}}
 });push();
 // 改行のない本文にも対応。履歴が取れない場合は全文から最終値を1件生成する。
 if(!rows.length){const one={date:'',label:'',source,sourceUrl:t(sourceUrl),order:0,weight:null,height:null,girth:null,cannon:null};for(const [key,names] of Object.entries(aliases)){for(const label of names){const ms=[...x.matchAll(new RegExp(label+'\\s*[：:]?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*'+units[key]+'?', 'gi'))];if(ms.length){one[key]=Number(ms[ms.length-1][1]);break}}}if(Object.values(one).some(v=>typeof v==='number'))rows.push(one)}
 const history=normalizeMeasurementHistory(rows),measurements=latestMeasurements(history,{});return{measurements,history,source:{type:source,url:t(sourceUrl),importedAt:new Date().toISOString()}};
}
function mergeMeasurementHistory(oldHistory=[],importedHistory=[],measurements={},source='manual',sourceUrl=''){
 const combined=[...normalizeMeasurementHistory(oldHistory),...normalizeMeasurementHistory(importedHistory)];const seen=new Set(),rows=[];
 for(const row of combined){const key=[row.date,row.weight,row.height,row.girth,row.cannon,row.source].join('|');if(!seen.has(key)){seen.add(key);rows.push({...row,order:rows.length})}}
 const latest=latestMeasurements(rows,{});const changed=['weight','height','girth','cannon'].some(k=>n(measurements?.[k])!==n(latest[k]));
 if(changed||!rows.length){rows.push({date:'',label:source==='manual'?'手入力・保存':'本文取込',source,sourceUrl:t(sourceUrl),order:rows.length,weight:n(measurements?.weight),height:n(measurements?.height),girth:n(measurements?.girth),cannon:n(measurements?.cannon)})}
 return normalizeMeasurementHistory(rows);
}
function importedPlainText(text){
 return cleanText(text)
  .replace(/^Title:\s*.*$/gmi,'')
  .replace(/^URL Source:\s*.*$/gmi,'')
  .replace(/^Published Time:\s*.*$/gmi,'')
  .replace(/^Markdown Content:\s*$/gmi,'')
  .replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
  .replace(/^\s{0,3}#{1,6}\s*/gm,'')
  .replace(/^\s*[*+-]\s+/gm,'')
  .replace(/^\s*>\s?/gm,'')
  .replace(/\*\*([^*]+)\*\*/g,'$1')
  .replace(/__([^_]+)__/g,'$1');
}
function parseCarrotActive(text,url=''){
 const x=importedPlainText(text),ls=lines(x);
 const ignored=/^(メニュー|ログイン|所属馬情報|所属馬一覧|出走予定|競走結果|勝利馬一覧|活躍馬|募集馬一覧|募集馬カタログ電子版|ご登録情報の変更|クラブ紹介|入会案内|PageTop|Home|Back|PCサイト|Copyright|血統図|牝系図)/i;
 const profileIndex=ls.findIndex(v=>/(?:20\d{2}年\s*\d{1,2}月\s*\d{1,2}日生\s*)?(?:牡|牝|せん|騸)(?:\s*\d+歳)?\s*.*?毛|(?:牡|牝|せん|騸)(?:\s*\d+歳)?\s*.*?毛.*?(?:20\d{2}年|['’]\d{2}[\/.-])/.test(v));
 const fullBirth=first(x,/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日生/,0);
 const shortBirth=first(x,/[\'’](\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})生/,0);
 let birthDate=normalizeBirthDate(fullBirth||'');
 if(!birthDate&&shortBirth){const m=shortBirth.match(/[\'’](\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/);if(m)birthDate=`20${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`}
 let name='';
 if(profileIndex>0){for(let i=profileIndex-1;i>=0;i--){const candidate=ls[i].replace(/^[-・●]\s*/,'').trim();if(!candidate||ignored.test(candidate)||/CARROT CLUB|https?:\/\//i.test(candidate))continue;name=candidate;break}}
 if(!name){const title=first(x,/^([^\n]+?)\s+(?:[A-Za-z][A-Za-z .'-]+\s*)?-\s*CARROT CLUB/im);name=t(title)}
 const profile=profileIndex>=0?ls[profileIndex]:'';
 const sexValue=sex(first(profile,/(牡|牝|せん|騸)/)||first(x,/(?:^|\n)\s*(牡|牝|せん|騸)\s*\d+歳/m)||valueByLabels(x,['性別']));
 const coatColor=first(profile,/([白黒青鹿栗栃尾芦月佐]+毛)/)||first(x,/(?:^|\n)\s*([白黒青鹿栗栃尾芦月佐]+毛)\s*(?:\n|$)/m)||valueByLabels(x,['毛色']);
 const pedigree=first(x,/父\s*([^\n×]+?)\s*[×x]\s*母\s*([^\n(]+?)\s*[（(]\s*BMS\s*[：:]\s*([^）)]+)[）)]/,0)||'';
 let sire='',dam='',broodmareSire='';
 if(pedigree){const m=pedigree.match(/父\s*([^\n×]+?)\s*[×x]\s*母\s*([^\n(]+?)\s*[（(]\s*BMS\s*[：:]\s*([^）)]+)[）)]/);if(m){sire=t(m[1]);dam=t(m[2]);broodmareSire=t(m[3])}}
 sire=sire||valueByLabels(x,['父']);dam=dam||valueByLabels(x,['母']);broodmareSire=broodmareSire||valueByLabels(x,['BMS','母の父','母父']);
 let englishName='',nameOrigin='';
 const englishLine=ls.find(v=>/[（(][^）)]*語[）)]/.test(v)&&/父\s*[^\n×]+\s*[×x]\s*母/.test(v));
 if(englishLine){const m=englishLine.match(/^\s*([^（(]+?)\s*[（(]([^）)]*語)[）)]\s*(.*?)(?=父\s*[^\n×]+\s*[×x]\s*母|$)/);if(m){englishName=t(m[1]);nameOrigin=t(m[3])}}
 let areaRaw='',trainerRaw='',breeder='';
 const at=ls.find(v=>/^(関東|関西|美浦|栗東|地方).+?厩舎.*生産/.test(v))||ls.find(v=>/^(関東|関西|美浦|栗東|地方)\s+(?:[|｜]\s*)?.+?\s*厩舎\s*$/.test(v));
 if(at){const m=at.match(/^(関東|関西|美浦|栗東|地方)\s*(?:[|｜]\s*)?(.+?)\s*厩舎(?:\s*生産\s*(.+))?$/);areaRaw=m?.[1]||'';trainerRaw=m?.[2]||'';breeder=t(m?.[3])}
 if(!trainerRaw){trainerRaw=valueByLabels(x,['厩舎']);areaRaw=valueByLabels(x,['所属'])||trainerRaw}
 breeder=breeder||valueByLabels(x,['生産','生産牧場']);
 const stableArea=/関東|美浦/.test(areaRaw)?'美浦':/関西|栗東/.test(areaRaw)?'栗東':area(areaRaw);
 const price=numberFrom(x,/募集総額\s*([0-9,]+)万円/),shareCount=numberFrom(x,/総口数\s*([0-9,]+)口/),sharePrice=numberFrom(x,/1口出資額\s*([0-9,]+)円/);
 const recordMatch=x.match(/(?:^|\n)\s*(平地|障害|地方)?\s*([^（(\n]+?)\s*[（(]\s*(\d+)\s*[-－]\s*(\d+)\s*[-－]\s*(\d+)\s*[-－]\s*(\d+)\s*[）)]/m);
 const surface=t(recordMatch?.[1]),className=t(recordMatch?.[2]);
 const wins=recordMatch?Number(recordMatch[3]):null,seconds=recordMatch?Number(recordMatch[4]):null,thirds=recordMatch?Number(recordMatch[5]):null,others=recordMatch?Number(recordMatch[6]):null;
 const recordText=recordMatch?t(recordMatch[0]):'';
 const starts=recordMatch?wins+seconds+thirds+others:null;
 const crossLine=ls.find(v=>/\b\d+[A-Z]?\s*[×x]\s*\d+[A-Z]?\b/.test(v)&&!/父\s*.+母/.test(v));
 const pedigreeCross=t(crossLine||valueByLabels(x,['クロス']));
 const horseClass=[surface,className].filter(Boolean).join('');
 const notes=[pedigreeCross?`クロス：${pedigreeCross}`:'',recordText?`現役クラス・戦績：${recordText}`:'',englishName?`英語名：${englishName}`:'',nameOrigin?`馬名の由来：${nameOrigin}`:''].filter(Boolean).join('\n');
 const year=birthDate?Number(birthDate.slice(0,4))+1:new Date().getFullYear();
 const measurementParsed=parseMeasurements(x,'carrot-text',url);
 const trainingFarm=valueByLabels(x,['予定育成牧場','育成牧場']);
 const data={year,club:'キャロット',horseNo:null,name,englishName,nameOrigin,sex:sexValue,coatColor,birthDate,sire,dam,broodmareSire,pedigreeCross,stableArea,trainer:trainerRaw.replace(/\s+/g,''),breeder,trainingFarm,currentLocation:'',horseClass,price,shareCount,sharePrice,recruitmentPr:'',sourceUrl:url,notes,currentStatus:{surface,className,recordText,wins,seconds,thirds,others,starts},measurements:measurementParsed.measurements,measurementHistory:measurementParsed.history,measurementSource:measurementParsed.source};
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data;
}
function parseUnionActive(text,url=''){
 const x=cleanText(text),ls=lines(x);
 const firstHorseName=ls.find(v=>!/^マイ馬に登録する$/.test(v)&&!/^父\s|^母\s|^母の父\s|^馬名$|^意味・由来|^馬名綴り|^生年月日|^年齢|^性別|^毛色|^所属|^厩舎|^戦績|^中央:|^地方:|^障害:|^クラス|^生産牧場/.test(v))||'';
 const birthDate=normalizeBirthDate(valueByLabels(x,['生年月日']));
 const recordLines=ls.filter(v=>/^(中央|地方|障害)\s*[：:]/.test(v));
 const meaning=valueByLabels(x,['意味・由来']);const spelling=valueByLabels(x,['馬名綴り']);
 const notes=[spelling?`馬名綴り：${spelling}`:'',meaning?`意味・由来：${meaning}`:'',...recordLines].filter(Boolean).join('\n');
 const year=birthDate?Number(birthDate.slice(0,4))+1:new Date().getFullYear();
 const sexText=valueByLabels(x,['性別'])||first(x,/性別\s*[：:]?\s*(牡|牝|せん|騸)/);
 const coat=valueByLabels(x,['毛色'])||first(x,/毛色\s*[：:]?\s*([^\s\n]+)/);
 const affiliation=valueByLabels(x,['所属'])||first(x,/所属\s*[：:]?\s*(美浦|栗東|地方)/);
 const trainer=valueByLabels(x,['厩舎'])||first(x,/厩舎\s*[：:]?\s*([^\n]+)/);
 const measurementParsed=parseMeasurements(x,'union-active-text',url);
 const data={year,club:'ユニオン',horseNo:null,name:firstHorseName,sex:sex(sexText),coatColor:coat,birthDate,sire:valueByLabels(x,['父']),dam:valueByLabels(x,['母']),broodmareSire:valueByLabels(x,['母の父','母父']),stableArea:area(affiliation),trainer:trainer.replace(/\s+/g,''),breeder:valueByLabels(x,['生産牧場','生産']),trainingFarm:'',currentLocation:'',horseClass:valueByLabels(x,['クラス']),price:null,shareCount:null,sharePrice:null,recruitmentPr:'',sourceUrl:url,notes,measurements:measurementParsed.measurements,measurementHistory:measurementParsed.history,measurementSource:measurementParsed.source};
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data;
}
function validateImportedData(data,format){
 if(!data?.name)throw new Error('馬名を抽出できませんでした。ページ上部の馬名・生年月日・父母情報を含めて本文を貼り付けてください。');
 if(format==='carrot-active'&&![data.birthDate,data.sire,data.dam,data.trainer].some(Boolean))throw new Error('キャロットの馬情報を抽出できませんでした。ページ本文全体をコピーして貼り付けてください。');
 return data;
}
function parseImportedPage(format,text,url=''){
 let data;
 if(format==='silk')data=parseSilk(text);
 else if(format==='union-active')data=parseUnionActive(text,url);
 else if(format==='carrot-active')data=parseCarrotActive(text,url);
 else data=parseUnion(text,url);
 return validateImportedData(data,format);
}
function detectFormat(text,url=''){const x=cleanText(text),u=t(url);if(/carrotclub\.net/i.test(u))return'carrot-active';if(/union-oc\.co\.jp/i.test(u)&&/マイ馬に登録する|中央\s*[：:]|馬名綴り/.test(x))return'union-active';if(/silkhorseclub\.jp/i.test(u))return'silk';if(/union-oc\.co\.jp/i.test(u))return'union';if((/BMS\s*[：:]|BMS[\s|｜]+|クロス[\s|｜]+|\d{4}年\s*\d{1,2}月\s*\d{1,2}日生|[\'’]\d{2}[\/.-]\d{1,2}[\/.-]\d{1,2}生|[（(]英語[）)]/.test(x))&&/(関東|関西|美浦|栗東|地方)[\s|｜　]+.*厩舎/.test(x))return'carrot-active';if(/マイ馬に登録する|馬名綴り/.test(x)&&/中央\s*[：:]/.test(x))return'union-active';const silkScore=[/シルク(?:・ホースクラブ|ホースクラブ)?/,/募集馬名/,/性別\s*[\/／・]\s*毛色/,/募集総額\s*[\/／・]\s*一口出資額/,/一口出資額/,/在厩場所/,/クラス/].filter(r=>r.test(x)).length,unionScore=[/PEGASUS/i,/ユニオン(?:オーナーズクラブ)?/,/募集時のPR/,/生産者からのPR/].filter(r=>r.test(x)).length;if(silkScore>=1&&silkScore>unionScore)return'silk';if(unionScore>=1&&unionScore>=silkScore)return'union';return''}
function selectedImportFormat(text,url=''){const selected=E.importFormat?.value||'auto';return selected==='auto'?detectFormat(text,url):selected}
async function fetchPageSource(url){let directError;try{const r=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return{source:await r.text(),baseUrl:r.url||url,kind:'html',route:'direct'}}catch(e){directError=e}try{const clean=url.replace(/^https?:\/\//,'');const proxy=`https://r.jina.ai/https://${clean}`;const r=await fetch(proxy,{headers:{Accept:'text/plain'},cache:'no-store'});if(!r.ok)throw new Error(`Reader HTTP ${r.status}`);return{source:await r.text(),baseUrl:url,kind:'reader',route:'reader'}}catch(e){console.error(directError,e);throw new Error('URLからページを取得できませんでした。ブラウザの外部通信制限（CORS等）の可能性があります。ページを開き、本文をコピーして下の本文欄へ貼り付けてください。')}}
async function fetchPageText(url){const r=await fetchPageSource(url);if(r.kind==='html')return new DOMParser().parseFromString(r.source,'text/html').body?.innerText||r.source;return importedPlainText(r.source)}
function normalizeImageUrl(raw,baseUrl){let v=t(raw).replace(/&amp;/g,'&').replace(/^['"]|['"]$/g,'');if(!v||v.startsWith('data:')||v.startsWith('blob:')||v.startsWith('javascript:'))return'';try{return new URL(v,baseUrl).href}catch{return''}}
function imageCandidateScore(url,alt=''){const x=(url+' '+alt).toLowerCase();let score=0;if(/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url))score+=3;if(/photo|gallery|horse|boshu|募集|馬体|catalog|large|original|upload|img/i.test(x))score+=3;if(/logo|icon|banner|header|footer|common|loading|arrow|btn|button|sns|facebook|twitter|youtube|favicon|spacer|noimage/i.test(x))score-=8;if(/\.(?:svg|gif)(?:[?#]|$)/i.test(url))score-=5;return score}
function extractPageImageUrls(source,baseUrl,kind){const found=[];const add=(raw,alt='')=>{const url=normalizeImageUrl(raw,baseUrl);if(!url)return;const score=imageCandidateScore(url,alt);if(score<1)return;if(!found.some(x=>x.url===url))found.push({url,score,alt:t(alt)})};if(kind==='html'){const doc=new DOMParser().parseFromString(source,'text/html');doc.querySelectorAll('img').forEach(img=>{add(img.currentSrc||img.getAttribute('src')||img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('data-lazy-src'),img.alt);const ss=img.getAttribute('srcset')||img.getAttribute('data-srcset');if(ss)ss.split(',').forEach(x=>add(x.trim().split(/\s+/)[0],img.alt))});doc.querySelectorAll('a[href]').forEach(a=>{if(/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(a.getAttribute('href')||''))add(a.getAttribute('href'),a.textContent)})}else{for(const m of source.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+['"][^'"]*['"])?\)/g))add(m[2],m[1]);for(const m of source.matchAll(/https?:\/\/[^\s<>()'"]+?\.(?:jpe?g|png|webp)(?:\?[^\s<>()'"]*)?/gi))add(m[0])}return found.sort((a,b)=>b.score-a.score).map(x=>x.url)}
function supportedHorsePage(url){try{const u=new URL(url);return/(^|\.)(union-oc\.co\.jp|silkhorseclub\.jp|carrotclub\.net)$/i.test(u.hostname)}catch{return false}}
function modelInputs(){return{gait:$('weightGait'),body:$('weightBody'),growth:$('weightGrowth'),measurement:$('weightMeasurement'),pedigree:$('weightPedigree'),connections:$('weightConnections')}}
function updateWeightTotal(){const total=Object.values(modelInputs()).reduce((s,el)=>s+Number(el.value||0),0),el=$('weightTotal');el.textContent=total+'%';el.classList.toggle('invalid',total!==100)}
function openModelSettings(){const m=normalizeModel(state.modelSettings);$('modelName').value=m.name;Object.entries(modelInputs()).forEach(([k,el])=>el.value=m.weights[k]);$('thresholdS').value=m.thresholds.s;$('thresholdA').value=m.thresholds.a;$('thresholdB').value=m.thresholds.b;updateWeightTotal();$('modelDialog').showModal()}
function setDefaultWeights(){const m=normalizeModel(DEFAULT_MODEL);$('modelName').value=m.name;Object.entries(modelInputs()).forEach(([k,el])=>el.value=m.weights[k]);$('thresholdS').value=m.thresholds.s;$('thresholdA').value=m.thresholds.a;$('thresholdB').value=m.thresholds.b;updateWeightTotal()}
function renderModelSummary(){const m=normalizeModel(state.modelSettings),w=m.weights,q=m.thresholds;$('modelSummary').textContent=`${m.name}：歩様${w.gait}%・馬体${w.body}%・成長${w.growth}%・測尺${w.measurement}%・配合${w.pedigree}%・厩舎牧場${w.connections}% ／ S${q.s}・A${q.a}・B${q.b}点以上`}
function teacherFeatureScores(h){
 const ev=normalizeEvaluation(h.evaluation).scores,pa=normalizePhotos(h).photoAi.scores,ga=normalizeVideos(h).gaitAi.scores;
 const out={};
 EVAL_FIELDS.forEach(k=>{let v=ev[k];if(v==null&&['hindquarter','chest','shoulder','back','bone','balance','growth'].includes(k))v=pa[k];if(v==null&&['frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness'].includes(k))v=ga[k];out[k]=scoreValue(v)});
 return out;
}
function teacherLabel(h){const a=resolvedTeacherAchievement(h),td=h.teacherData||{},isG1=Boolean(td.g1Winner||a==='GⅠ勝利'),isGraded=Boolean(isG1||td.gradedWinner||a==='重賞勝利');return{achievement:a,source:td.g1Winner||td.gradedWinner?'manual-graded-flag':classAchievement(h)?'class':'legacy-evaluation',classAchievement:classAchievement(h),isG1Winner:isG1,isGradedWinner:isGraded,isOpenClass:Boolean(isGraded||['重賞出走','オープン'].includes(a))}}
function teacherDatasetObject(){const horses=(state.horses||[]).filter(h=>h.teacherData?.enabled).map(h=>({
 id:h.id,name:h.name,club:h.club,year:h.year,sex:h.sex,birthDate:h.birthDate,sire:h.sire,dam:h.dam,broodmareSire:h.broodmareSire,trainer:h.trainer,breeder:h.breeder,price:h.price,sharePrice:h.sharePrice,horseClass:h.horseClass,currentStatus:h.currentStatus||{},
 measurements:h.measurements||{},features:teacherFeatureScores(h),label:teacherLabel(h),teacherRank:h.teacherData?.rank||'',finalRating:h.teacherData?.finalRating??null,satisfaction:h.teacherData?.satisfaction??null,
 source:{photo:Boolean(mainPhoto(h)),gait:Boolean((normalizeVideos(h).videos||[]).length||h.videoUrl),measurement:Object.values(h.measurements||{}).some(v=>v!=null&&v!=='')}
 }));return{schema:TEACHER_DATASET_SCHEMA,generatedAt:new Date().toISOString(),appVersion:V,teacherCount:horses.length,featureDefinitions:Object.fromEntries(EVAL_FIELDS.map(k=>[k,{label:EVAL_LABELS[k],scale:'1-5',missing:null}])),labelDefinitions:{achievement:ANALYSIS_LABEL_ORDER,achievementSource:'現在クラスを優先し、重賞・GⅠ勝利は教師データ管理の手動フラグで上書き',isG1Winner:'GⅠ勝利（手動フラグ）',isGradedWinner:'GⅠまたはGⅡ・GⅢ勝利（手動フラグ）',isOpenClass:'オープン以上'},horses}}
function downloadJson(obj,name){const b=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
function exportTeacherDataset(){const ds=teacherDatasetObject();if(!ds.teacherCount){alert('教師データが登録されていません。');return}downloadJson(ds,`horse-evaluator-teacher-dataset-${new Date().toISOString().slice(0,10)}-${ds.teacherCount}horses.json`);toast(`教師データ${ds.teacherCount}頭を書き出しました`)}
function mean(xs){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
function stddev(xs){if(xs.length<2)return null;const m=mean(xs);return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1))}
function pearsonPairs(pairs){const z=pairs.filter(([a,b])=>a!=null&&b!=null);if(z.length<5)return null;const xs=z.map(x=>x[0]),ys=z.map(x=>x[1]),xm=mean(xs),ym=mean(ys),num=z.reduce((q,[x,y])=>q+(x-xm)*(y-ym),0),dx=Math.sqrt(xs.reduce((q,x)=>q+(x-xm)**2,0)),dy=Math.sqrt(ys.reduce((q,y)=>q+(y-ym)**2,0));return dx&&dy?{r:num/(dx*dy),n:z.length}:null}
function compareTeacherGroups(groupA,groupB,labelA,labelB,allCount){return EVAL_FIELDS.map(k=>{const a=groupA.map(x=>x.features[k]).filter(v=>v!=null),b=groupB.map(x=>x.features[k]).filter(v=>v!=null),am=mean(a),bm=mean(b),sa=stddev(a),sb=stddev(b),pooled=(a.length>1&&b.length>1)?Math.sqrt(((a.length-1)*(sa||0)**2+(b.length-1)*(sb||0)**2)/(a.length+b.length-2)):null,diff=am!=null&&bm!=null?am-bm:null,effect=pooled&&pooled>0?diff/pooled:null,coverage=Math.round((a.length+b.length)/Math.max(1,allCount)*100),minN=Math.min(a.length,b.length),stability=Math.min(1,minN/30)*(coverage/100),importance=effect==null?null:Math.abs(effect)*stability,reliability=minN>=30&&coverage>=75?'A':minN>=15&&coverage>=55?'B':'C';return{key:k,label:EVAL_LABELS[k],aMean:am,bMean:bm,diff,effect,aN:a.length,bN:b.length,coverage,importance,reliability,labelA,labelB}}).sort((a,b)=>(b.importance??-1)-(a.importance??-1))}
function teacherAnalysis(){const ds=teacherDatasetObject(),rows=ds.horses;if(!rows.length)throw new Error('教師データが登録されていません。');const graded=rows.filter(x=>x.label.isGradedWinner),nonGraded=rows.filter(x=>!x.label.isGradedWinner&&x.label.achievement),g1=rows.filter(x=>x.label.isG1Winner),g23=rows.filter(x=>x.label.isGradedWinner&&!x.label.isG1Winner);const comparisons=[{key:'graded',title:'重賞勝ち vs 非重賞',a:graded,b:nonGraded,labelA:'重賞勝ち',labelB:'比較群'},{key:'g1',title:'GⅠ勝ち vs 非重賞',a:g1,b:nonGraded,labelA:'GⅠ勝ち',labelB:'非重賞'},{key:'g1g23',title:'GⅠ勝ち vs GⅡ・GⅢ勝ち',a:g1,b:g23,labelA:'GⅠ勝ち',labelB:'GⅡ・GⅢ勝ち'}].map(c=>({...c,fields:compareTeacherGroups(c.a,c.b,c.labelA,c.labelB,rows.length)}));const correlations=[];for(let i=0;i<EVAL_FIELDS.length;i++)for(let j=i+1;j<EVAL_FIELDS.length;j++){const k1=EVAL_FIELDS[i],k2=EVAL_FIELDS[j],r=pearsonPairs(rows.map(x=>[x.features[k1],x.features[k2]]));if(r&&Math.abs(r.r)>=.55)correlations.push({a:EVAL_LABELS[k1],b:EVAL_LABELS[k2],r:r.r,n:r.n})}correlations.sort((a,b)=>Math.abs(b.r)-Math.abs(a.r));const labels=ANALYSIS_LABEL_ORDER.map(label=>({label,count:rows.filter(x=>x.label.achievement===label).length})).filter(x=>x.count),sourceCounts={class:rows.filter(x=>x.label.source==='class').length,manual:rows.filter(x=>x.label.source==='manual-graded-flag').length,legacy:rows.filter(x=>x.label.source==='legacy-evaluation').length};return{dataset:ds,teacherCount:rows.length,winnerCount:graded.length,comparisonCount:nonGraded.length,g1Count:g1.length,g23Count:g23.length,labels,sourceCounts,comparisons,correlations:correlations.slice(0,12),analyzedAt:new Date().toISOString()}}
function analysisTableHtml(c){const usable=c.fields.filter(x=>x.diff!=null),rows=usable.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.label)}</td><td>${x.aMean.toFixed(2)} (${x.aN})</td><td>${x.bMean.toFixed(2)} (${x.bN})</td><td class="${x.diff>=0?'analysis-positive':'analysis-negative'}">${x.diff>=0?'+':''}${x.diff.toFixed(2)}</td><td>${x.effect==null?'―':x.effect.toFixed(2)}</td><td>${x.importance==null?'―':x.importance.toFixed(2)}</td><td><b>${x.reliability}</b></td><td>${x.coverage}%</td></tr>`).join('');return usable.length?`<div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>#</th><th>項目</th><th>${esc(c.labelA)}平均</th><th>${esc(c.labelB)}平均</th><th>差</th><th>効果量</th><th>探索指数</th><th>信頼</th><th>充足</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty"><h3>比較可能な項目がありません</h3></div>'}
function teacherAnalysisHtml(){const a=teacherAnalysis();state.analysisMeta={datasetSchema:TEACHER_DATASET_SCHEMA,lastAnalyzedAt:a.analyzedAt,lastTeacherCount:a.teacherCount};save();const labelHtml=a.labels.map(x=>`<span class="badge">${esc(x.label)} ${x.count}</span>`).join(' '),sections=a.comparisons.map((c,i)=>`<section class="analysis-deep-section"><h3>${esc(c.title)}</h3><p class="muted">${c.labelA} ${c.a.length}頭 ／ ${c.labelB} ${c.b.length}頭。探索指数＝|標準化効果量| × サンプル安定係数 × データ充足率。モデル重みではなく、次に検証すべき特徴の優先順位です。</p>${analysisTableHtml(c)}</section>`).join(''),corr=a.correlations.length?`<section class="analysis-deep-section"><h3>項目間の重複チェック</h3><p class="muted">相関 |r| ≥ 0.55 の組み合わせです。強く似た項目を二重に高評価しないための確認に使います。</p><div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>#</th><th>項目A</th><th>項目B</th><th>相関 r</th><th>有効頭数</th></tr></thead><tbody>${a.correlations.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.a)}</td><td>${esc(x.b)}</td><td>${x.r.toFixed(2)}</td><td>${x.n}</td></tr>`).join('')}</tbody></table></div></section>`:'';return`<div class="dialog-head"><div><div class="eyebrow">Teacher Data Analyzer 2</div><h2>教師データ深掘り解析</h2></div><button type="button" class="icon-btn detail-top-close">×</button></div><section class="analysis-summary analysis-summary-5"><div><span>教師データ</span><strong>${a.teacherCount}頭</strong></div><div><span>重賞勝ち</span><strong>${a.winnerCount}頭</strong></div><div><span>非重賞比較群</span><strong>${a.comparisonCount}頭</strong></div><div><span>GⅠ勝ち</span><strong>${a.g1Count}頭</strong></div><div><span>GⅡ・GⅢ勝ち</span><strong>${a.g23Count}頭</strong></div></section><p>${labelHtml}</p><p class="muted">ラベル元：クラス自動 ${a.sourceCounts.class}頭 ／ 重賞手動 ${a.sourceCounts.manual}頭 ／ 旧実績欄 ${a.sourceCounts.legacy}頭</p><div class="analysis-legend"><b>信頼A</b> 両群30頭以上・充足75%以上　／　<b>B</b> 両群15頭以上・充足55%以上　／　<b>C</b> それ未満</div>${sections}${corr}<h3>解釈上の注意</h3><div class="notes">この解析は「平均との差」から一段進め、効果量・サンプル数・欠損率・項目間相関を同時に確認する探索解析です。探索指数は将来確率や因果効果ではなく、2026 Season Modelへ採用する候補を絞るための指標です。最終的な重みは、層別解析と検証データでの再現性を確認してから決定します。</div>`}
function openTeacherAnalysis(){try{E.detailContent.innerHTML=teacherAnalysisHtml();E.detailDialog.dataset.horseId='';E.detailDialog.showModal();requestAnimationFrame(()=>E.detailDialog.scrollTop=0)}catch(e){alert(e.message)}}

function parseCsvRows(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')quoted=false;else cell+=ch}else if(ch==='"')quoted=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=ch}if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}return rows}
function decodeCarrotCsv(buffer){const u8=new Uint8Array(buffer);try{const utf=new TextDecoder('utf-8',{fatal:true}).decode(u8);if(utf.includes('募集馬名')&&utf.includes('No.'))return utf}catch(e){}try{return new TextDecoder('shift_jis').decode(u8)}catch(e){throw new Error('CSVの文字コードを読み取れませんでした。UTF-8またはCP932/Shift_JISで保存してください。')}}
function carrotCsvDate(v){const m=t(v).match(/(\d{1,2})月(\d{1,2})日/);return m?`2025-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`:''}
function carrotCsvColor(v){const map={'鹿':'鹿毛','栗':'栗毛','黒鹿':'黒鹿毛','青鹿':'青鹿毛','芦':'芦毛','青':'青毛','栃栗':'栃栗毛'};const x=t(v);return map[x]||x}
function carrotCsvArea(v){const x=t(v);return x==='東'?'美浦':x==='西'?'栗東':x==='地方'?'地方':area(x)}
function carrotCsvSex(v){const x=t(v);return x==='メス'?'牝':sex(x)}
function carrotCsvNumber(v){const x=t(v).replace(/[,\s円万円口]/g,'');return x===''?null:Number(x)}
function parseCarrotCsv(text){const rows=parseCsvRows(text).filter(r=>r.some(c=>t(c)));if(rows.length<2)throw new Error('CSVに募集馬データがありません。');const headers=rows[0].map(c=>t(c).replace(/^\uFEFF/,'')),required=['No.','募集馬名','父','母','母の父','性別','毛色','生年月日(2025年)','体高','胸囲','管囲','体重','生産牧場','東西','予定厩舎','一頭総額（万円）','一口金額（円）'];const missing=required.filter(h=>!headers.includes(h));if(missing.length)throw new Error('必要な列がありません：'+missing.join('、'));const idx=Object.fromEntries(headers.map((h,i)=>[h,i])),get=(r,h)=>r[idx[h]]??'';return rows.slice(1).filter(r=>t(get(r,'No.'))).map((r,i)=>{const horseNo=carrotCsvNumber(get(r,'No.')),price=carrotCsvNumber(get(r,'一頭総額（万円）')),sharePrice=carrotCsvNumber(get(r,'一口金額（円）')),stableArea=carrotCsvArea(get(r,'東西')),shareCount=stableArea==='地方'?100:400;return{row:i+2,horseNo,motherPriority:t(get(r,'母馬優先'))==='●',name:t(get(r,'募集馬名')),sire:t(get(r,'父')),dam:t(get(r,'母')),broodmareSire:t(get(r,'母の父')),sex:carrotCsvSex(get(r,'性別')),coatColor:carrotCsvColor(get(r,'毛色')),birthDate:carrotCsvDate(get(r,'生年月日(2025年)')),measurements:{height:carrotCsvNumber(get(r,'体高')),girth:carrotCsvNumber(get(r,'胸囲')),cannon:carrotCsvNumber(get(r,'管囲')),weight:carrotCsvNumber(get(r,'体重'))},breeder:t(get(r,'生産牧場')),stableArea,trainer:t(get(r,'予定厩舎')),price,shareCount,sharePrice}})}
function validateCarrotCsv(records){const errors=[],warnings=[],seen=new Set();records.forEach(r=>{if(!Number.isInteger(r.horseNo)||r.horseNo<1)errors.push(`行${r.row}: 募集番号が不正`);if(seen.has(r.horseNo))errors.push(`No.${r.horseNo}: CSV内で募集番号が重複`);seen.add(r.horseNo);['name','sire','dam','broodmareSire','sex','birthDate','breeder','stableArea','trainer'].forEach(k=>{if(!r[k])errors.push(`No.${r.horseNo}: ${k}が未入力`)});const m=r.measurements;if(!(m.weight>=300&&m.weight<=650))warnings.push(`No.${r.horseNo}: 体重 ${m.weight}kg を確認`);if(!(m.height>=130&&m.height<=180))warnings.push(`No.${r.horseNo}: 体高 ${m.height}cm を確認`);if(!(m.girth>=140&&m.girth<=210))warnings.push(`No.${r.horseNo}: 胸囲 ${m.girth}cm を確認`);if(!(m.cannon>=15&&m.cannon<=25))warnings.push(`No.${r.horseNo}: 管囲 ${m.cannon}cm を確認`);if(r.price!=null&&r.sharePrice!=null&&r.shareCount&&r.price*10000!==r.sharePrice*r.shareCount)errors.push(`No.${r.horseNo}: 総額・一口価格・口数が不一致`);if(!['牡','牝','せん'].includes(r.sex))errors.push(`No.${r.horseNo}: 性別「${r.sex}」を確認`);if(!['美浦','栗東','地方'].includes(r.stableArea))errors.push(`No.${r.horseNo}: 所属「${r.stableArea}」を確認`)});const existing=records.filter(r=>state.horses.some(h=>h.year===2026&&h.club==='キャロット'&&h.horseNo===r.horseNo));return{errors,warnings,existing}}
function carrotCsvHorse(r){const now=new Date().toISOString(),id=uid();return{id,year:2026,club:'キャロット',horseNo:r.horseNo,name:r.name,motherPriority:r.motherPriority,sex:r.sex,coatColor:r.coatColor,birthDate:r.birthDate,sire:r.sire,dam:r.dam,broodmareSire:r.broodmareSire,stableArea:r.stableArea,trainer:r.trainer,breeder:r.breeder,trainingFarm:'',currentLocation:'',horseClass:'',englishName:'',nameOrigin:'',pedigreeCross:'',currentStatus:{surface:'',className:'',recordText:'',wins:null,seconds:null,thirds:null,others:null,starts:null},price:r.price,shareCount:r.shareCount,sharePrice:r.sharePrice,recruitmentPr:'',internalId:internalId('キャロット',2026,r.horseNo,id),measurements:r.measurements,measurementHistory:mergeMeasurementHistory([],[],r.measurements,'carrot-csv',''),measurementSource:{type:'carrot-csv',url:'',importedAt:now},sourceUrl:'',photoUrl:'',photos:[],mainPhotoId:'',photoComment:'',photoAi:{scores:Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,null])),summary:'',updatedAt:''},videoUrl:'',videos:[],gaitComment:'',gaitAi:{scores:Object.fromEntries(GAIT_AI_FIELDS.map(k=>[k,null])),summary:'',updatedAt:''},favorite:false,notes:'',management:{owned:false,comparisonExcluded:false,tags:[]},teacherData:{enabled:false,rank:'',registeredAt:'',gradedWinner:false,g1Winner:false,finalRating:null,satisfaction:null,retrospective:'',comment:''},evaluation:normalizeEvaluation({}),createdAt:now,updatedAt:now,changeLog:[{at:now,action:'キャロットCSV一括取込'}]}}
async function importCarrotCsvFile(file){const status=E.carrotCsvStatus;try{status.textContent=`「${file.name}」を検証しています…`;status.className='muted';const text=decodeCarrotCsv(await file.arrayBuffer()),records=parseCarrotCsv(text),v=validateCarrotCsv(records);const nos=records.map(r=>r.horseNo).sort((a,b)=>a-b),expected=nos.length?Array.from({length:nos[nos.length-1]},(_,i)=>i+1):[],missingNos=expected.filter(x=>!nos.includes(x));if(missingNos.length)v.errors.push('募集番号の欠番：'+missingNos.join(','));if(v.errors.length)throw new Error(`検証エラー ${v.errors.length}件\n`+v.errors.slice(0,12).join('\n'));const summary=`検出 ${records.length}頭 / エラー0件 / 注意 ${v.warnings.length}件 / 既存重複 ${v.existing.length}頭`;status.textContent=summary;status.className='muted import-status-ok';let message=summary+'\n\n';if(records.length!==94)message+=`⚠ 想定94頭に対して ${records.length}頭です。\n`;if(v.warnings.length)message+=`注意例：\n${v.warnings.slice(0,6).join('\n')}\n\n`;if(v.existing.length)message+=`既存の2026キャロット募集番号が ${v.existing.length}頭あります。既存馬は上書きせずスキップします。\n\n`;message+='検証済みデータを一括登録しますか？';if(!confirm(message))return;const existingNos=new Set(state.horses.filter(h=>h.year===2026&&h.club==='キャロット'&&h.horseNo!=null).map(h=>h.horseNo)),add=records.filter(r=>!existingNos.has(r.horseNo)).map(carrotCsvHorse);if(!add.length){toast('新規登録対象はありません');return}state=save({...state,horses:[...state.horses,...add]});refreshFilters();render();status.textContent=`${add.length}頭を登録しました（既存 ${records.length-add.length}頭は保持）`;status.className='muted import-status-ok';toast(`キャロット募集馬 ${add.length}頭を一括登録しました`)}catch(err){console.error(err);status.textContent=err.message;status.className='muted import-status-error';alert('キャロットCSVを取り込めませんでした。\n'+err.message)}}
async function exportJ(){await hydrateStatePhotos(state);const b=new Blob([JSON.stringify({...state,version:V,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`horse-evaluator-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(u);toast('バックアップを書き出しました')}
async function importJ(f, replace=true){
  const before=state;
  try{
    if(!f) throw new Error('復元ファイルが選択されていません。');
    if(E.restoreStatus){
      E.restoreStatus.textContent=`「${f.name}」を読み込んでいます…`;
      E.restoreStatus.className='muted';
    }
    // iOS Safari / ホーム画面追加環境でも確実に読めるようFileReaderを使用
    const text=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(new Error('選択したファイルを読み込めませんでした。'));
      reader.onabort=()=>reject(new Error('ファイルの読み込みが中断されました。'));
      reader.readAsText(f,'UTF-8');
    });
    if(E.restoreStatus) E.restoreStatus.textContent='JSONを検証しています…';
    let raw;
    try{raw=JSON.parse(text)}catch{throw new Error('JSONの構文が不正です。ファイルが途中で切れていないか確認してください。')}
    const m=migrate(raw),report=validateImport(raw,m);
    let next;
    if(replace){
      next=m;
    }else{
      const map=new Map(state.horses.map(h=>[h.id,h]));
      m.horses.forEach(h=>map.set(h.id,h));
      next={...base(),modelSettings:m.modelSettings||state.modelSettings,horses:[...map.values()]};
    }
    next.version=V;
    next.updatedAt=new Date().toISOString();
    await persistHorsePhotosForState(next);
    const nextJson=JSON.stringify(persistableState(next));
    const previousJson=localStorage.getItem(K);
    if(E.restoreStatus) E.restoreStatus.textContent=`${next.horses.length}頭を保存しています…`;
    try{
      localStorage.removeItem(PRE_IMPORT_K);
      localStorage.removeItem(K);
      localStorage.setItem(K,nextJson);
    }catch(storageError){
      try{localStorage.removeItem(K);if(previousJson!==null)localStorage.setItem(K,previousJson)}catch(rollbackError){console.error('旧データの再保存にも失敗しました',rollbackError)}
      throw new Error('復元データを保存できませんでした。ブラウザの保存容量が不足している可能性があります。');
    }
    const persistedText=localStorage.getItem(K);
    if(!persistedText) throw new Error('保存後に復元データを確認できませんでした。');
    const roundTrip=migrate(JSON.parse(persistedText));
    if(roundTrip.horses.length!==next.horses.length) throw new Error(`保存後の件数が一致しません（予定${next.horses.length}頭／保存${roundTrip.horses.length}頭）。`);
    state=await hydrateStatePhotos(roundTrip);state=await hydrateStateVideos(state);
    render();
    window.scrollTo({top:0,behavior:'instant'});
    const msg=`${report.count}頭を${replace?'置換復元':'追加・更新'}しました`;
    if(E.restoreStatus){E.restoreStatus.textContent=msg;E.restoreStatus.className='muted import-status-ok'}
    toast(msg);
    alert(msg);
  }catch(e){
    state=before;
    console.error(e);
    const msg=`JSONを読み込めませんでした。${e?.message?' '+e.message:''}`;
    if(E.restoreStatus){E.restoreStatus.textContent=msg;E.restoreStatus.className='muted import-status-error'}
    alert(msg);
  }
}


function applyImportedData(data){
  pendingImportedExtras={englishName:t(data.englishName),nameOrigin:t(data.nameOrigin),pedigreeCross:t(data.pedigreeCross),currentStatus:data.currentStatus?{...data.currentStatus}:null,measurementHistory:normalizeMeasurementHistory(data.measurementHistory||[]),measurementSource:data.measurementSource||null};
  const fields=['year','club','horseNo','name','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','currentLocation','horseClass','price','shareCount','sharePrice','sourceUrl','recruitmentPr','notes'];
  fields.forEach(k=>{if(data[k]!=null&&$(k))$(k).value=data[k]});
  const m=data.measurements||{};['weight','height','girth','cannon'].forEach(k=>{if(m[k]!=null)$(k).value=m[k]});
  setImportStatus(`${data.club||'クラブ'}：${data.name} を入力欄へ反映しました。内容を確認し、保存してください。`,'ok');
}
function closeHorseDialog(){clearAiImportInputs();if(E.horseDialog.open)E.horseDialog.close()}
function closeDetailDialog(){if(E.detailDialog.open)E.detailDialog.close()}

$('newHorseBtn').onclick=openNew;
$('closeDialogBtn').onclick=$('cancelBtn').onclick=closeHorseDialog;
E.horseDialog.addEventListener('close',clearAiImportInputs);
$('detailCloseBtn').onclick=closeDetailDialog;
E.detailContent.addEventListener('click',e=>{
  if(e.target.closest('.detail-top-close')){closeDetailDialog();return}
  const similar=e.target.closest('[data-similar-id]');
  if(similar){detail(similar.dataset.similarId);return}
  const b=e.target.closest('[data-detail-photo]');
  if(b){const h=state.horses.find(x=>x.id===E.detailDialog.dataset.horseId),pm=h?normalizePhotos(h):null,img=$('detailMainPhoto');if(pm&&img){const p=pm.photos[Number(b.dataset.detailPhoto)];if(p)img.src=p.src}}
});
E.horseList.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const h=state.horses.find(x=>x.id===b.dataset.id);if(!h)return;
  if(b.dataset.a==='detail')detail(h.id);
  if(b.dataset.a==='edit')openEdit(h.id);
  if(b.dataset.a==='favorite'){h.favorite=!h.favorite;h.updatedAt=new Date().toISOString();try{state=save();render()}catch(err){alert('お気に入りを保存できませんでした。\n'+err.message)}}
  if(b.dataset.a==='teacher'){const now=new Date().toISOString();h.teacherData=h.teacherData||{};h.teacherData.enabled=!h.teacherData.enabled;h.teacherData.registeredAt=h.teacherData.enabled?(h.teacherData.registeredAt||now):'';h.updatedAt=now;h.changeLog=[...(h.changeLog||[]).slice(-49),{at:now,action:h.teacherData.enabled?'教師データに追加':'教師データから除外'}];try{state=save();render();toast(h.teacherData.enabled?'教師データに追加しました':'教師データから除外しました')}catch(err){alert('教師データ設定を保存できませんでした。\n'+err.message)}}
  if(b.dataset.a==='delete'&&confirm(`「${h.name}」を削除しますか？`)){const keys=(h.photos||[]).map(p=>p.dbKey||p.id),videoKeys=(h.videos||[]).map(v=>v.dbKey||v.id);const before=state;state={...state,horses:state.horses.filter(x=>x.id!==h.id)};try{state=save(state);for(const key of keys)await photoDbDelete(key).catch(console.warn);for(const key of videoKeys)await videoDbDelete(key).catch(console.warn);render();toast('削除しました')}catch(err){state=before;alert('削除結果を保存できませんでした。\n'+err.message)}}
});
E.horseForm.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
    const h=readForm();
    if(!h.name)throw new Error('馬名を入力してください。');
    if(!Number.isFinite(h.year))throw new Error('年度を入力してください。');
    const i=state.horses.findIndex(x=>x.id===h.id);
    const oldPhotoKeys=i>=0?(state.horses[i].photos||[]).map(p=>p.dbKey||p.id):[];
    const oldVideoKeys=i>=0?(state.horses[i].videos||[]).map(v=>v.dbKey||v.id):[];
    await persistHorsePhotos(h);
    await persistHorseVideos(h);
    const nextHorses=state.horses.map(x=>typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x)));
    if(i>=0)nextHorses[i]=h;else nextHorses.push(h);
    const saved=save({...state,horses:nextHorses});
    state=saved;const newPhotoKeys=new Set((h.photos||[]).map(p=>p.dbKey||p.id));for(const key of oldPhotoKeys)if(key&&!newPhotoKeys.has(key))photoDbDelete(key).catch(console.warn);const newVideoKeys=new Set((h.videos||[]).map(v=>v.dbKey||v.id));for(const key of oldVideoKeys)if(key&&!newVideoKeys.has(key))videoDbDelete(key).catch(console.warn);closeHorseDialog();render();toast(i>=0?'更新しました':'登録しました');
  }catch(err){console.error(err);alert('保存できませんでした。\n'+(err.message||'入力内容と保存容量を確認してください。'))}
});
['yearFilter','clubFilter','sexFilter','stableAreaFilter','sortSelect','favoriteOnly','dataViewFilter'].forEach(id=>$(id).addEventListener('change',()=>{saveUi();render()}));
E.searchInput.addEventListener('input',()=>{saveUi();render()});
E.resetFiltersBtn.onclick=()=>{E.yearFilter.value='';E.clubFilter.value='';E.sexFilter.value='';E.stableAreaFilter.value='';E.searchInput.value='';E.sortSelect.value='horseNo';E.favoriteOnly.checked=false;if(E.dataViewFilter)E.dataViewFilter.value='all';saveUi();render()};
$('photoFiles').addEventListener('change',async e=>{await addPhotoFiles(e.target.files||[]);e.target.value=''});
$('addPhotoUrlBtn').onclick=()=>{const url=prompt('写真URLを入力してください。');if(!url)return;if(editPhotos.length>=8){alert('写真は1頭8枚までです。');return}editPhotos.push({id:uid(),src:t(url),type:'url',createdAt:new Date().toISOString(),main:editPhotos.length===0});renderPhotoEditor()};
$('photoEditorGallery').addEventListener('click',e=>{const del=e.target.closest('[data-photo-delete]'),move=e.target.closest('[data-photo-move]');if(del){editPhotos=editPhotos.filter(x=>x.id!==del.dataset.photoDelete);if(editPhotos.length&&!editPhotos.some(x=>x.main))editPhotos[0].main=true;renderPhotoEditor()}else if(move){const i=editPhotos.findIndex(x=>x.id===move.dataset.id),j=move.dataset.photoMove==='up'?i-1:i+1;if(i>=0&&j>=0&&j<editPhotos.length){[editPhotos[i],editPhotos[j]]=[editPhotos[j],editPhotos[i]];renderPhotoEditor()}}});
$('photoEditorGallery').addEventListener('change',e=>{const r=e.target.closest('[data-photo-main]');if(r){editPhotos.forEach(x=>x.main=x.id===r.dataset.photoMain)}});
$('videoFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;if(!/video\/(mp4|quicktime)/i.test(f.type)&&!/\.(mp4|mov)$/i.test(f.name)){alert('MP4またはMOV形式の動画を選択してください。');return}if(f.size>1024*1024*1024){alert('動画サイズが1GBを超えています。端末容量を確認してください。');return}const id=uid(),src=URL.createObjectURL(f);editVideos=[{id,dbKey:id,src,type:'file',name:f.name,mimeType:f.type||'video/mp4',size:f.size,label:'歩様動画',createdAt:new Date().toISOString(),_blob:f}];renderVideoEditor()});
$('addVideoUrlBtn').onclick=()=>{const current=editVideos[0]?.type==='url'?editVideos[0].url:'';const url=prompt('歩様動画URLを入力してください。',current);if(!url)return;editVideos=[{id:uid(),url:t(url),type:'url',label:'歩様動画',createdAt:new Date().toISOString()}];$('videoUrl').value=t(url);renderVideoEditor()};
$('videoEditorList').addEventListener('click',e=>{const b=e.target.closest('[data-video-delete]');if(b){editVideos=[];$('videoUrl').value='';renderVideoEditor()}});
$('applyPhotoAiJsonBtn').onclick=applyPhotoAiJson;$('copyPhotoAiTemplateBtn').onclick=copyPhotoAiTemplate;
$('applyGaitAiJsonBtn').onclick=applyGaitAiJson;
$('copyGaitAiTemplateBtn').onclick=copyGaitAiTemplate;
const gaitTransferButton=$('applyGaitToEvaluationBtn');
if(gaitTransferButton){
  gaitTransferButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();applyGaitToEvaluation()});
}
document.addEventListener('click',e=>{
  const button=e.target.closest&&e.target.closest('#applyGaitToEvaluationBtn');
  if(button&&button!==gaitTransferButton){e.preventDefault();applyGaitToEvaluation()}
});
$('applyFullAiJsonBtn').onclick=applyFullAiJson;$('copyFullAiTemplateBtn').onclick=copyFullAiTemplate;
E.importTextBtn.onclick=()=>{try{const text=E.pageText.value;if(!t(text))throw new Error('ページ本文を貼り付けてください。');const format=selectedImportFormat(text,t($('sourceUrl').value));if(!format)throw new Error('クラブ形式を判定できませんでした。');const data=parseImportedPage(format,text,t($('sourceUrl').value));applyImportedData(data)}catch(err){console.error(err);setImportStatus(err.message,'error');alert('本文を取り込めませんでした。\n'+err.message)}};
E.importUrlBtn.onclick=async()=>{try{const url=t($('sourceUrl').value);if(!url)throw new Error('募集馬ページURLを入力してください。');E.importUrlBtn.disabled=true;setImportStatus('ページ本文を取得しています…');const text=await fetchPageText(url);E.pageText.value=text;const format=selectedImportFormat(text,url);if(!format)throw new Error('クラブ形式を判定できませんでした。');const data=parseImportedPage(format,text,url);applyImportedData(data)}catch(err){console.error(err);E.pageText.value='';setImportStatus(err.message,'error');alert('URLから取り込めませんでした。\n'+err.message)}finally{E.importUrlBtn.disabled=false}};

if(E.carrotCsvInput)E.carrotCsvInput.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(f)importCarrotCsvFile(f)});
$('exportBtn').onclick=exportJ;$('exportTeacherBtn').onclick=exportTeacherDataset;$('teacherAnalysisBtn').onclick=openTeacherAnalysis;$('importInput').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(E.restoreStatus){E.restoreStatus.textContent=f?`「${f.name}」を選択しました。復元を開始します…`:'ファイルが選択されませんでした。';E.restoreStatus.className='muted'}if(f){setTimeout(()=>importJ(f,true),0)}e.target.value='';});
$('seedBtn').onclick=()=>{const now=new Date().toISOString();state.horses.push({id:uid(),year:2026,club:'ユニオン',horseNo:14,name:'リフレイムの2025',sex:'牝',birthDate:'2025-03-29',sire:'エピファネイア',dam:'リフレイム',broodmareSire:'アメリカンファラオ',stableArea:'美浦',trainer:'黒岩陽一',breeder:'千里ファーム',trainingFarm:'山口ステーブル',price:8800,shareCount:800,sharePrice:110000,recruitmentPr:'Sprint 1.3動作確認用の募集時PRです。',internalId:'UNION-2026-014',measurements:{weight:436,height:150,girth:172,cannon:20.5},sourceUrl:'https://www.union-oc.co.jp/id/4014#open_PHOTO',photoUrl:'',videoUrl:'',favorite:false,notes:'Sprint 1.2動作確認用',management:{owned:false,comparisonExcluded:false,tags:[]},teacherData:{enabled:false,rank:'',registeredAt:'',finalRating:null,satisfaction:null,retrospective:'',comment:''},evaluation:normalizeEvaluation({}),createdAt:now,updatedAt:now,changeLog:[{at:now,action:'サンプル登録'}]});save();render();toast('サンプルを追加しました')};
$('modelSettingsBtn').onclick=openModelSettings;$('closeModelBtn').onclick=$('cancelModelBtn').onclick=()=>$('modelDialog').close();Object.values(modelInputs()).forEach(el=>el.oninput=updateWeightTotal);$('resetWeightsBtn').onclick=setDefaultWeights;$('modelForm').onsubmit=e=>{e.preventDefault();const inputs=modelInputs(),weights=Object.fromEntries(Object.entries(inputs).map(([k,el])=>[k,Number(el.value||0)])),total=Object.values(weights).reduce((a,b)=>a+b,0);if(total!==100){alert('重みの合計を100%にしてください。');return}const thresholds={s:Number($('thresholdS').value),a:Number($('thresholdA').value),b:Number($('thresholdB').value)};if(!(thresholds.s>thresholds.a&&thresholds.a>thresholds.b)){alert('推奨度基準は S > A > B の順にしてください。');return}state.modelSettings=normalizeModel({name:$('modelName').value,weights,thresholds});save();$('modelDialog').close();render();toast('評価モデルを保存しました')};
$('clearBtn').onclick=async()=>{if(confirm('全データを削除しますか？')){state=base();save();await photoDbClear().catch(console.warn);await videoDbClear().catch(console.warn);render()}};async function initApp(){initEvaluationControls();state=load();await migrateLegacyPhotos(state);await hydrateStatePhotos(state);await hydrateStateVideos(state);refreshFilters();loadUi();render()}initApp().catch(e=>{console.error(e);alert('アプリの初期化中にエラーが発生しました。\n'+e.message)});})();
