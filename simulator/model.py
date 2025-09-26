import pandas as pd
import numpy as np
from pathlib import Path

def simulate_stage(multiplier: float, p_black: float, rounds: int = 100_000, bet: float = 1.0, seed=None):
    """Single-trial model: success with prob p_black yields multiplier*bet; failure yields 0."""
    rng = np.random.default_rng(seed)
    successes = rng.random(rounds) < float(p_black)
    payouts = np.where(successes, float(multiplier) * bet, 0.0)
    rtp = payouts.mean() / bet
    sd = payouts.std(ddof=1) / bet
    return {
        "rtp": rtp,
        "stdev": sd,
        "success_rate": successes.mean(),
    }

def run_sims(config_df: pd.DataFrame, rounds_list=(10_000, 100_000, 1_000_000), bet: float = 1.0, seed: int = 123):
    """Run Monte Carlo for a config across multiple round counts; return aggregated DataFrame."""
    assert {"Stage","Multiplier","P_black"}.issubset(set(config_df.columns)), "Config must contain Stage, Multiplier, P_black"
    cfg = config_df[["Stage","Multiplier","P_black"]].dropna().copy()
    cfg["Stage"] = cfg["Stage"].astype(int)
    cfg["Multiplier"] = cfg["Multiplier"].astype(float)
    cfg["P_black"] = cfg["P_black"].astype(float)
    cfg["Expected_RTP"] = cfg["Multiplier"] * cfg["P_black"]

    rng = np.random.default_rng(seed)
    records = []
    for _, row in cfg.iterrows():
        for n in rounds_list:
            sub_seed = int(rng.integers(0, 2**32-1))
            stats = simulate_stage(row["Multiplier"], row["P_black"], rounds=int(n), bet=bet, seed=sub_seed)
            rtp, sd, sr = stats["rtp"], stats["stdev"], stats["success_rate"]
            records.append({
                "Stage": int(row["Stage"]),
                "Multiplier": float(row["Multiplier"]),
                "P_black": float(row["P_black"]),
                "Expected_RTP": float(row["Expected_RTP"]),
                "Rounds": int(n),
                "Sim_RTP": rtp,
                "Sim_StdDev": sd,
                "Success_Rate": sr,
                "CI_low": rtp - 1.96*sd/np.sqrt(n),
                "CI_high": rtp + 1.96*sd/np.sqrt(n),
            })
    out = pd.DataFrame.from_records(records)
    out = out.sort_values(["Rounds","Stage"]).reset_index(drop=True)
    return out

def read_config_from_excel(path: Path):
    """Read all sheets starting with 'Config_' and return dict[name->DataFrame]."""
    xls = pd.ExcelFile(path)
    configs = {}
    for name in xls.sheet_names:
        if name.lower().startswith("config"):
            df = pd.read_excel(xls, sheet_name=name)
            configs[name] = df
    return configs

def read_config_from_csv(path: Path):
    """Read single CSV config and return DataFrame."""
    return pd.read_csv(path)

# Placeholder: ladder model (survive N-1, succeed at N)
# def run_sims_ladder(...):
#     pass
