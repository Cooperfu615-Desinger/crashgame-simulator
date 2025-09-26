# CrashGame Simulator (紅黑籤)

Interactive (Streamlit) + CLI simulator for quick Monte Carlo validation of per-stage Multiplier and success probability (P_black). Observe RTP convergence, variance, and 95% confidence intervals across multiple round counts (10K/100K/1M).

---

## Features
- Editable Config: CSV or Excel (sheets named `Config_*`)
- Two modes:
  - Streamlit UI: upload/edit config -> run -> download results
  - CLI: batch run multiple configs and output an Excel
- Stats: Sim_RTP, StdDev, 95% CI, Success Rate
- Reproducible with fixed random seed

---

## Structure
```
crashgame-simulator/
├─ app/
│  └─ streamlit_app.py
├─ simulator/
│  ├─ __init__.py
│  └─ model.py
├─ configs/
│  ├─ Config_first_attempt.csv
│  └─ Config_chosen_moment.csv
├─ data/
│  └─ CrashGame_Simulator.xlsx
├─ cli.py
├─ requirements.txt
├─ README.md
├─ LICENSE
└─ .gitignore
```

---

## Install
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### A) Streamlit UI
```bash
streamlit run app/streamlit_app.py
```
- Edit the default `Config_first_attempt` / `Config_chosen_moment` in-place
- Or upload CSV/Excel (Excel needs sheets starting with `Config_`)
- Pick rounds, seed, bet -> Run -> Download results

### B) CLI
```bash
python cli.py -i configs/Config_first_attempt.csv -o SimResults.xlsx -r 10000 100000 1000000 -s 123
```
Args:
- `-i/--input`: CSV/Excel path or a folder (folder batches all CSVs)
- `-o/--output`: Output Excel path
- `-r/--rounds`: One or more round counts
- `-s/--seed`: Random seed
- `-b/--bet`: Bet per round (default 1.0)

CSV columns:
```
Stage,Multiplier,P_black
1,1.02,0.95
2,1.07,0.948
...
```

Excel format:
- Create one or more `Config_*` sheets with the same columns

---

## Note
- This is a single-trial success model (probability P_black yields Multiplier*bet, else 0). It is ideal for parameter sanity checks and long-run convergence.
- For a staged "ladder" model (survive first N-1, succeed at N), add a function in `simulator/model.py` (hook provided in comments) or open a PR.

License: MIT
