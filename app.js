(()=>{'use strict';
const K='horseEvaluator3',V='3.1.28',UI_K='horseEvaluator3_ui',PRE_IMPORT_K='horseEvaluator3_preImportBackup',PHOTO_DB='horseEvaluator3_photos',PHOTO_STORE='photos',VIDEO_DB='horseEvaluator3_videos',VIDEO_STORE='videos',$=id=>document.getElementById(id);let state;
const E={yearFilter:$('yearFilter'),clubFilter:$('clubFilter'),sexFilter:$('sexFilter'),stableAreaFilter:$('stableAreaFilter'),searchInput:$('searchInput'),sortSelect:$('sortSelect'),favoriteOnly:$('favoriteOnly'),dashboard:$('dashboard'),horseList:$('horseList'),resultCount:$('resultCount'),emptyState:$('emptyState'),horseDialog:$('horseDialog'),horseForm:$('horseForm'),detailDialog:$('detailDialog'),detailContent:$('detailContent'),toast:$('toast'),importUrlBtn:$('importUrlBtn'),importStatus:$('importStatus'),importTextBtn:$('importTextBtn'),pageText:$('pageText'),importFormat:$('importFormat'),restoreStatus:$('restoreStatus'),resetFiltersBtn:$('resetFiltersBtn')};
const DEFAULT_MODEL={name:'標準モデル',weights:{gait:30,body:25,growth:15,measurement:10,pedigree:10,connections:10},thresholds:{s:90,a:80,b:70}};
const GROUP_LABELS={gait:'歩様',body:'馬体',growth:'成長性',measurement:'測尺',pedigree:'血統・配合',connections:'厩舎・牧場'};
const GROUP_FIELDS={gait:['frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness'],body:['hindquarter','hindShape','chest','shoulder','back','bone','balance'],growth:['growth'],pedigree:['pedigree'],connections:['trainer','farm']};
const EVAL_FIELDS=['hindquarter','hindShape','chest','shoulder','back','bone','balance','growth','frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness','pedigree','trainer','farm'];
const EVAL_IDS={hindquarter:'evHindquarter',hindShape:'evHindShape',chest:'evChest',shoulder:'evShoulder',back:'evBack',bone:'evBone',balance:'evBalance',growth:'evGrowth',frontRange:'evFrontRange',hindStep:'evHindStep',propulsion:'evPropulsion',flexibility:'evFlexibility',stride:'evStride',rhythm:'evRhythm',symmetry:'evSymmetry',lightness:'evLightness',pedigree:'evPedigree',trainer:'evTrainer',farm:'evFarm'};
const PHOTO_AI_FIELDS=['hindquarter','explosion','shoulder','chest','back','neck','bone','balance','growth','overall'];
const PHOTO_AI_IDS={hindquarter:'aiPhotoHindquarter',explosion:'aiPhotoExplosion',shoulder:'aiPhotoShoulder',chest:'aiPhotoChest',back:'aiPhotoBack',neck:'aiPhotoNeck',bone:'aiPhotoBone',balance:'aiPhotoBalance',growth:'aiPhotoGrowth',overall:'aiPhotoOverall'};
const PHOTO_AI_LABELS={hindquarter:'トモ容量',explosion:'トモの爆発力',shoulder:'肩の角度',chest:'胸前',back:'背中・腰',neck:'首差し',bone:'骨量',balance:'全体バランス',growth:'成長期待度',overall:'総合馬体評価'};
let editPhotos=[],editVideos=[];
const GAIT_AI_FIELDS=['frontRange','hindStep','propulsion','flexibility','stride','rhythm','symmetry','lightness','overall'];
const GAIT_AI_IDS={frontRange:'aiGaitFrontRange',hindStep:'aiGaitHindStep',propulsion:'aiGaitPropulsion',flexibility:'aiGaitFlexibility',stride:'aiGaitStride',rhythm:'aiGaitRhythm',symmetry:'aiGaitSymmetry',lightness:'aiGaitLightness',overall:'aiGaitOverall'};
const GAIT_AI_LABELS={frontRange:'前肢の可動域',hindStep:'後肢の踏み込み',propulsion:'推進力',flexibility:'柔軟性',stride:'ストライド',rhythm:'リズム',symmetry:'左右対称性',lightness:'歩様の軽さ',overall:'総合歩様評価'};
const EVAL_LABELS={hindquarter:'トモ容量',hindShape:'トモの形・厚み',chest:'胸前・胸の深さ',shoulder:'肩の構造',back:'背中・腰の連結',bone:'骨量',balance:'全体バランス',growth:'成長余地',frontRange:'前肢の可動域',hindStep:'後肢の踏み込み',propulsion:'推進力',flexibility:'柔軟性',stride:'ストライド',rhythm:'リズム',symmetry:'左右対称性',lightness:'歩様の軽さ',pedigree:'配合評価',trainer:'厩舎評価',farm:'生産・育成評価'};
function scoreValue(v){const x=Number(v);return Number.isFinite(x)&&x>=1&&x<=5?x:null}
function normalizeEvaluation(e={}){const scores={};EVAL_FIELDS.forEach(k=>scores[k]=scoreValue(e?.scores?.[k]??e?.[k]));return{scores,achievement:t(e.achievement),distanceCategory:t(e.distanceCategory),healthRisk:scoreValue(e.healthRisk),comment:t(e.comment)}}
function evaluationAverage(e){const vals=EVAL_FIELDS.map(k=>scoreValue(e?.scores?.[k])).filter(v=>v!=null);return vals.length?{average:vals.reduce((a,b)=>a+b,0)/vals.length,count:vals.length}:{average:null,count:0}}
function measurementScore(h){const m=h.measurements||{},vals=[];if(m.weight!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.weight)-430)/40)));if(m.height!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.height)-153)/5)));if(m.girth!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.girth)-175)/8)));if(m.cannon!=null)vals.push(Math.max(1,Math.min(5,3+(Number(m.cannon)-20)/1.5)));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}
function groupAverage(h,group){if(group==='measurement')return measurementScore(h);const ev=normalizeEvaluation(h.evaluation),vals=(GROUP_FIELDS[group]||[]).map(k=>scoreValue(ev.scores[k])).filter(v=>v!=null);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}
function weightedScore(h){const model=normalizeModel(state?.modelSettings),parts=[];Object.entries(model.weights).forEach(([g,w])=>{const a=groupAverage(h,g);if(a!=null&&w>0)parts.push({g,w,a})});const used=parts.reduce((s,p)=>s+p.w,0);if(!used)return{score:null,coverage:0};const score=parts.reduce((s,p)=>s+p.a*p.w,0)/used*20;const total=Object.values(model.weights).reduce((a,b)=>a+Number(b||0),0)||100;return{score,coverage:Math.round(used/total*100)}}
function scoreBreakdown(h){const model=normalizeModel(state?.modelSettings),rows=[];let usedWeight=0,rawTotal=0;Object.entries(model.weights).forEach(([group,weightRaw])=>{const weight=Number(weightRaw||0),average=groupAverage(h,group),fields=group==='measurement'?[]:(GROUP_FIELDS[group]||[]);const items=fields.map(k=>({key:k,label:EVAL_LABELS[k],score:scoreValue(normalizeEvaluation(h.evaluation).scores[k])}));if(average!=null&&weight>0){usedWeight+=weight;rawTotal+=average/5*weight}rows.push({group,label:GROUP_LABELS[group]||group,weight,average,points:average==null?null:average/5*weight,items})});const adjustedTotal=usedWeight?rawTotal/usedWeight*100:null;return{rows,rawTotal,usedWeight,adjustedTotal,totalWeight:Object.values(model.weights).reduce((a,b)=>a+Number(b||0),0)||100}}
function groupCompletion(h,group){if(group==='measurement'){const m=h.measurements||{},vals=['weight','height','girth','cannon'];return vals.filter(k=>m[k]!=null&&m[k]!=='').length/vals.length}const ev=normalizeEvaluation(h.evaluation),fields=GROUP_FIELDS[group]||[];if(!fields.length)return 0;return fields.filter(k=>scoreValue(ev.scores[k])!=null).length/fields.length}
function confidenceScore(h){const model=normalizeModel(state?.modelSettings),total=Object.values(model.weights).reduce((a,b)=>a+Number(b||0),0)||100;let weightedFields=0,coveredWeight=0;Object.entries(model.weights).forEach(([g,w])=>{if(w<=0)return;const c=groupCompletion(h,g);weightedFields+=w*c;if(c>0)coveredWeight+=w});const fieldCoverage=weightedFields/total*100,groupCoverage=coveredWeight/total*100;return Math.round(fieldCoverage*.7+groupCoverage*.3)}
function recommendation(h){const q=weightedScore(h);if(q.score==null)return{grade:'―',score:null,confidence:confidenceScore(h),className:'grade-none'};const th=normalizeModel(state?.modelSettings).thresholds;const grade=q.score>=th.s?'S':q.score>=th.a?'A':q.score>=th.b?'B':'C';return{grade,score:q.score,confidence:confidenceScore(h),className:'grade-'+grade.toLowerCase()}}
function stars(v){const x=Math.max(0,Math.min(5,Math.round(Number(v)||0)));return '★'.repeat(x)+'☆'.repeat(5-x)}
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
function transferGaitScoresToEvaluation(sourceScores=null){let count=0;GAIT_AI_FIELDS.filter(k=>k!=='overall').forEach(k=>{const sourceValue=sourceScores?scoreValue(sourceScores[k]??sourceScores.scores?.[k]):scoreValue($(GAIT_AI_IDS[k])?.value),ev=$(EVAL_IDS[k]);if(sourceValue!=null&&ev){ev.value=String(sourceValue);ev.dispatchEvent(new Event('change',{bubbles:true}));count++}});return count}
function applyGaitAiJson(){try{const x=extractJsonObject($('aiGaitJson').value);GAIT_AI_FIELDS.forEach(k=>{const v=x[k]??x.scores?.[k];if(v!=null){const el=$(GAIT_AI_IDS[k]);if(el)el.value=scoreValue(v)??''}});if(x.summary!=null)$('aiGaitSummary').value=t(x.summary);const count=transferGaitScoresToEvaluation(x);$('aiGaitJson').value='';toast(count?`AI歩様評価を反映し、評価シートへ${count}項目転記しました`:'AI歩様評価を反映しました')}catch(e){console.error(e);alert('AI歩様評価JSONの形式が正しくありません。')}}
function applyGaitToEvaluation(){const count=transferGaitScoresToEvaluation();if(!count){alert('転記できる歩様評価がありません。先にAI歩様評価JSONを反映するか、歩様評価を入力してください。');return}toast(`歩様評価シートへ${count}項目転記しました`)}
function copyGaitAiTemplate(){const payload={horse:t($('name').value)||'募集馬',instruction:'添付した歩様動画を解析し、JSONのみ返してください。',scale:'1=低い、3=標準、5=非常に高い',fields:GAIT_AI_LABELS,output:Object.fromEntries([...GAIT_AI_FIELDS.map(k=>[k,null]),['summary','']])};navigator.clipboard?.writeText(JSON.stringify(payload,null,2)).then(()=>toast('動画AIテンプレートをコピーしました')).catch(()=>alert(JSON.stringify(payload,null,2)))}
function fullAiTemplate(){return{schema:'horse-evaluator-ai-1',horse:{name:t($('name').value),club:$('club').value,horseNo:n($('horseNo').value),sex:$('sex').value,birthDate:$('birthDate').value,sire:t($('sire').value),dam:t($('dam').value),broodmareSire:t($('broodmareSire').value),trainer:t($('trainer').value),breeder:t($('breeder').value)},measurements:{weight:n($('weight').value),height:n($('height').value),girth:n($('girth').value),cannon:n($('cannon').value)},photoAi:{...Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,null])),summary:''},gaitAi:{...Object.fromEntries(GAIT_AI_FIELDS.map(k=>[k,null])),summary:''},evaluation:{scores:Object.fromEntries(EVAL_FIELDS.map(k=>[k,null])),healthRisk:null,comment:''}}}
function copyFullAiTemplate(){const x=fullAiTemplate();x.instruction='写真・歩様動画・測尺を解析し、このJSON構造を維持して値を入力し、JSONのみ返してください。';navigator.clipboard?.writeText(JSON.stringify(x,null,2)).then(()=>toast('統合AIテンプレートをコピーしました')).catch(()=>alert(JSON.stringify(x,null,2)))}
function applyFullAiJson(){try{const x=extractJsonObject($('fullAiJson').value),h=x.horse||x.profile||{},editingId=t($('horseId').value),currentName=t($('name').value),jsonName=t(h.name);if(editingId&&jsonName&&currentName&&jsonName!==currentName&&!confirm(`JSONの馬名「${jsonName}」は編集中の「${currentName}」と一致しません。\nAI評価だけをこの馬へ反映しますか？`))return;if(!editingId){const fields=['name','club','horseNo','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','price','shareCount','sharePrice','sourceUrl'];fields.forEach(k=>{if(h[k]!=null&&$(k))$(k).value=h[k]})}Object.entries(x.measurements||{}).forEach(([k,v])=>{if(['weight','height','girth','cannon'].includes(k)&&v!=null)$(k).value=v});const pa=x.photoAi||{};PHOTO_AI_FIELDS.forEach(k=>{const v=pa[k]??pa.scores?.[k];if(v!=null)$(PHOTO_AI_IDS[k]).value=scoreValue(v)??''});if(pa.summary!=null)$('aiPhotoSummary').value=t(pa.summary);const ga=x.gaitAi||x.videoAi||{};GAIT_AI_FIELDS.forEach(k=>{const v=ga[k]??ga.scores?.[k];if(v!=null)$(GAIT_AI_IDS[k]).value=scoreValue(v)??''});if(ga.summary!=null)$('aiGaitSummary').value=t(ga.summary);const gaitTransferred=transferGaitScoresToEvaluation(ga);const ev=x.evaluation||{};EVAL_FIELDS.forEach(k=>{const v=ev[k]??ev.scores?.[k];if(v!=null)$(EVAL_IDS[k]).value=scoreValue(v)??''});if(ev.healthRisk!=null)$('healthRisk').value=scoreValue(ev.healthRisk)??'';if(ev.comment!=null)$('evaluationComment').value=t(ev.comment);$('fullAiJson').value='';toast(gaitTransferred?`ChatGPT統合JSONを反映し、歩様評価シートへ${gaitTransferred}項目転記しました`:'ChatGPT統合JSONを反映しました')}catch(e){console.error(e);alert('統合JSONの形式が正しくありません。')}}

function mainPhoto(h){const p=normalizePhotos(h);return p.photos.find(x=>x.id===p.mainPhotoId)?.src||p.photos[0]?.src||t(h.photoUrl)}
function base(){return{version:V,app:'Horse Evaluator',modelSettings:normalizeModel(DEFAULT_MODEL),horses:[],updatedAt:new Date().toISOString()}}
function uid(){return crypto.randomUUID?crypto.randomUUID():'h-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
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
  const a=sourceArray(x),now=new Date().toISOString();
  return {
    version:V,sourceVersion:t(x?.version)||'unknown',app:'Horse Evaluator',modelSettings:normalizeModel(x?.modelSettings),updatedAt:now,
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
        sourceUrl:t(pick(h.sourceUrl,h.pageUrl)),photoUrl:t(pick(h.photoUrl,h.photo,h.files?.photo)),...normalizePhotos(h),
        videoUrl:t(pick(h.videoUrl,h.video,h.files?.video)),...normalizeVideos(h),favorite:Boolean(h.favorite),notes:t(pick(h.notes,h.memo)),evaluation:normalizeEvaluation(h.evaluation),
        createdAt,updatedAt,changeLog:normalizeLog(h.changeLog,createdAt)
      };
    })
  };
}
function validateImport(raw,m){const warnings=[];if(!m.horses.length)throw new Error('馬データが0件です。');const ids=new Set();m.horses.forEach((h,i)=>{if(ids.has(h.id))warnings.push(`${i+1}件目: ID重複`);ids.add(h.id);if(!h.name)warnings.push(`${i+1}件目: 馬名なし`)});return{sourceVersion:t(raw?.version)||'不明',count:m.horses.length,warnings}}
function toast(s){E.toast.textContent=s;E.toast.classList.add('show');clearTimeout(toast.x);toast.x=setTimeout(()=>E.toast.classList.remove('show'),1800)}
function refreshFilters(){const y=E.yearFilter.value,c=E.clubFilter.value,ys=[...new Set(state.horses.map(h=>h.year))].sort((a,b)=>b-a),cs=[...new Set(state.horses.map(h=>h.club))].sort();E.yearFilter.innerHTML='<option value="">すべて</option>'+ys.map(v=>`<option>${v}</option>`).join('');E.clubFilter.innerHTML='<option value="">すべて</option>'+cs.map(v=>`<option>${esc(v)}</option>`).join('');if(ys.map(String).includes(y))E.yearFilter.value=y;if(cs.includes(c))E.clubFilter.value=c}
function uiState(){return{year:E.yearFilter.value,club:E.clubFilter.value,sex:E.sexFilter.value,area:E.stableAreaFilter.value,query:E.searchInput.value,sort:E.sortSelect.value,favoriteOnly:E.favoriteOnly.checked}}
function saveUi(){localStorage.setItem(UI_K,JSON.stringify(uiState()))}
function loadUi(){try{const u=JSON.parse(localStorage.getItem(UI_K)||'{}');E.yearFilter.value=u.year||'';E.clubFilter.value=u.club||'';E.sexFilter.value=u.sex||'';E.stableAreaFilter.value=u.area||'';E.searchInput.value=u.query||'';E.sortSelect.value=u.sort||'horseNo';E.favoriteOnly.checked=Boolean(u.favoriteOnly)}catch(e){console.warn('表示条件の復元に失敗',e)}}
function list(){const y=E.yearFilter.value,c=E.clubFilter.value,sx=E.sexFilter.value,a=E.stableAreaFilter.value,q=E.searchInput.value.trim().toLowerCase(),fav=E.favoriteOnly.checked,s=E.sortSelect.value;return state.horses.filter(h=>(!y||String(h.year)===y)&&(!c||h.club===c)&&(!sx||h.sex===sx)&&(!a||h.stableArea===a)&&(!fav||h.favorite)&&(!q||[h.horseNo,h.name,h.club,h.sire,h.dam,h.broodmareSire,h.stableArea,h.trainer,h.breeder,h.trainingFarm,h.currentLocation,h.horseClass,h.internalId,h.notes].join(' ').toLowerCase().includes(q))).sort((x,z)=>s==='updatedAt'?new Date(z.updatedAt)-new Date(x.updatedAt):s==='name'?x.name.localeCompare(z.name,'ja'):s==='priceDesc'?(z.price??-1)-(x.price??-1):s==='priceAsc'?(x.price??Number.MAX_SAFE_INTEGER)-(z.price??Number.MAX_SAFE_INTEGER):s==='sharePriceAsc'?(x.sharePrice??Number.MAX_SAFE_INTEGER)-(z.sharePrice??Number.MAX_SAFE_INTEGER):(x.horseNo??9999)-(z.horseNo??9999)||x.name.localeCompare(z.name,'ja'))}
function metric(l,v,u){return`<div class="metric"><b>${v==null?'―':esc(v)}</b><span>${l}${v==null?'':' '+u}</span></div>`}
function card(h){const m=h.measurements||{},mp=mainPhoto(h),bg=mp?`style="background-image:url('${esc(mp)}')"`:'',r=recommendation(h);return`<article class="horse-card"><div class="photo" ${bg}>${mp?'':'NO PHOTO'}</div><div class="body"><div class="topline"><div><span class="badge">${h.year} ${esc(h.club)}</span>${h.horseNo!=null?`<span class="badge">No.${h.horseNo}</span>`:''}${h.stableArea?`<span class="badge">${esc(h.stableArea)}</span>`:''}<h3>${esc(h.name)}</h3><div class="horse-meta">${esc(h.sex)||'性別未設定'}${h.coatColor?'・'+esc(h.coatColor):''}${h.breeder?' ／ '+esc(h.breeder):''}</div>${(()=>{const q=evaluationAverage(h.evaluation);return q.average==null?'':`<div class="horse-meta">評価平均 <b>${q.average.toFixed(2)}</b>（${q.count}項目）</div>`})()}${r.score==null?'':`<div class="decision-strip"><div class="recommend-badge ${r.className}">${r.grade}</div><div><span>総合点</span><strong>${r.score.toFixed(1)}</strong></div><div><span>自信度</span><strong>${r.confidence}%</strong></div></div>`}</div><button class="favorite ${h.favorite?'on':''}" data-a="favorite" data-id="${h.id}">★</button></div><div class="pedigree">父：${esc(h.sire)||'―'}<br>母：${esc(h.dam)||'―'}<br>母父：${esc(h.broodmareSire)||'―'}<br>厩舎：${esc(h.trainer)||'―'}</div><div class="price-box"><b>総額 ${h.price==null?'―':money(h.price)+'万円'}</b><span>${h.shareCount==null?'募集口数 ―':money(h.shareCount)+'口'} ／ 1口 ${h.sharePrice==null?'―':money(h.sharePrice)+'円'}</span></div><div class="metrics">${metric('体重',m.weight,'kg')}${metric('体高',m.height,'cm')}${metric('胸囲',m.girth,'cm')}${metric('管囲',m.cannon,'cm')}</div><div class="card-actions"><button data-a="detail" data-id="${h.id}">詳細</button><button data-a="edit" data-id="${h.id}">編集</button><button data-a="delete" data-id="${h.id}" class="danger">削除</button></div><div class="updated">更新：${fmt(h.updatedAt)}</div></div></article>`}

function render(){refreshFilters();renderModelSummary();const a=list();E.dashboard.innerHTML=[['登録頭数',state.horses.length],['年度数',new Set(state.horses.map(h=>h.year)).size],['クラブ数',new Set(state.horses.map(h=>h.club)).size],['お気に入り',state.horses.filter(h=>h.favorite).length]].map(([l,v])=>`<div class="stat"><div class="num">${v}</div><div class="label">${l}</div></div>`).join('');E.resultCount.textContent=state.horses.length===a.length?`${a.length}頭`:`${a.length}頭 / 全${state.horses.length}頭`;E.horseList.innerHTML=a.map(card).join('');E.emptyState.classList.toggle('hidden',a.length!==0)}
function setImportStatus(msg,type=''){E.importStatus.textContent=msg;E.importStatus.className='muted '+(type==='ok'?'import-status-ok':type==='error'?'import-status-error':'')}
function renderPhotoEditor(){const box=$('photoEditorGallery');if(!box)return;$('photoCount').textContent=`${editPhotos.length}枚`;box.innerHTML=editPhotos.length?editPhotos.map((p,i)=>`<article class="photo-edit-card"><img src="${esc(p.src)}" alt="写真${i+1}"><div><label class="radio-line"><input type="radio" name="mainPhoto" data-photo-main="${p.id}" ${p.main||(!editPhotos.some(x=>x.main)&&i===0)?'checked':''}>代表写真</label><div class="photo-edit-actions"><button type="button" data-photo-move="up" data-id="${p.id}" ${i===0?'disabled':''}>↑</button><button type="button" data-photo-move="down" data-id="${p.id}" ${i===editPhotos.length-1?'disabled':''}>↓</button><button type="button" data-photo-delete="${p.id}" class="danger">削除</button></div></div></article>`).join(''):'<div class="photo-empty">写真はまだ登録されていません。</div>'}
async function compressPhoto(file){if(!file.type.startsWith('image/'))throw new Error('画像ファイルではありません。');const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=data});const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.78)}
async function addPhotoFiles(files){for(const file of [...files]){if(editPhotos.length>=8){alert('写真は1頭8枚までです。');break}try{const src=await compressPhoto(file);editPhotos.push({id:uid(),src,type:'file',createdAt:new Date().toISOString(),main:editPhotos.length===0})}catch(e){alert(`${file.name}: ${e.message}`)}}renderPhotoEditor()}
function photoGalleryHtml(h){const pm=normalizePhotos(h);if(!pm.photos.length)return'';return`<section class="detail-gallery"><div class="detail-main-photo"><img src="${esc(pm.photos.find(x=>x.id===pm.mainPhotoId)?.src||pm.photos[0].src)}" alt="代表写真" id="detailMainPhoto"></div><div class="detail-thumbs">${pm.photos.map((p,i)=>`<button type="button" data-detail-photo="${i}"><img src="${esc(p.src)}" alt="写真${i+1}"></button>`).join('')}</div></section>`}
function photoAiHtml(h){const pm=normalizePhotos(h),ai=pm.photoAi,rows=PHOTO_AI_FIELDS.filter(k=>ai.scores[k]!=null).map(k=>`<div><span>${PHOTO_AI_LABELS[k]}</span><b>${stars(ai.scores[k])} ${ai.scores[k]}/5</b></div>`).join('');if(!pm.photos.length&&!pm.photoComment&&!rows&&!ai.summary)return'';return`<section class="photo-ai-detail"><h3>写真・AI馬体評価</h3>${pm.photoComment?`<div class="notes"><b>写真コメント</b>\n${esc(pm.photoComment)}</div>`:''}${rows?`<div class="photo-ai-score-grid">${rows}</div>`:''}${ai.summary?`<div class="ai-summary"><span>AI写真総括</span><p>${esc(ai.summary)}</p></div>`:''}</section>`}
function applyPhotoAiJson(){try{const x=extractJsonObject($('aiPhotoJson').value);PHOTO_AI_FIELDS.forEach(k=>{if(x[k]!=null||x.scores?.[k]!=null)$(PHOTO_AI_IDS[k]).value=scoreValue(x[k]??x.scores[k])??''});if(x.summary!=null)$('aiPhotoSummary').value=t(x.summary);$('aiPhotoJson').value='';toast('AI写真評価を反映しました')}catch(e){console.error(e);alert('AI写真評価を反映できませんでした。\n'+(e.message||'入力内容を確認してください。'))}}
function copyPhotoAiTemplate(){const name=t($('name').value)||'募集馬',payload={horse:name,instruction:'添付した募集写真を評価し、1〜5点でJSONのみ返してください。',scale:'1=低い、3=標準、5=非常に高い',fields:Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,PHOTO_AI_LABELS[k]])),output:{hindquarter:null,explosion:null,shoulder:null,chest:null,back:null,neck:null,bone:null,balance:null,growth:null,overall:null,summary:''}};navigator.clipboard?.writeText(JSON.stringify(payload,null,2)).then(()=>toast('AI連携テンプレートをコピーしました')).catch(()=>alert(JSON.stringify(payload,null,2)))}
function openNew(){E.horseForm.reset();clearAiImportInputs();editPhotos=[];editVideos=[];renderPhotoEditor();renderVideoEditor();EVAL_FIELDS.forEach(k=>{const el=$(EVAL_IDS[k]);if(el)el.value=''});$('horseId').value='';$('year').value=new Date().getFullYear();$('dialogTitle').textContent='新規登録';setImportStatus('');if(E.pageText)E.pageText.value='';E.horseDialog.showModal()}
function openEdit(id){const h=state.horses.find(x=>x.id===id);if(!h)return;clearAiImportInputs();const pm=normalizePhotos(h),vm=normalizeVideos(h);editPhotos=pm.photos.map(x=>({...x,main:x.id===pm.mainPhotoId}));$('photoComment').value=pm.photoComment;PHOTO_AI_FIELDS.forEach(k=>{$(PHOTO_AI_IDS[k]).value=pm.photoAi.scores[k]??''});$('aiPhotoSummary').value=pm.photoAi.summary;editVideos=vm.videos.map(x=>({...x}));$('gaitComment').value=vm.gaitComment;GAIT_AI_FIELDS.forEach(k=>{$(GAIT_AI_IDS[k]).value=vm.gaitAi.scores[k]??''});$('aiGaitSummary').value=vm.gaitAi.summary;renderPhotoEditor();renderVideoEditor();['year','club','horseNo','name','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','currentLocation','horseClass','price','shareCount','sharePrice','sourceUrl','photoUrl','videoUrl','recruitmentPr','notes'].forEach(k=>$(k).value=h[k]??'');['weight','height','girth','cannon'].forEach(k=>$(k).value=h.measurements?.[k]??'');$('favorite').checked=h.favorite;const ev=normalizeEvaluation(h.evaluation);EVAL_FIELDS.forEach(k=>{const el=$(EVAL_IDS[k]);if(el)el.value=ev.scores[k]??''});$('achievement').value=ev.achievement;$('distanceCategory').value=ev.distanceCategory;$('healthRisk').value=ev.healthRisk??'';$('evaluationComment').value=ev.comment;$('horseId').value=h.id;$('dialogTitle').textContent='募集馬を編集';setImportStatus('');if(E.pageText)E.pageText.value='';E.horseDialog.showModal()}
function readForm(){const id=$('horseId').value||uid(),old=state.horses.find(h=>h.id===id),now=new Date().toISOString();return{id,year:Number($('year').value),club:$('club').value,horseNo:n($('horseNo').value),name:t($('name').value),sex:$('sex').value,coatColor:t($('coatColor').value),birthDate:$('birthDate').value,sire:t($('sire').value),dam:t($('dam').value),broodmareSire:t($('broodmareSire').value),stableArea:$('stableArea').value,trainer:t($('trainer').value),breeder:t($('breeder').value),trainingFarm:t($('trainingFarm').value),currentLocation:t($('currentLocation').value),horseClass:t($('horseClass').value),price:n($('price').value),shareCount:n($('shareCount').value),sharePrice:n($('sharePrice').value),recruitmentPr:t($('recruitmentPr').value),internalId:old?.internalId||internalId($('club').value,Number($('year').value),n($('horseNo').value),id),measurements:{weight:n($('weight').value),height:n($('height').value),girth:n($('girth').value),cannon:n($('cannon').value)},sourceUrl:t($('sourceUrl').value),photoUrl:t($('photoUrl').value),photos:editPhotos.map(x=>({...x})),mainPhotoId:editPhotos.find(x=>x.main)?.id||editPhotos[0]?.id||'',photoComment:t($('photoComment').value),photoAi:{scores:Object.fromEntries(PHOTO_AI_FIELDS.map(k=>[k,scoreValue($(PHOTO_AI_IDS[k]).value)])),summary:t($('aiPhotoSummary').value),updatedAt:now},videoUrl:t($('videoUrl').value),videos:editVideos.slice(0,1).map(x=>({...x})),gaitComment:t($('gaitComment').value),gaitAi:{scores:Object.fromEntries(GAIT_AI_FIELDS.map(k=>[k,scoreValue($(GAIT_AI_IDS[k]).value)])),summary:t($('aiGaitSummary').value),updatedAt:now},favorite:$('favorite').checked,notes:t($('notes').value),evaluation:{scores:Object.fromEntries(EVAL_FIELDS.map(k=>[k,scoreValue($(EVAL_IDS[k]).value)])),achievement:$('achievement').value,distanceCategory:$('distanceCategory').value,healthRisk:scoreValue($('healthRisk').value),comment:t($('evaluationComment').value)},createdAt:old?.createdAt||now,updatedAt:now,changeLog:[...(old?.changeLog||[]).slice(-49),{at:now,action:old?'更新':'登録'}]}}
function detail(id){E.detailDialog.dataset.horseId=id;const h=state.horses.find(x=>x.id===id),m=h.measurements||{},ev=normalizeEvaluation(h.evaluation),avg=evaluationAverage(ev),r=recommendation(h),bd=scoreBreakdown(h),d=(l,v)=>`<div class="detail-item"><span>${l}</span><b>${esc(v)||'―'}</b></div>`;const scores=EVAL_FIELDS.map(k=>d(EVAL_LABELS[k],ev.scores[k]==null?'':ev.scores[k]+' / 5')).join('');const breakdownRows=bd.rows.map(row=>{const detailItems=row.group==='measurement'?`<div class="breakdown-subgrid">${['weight','height','girth','cannon'].map((k,i)=>{const labels=['馬体重','体高','胸囲','管囲'];const units=['kg','cm','cm','cm'];const value=m[k];return `<div><span>${labels[i]}</span><b>${value==null?'未入力':esc(value)+units[i]}</b></div>`}).join('')}</div>`:`<div class="breakdown-subgrid">${row.items.map(item=>`<div><span>${esc(item.label)}</span><b>${item.score==null?'未評価':item.score+' / 5'}</b></div>`).join('')}</div>`;return `<details class="breakdown-row"><summary><span class="breakdown-name">${esc(row.label)}</span><span class="breakdown-average">${row.average==null?'未評価':row.average.toFixed(2)+' / 5'}</span><strong>${row.points==null?'―':row.points.toFixed(1)} <small>/ ${row.weight}</small></strong></summary>${detailItems}</details>`}).join('');E.detailContent.innerHTML=`<div class="dialog-head detail-sticky-head"><div><div class="eyebrow">${h.year} ${esc(h.club)} ${h.horseNo!=null?'No.'+h.horseNo:''}</div><h2>${esc(h.name)}</h2></div><button type="button" class="icon-btn detail-top-close" aria-label="詳細を閉じる">×</button></div>${photoGalleryHtml(h)}${judgmentHtml(h)}${r.score==null?'':`<section class="score-breakdown"><div class="breakdown-head"><div><h3>総合点の内訳</h3><p>${esc(normalizeModel(state.modelSettings).name)}・未評価分類は総合点計算から除外</p></div><strong>${r.score.toFixed(1)}<small> / 100</small></strong></div>${breakdownRows}<div class="breakdown-total"><span>入力済み分類の配点</span><b>${bd.usedWeight} / ${bd.totalWeight}</b></div></section>`}<div class="detail-grid">${d('性別',h.sex)}${d('毛色',h.coatColor)}${d('生年月日',h.birthDate)}${d('父',h.sire)}${d('母',h.dam)}${d('母父',h.broodmareSire)}${d('所属',h.stableArea)}${d('厩舎',h.trainer)}${d('生産牧場',h.breeder)}${d('育成牧場',h.trainingFarm)}${d('在厩場所',h.currentLocation)}${d('クラス',h.horseClass)}${d('内部管理ID',h.internalId)}${d('募集総額',h.price==null?'':money(h.price)+'万円')}${d('募集口数',h.shareCount==null?'':money(h.shareCount)+'口')}${d('1口価格',h.sharePrice==null?'':money(h.sharePrice)+'円')}${d('馬体重',m.weight==null?'':m.weight+'kg')}${d('体高',m.height==null?'':m.height+'cm')}${d('胸囲',m.girth==null?'':m.girth+'cm')}${d('管囲',m.cannon==null?'':m.cannon+'cm')}</div>${h.sourceUrl?`<a class="source-link" href="${esc(h.sourceUrl)}" target="_blank" rel="noopener">募集馬ページを開く</a>`:''}${h.videoUrl?`<p><a href="${esc(h.videoUrl)}" target="_blank" rel="noopener">歩様動画を開く</a></p>`:''}${photoAiHtml(h)}${gaitAiHtml(h)}<h3 class="detail-section-title">評価シート</h3><div class="evaluation-summary"><strong>${avg.average==null?'未評価':avg.average.toFixed(2)+' / 5'}</strong><span class="score-badge">${avg.count}項目入力</span>${(()=>{const q=weightedScore(h);return q.score==null?'':`<div class="detail-total-score">重み付き総合点 <b>${q.score.toFixed(1)} / 100</b>（充足 ${q.coverage}%）</div>`})()}</div><div class="detail-grid">${scores}${d('競走実績',ev.achievement)}${d('主戦場',ev.distanceCategory)}${d('体質リスク',ev.healthRisk==null?'':ev.healthRisk+' / 5')}</div><h3>評価コメント</h3><div class="notes">${esc(ev.comment)||'―'}</div><h3>募集時PR</h3><div class="notes">${esc(h.recruitmentPr)||'―'}</div><h3>メモ</h3><div class="notes">${esc(h.notes)||'―'}</div><h3>更新履歴</h3><div class="notes">${(h.changeLog||[]).slice().reverse().map(x=>fmt(x.at)+'　'+esc(x.action)).join('\n')}</div>`;E.detailDialog.scrollTop=0;E.detailDialog.showModal();requestAnimationFrame(()=>{E.detailDialog.scrollTop=0;E.detailContent.scrollTop=0})}
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
 const measure=(label,unit)=>{const ms=[...x.matchAll(new RegExp(label+'[：:\s]*([0-9.]+)\s*'+unit,'g'))];return ms.length?Number(ms[ms.length-1][1]):null};
 const year=bm?Number(bm[1])+1:new Date().getFullYear();
 const data={year,club:'シルク',horseNo,name,sex:sex(sc[0]||valueFor(['性別'])),coatColor:sc[1]||valueFor(['毛色']),birthDate,
 sire:valueFor(['父']),dam:valueFor(['母']),broodmareSire:valueFor(['母の父','母父']),stableArea,trainer,
 breeder,trainingFarm,currentLocation:valueFor(['在厩場所','現在地']),horseClass:valueFor(['クラス']),
 price,sharePrice,shareCount:(price!=null&&sharePrice)?Math.round(price*10000/sharePrice):null,recruitmentPr:valueFor(['募集馬紹介','募集時のPR','コメント']),sourceUrl:'',measurements:{weight:measure('馬体重','kg'),height:measure('体高','cm'),girth:measure('胸囲','cm'),cannon:measure('管囲','cm')}};
 data.internalId=internalId(data.club,data.year,data.horseNo,'');return data
}
function detectFormat(text,url=''){const x=cleanText(text),u=t(url);if(/silkhorseclub\.jp/i.test(u))return'silk';if(/union-oc\.co\.jp/i.test(u))return'union';const silkScore=[/シルク(?:・ホースクラブ|ホースクラブ)?/,/募集馬名/,/性別\s*[\/／・]\s*毛色/,/募集総額\s*[\/／・]\s*一口出資額/,/一口出資額/,/在厩場所/,/クラス/].filter(r=>r.test(x)).length,unionScore=[/PEGASUS/i,/ユニオン(?:オーナーズクラブ)?/,/募集時のPR/,/生産者からのPR/].filter(r=>r.test(x)).length;if(silkScore>=1&&silkScore>unionScore)return'silk';if(unionScore>=1&&unionScore>=silkScore)return'union';return''}
function selectedImportFormat(text,url=''){const selected=E.importFormat?.value||'auto';return selected==='auto'?detectFormat(text,url):selected}
async function fetchPageSource(url){let directError;try{const r=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return{source:await r.text(),baseUrl:r.url||url,kind:'html',route:'direct'}}catch(e){directError=e}try{const clean=url.replace(/^https?:\/\//,'');const proxy=`https://r.jina.ai/https://${clean}`;const r=await fetch(proxy,{headers:{Accept:'text/plain'},cache:'no-store'});if(!r.ok)throw new Error(`Reader HTTP ${r.status}`);return{source:await r.text(),baseUrl:url,kind:'reader',route:'reader'}}catch(e){console.error(directError,e);throw new Error('ページを取得できませんでした。通信状態または外部取得サービスの制限を確認してください。')}}
async function fetchPageText(url){const r=await fetchPageSource(url);if(r.kind==='html')return new DOMParser().parseFromString(r.source,'text/html').body?.innerText||r.source;return r.source}
function normalizeImageUrl(raw,baseUrl){let v=t(raw).replace(/&amp;/g,'&').replace(/^['"]|['"]$/g,'');if(!v||v.startsWith('data:')||v.startsWith('blob:')||v.startsWith('javascript:'))return'';try{return new URL(v,baseUrl).href}catch{return''}}
function imageCandidateScore(url,alt=''){const x=(url+' '+alt).toLowerCase();let score=0;if(/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url))score+=3;if(/photo|gallery|horse|boshu|募集|馬体|catalog|large|original|upload|img/i.test(x))score+=3;if(/logo|icon|banner|header|footer|common|loading|arrow|btn|button|sns|facebook|twitter|youtube|favicon|spacer|noimage/i.test(x))score-=8;if(/\.(?:svg|gif)(?:[?#]|$)/i.test(url))score-=5;return score}
function extractPageImageUrls(source,baseUrl,kind){const found=[];const add=(raw,alt='')=>{const url=normalizeImageUrl(raw,baseUrl);if(!url)return;const score=imageCandidateScore(url,alt);if(score<1)return;if(!found.some(x=>x.url===url))found.push({url,score,alt:t(alt)})};if(kind==='html'){const doc=new DOMParser().parseFromString(source,'text/html');doc.querySelectorAll('img').forEach(img=>{add(img.currentSrc||img.getAttribute('src')||img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('data-lazy-src'),img.alt);const ss=img.getAttribute('srcset')||img.getAttribute('data-srcset');if(ss)ss.split(',').forEach(x=>add(x.trim().split(/\s+/)[0],img.alt))});doc.querySelectorAll('a[href]').forEach(a=>{if(/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(a.getAttribute('href')||''))add(a.getAttribute('href'),a.textContent)})}else{for(const m of source.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+['"][^'"]*['"])?\)/g))add(m[2],m[1]);for(const m of source.matchAll(/https?:\/\/[^\s<>()'"]+?\.(?:jpe?g|png|webp)(?:\?[^\s<>()'"]*)?/gi))add(m[0])}return found.sort((a,b)=>b.score-a.score).map(x=>x.url)}
function supportedHorsePage(url){try{const u=new URL(url);return/(^|\.)(union-oc\.co\.jp|silkhorseclub\.jp)$/i.test(u.hostname)}catch{return false}}
function modelInputs(){return{gait:$('weightGait'),body:$('weightBody'),growth:$('weightGrowth'),measurement:$('weightMeasurement'),pedigree:$('weightPedigree'),connections:$('weightConnections')}}
function updateWeightTotal(){const total=Object.values(modelInputs()).reduce((s,el)=>s+Number(el.value||0),0),el=$('weightTotal');el.textContent=total+'%';el.classList.toggle('invalid',total!==100)}
function openModelSettings(){const m=normalizeModel(state.modelSettings);$('modelName').value=m.name;Object.entries(modelInputs()).forEach(([k,el])=>el.value=m.weights[k]);$('thresholdS').value=m.thresholds.s;$('thresholdA').value=m.thresholds.a;$('thresholdB').value=m.thresholds.b;updateWeightTotal();$('modelDialog').showModal()}
function setDefaultWeights(){const m=normalizeModel(DEFAULT_MODEL);$('modelName').value=m.name;Object.entries(modelInputs()).forEach(([k,el])=>el.value=m.weights[k]);$('thresholdS').value=m.thresholds.s;$('thresholdA').value=m.thresholds.a;$('thresholdB').value=m.thresholds.b;updateWeightTotal()}
function renderModelSummary(){const m=normalizeModel(state.modelSettings),w=m.weights,q=m.thresholds;$('modelSummary').textContent=`${m.name}：歩様${w.gait}%・馬体${w.body}%・成長${w.growth}%・測尺${w.measurement}%・配合${w.pedigree}%・厩舎牧場${w.connections}% ／ S${q.s}・A${q.a}・B${q.b}点以上`}
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
  const fields=['year','club','horseNo','name','sex','coatColor','birthDate','sire','dam','broodmareSire','stableArea','trainer','breeder','trainingFarm','currentLocation','horseClass','price','shareCount','sharePrice','sourceUrl','recruitmentPr'];
  fields.forEach(k=>{if(data[k]!=null&&$(k))$(k).value=data[k]});
  const m=data.measurements||{};['weight','height','girth','cannon'].forEach(k=>{if(m[k]!=null)$(k).value=m[k]});
  setImportStatus('募集馬情報を入力欄へ反映しました。保存ボタンで登録してください。','ok');
}
function closeHorseDialog(){clearAiImportInputs();if(E.horseDialog.open)E.horseDialog.close()}
function closeDetailDialog(){if(E.detailDialog.open)E.detailDialog.close()}

$('newHorseBtn').onclick=openNew;
$('closeDialogBtn').onclick=$('cancelBtn').onclick=closeHorseDialog;
E.horseDialog.addEventListener('close',clearAiImportInputs);
$('detailCloseBtn').onclick=closeDetailDialog;
E.detailContent.addEventListener('click',e=>{
  if(e.target.closest('.detail-top-close')){closeDetailDialog();return}
  const b=e.target.closest('[data-detail-photo]');
  if(b){const h=state.horses.find(x=>x.id===E.detailDialog.dataset.horseId),pm=h?normalizePhotos(h):null,img=$('detailMainPhoto');if(pm&&img){const p=pm.photos[Number(b.dataset.detailPhoto)];if(p)img.src=p.src}}
});
E.horseList.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const h=state.horses.find(x=>x.id===b.dataset.id);if(!h)return;
  if(b.dataset.a==='detail')detail(h.id);
  if(b.dataset.a==='edit')openEdit(h.id);
  if(b.dataset.a==='favorite'){h.favorite=!h.favorite;h.updatedAt=new Date().toISOString();try{save();render()}catch(err){alert('お気に入りを保存できませんでした。\n'+err.message)}}
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
['yearFilter','clubFilter','sexFilter','stableAreaFilter','sortSelect','favoriteOnly'].forEach(id=>$(id).addEventListener('change',()=>{saveUi();render()}));
E.searchInput.addEventListener('input',()=>{saveUi();render()});
E.resetFiltersBtn.onclick=()=>{E.yearFilter.value='';E.clubFilter.value='';E.sexFilter.value='';E.stableAreaFilter.value='';E.searchInput.value='';E.sortSelect.value='horseNo';E.favoriteOnly.checked=false;saveUi();render()};
$('photoFiles').addEventListener('change',async e=>{await addPhotoFiles(e.target.files||[]);e.target.value=''});
$('addPhotoUrlBtn').onclick=()=>{const url=prompt('写真URLを入力してください。');if(!url)return;if(editPhotos.length>=8){alert('写真は1頭8枚までです。');return}editPhotos.push({id:uid(),src:t(url),type:'url',createdAt:new Date().toISOString(),main:editPhotos.length===0});renderPhotoEditor()};
$('photoEditorGallery').addEventListener('click',e=>{const del=e.target.closest('[data-photo-delete]'),move=e.target.closest('[data-photo-move]');if(del){editPhotos=editPhotos.filter(x=>x.id!==del.dataset.photoDelete);if(editPhotos.length&&!editPhotos.some(x=>x.main))editPhotos[0].main=true;renderPhotoEditor()}else if(move){const i=editPhotos.findIndex(x=>x.id===move.dataset.id),j=move.dataset.photoMove==='up'?i-1:i+1;if(i>=0&&j>=0&&j<editPhotos.length){[editPhotos[i],editPhotos[j]]=[editPhotos[j],editPhotos[i]];renderPhotoEditor()}}});
$('photoEditorGallery').addEventListener('change',e=>{const r=e.target.closest('[data-photo-main]');if(r){editPhotos.forEach(x=>x.main=x.id===r.dataset.photoMain)}});
$('videoFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;if(!/video\/(mp4|quicktime)/i.test(f.type)&&!/\.(mp4|mov)$/i.test(f.name)){alert('MP4またはMOV形式の動画を選択してください。');return}if(f.size>1024*1024*1024){alert('動画サイズが1GBを超えています。端末容量を確認してください。');return}const id=uid(),src=URL.createObjectURL(f);editVideos=[{id,dbKey:id,src,type:'file',name:f.name,mimeType:f.type||'video/mp4',size:f.size,label:'歩様動画',createdAt:new Date().toISOString(),_blob:f}];renderVideoEditor()});
$('addVideoUrlBtn').onclick=()=>{const current=editVideos[0]?.type==='url'?editVideos[0].url:'';const url=prompt('歩様動画URLを入力してください。',current);if(!url)return;editVideos=[{id:uid(),url:t(url),type:'url',label:'歩様動画',createdAt:new Date().toISOString()}];$('videoUrl').value=t(url);renderVideoEditor()};
$('videoEditorList').addEventListener('click',e=>{const b=e.target.closest('[data-video-delete]');if(b){editVideos=[];$('videoUrl').value='';renderVideoEditor()}});
$('applyPhotoAiJsonBtn').onclick=applyPhotoAiJson;$('copyPhotoAiTemplateBtn').onclick=copyPhotoAiTemplate;
$('applyGaitAiJsonBtn').onclick=applyGaitAiJson;$('copyGaitAiTemplateBtn').onclick=copyGaitAiTemplate;$('applyGaitToEvaluationBtn').onclick=applyGaitToEvaluation;
$('applyFullAiJsonBtn').onclick=applyFullAiJson;$('copyFullAiTemplateBtn').onclick=copyFullAiTemplate;
E.importTextBtn.onclick=()=>{try{const text=E.pageText.value;if(!t(text))throw new Error('ページ本文を貼り付けてください。');const format=selectedImportFormat(text,t($('sourceUrl').value));if(!format)throw new Error('クラブ形式を判定できませんでした。');const data=format==='silk'?parseSilk(text):parseUnion(text,t($('sourceUrl').value));applyImportedData(data)}catch(err){console.error(err);setImportStatus(err.message,'error');alert('本文を取り込めませんでした。\n'+err.message)}};
E.importUrlBtn.onclick=async()=>{try{const url=t($('sourceUrl').value);if(!url)throw new Error('募集馬ページURLを入力してください。');E.importUrlBtn.disabled=true;setImportStatus('ページ本文を取得しています…');const text=await fetchPageText(url);E.pageText.value=text;const format=selectedImportFormat(text,url);if(!format)throw new Error('クラブ形式を判定できませんでした。');const data=format==='silk'?parseSilk(text):parseUnion(text,url);applyImportedData(data)}catch(err){console.error(err);setImportStatus(err.message,'error');alert('URLから取り込めませんでした。\n'+err.message)}finally{E.importUrlBtn.disabled=false}};

$('exportBtn').onclick=exportJ;$('importInput').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(E.restoreStatus){E.restoreStatus.textContent=f?`「${f.name}」を選択しました。復元を開始します…`:'ファイルが選択されませんでした。';E.restoreStatus.className='muted'}if(f){setTimeout(()=>importJ(f,true),0)}e.target.value='';});
$('seedBtn').onclick=()=>{const now=new Date().toISOString();state.horses.push({id:uid(),year:2026,club:'ユニオン',horseNo:14,name:'リフレイムの2025',sex:'牝',birthDate:'2025-03-29',sire:'エピファネイア',dam:'リフレイム',broodmareSire:'アメリカンファラオ',stableArea:'美浦',trainer:'黒岩陽一',breeder:'千里ファーム',trainingFarm:'山口ステーブル',price:8800,shareCount:800,sharePrice:110000,recruitmentPr:'Sprint 1.3動作確認用の募集時PRです。',internalId:'UNION-2026-014',measurements:{weight:436,height:150,girth:172,cannon:20.5},sourceUrl:'https://www.union-oc.co.jp/id/4014#open_PHOTO',photoUrl:'',videoUrl:'',favorite:false,notes:'Sprint 1.2動作確認用',evaluation:normalizeEvaluation({}),createdAt:now,updatedAt:now,changeLog:[{at:now,action:'サンプル登録'}]});save();render();toast('サンプルを追加しました')};
$('modelSettingsBtn').onclick=openModelSettings;$('closeModelBtn').onclick=$('cancelModelBtn').onclick=()=>$('modelDialog').close();Object.values(modelInputs()).forEach(el=>el.oninput=updateWeightTotal);$('resetWeightsBtn').onclick=setDefaultWeights;$('modelForm').onsubmit=e=>{e.preventDefault();const inputs=modelInputs(),weights=Object.fromEntries(Object.entries(inputs).map(([k,el])=>[k,Number(el.value||0)])),total=Object.values(weights).reduce((a,b)=>a+b,0);if(total!==100){alert('重みの合計を100%にしてください。');return}const thresholds={s:Number($('thresholdS').value),a:Number($('thresholdA').value),b:Number($('thresholdB').value)};if(!(thresholds.s>thresholds.a&&thresholds.a>thresholds.b)){alert('推奨度基準は S > A > B の順にしてください。');return}state.modelSettings=normalizeModel({name:$('modelName').value,weights,thresholds});save();$('modelDialog').close();render();toast('評価モデルを保存しました')};
$('clearBtn').onclick=async()=>{if(confirm('全データを削除しますか？')){state=base();save();await photoDbClear().catch(console.warn);await videoDbClear().catch(console.warn);render()}};async function initApp(){initEvaluationControls();state=load();await migrateLegacyPhotos(state);await hydrateStatePhotos(state);await hydrateStateVideos(state);refreshFilters();loadUi();render()}initApp().catch(e=>{console.error(e);alert('アプリの初期化中にエラーが発生しました。\n'+e.message)});})();
