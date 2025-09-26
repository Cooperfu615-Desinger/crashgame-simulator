import argparse
from pathlib import Path
import pandas as pd
from simulator import run_sims, read_config_from_excel, read_config_from_csv

def main():
    ap = argparse.ArgumentParser(description="CrashGame Simulator CLI")
    ap.add_argument("-i","--input", required=True, help="Config CSV/Excel/Folder")
    ap.add_argument("-o","--output", default="SimResults.xlsx", help="Output Excel path")
    ap.add_argument("-r","--rounds", nargs="+", type=int, default=[10_000, 100_000, 1_000_000], help="Rounds list")
    ap.add_argument("-s","--seed", type=int, default=123, help="Random seed")
    ap.add_argument("-b","--bet", type=float, default=1.0, help="Bet per round")
    args = ap.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)

    results = {}
    if in_path.is_dir():
        # batch load all CSVs
        for csv_path in sorted(in_path.glob("*.csv")):
            cfg = read_config_from_csv(csv_path)
            name = csv_path.stem
            results[f"Sim_{name}"] = run_sims(cfg, rounds_list=args.rounds, bet=args.bet, seed=args.seed)
    elif in_path.suffix.lower() in [".xlsx", ".xlsm", ".xls"]:
        cfgs = read_config_from_excel(in_path)
        for name, df in cfgs.items():
            short = name.split("Config_")[-1]
            results[f"Sim_{short}"] = run_sims(df, rounds_list=args.rounds, bet=args.bet, seed=args.seed)
    else:
        # assume single CSV
        cfg = read_config_from_csv(in_path)
        results["Sim"] = run_sims(cfg, rounds_list=args.rounds, bet=args.bet, seed=args.seed)

    with pd.ExcelWriter(out_path, engine="xlsxwriter") as w:
        for name, df in results.items():
            sheet = name[:31]  # Excel sheet name limit
            df.to_excel(w, sheet_name=sheet, index=False)

    print(f"[OK] Wrote {out_path.resolve()}")

if __name__ == "__main__":
    main()
