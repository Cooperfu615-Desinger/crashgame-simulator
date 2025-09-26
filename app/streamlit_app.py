import io
from pathlib import Path
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt

from simulator import run_sims

st.set_page_config(page_title="CrashGame Simulator", layout="wide")

st.title("CrashGame Simulator (Red/Black)")
st.caption("Edit config -> simulate -> download results")

with st.sidebar:
    st.header("Global Settings")
    rounds = st.multiselect("Rounds", options=[10_000, 100_000, 1_000_000, 5_000_000], default=[10_000, 100_000, 1_000_000])
    seed = st.number_input("Random Seed", value=123, step=1)
    bet = st.number_input("Bet per Round", value=1.0, step=0.1, format="%.2f")
    st.markdown("---")
    uploaded = st.file_uploader("Upload Config (CSV or Excel; Excel sheets must start with Config_)", type=["csv","xlsx","xlsm","xls"])

def load_default():
    base = Path(__file__).resolve().parents[1] / "configs"
    first = pd.read_csv(base / "Config_first_attempt.csv")
    chosen = pd.read_csv(base / "Config_chosen_moment.csv")
    return {"Config_first_attempt": first, "Config_chosen_moment": chosen}

def load_uploaded(file):
    suffix = Path(file.name).suffix.lower()
    if suffix == ".csv":
        df = pd.read_csv(file)
        return {"Config_uploaded": df}
    else:
        xls = pd.ExcelFile(file)
        cfgs = {}
        for name in xls.sheet_names:
            if name.lower().startswith("config"):
                cfgs[name] = pd.read_excel(xls, sheet_name=name)
        return cfgs

if uploaded:
    cfgs = load_uploaded(uploaded)
else:
    cfgs = load_default()

tabs = st.tabs(list(cfgs.keys()))
edited_cfgs = {}
for tab, (name, df) in zip(tabs, cfgs.items()):
    with tab:
        st.subheader(name)
        st.write("Edit columns: Stage, Multiplier, P_black")
        ed = st.data_editor(df, use_container_width=True, num_rows="dynamic")
        edited_cfgs[name] = ed

run = st.button("Run Simulation", type="primary")
if run:
    results = {}
    for name, df in edited_cfgs.items():
        cols_needed = ["Stage","Multiplier","P_black"]
        missing = [c for c in cols_needed if c not in df.columns]
        if missing:
            st.error(f"{name} missing columns: {missing}")
            continue
        out = run_sims(df, rounds_list=rounds, bet=bet, seed=seed)
        results[name] = out

    if results:
        st.success("Done")

        for name, res in results.items():
            st.markdown(f"### Results: {name}")
            st.dataframe(res, use_container_width=True, height=320)

            agg = res.groupby("Rounds", as_index=False)["Sim_RTP"].mean()
            fig, ax = plt.subplots()
            ax.plot(agg["Rounds"], agg["Sim_RTP"], marker="o")
            ax.set_xlabel("Rounds")
            ax.set_ylabel("Mean Sim_RTP (across stages)")
            ax.set_title(f"RTP convergence: {name}")
            st.pyplot(fig)

        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="xlsxwriter") as w:
            for name, res in results.items():
                sheet = f"Sim_{name.split('Config_')[-1]}"[:31]
                res.to_excel(w, index=False, sheet_name=sheet)
        st.download_button("Download Excel", data=buffer.getvalue(), file_name="SimResults.xlsx", mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
