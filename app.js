(() => {
"use strict";
const STORAGE_KEY="horseEvaluator.v2.horses";
const $=id=>document.getElementById(id);
const fields=["name","club","year","number","sex","birthDate","trainer","breeder","price","status","sire","dam","damsire","photoUrls","videoUrls","notes"];
const scoreFields=["hindquarters","gait","growth","legs","pedigree","value"];
let horses=loadHorses(),favoriteDraft=false;

const uid=()=>crypto.randomUUID?crypto.randomUUID():"h-"+Date.now()+"-"+Math.random().toString(16).slice(2);
const now=()=>new Date().toISOString();
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const splitLines=v=>String(v||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove("show"),2200)}

function normalizeClub(v=""){
  if(v.includes("キャロット"))return"キャロット";
  if(v.includes("シルク"))return"シルク";
  if(v.includes("ユニオン")||v.includes("日高ブリーダーズ"))return"ユニオン";
  if(v.includes("インゼル"))return"インゼル";
  return v||"";
}
function normalizeSex(v=""){
  if(v.startsWith("牡"))return"牡";
  if(v.startsWith("牝"))return"牝";
  if(v.startsWith("騸")||v.startsWith("せん"))return"騸";
  return v||"";
}
function legacyToV2(raw){
  const s=raw.subjective||{}, m=raw.measurements||{}, avg=n(raw.result?.subjectiveAverage||3);
  return {
    id:raw.id||uid(), version:2, name:raw.horseName||"名称未設定",
    club:normalizeClub(raw.club), year:"", number:"", sex:normalizeSex(raw.sex),
    birthDate:raw.birthDate||"", trainer:"", breeder:"", price:"", status:"検討中",
    sire:"", dam:"", damsire:"",
    measurements:(m&&typeof m==="object"&&!Array.isArray(m)&&Object.values(m).some(v=>v!==null&&v!==""))
      ?[{date:"",weight:m.weight??"",height:m.height??"",chest:m.chest??"",cannon:m.cannon??""}]:[],
    ratings:{
      hindquarters:n(s.hindquarter)*2,
      gait:Math.round((n(s.flexibility)+n(s.stride)+n(s.coordination))/3*2),
      growth:n(s.growth)*2,
      legs:n(s.coordination)*2,
      pedigree:avg*2,
      value:avg*2
    },
    photoUrls:[], videoUrls:[],
    notes:raw.notes||"",
    favorite:false,
    legacyScore:Number.isFinite(Number(raw.result?.total))?Number(raw.result.total):null,
    legacyResult:raw.result||null,
    createdAt:raw.createdAt||now(), updatedAt:raw.createdAt||now()
  };
}
function normalizeHorse(raw={}){
  if(raw.horseName||raw.subjective||(!Array.isArray(raw.measurements)&&raw.result))return legacyToV2(raw);
  const ratings=raw.ratings||raw.scores||{}, measurements=Array.isArray(raw.measurements)?raw.measurements:[];
  return {id:raw.id||uid(),version:2,name:raw.name||"名称未設定",club:normalizeClub(raw.club),year:raw.year||"",number:raw.number||"",sex:normalizeSex(raw.sex),birthDate:raw.birthDate||"",trainer:raw.trainer||"",breeder:raw.breeder||"",price:raw.price||"",status:raw.status||"",sire:raw.sire||"",dam:raw.dam||"",damsire:raw.damsire||"",measurements,
    ratings:{hindquarters:n(ratings.hindquarters),gait:n(ratings.gait),growth:n(ratings.growth),legs:n(ratings.legs),pedigree:n(ratings.pedigree),value:n(ratings.value)},
    photoUrls:Array.isArray(raw.photoUrls)?raw.photoUrls:splitLines(raw.photoUrls),videoUrls:Array.isArray(raw.videoUrls)?raw.videoUrls:splitLines(raw.videoUrls),
    notes:raw.notes||"",favorite:Boolean(raw.favorite),legacyScore:Number.isFinite(Number(raw.legacyScore))?Number(raw.legacyScore):null,legacyResult:raw.legacyResult||null,createdAt:raw.createdAt||now(),updatedAt:raw.updatedAt||now()};
}
function extractRecords(parsed){
  if(Array.isArray(parsed))return parsed;
  if(parsed&&Array.isArray(parsed.horses))return parsed.horses;
  if(parsed&&Array.isArray(parsed.records))return parsed.records;
  if(parsed&&Array.isArray(parsed.items))return parsed.items;
  if(parsed&&Array.isArray(parsed.data))return parsed.data;
  if(parsed&&typeof parsed==="object"&&(parsed.horseName||parsed.name))return[parsed];
  throw new Error("対応していないJSON形式です");
}
function score(h){if(Number.isFinite(Number(h.legacyScore)))return Number(h.legacyScore);return Math.round(Object.values(h.ratings||{}).reduce((a,b)=>a+n(b),0)/60*100)}
function saveHorses(){localStorage.setItem(STORAGE_KEY,JSON.stringify(horses))}
function loadHorses(){try{const d=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(d)?d.map(normalizeHorse):[]}catch{return[]}}

function showView(v){$("dashboardView").classList.toggle("active",v==="dashboard");$("editorView").classList.toggle("active",v==="editor");$("newHorseBtn").classList.toggle("hidden",v==="editor");window.scrollTo(0,0)}
function renderDashboard(){
 const q=$("searchInput").value.trim().toLowerCase(),club=$("clubFilter").value,sort=$("sortSelect").value;
 let list=horses.filter(h=>[h.name,h.club,h.sire,h.dam,h.damsire,h.trainer,h.breeder].join(" ").toLowerCase().includes(q)&&(!club||h.club===club));
 list.sort((a,b)=>sort==="scoreDesc"?score(b)-score(a):sort==="numberAsc"?String(a.number||"").localeCompare(String(b.number||""),"ja",{numeric:true}):sort==="nameAsc"?a.name.localeCompare(b.name,"ja"):String(b.updatedAt).localeCompare(String(a.updatedAt)));
 $("horseList").innerHTML=list.map(h=>`<article class="horse-card" data-id="${esc(h.id)}"><div class="card-top"><span class="badge">${esc(h.club||"クラブ未設定")}${h.number?` #${esc(h.number)}`:""}</span><span>${h.favorite?"★":"☆"}</span></div><h3>${esc(h.name)}</h3><p class="meta">${esc([h.sire&&"父 "+h.sire,h.dam&&"母 "+h.dam].filter(Boolean).join(" ／ ")||"血統未入力")}</p><div class="card-bottom"><span class="status">${esc(h.status||"状況未設定")}</span><span class="score-pill">${score(h)}点</span></div></article>`).join("");
 document.querySelectorAll(".horse-card").forEach(el=>el.onclick=()=>openEditor(el.dataset.id));
 $("emptyState").classList.toggle("hidden",list.length>0);$("horseCount").textContent=horses.length;$("favoriteCount").textContent=horses.filter(h=>h.favorite).length;$("averageScore").textContent=horses.length?Math.round(horses.reduce((a,h)=>a+score(h),0)/horses.length)+"点":"—";
}
function addMeasurement(m={}){const node=$("measurementTemplate").content.firstElementChild.cloneNode(true);node.querySelector(".m-date").value=m.date||"";node.querySelector(".m-weight").value=m.weight??"";node.querySelector(".m-height").value=m.height??"";node.querySelector(".m-chest").value=m.chest??"";node.querySelector(".m-cannon").value=m.cannon??"";node.querySelector(".remove-measurement").onclick=()=>node.remove();$("measurementList").appendChild(node)}
function resetForm(){$("horseForm").reset();$("horseId").value="";favoriteDraft=false;$("favoriteBtn").textContent="☆";$("editorTitle").textContent="新規登録";$("deleteBtn").classList.add("hidden");$("measurementList").innerHTML="";addMeasurement();scoreFields.forEach(id=>{$(id).value=0;updateRange($(id))});updateTotal()}
function openEditor(id){resetForm();const h=horses.find(x=>x.id===id);if(h){$("horseId").value=h.id;$("editorTitle").textContent=h.name;fields.forEach(k=>$(k).value=k==="photoUrls"?(h.photoUrls||[]).join("\n"):k==="videoUrls"?(h.videoUrls||[]).join("\n"):(h[k]??""));favoriteDraft=h.favorite;$("favoriteBtn").textContent=h.favorite?"★":"☆";$("measurementList").innerHTML="";(h.measurements.length?h.measurements:[{}]).forEach(addMeasurement);scoreFields.forEach(id=>{$(id).value=n(h.ratings[id]);updateRange($(id))});$("deleteBtn").classList.remove("hidden");updateTotal()}showView("editor")}
function collectMeasurements(){return[...document.querySelectorAll(".measurement-row")].map(r=>({date:r.querySelector(".m-date").value,weight:r.querySelector(".m-weight").value,height:r.querySelector(".m-height").value,chest:r.querySelector(".m-chest").value,cannon:r.querySelector(".m-cannon").value})).filter(m=>Object.values(m).some(Boolean))}
function updateRange(i){i.parentElement.querySelector("output").textContent=i.value}
function updateTotal(){$("totalScore").textContent=Math.round(scoreFields.reduce((a,id)=>a+n($(id).value),0)/60*100)}
function submitForm(e){e.preventDefault();const id=$("horseId").value,old=horses.find(h=>h.id===id),raw={};fields.forEach(k=>raw[k]=$(k).value.trim());raw.id=id||uid();raw.favorite=favoriteDraft;raw.measurements=collectMeasurements();raw.ratings=Object.fromEntries(scoreFields.map(k=>[k,n($(k).value)]));raw.photoUrls=splitLines(raw.photoUrls);raw.videoUrls=splitLines(raw.videoUrls);raw.createdAt=old?.createdAt||now();raw.updatedAt=now();raw.legacyScore=null;const h=normalizeHorse(raw);horses=old?horses.map(x=>x.id===id?h:x):[h,...horses];saveHorses();renderDashboard();showView("dashboard");toast(old?"上書き保存しました":"登録しました")}
async function importFiles(files){
 try{
   const all=[];
   for(const file of files){const parsed=JSON.parse(await file.text());all.push(...extractRecords(parsed).map(normalizeHorse))}
   if(!all.length)throw new Error("馬データが見つかりません");
   const replace=confirm(`${all.length}頭を読み込みます。\n\nOK：現在のデータを置き換える\nキャンセル：現在のデータに追加する`);
   if(replace)horses=all;else{const map=new Map(horses.map(h=>[h.id,h]));all.forEach(h=>map.set(h.id,h));horses=[...map.values()]}
   saveHorses();renderDashboard();toast(`${all.length}頭を読み込みました`);
 }catch(e){alert("JSONを読み込めませんでした。\n"+e.message)}
 $("importInput").value="";
}
function exportJson(){const blob=new Blob([JSON.stringify({app:"Horse Evaluator",version:"2.0.1",exportedAt:now(),horses},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`horse-evaluator-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
$("newHorseBtn").onclick=()=>openEditor();$("backBtn").onclick=()=>{renderDashboard();showView("dashboard")};$("horseForm").onsubmit=submitForm;$("addMeasurementBtn").onclick=()=>addMeasurement();$("favoriteBtn").onclick=()=>{favoriteDraft=!favoriteDraft;$("favoriteBtn").textContent=favoriteDraft?"★":"☆"};$("deleteBtn").onclick=()=>{const id=$("horseId").value,h=horses.find(x=>x.id===id);if(h&&confirm(`「${h.name}」を削除しますか？`)){horses=horses.filter(x=>x.id!==id);saveHorses();renderDashboard();showView("dashboard")}};scoreFields.forEach(id=>$(id).oninput=e=>{updateRange(e.target);updateTotal()});["searchInput","clubFilter","sortSelect"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderDashboard));$("exportBtn").onclick=exportJson;$("importInput").onchange=e=>e.target.files.length&&importFiles([...e.target.files]);$("sampleBtn").onclick=()=>{horses.unshift(normalizeHorse({name:"サンプル募集馬",club:"キャロット",status:"検討中",ratings:{hindquarters:8,gait:7,growth:8,legs:7,pedigree:8,value:6}}));saveHorses();renderDashboard()};renderDashboard();
})();