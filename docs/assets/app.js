function fmt4(x){ return (Math.round(x*10000)/10000).toFixed(4); }
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function sum(arr){ return arr.reduce((a,b)=>a+b,0); }

// Samples
const SAMPLE_FIRST = [
  {Stage:1, Multiplier:1.02, P_black:0.95},
  {Stage:2, Multiplier:1.07, P_black:0.948},
  {Stage:3, Multiplier:1.14, P_black:0.944},
  {Stage:4, Multiplier:1.29, P_black:0.885},
  {Stage:5, Multiplier:1.41, P_black:0.912},
  {Stage:6, Multiplier:1.55, P_black:0.91},
  {Stage:7, Multiplier:1.72, P_black:0.9},
  {Stage:8, Multiplier:1.94, P_black:0.885},
  {Stage:9, Multiplier:2.21, P_black:0.88},
  {Stage:10, Multiplier:2.58, P_black:0.855},
  {Stage:11, Multiplier:3.10, P_black:0.835},
  {Stage:12, Multiplier:3.88, P_black:0.8},
  {Stage:13, Multiplier:5.17, P_black:0.75},
  {Stage:14, Multiplier:7.76, P_black:0.668},
  {Stage:15, Multiplier:15.0, P_black:0.5},
];
const SAMPLE_CHOSEN = [
  {Stage:1, Multiplier:1.02, P_black:0.95},
  {Stage:2, Multiplier:1.07, P_black:0.948},
  {Stage:3, Multiplier:1.14, P_black:0.944},
  {Stage:4, Multiplier:6.85, P_black:0.166},
  {Stage:5, Multiplier:13.7, P_black:0.502},
  {Stage:6, Multiplier:32.01, P_black:0.425},
  {Stage:7, Multiplier:96.03, P_black:0.337},
  {Stage:8, Multiplier:500.0, P_black:0.1925},
];

let decks = [
  { name:"牌局A", weight:1.0, localScale:1.0, steps: JSON.parse(JSON.stringify(SAMPLE_FIRST)) },
  { name:"牌局B", weight:1.0, localScale:1.0, steps: JSON.parse(JSON.stringify(SAMPLE_CHOSEN)) },
  { name:"牌局C", weight:1.0, localScale:1.0, steps: JSON.parse(JSON.stringify(SAMPLE_FIRST)) },
  { name:"牌局D", weight:1.0, localScale:1.0, steps: JSON.parse(JSON.stringify(SAMPLE_FIRST)) },
  { name:"牌局E", weight:1.0, localScale:1.0, steps: JSON.parse(JSON.stringify(SAMPLE_FIRST)) },
];

let globalScale = 1.0;

function deckEV(deck) {
  const s = deck.steps;
  if (!s.length) return 0;
  let sumEV = 0;
  for (const row of s) {
    const m = row.Multiplier * deck.localScale * globalScale;
    const p = row.P_black;
    sumEV += (p * m);
  }
  return sumEV / s.length;
}

function overallEV() {
  const totalW = sum(decks.map(d=>Math.max(0, d.weight)));
  if (totalW <= 0) return 0;
  let acc = 0;
  for (const d of decks) {
    acc += (Math.max(0,d.weight)/totalW) * deckEV(d);
  }
  return acc;
}

const decksContainer = document.getElementById("decks");
const overallRTPSpan = document.getElementById("overallRTP");
const globalScaleRange = document.getElementById("globalScale");
const globalScaleNum = document.getElementById("globalScaleNum");
const targetRTPInput = document.getElementById("targetRTP");
const btnFit = document.getElementById("btnFit");

let rtpChart;

function render() {
  decksContainer.innerHTML = "";
  decks.forEach((deck, idx)=>{
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl shadow p-4";
    const deckRTP = deckEV(deck);

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-3">
          <input data-idx="${idx}" data-field="name" class="px-2 py-1 rounded-lg border w-36" value="${deck.name}" />
          <span class="text-sm text-slate-500">牌局 RTP：</span>
          <span class="text-xl font-semibold">${fmt4(deckRTP)}</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-sm">選中機率</label>
          <input data-idx="${idx}" data-field="weight" type="number" step="0.01" class="px-2 py-1 rounded-lg border w-24" value="${deck.weight}" />
          <label class="text-sm">牌局倍率比例</label>
          <input data-idx="${idx}" data-field="localScale" type="number" step="0.001" class="px-2 py-1 rounded-lg border w-24" value="${deck.localScale}" />
          <button data-idx="${idx}" data-action="addRow" class="px-2 py-1 rounded-lg bg-slate-900 text-white">新增步驟</button>
          <button data-idx="${idx}" data-action="resetA" class="px-2 py-1 rounded-lg bg-slate-200">載入範例A</button>
          <button data-idx="${idx}" data-action="resetB" class="px-2 py-1 rounded-lg bg-slate-200">載入範例B</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-100">
            <tr>
              <th class="px-2 py-1 text-left">Stage</th>
              <th class="px-2 py-1 text-left">Multiplier</th>
              <th class="px-2 py-1 text-left">P_black</th>
              <th class="px-2 py-1 text-left">步驟期望 p×m</th>
              <th class="px-2 py-1 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            ${deck.steps.map((row, rIdx)=>{
              const stepEV = row.P_black * row.Multiplier * deck.localScale * globalScale;
              return `
                <tr class="border-b">
                  <td class="px-2 py-1"><input data-idx="${idx}" data-r="${rIdx}" data-field="Stage" type="number" class="px-2 py-1 rounded border w-24" value="${row.Stage}"></td>
                  <td class="px-2 py-1"><input data-idx="${idx}" data-r="${rIdx}" data-field="Multiplier" type="number" step="0.001" class="px-2 py-1 rounded border w-28" value="${row.Multiplier}"></td>
                  <td class="px-2 py-1"><input data-idx="${idx}" data-r="${rIdx}" data-field="P_black" type="number" step="0.0001" class="px-2 py-1 rounded border w-28" value="${row.P_black}"></td>
                  <td class="px-2 py-1">${fmt4(stepEV)}</td>
                  <td class="px-2 py-1">
                    <button data-idx="${idx}" data-r="${rIdx}" data-action="delRow" class="px-2 py-1 rounded bg-rose-100">刪除</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
    decksContainer.appendChild(card);
  });

  const overall = overallEV();
  overallRTPSpan.textContent = fmt4(overall);

  const ctx = document.getElementById("rtpChart").getContext("2d");
  const labels = decks.map(d=>d.name);
  const data = decks.map(d=>deckEV(d));
  if (rtpChart) rtpChart.destroy();
  rtpChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: "Deck RTP", data }] },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { title: { display: true, text: "RTP" } } }
    }
  });

  decksContainer.querySelectorAll("input").forEach(inp=>{
    inp.addEventListener("input", onDeckInput);
  });
  decksContainer.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", onDeckAction);
  });
}

function onDeckInput(e){
  const idx = parseInt(e.target.getAttribute("data-idx"));
  const field = e.target.getAttribute("data-field");
  const r = e.target.getAttribute("data-r");
  if (r !== null) {
    const rr = parseInt(r);
    if (field === "Stage") decks[idx].steps[rr].Stage = parseInt(e.target.value||0);
    if (field === "Multiplier") decks[idx].steps[rr].Multiplier = parseFloat(e.target.value||0);
    if (field === "P_black") decks[idx].steps[rr].P_black = clamp(parseFloat(e.target.value||0), 0, 1);
  } else {
    if (field === "name") decks[idx].name = e.target.value;
    if (field === "weight") decks[idx].weight = Math.max(0, parseFloat(e.target.value||0));
    if (field === "localScale") decks[idx].localScale = Math.max(0, parseFloat(e.target.value||0));
  }
  render();
}

function onDeckAction(e){
  const idx = parseInt(e.target.getAttribute("data-idx"));
  const act = e.target.getAttribute("data-action");
  if (act === "addRow") {
    const nextStage = (decks[idx].steps.at(-1)?.Stage || 0) + 1;
    decks[idx].steps.push({Stage: nextStage, Multiplier: 1.00, P_black: 0.5});
  }
  if (act === "delRow") {
    const r = parseInt(e.target.getAttribute("data-r"));
    decks[idx].steps.splice(r,1);
  }
  if (act === "resetA") {
    decks[idx].steps = JSON.parse(JSON.stringify(SAMPLE_FIRST));
  }
  if (act === "resetB") {
    decks[idx].steps = JSON.parse(JSON.stringify(SAMPLE_CHOSEN));
  }
  render();
}

// Global controls
const globalScaleRange = document.getElementById("globalScale");
const globalScaleNum = document.getElementById("globalScaleNum");
const targetRTPInput = document.getElementById("targetRTP");
const btnFit = document.getElementById("btnFit");

globalScaleRange.addEventListener("input", (e)=>{
  globalScale = parseFloat(e.target.value);
  globalScaleNum.value = globalScale.toFixed(3);
  render();
});
globalScaleNum.addEventListener("input", (e)=>{
  globalScale = clamp(parseFloat(e.target.value||1), 0.1, 3.0);
  globalScaleRange.value = globalScale.toFixed(3);
  render();
});
btnFit.addEventListener("click", ()=>{
  const target = parseFloat(targetRTPInput.value||0.97);
  const backup = globalScale;
  globalScale = 1.0;
  const base = overallEV();
  if (base <= 0) {
    alert("目前基礎 RTP = 0，請先設定有效參數");
    globalScale = backup;
    return;
  }
  const newScale = clamp(target / base, 0.1, 3.0);
  globalScale = newScale;
  globalScaleRange.value = newScale.toFixed(3);
  globalScaleNum.value = newScale.toFixed(3);
  render();
});

render();