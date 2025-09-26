/* Seeded RNG (Mulberry32) */
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const idxStage = headers.indexOf("Stage");
  const idxMult  = headers.indexOf("Multiplier");
  const idxPb    = headers.indexOf("P_black");
  const out = [];
  for (let i=1; i<lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 3) continue;
    const Stage = parseInt(cols[idxStage]);
    const Multiplier = parseFloat(cols[idxMult]);
    const P_black = parseFloat(cols[idxPb]);
    if (isFinite(Stage) && isFinite(Multiplier) && isFinite(P_black)) {
      out.push({Stage, Multiplier, P_black});
    }
  }
  out.sort((a,b)=>a.Stage-b.Stage);
  return out;
}

const SAMPLE_FIRST = `Stage,Multiplier,P_black
1,1.02,0.95
2,1.07,0.948
3,1.14,0.944
4,1.29,0.885
5,1.41,0.912
6,1.55,0.91
7,1.72,0.9
8,1.94,0.885
9,2.21,0.88
10,2.58,0.855
11,3.10,0.835
12,3.88,0.8
13,5.17,0.75
14,7.76,0.668
15,15.0,0.5`;

const SAMPLE_CHOSEN = `Stage,Multiplier,P_black
1,1.02,0.95
2,1.07,0.948
3,1.14,0.944
4,6.85,0.166
5,13.7,0.502
6,32.01,0.425
7,96.03,0.337
8,500.0,0.1925`;

let currentConfig = parseCSV(SAMPLE_FIRST);

/* Monte Carlo single-trial */
function simulateStage(mc, p, rounds, bet, rng) {
  let success = 0;
  for (let i=0; i<rounds; i++) {
    if (rng() < p) success++;
  }
  const meanPayout = (success * mc * bet) / rounds;
  const rtp = meanPayout / bet;
  // Bernoulli std of payouts: sd = sqrt(p*(1-p))*mc
  const sdPayout = Math.sqrt(p*(1-p)) * mc * bet;
  const sd = sdPayout / bet;
  const sr = success / rounds;
  const ciLow = rtp - 1.96*sd/Math.sqrt(rounds);
  const ciHigh = rtp + 1.96*sd/Math.sqrt(rounds);
  return {rtp, sd, sr, ciLow, ciHigh};
}

/* Analytical fast mode (no MC loops) */
function analyticalStage(mc, p, rounds, bet) {
  const rtp = p * mc;
  const sd = Math.sqrt(p*(1-p)) * mc; // per-bet std
  const ciLow = rtp - 1.96*sd/Math.sqrt(rounds);
  const ciHigh = rtp + 1.96*sd/Math.sqrt(rounds);
  return {rtp, sd, sr: p, ciLow, ciHigh};
}

function runSim(config, roundsList, seed, bet, analytical=false) {
  const rng = mulberry32(seed|0);
  const rows = [];
  for (const r of roundsList) {
    for (const st of config) {
      const mc = st.Multiplier;
      const p = st.P_black;
      const stats = analytical ? analyticalStage(mc, p, r, bet)
                               : simulateStage(mc, p, r, bet, rng);
      rows.push({
        Stage: st.Stage,
        Multiplier: mc,
        P_black: p,
        Rounds: r,
        Sim_RTP: stats.rtp,
        Sim_StdDev: stats.sd,
        Success_Rate: stats.sr,
        CI_low: stats.ciLow,
        CI_high: stats.ciHigh
      });
    }
  }
  return rows;
}

function toCSV(rows) {
  const headers = ["Stage","Multiplier","P_black","Rounds","Sim_RTP","Sim_StdDev","Success_Rate","CI_low","CI_high"];
  const out = [headers.join(",")];
  for (const r of rows) {
    out.push(headers.map(h=>r[h]).join(","));
  }
  return out.join("\n");
}

/* UI wiring */
const btnLoadFirst = document.getElementById("btnLoadFirst");
const btnLoadChosen = document.getElementById("btnLoadChosen");
const fileCsv = document.getElementById("fileCsv");
const inpRounds = document.getElementById("inpRounds");
const inpSeed = document.getElementById("inpSeed");
const inpBet = document.getElementById("inpBet");
const chkAnalytical = document.getElementById("chkAnalytical");
const btnRun = document.getElementById("btnRun");
const btnDownload = document.getElementById("btnDownload");
const msg = document.getElementById("msg");
const tblBody = document.querySelector("#tbl tbody");

btnLoadFirst.addEventListener("click", ()=>{
  currentConfig = parseCSV(SAMPLE_FIRST);
  msg.textContent = "已載入：初試啼聲";
});
btnLoadChosen.addEventListener("click", ()=>{
  currentConfig = parseCSV(SAMPLE_CHOSEN);
  msg.textContent = "已載入：天選時刻";
});
fileCsv.addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    complete: (res)=>{
      const rows = res.data.filter(r=>r.Stage && r.Multiplier && r.P_black).map(r=>({
        Stage: parseInt(r.Stage),
        Multiplier: parseFloat(r.Multiplier),
        P_black: parseFloat(r.P_black)
      }));
      rows.sort((a,b)=>a.Stage-b.Stage);
      currentConfig = rows;
      msg.textContent = `已載入自訂 CSV（${rows.length} rows）`;
    }
  });
});

let chart;
btnRun.addEventListener("click", ()=>{
  const roundsList = inpRounds.value.split(",").map(s=>parseInt(s.trim())).filter(n=>isFinite(n)&&n>0);
  const seed = parseInt(inpSeed.value)||123;
  const bet = parseFloat(inpBet.value)||1.0;
  const analytical = chkAnalytical.checked;

  if (!currentConfig || currentConfig.length===0) {
    msg.textContent = "請先載入參數或上傳 CSV";
    return;
  }

  msg.textContent = "模擬中…";
  setTimeout(()=>{
    const rows = runSim(currentConfig, roundsList, seed, bet, analytical);
    // fill table
    tblBody.innerHTML = "";
    for (const r of rows) {
      const tr = document.createElement("tr");
      const cells = [r.Stage, r.Multiplier, r.P_black, r.Rounds, r.Sim_RTP.toFixed(6), r.Sim_StdDev.toFixed(6), r.Success_Rate.toFixed(6), r.CI_low.toFixed(6), r.CI_high.toFixed(6)];
      for (const c of cells) {
        const td = document.createElement("td");
        td.className = "px-2 py-1 border-b";
        td.textContent = c;
        tr.appendChild(td);
      }
      tblBody.appendChild(tr);
    }
    // chart (mean RTP across stages per rounds)
    const meanByRounds = {};
    for (const r of rows) {
      if (!meanByRounds[r.Rounds]) meanByRounds[r.Rounds] = {sum:0, n:0};
      meanByRounds[r.Rounds].sum += r.Sim_RTP;
      meanByRounds[r.Rounds].n += 1;
    }
    const labels = Object.keys(meanByRounds).map(k=>parseInt(k)).sort((a,b)=>a-b);
    const data = labels.map(l=>meanByRounds[l].sum / meanByRounds[l].n);
    const ctx = document.getElementById("chart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: "Mean Sim_RTP", data, tension: 0.2, pointRadius: 3 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Rounds" } }, y: { title: { display: true, text: "Mean Sim_RTP" } } } }
    });

    // download CSV
    const csv = toCSV(rows);
    const blob = new Blob([csv], {type:"text/csv"});
    btnDownload.href = URL.createObjectURL(blob);
    btnDownload.classList.remove("hidden");

    msg.textContent = "完成 ✅";
  }, 10);
});