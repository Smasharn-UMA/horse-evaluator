const FEATURE_KEYS = [
  "hindquarter","hindShape","chest","shoulder","back","bone","balance","growth",
  "frontRange","hindStep","propulsion","flexibility","stride","rhythm","symmetry","lightness"
];
const FEATURE_LABELS = {
  hindquarter:"トモ容量",hindShape:"トモ形状",chest:"胸前",shoulder:"肩",back:"背腰",bone:"骨量",
  balance:"バランス",growth:"成長余地",frontRange:"前肢可動域",hindStep:"後肢踏込",propulsion:"推進力",
  flexibility:"柔軟性",stride:"ストライド",rhythm:"リズム",symmetry:"左右対称",lightness:"軽さ"
};
let dataset = null;
let selected = new Set();
let blindMap = new Map(); // horse id -> blind id
let results = new Map();  // blind id -> result

const $ = id => document.getElementById(id);
const toast = msg => {
  const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2600);
};
const avg = vals => {
  const v=vals.filter(x=>Number.isFinite(x)); return v.length? v.reduce((a,b)=>a+b,0)/v.length : null;
};
const scoreAvg = horse => avg(FEATURE_KEYS.map(k=>Number(horse?.features?.[k])).filter(Number.isFinite));
const sourceHas = (h,key) => !!h?.source?.[key];
const fmt = n => Number.isFinite(n)? n.toFixed(2):"—";
const download = (name, text, type="application/json") => {
  const blob=new Blob([text],{type}); const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
};
const today = () => new Date().toISOString().slice(0,10);

function eligible(h){
  return sourceHas(h,"photo") || sourceHas(h,"gait") || sourceHas(h,"measurement");
}
function filteredHorses(){
  if(!dataset) return [];
  const ach=$("achievementFilter").value, src=$("sourceFilter").value, q=$("searchInput").value.trim().toLowerCase();
  return dataset.horses.filter(h=>{
    const ha=h?.label?.achievement ?? "";
    if(ach==="__blank__" && ha) return false;
    if(ach && ach!=="__blank__" && ha!==ach) return false;
    if(src==="full" && !(sourceHas(h,"photo")&&sourceHas(h,"gait")&&sourceHas(h,"measurement"))) return false;
    if(src==="photo-gait" && !(sourceHas(h,"photo")&&sourceHas(h,"gait"))) return false;
    if(["photo","gait","measurement"].includes(src) && !sourceHas(h,src)) return false;
    if(q){
      const hay=[h.name,h.club,h.year,h.sex].join(" ").toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}
function render(){
  const rows=$("horseRows"); rows.innerHTML="";
  const hs=filteredHorses();
  $("visibleCount").textContent=`${hs.length}頭`;
  $("statTotal").textContent=dataset?.horses?.length||0;
  $("statEligible").textContent=dataset?dataset.horses.filter(eligible).length:0;
  $("statSelected").textContent=selected.size;
  for(const h of hs){
    const tr=document.createElement("tr"); if(selected.has(h.id)) tr.classList.add("selected");
    const blind=blindMap.get(h.id)||"";
    const oldA=scoreAvg(h);
    const res=blind ? results.get(blind):null;
    const newScores=res?.scores||res?.evaluation?.scores||{};
    const newA=avg(FEATURE_KEYS.map(k=>Number(newScores[k])).filter(Number.isFinite));
    const d=(Number.isFinite(oldA)&&Number.isFinite(newA))?newA-oldA:null;
    tr.innerHTML=`
      <td><input type="checkbox" data-id="${escapeHtml(h.id)}" ${selected.has(h.id)?"checked":""}></td>
      <td>${escapeHtml(blind||"—")}</td>
      <td>${escapeHtml(h.name||"")}</td>
      <td>${escapeHtml(String(h.year??""))}</td>
      <td>${escapeHtml(h?.label?.achievement||"—")}</td>
      <td class="${sourceHas(h,"photo")?"ok":"no"}">${sourceHas(h,"photo")?"●":"—"}</td>
      <td class="${sourceHas(h,"gait")?"ok":"no"}">${sourceHas(h,"gait")?"●":"—"}</td>
      <td class="${sourceHas(h,"measurement")?"ok":"no"}">${sourceHas(h,"measurement")?"●":"—"}</td>
      <td class="num">${fmt(oldA)}</td>
      <td class="num">${fmt(newA)}</td>
      <td class="num ${d<0?"neg":d>0?"pos":""}">${d==null?"—":(d>0?"+":"")+d.toFixed(2)}</td>`;
    rows.appendChild(tr);
  }
  rows.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.addEventListener("change",e=>{
    e.target.checked?selected.add(e.target.dataset.id):selected.delete(e.target.dataset.id); render();
  }));
  renderAnalysis();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}

async function loadDataset(file){
  const text=await file.text(); const parsed=JSON.parse(text);
  if(!Array.isArray(parsed.horses)) throw new Error("horses配列がありません");
  dataset=parsed; selected.clear(); blindMap.clear(); results.clear();
  $("datasetMeta").textContent=`schema: ${parsed.schema||"不明"} / appVersion: ${parsed.appVersion||"不明"} / generatedAt: ${parsed.generatedAt||"不明"}`;
  render(); toast(`${parsed.horses.length}頭を読み込みました`);
}
function generateBlind(){
  if(!dataset||!selected.size){toast("再評価対象を選択してください");return;}
  const prefix=($("blindPrefix").value.trim()||"BLIND").replace(/[^A-Za-z0-9_-]/g,"");
  let i=1;
  const used=new Set([...blindMap.values()]);
  for(const h of dataset.horses.filter(x=>selected.has(x.id))){
    if(blindMap.has(h.id)) continue;
    let id; do{id=`${prefix}-${String(i++).padStart(4,"0")}`}while(used.has(id));
    used.add(id); blindMap.set(h.id,id);
  }
  render(); toast(`${selected.size}頭を匿名化しました`);
}
function blindRecord(h){
  const id=blindMap.get(h.id);
  return {
    blindId:id,
    sex:h.sex??null,
    measurements:{
      weight:h?.measurements?.weight??null,
      height:h?.measurements?.height??null,
      girth:h?.measurements?.girth??null,
      cannon:h?.measurements?.cannon??null
    },
    mediaRequired:{
      photo:!!h?.source?.photo,
      gait:!!h?.source?.gait
    },
    protocol:{
      version:$("protocolVersion").value.trim()||"blind-v1.0",
      purpose:"1歳夏の募集時点における純粋な馬体・歩様評価",
      allowedInputs:["募集時の馬体写真","募集時の歩様動画","測尺4項目","性別"],
      prohibitedInputs:["馬名","クラブ","父・母・母父","厩舎","生産牧場・育成牧場","募集価格","競走実績・クラス","実績ラベル","他馬との比較","募集馬群内順位"],
      scoreScale:"1-5 integer; 1=低い, 3=標準, 5=非常に高い",
      outputKeys:FEATURE_KEYS
    }
  };
}
function ensureBlind(){ if(!selected.size) throw new Error("対象未選択"); if([...selected].some(id=>!blindMap.has(id))) throw new Error("先に匿名IDを生成してください"); }
function exportPackage(){
  try{
    ensureBlind();
    const horses=dataset.horses.filter(h=>selected.has(h.id)).map(blindRecord);
    const pkg={schema:"horse-evaluator-blind-reevaluation-package-1",createdAt:new Date().toISOString(),protocolVersion:$("protocolVersion").value,horseCount:horses.length,horses};
    download(`horse-evaluator-blind-package-${today()}-${horses.length}horses.json`,JSON.stringify(pkg,null,2));
    toast("再評価パッケージを出力しました");
  }catch(e){toast(e.message)}
}
function exportMapping(){
  try{
    ensureBlind();
    const mapping=dataset.horses.filter(h=>selected.has(h.id)).map(h=>({
      blindId:blindMap.get(h.id),horseId:h.id,name:h.name,achievement:h?.label?.achievement??null,
      originalFeatures:Object.fromEntries(FEATURE_KEYS.map(k=>[k,h?.features?.[k]??null])),
      source:h.source||{},measurements:h.measurements||{}
    }));
    const obj={schema:"horse-evaluator-blind-secret-map-1",createdAt:new Date().toISOString(),warning:"AI再評価時にはこのファイルを渡さないでください",mapping};
    download(`horse-evaluator-blind-SECRET-map-${today()}.json`,JSON.stringify(obj,null,2));
    toast("秘密の照合表を出力しました");
  }catch(e){toast(e.message)}
}
function exportPrompt(){
  try{
    ensureBlind();
    const records=dataset.horses.filter(h=>selected.has(h.id)).map(blindRecord);
    const prompt = `Horse Evaluator 教師データ・完全ブラインド再評価\n\n`+
`以下の各馬について、馬名・血統・厩舎・生産・価格・競走実績・実績ラベルを推測または参照せず、添付された募集時写真・歩様動画・測尺のみから再評価してください。\n`+
`同じ基準を全頭に適用し、1=低い、3=標準、5=非常に高いの1〜5整数で採点してください。競走実績を知っている可能性があっても評価根拠に使用しないでください。\n\n`+
`評価項目: ${FEATURE_KEYS.map(k=>`${k}(${FEATURE_LABELS[k]})`).join(", ")}\n\n`+
`返却形式:\n{"schema":"horse-evaluator-blind-results-1","protocolVersion":"${$("protocolVersion").value.trim()||"blind-v1.0"}","results":[{"blindId":"BLIND-0001","scores":{"hindquarter":1,"hindShape":1,"chest":1,"shoulder":1,"back":1,"bone":1,"balance":1,"growth":1,"frontRange":1,"hindStep":1,"propulsion":1,"flexibility":1,"stride":1,"rhythm":1,"symmetry":1,"lightness":1},"comment":""}]}\n\n`+
`対象馬:\n`+
records.map(r=>`${r.blindId} / 性別:${r.sex??"不明"} / 測尺:${r.measurements.weight??"null"}kg, ${r.measurements.height??"null"}cm, ${r.measurements.girth??"null"}cm, ${r.measurements.cannon??"null"}cm / 写真:${r.mediaRequired.photo?"あり":"なし"} / 歩様:${r.mediaRequired.gait?"あり":"なし"}`).join("\n");
    download(`horse-evaluator-blind-prompt-${today()}.txt`,prompt,"text/plain;charset=utf-8");
    toast("ChatGPT用プロンプトを出力しました");
  }catch(e){toast(e.message)}
}
async function importResults(file){
  const parsed=JSON.parse(await file.text());
  const list=Array.isArray(parsed)?parsed:(parsed.results||[]);
  if(!Array.isArray(list)) throw new Error("results配列がありません");
  let n=0;
  for(const r of list){
    if(!r?.blindId) continue;
    const scores=r.scores||r?.evaluation?.scores;
    if(!scores) continue;
    results.set(r.blindId,r); n++;
  }
  render(); toast(`${n}件の再評価結果を取り込みました`);
}
function renderAnalysis(){
  const done=[];
  if(dataset){
    for(const h of dataset.horses){
      const bid=blindMap.get(h.id); const r=bid&&results.get(bid); if(!r) continue;
      const ns=r.scores||r?.evaluation?.scores||{};
      const old=Object.fromEntries(FEATURE_KEYS.map(k=>[k,Number(h?.features?.[k])]));
      const neu=Object.fromEntries(FEATURE_KEYS.map(k=>[k,Number(ns[k])]));
      done.push({h,bid,old,neu});
    }
  }
  if(!done.length){
    $("analysisSummary").className="analysis-empty"; $("analysisSummary").textContent="再評価結果はまだありません。"; $("analysisTables").innerHTML=""; return;
  }
  const diffs=[];
  for(const d of done) for(const k of FEATURE_KEYS) if(Number.isFinite(d.old[k])&&Number.isFinite(d.neu[k])) diffs.push(d.neu[k]-d.old[k]);
  const mean=avg(diffs), abs=avg(diffs.map(Math.abs)), down=diffs.filter(x=>x<0).length/diffs.length;
  $("analysisSummary").className="";
  $("analysisSummary").innerHTML=`<div class="analysis-grid">
    <div class="metric"><strong>${done.length}</strong><span>再評価済み頭数</span></div>
    <div class="metric"><strong>${fmt(mean)}</strong><span>平均差（新−旧）</span></div>
    <div class="metric"><strong>${fmt(abs)}</strong><span>平均絶対差</span></div>
    <div class="metric"><strong>${(down*100).toFixed(1)}%</strong><span>旧評価より低下したセル</span></div>
  </div>`;

  const byFeat=FEATURE_KEYS.map(k=>{
    const a=done.flatMap(d=>(Number.isFinite(d.old[k])&&Number.isFinite(d.neu[k]))?[d.neu[k]-d.old[k]]:[]);
    return {k,n:a.length,mean:avg(a),abs:avg(a.map(Math.abs))};
  });
  const groups={};
  for(const d of done){
    const g=d.h?.label?.achievement||"空欄";
    if(!groups[g]) groups[g]=[];
    const oa=avg(FEATURE_KEYS.map(k=>d.old[k]).filter(Number.isFinite));
    const na=avg(FEATURE_KEYS.map(k=>d.neu[k]).filter(Number.isFinite));
    if(Number.isFinite(oa)&&Number.isFinite(na)) groups[g].push(na-oa);
  }
  $("analysisTables").innerHTML=`
    <h3>項目別</h3><div class="table-wrap"><table><thead><tr><th>項目</th><th>N</th><th>平均差</th><th>平均絶対差</th></tr></thead>
    <tbody>${byFeat.map(x=>`<tr><td>${FEATURE_LABELS[x.k]}</td><td>${x.n}</td><td class="num ${x.mean<0?"neg":x.mean>0?"pos":""}">${fmt(x.mean)}</td><td class="num">${fmt(x.abs)}</td></tr>`).join("")}</tbody></table></div>
    <h3 style="margin-top:16px">実績別</h3><div class="table-wrap"><table><thead><tr><th>実績</th><th>N</th><th>平均差</th></tr></thead>
    <tbody>${Object.entries(groups).map(([g,a])=>{const m=avg(a);return `<tr><td>${escapeHtml(g)}</td><td>${a.length}</td><td class="num ${m<0?"neg":m>0?"pos":""}">${fmt(m)}</td></tr>`}).join("")}</tbody></table></div>`;
}

$("datasetFile").addEventListener("change",async e=>{try{if(e.target.files[0])await loadDataset(e.target.files[0])}catch(err){toast("読込エラー: "+err.message)}});
["achievementFilter","sourceFilter"].forEach(id=>$(id).addEventListener("change",render));
$("searchInput").addEventListener("input",render);
$("selectVisibleBtn").addEventListener("click",()=>{filteredHorses().forEach(h=>selected.add(h.id));render()});
$("clearSelectionBtn").addEventListener("click",()=>{selected.clear();blindMap.clear();render()});
$("randomSampleBtn").addEventListener("click",()=>{
  const hs=[...filteredHorses()]; const n=Math.max(1,Math.min(hs.length,Number($("sampleSize").value)||1));
  for(let i=hs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[hs[i],hs[j]]=[hs[j],hs[i]]}
  selected.clear(); hs.slice(0,n).forEach(h=>selected.add(h.id)); blindMap.clear(); render(); toast(`${n}頭を無作為抽出しました`);
});
$("generateBlindBtn").addEventListener("click",generateBlind);
$("exportPackageBtn").addEventListener("click",exportPackage);
$("exportMappingBtn").addEventListener("click",exportMapping);
$("exportPromptBtn").addEventListener("click",exportPrompt);
$("resultFile").addEventListener("change",async e=>{try{if(e.target.files[0])await importResults(e.target.files[0])}catch(err){toast("取込エラー: "+err.message)}});
render();
