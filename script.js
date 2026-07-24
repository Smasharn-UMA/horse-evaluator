const fields = [
  "horseName", "club", "sex", "birthDate",
  "weight", "height", "chest", "cannon",
  "hindquarter", "flexibility", "stride", "coordination", "growth",
  "notes"
];

const $ = (id) => document.getElementById(id);

const state = {
  photoName: "",
  videoName: "",
  lastResult: null
};

function numberValue(id) {
  const value = parseFloat($(id).value);
  return Number.isFinite(value) ? value : null;
}

function collectData() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    horseName: $("horseName").value.trim(),
    club: $("club").value,
    sex: $("sex").value,
    birthDate: $("birthDate").value,
    measurements: {
      weight: numberValue("weight"),
      height: numberValue("height"),
      chest: numberValue("chest"),
      cannon: numberValue("cannon")
    },
    subjective: {
      hindquarter: Number($("hindquarter").value),
      flexibility: Number($("flexibility").value),
      stride: Number($("stride").value),
      coordination: Number($("coordination").value),
      growth: Number($("growth").value)
    },
    notes: $("notes").value.trim(),
    files: {
      photoName: state.photoName,
      videoName: state.videoName
    },
    result: state.lastResult
  };
}

function measurementScore(data) {
  const m = data.measurements;
  let score = 0;
  let count = 0;
  const comments = [];

  const rules = [
    {
      key: "weight",
      label: "馬体重",
      evaluate: (v) => v >= 440 ? 5 : v >= 410 ? 4 : v >= 380 ? 3 : v >= 350 ? 2 : 1
    },
    {
      key: "height",
      label: "体高",
      evaluate: (v) => v >= 158 ? 5 : v >= 154 ? 4 : v >= 150 ? 3 : v >= 146 ? 2 : 1
    },
    {
      key: "chest",
      label: "胸囲",
      evaluate: (v) => v >= 178 ? 5 : v >= 173 ? 4 : v >= 168 ? 3 : v >= 163 ? 2 : 1
    },
    {
      key: "cannon",
      label: "管囲",
      evaluate: (v) => v >= 20.5 ? 5 : v >= 19.8 ? 4 : v >= 19.2 ? 3 : v >= 18.6 ? 2 : 1
    }
  ];

  for (const rule of rules) {
    const value = m[rule.key];
    if (value !== null) {
      const s = rule.evaluate(value);
      score += s;
      count += 1;
      comments.push(`${rule.label}: ${s}/5`);
    }
  }

  return {
    average: count ? score / count : 0,
    count,
    comments
  };
}

function evaluate() {
  const data = collectData();
  const ms = measurementScore(data);

  const s = data.subjective;
  const subjectiveAverage =
    (s.hindquarter * 1.35 +
     s.flexibility +
     s.stride * 1.2 +
     s.coordination * 1.1 +
     s.growth * 1.15) / 5.8;

  let combined;
  if (ms.count > 0) {
    combined = ms.average * 0.45 + subjectiveAverage * 0.55;
  } else {
    combined = subjectiveAverage;
  }

  const total = Math.round(combined * 20);
  let title;
  let verdict;

  if (total >= 86) {
    title = "最優先候補";
    verdict = "現時点では高水準です。価格、血統、母年齢、脚元、厩舎を精査して最終判断へ進めます。";
  } else if (total >= 76) {
    title = "有力候補";
    verdict = "出資候補として十分検討できます。特に歩様動画とトモの成長余地を再確認します。";
  } else if (total >= 66) {
    title = "比較候補";
    verdict = "長所はありますが、弱点との比較が必要です。募集価格との釣り合いを重視します。";
  } else if (total >= 51) {
    title = "慎重検討";
    verdict = "現段階では決め手不足です。成長待ち、更新動画、測尺推移の確認が必要です。";
  } else {
    title = "見送り寄り";
    verdict = "初期評価ではリスクが上回ります。明確な補強材料がない限り優先度を下げます。";
  }

  const warnings = [];
  if (data.measurements.cannon !== null && data.measurements.cannon < 19.0) {
    warnings.push("管囲が細めです。馬体重とのバランスと脚元を慎重に確認してください。");
  }
  if (data.measurements.weight !== null && data.measurements.weight < 380) {
    warnings.push("馬体重が小さめです。成長曲線と母系のサイズ傾向を確認してください。");
  }
  if (s.hindquarter <= 2) {
    warnings.push("トモの容量評価が低めです。推進力と今後の成長余地が重要です。");
  }
  if (s.flexibility <= 2 || s.coordination <= 2) {
    warnings.push("歩様の柔軟性または前後連動に懸念があります。動画を再確認してください。");
  }

  state.lastResult = {
    total,
    title,
    verdict,
    measurementAverage: ms.count ? Number(ms.average.toFixed(2)) : null,
    subjectiveAverage: Number(subjectiveAverage.toFixed(2)),
    warnings
  };

  $("resultTitle").textContent = title;
  $("totalScore").textContent = total;
  $("resultDetails").innerHTML = `
    <strong>${verdict}</strong>
    <div style="margin-top:8px">
      測尺評価：${ms.count ? ms.comments.join(" / ") : "未入力"}<br>
      主観評価平均：${subjectiveAverage.toFixed(2)} / 5
    </div>
    ${warnings.length ? `<ul>${warnings.map(w => `<li>${w}</li>`).join("")}</ul>` : ""}
  `;

  return data;
}

function loadPreview(input, targetId, type) {
  const file = input.files && input.files[0];
  const target = $(targetId);

  if (!file) {
    target.className = "media-preview empty";
    target.textContent = type === "image" ? "写真未選択" : "動画未選択";
    return;
  }

  const url = URL.createObjectURL(file);
  target.className = "media-preview";
  target.innerHTML = "";

  if (type === "image") {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "立ち写真プレビュー";
    target.appendChild(img);
    state.photoName = file.name;
  } else {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    target.appendChild(video);
    state.videoName = file.name;
  }
}

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem("horseEvaluatorRecords") || "[]");
  } catch {
    return [];
  }
}

function setSaved(records) {
  localStorage.setItem("horseEvaluatorRecords", JSON.stringify(records));
}

function saveCurrent() {
  const data = evaluate();
  if (!data.horseName) {
    alert("馬名を入力してください。");
    return;
  }

  data.result = state.lastResult;
  const records = getSaved();
  records.unshift(data);
  setSaved(records.slice(0, 100));
  renderSaved();
  alert("この端末に保存しました。");
}

function renderSaved() {
  const records = getSaved();
  const list = $("savedList");

  if (!records.length) {
    list.textContent = "保存データはありません。";
    return;
  }

  list.innerHTML = records.map((r, index) => `
    <div class="saved-item">
      <strong>${escapeHtml(r.horseName || "名称未設定")}</strong>
      <small>${new Date(r.createdAt).toLocaleString("ja-JP")} / ${escapeHtml(r.club || "クラブ未設定")} / ${r.result?.total ?? "--"}点</small>
      <div class="item-actions">
        <button class="secondary-btn" onclick="loadSaved(${index})">読み込む</button>
        <button class="ghost-btn danger" onclick="deleteSaved(${index})">削除</button>
      </div>
    </div>
  `).join("");
}

function loadSaved(index) {
  const r = getSaved()[index];
  if (!r) return;

  $("horseName").value = r.horseName || "";
  $("club").value = r.club || "";
  $("sex").value = r.sex || "";
  $("birthDate").value = r.birthDate || "";
  $("weight").value = r.measurements?.weight ?? "";
  $("height").value = r.measurements?.height ?? "";
  $("chest").value = r.measurements?.chest ?? "";
  $("cannon").value = r.measurements?.cannon ?? "";
  $("hindquarter").value = r.subjective?.hindquarter ?? 3;
  $("flexibility").value = r.subjective?.flexibility ?? 3;
  $("stride").value = r.subjective?.stride ?? 3;
  $("coordination").value = r.subjective?.coordination ?? 3;
  $("growth").value = r.subjective?.growth ?? 3;
  $("notes").value = r.notes || "";
  updateRangeLabels();
  evaluate();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSaved(index) {
  const records = getSaved();
  records.splice(index, 1);
  setSaved(records);
  renderSaved();
}

function clearSaved() {
  if (!confirm("保存済みデータをすべて削除しますか？")) return;
  localStorage.removeItem("horseEvaluatorRecords");
  renderSaved();
}

function exportJson() {
  const data = evaluate();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (data.horseName || "horse-data").replace(/[\\/:*?"<>|]/g, "_");
  a.href = url;
  a.download = `${safeName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetForm() {
  if (!confirm("現在の入力内容をリセットしますか？")) return;

  fields.forEach((id) => {
    const el = $(id);
    if (!el) return;
    if (el.type === "range") el.value = 3;
    else el.value = "";
  });

  $("photoInput").value = "";
  $("videoInput").value = "";
  $("photoPreview").className = "media-preview empty";
  $("photoPreview").textContent = "写真未選択";
  $("videoPreview").className = "media-preview empty";
  $("videoPreview").textContent = "動画未選択";
  $("resultTitle").textContent = "未評価";
  $("totalScore").textContent = "--";
  $("resultDetails").textContent = "測尺と主観評価を入力すると判定を表示します。";
  state.photoName = "";
  state.videoName = "";
  state.lastResult = null;
  updateRangeLabels();
}

function updateRangeLabels() {
  document.querySelectorAll('input[type="range"]').forEach((range) => {
    const span = document.querySelector(`[data-for="${range.id}"]`);
    if (span) span.textContent = range.value;
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("photoInput").addEventListener("change", (e) => loadPreview(e.target, "photoPreview", "image"));
$("videoInput").addEventListener("change", (e) => loadPreview(e.target, "videoPreview", "video"));
$("evaluateBtn").addEventListener("click", evaluate);
$("saveBtn").addEventListener("click", saveCurrent);
$("exportBtn").addEventListener("click", exportJson);
$("resetBtn").addEventListener("click", resetForm);
$("clearSavedBtn").addEventListener("click", clearSaved);

document.querySelectorAll('input[type="range"]').forEach((range) => {
  range.addEventListener("input", updateRangeLabels);
});

updateRangeLabels();
renderSaved();

window.loadSaved = loadSaved;
window.deleteSaved = deleteSaved;
