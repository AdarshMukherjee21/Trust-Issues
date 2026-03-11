import os
import json
import pandas as pd

# -----------------------
# Paths
# -----------------------

BASE_DIR = r""

CSV_PATH = os.path.join(BASE_DIR, r"data\spam.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, r"data\mass_data.csv")

DATA_FOLDERS = [
    r"sim_data_05_03_13h_GEN_100",
    r"sim_data_05_03_13h_GEN_100_fail",
    r"sim_data_26_02_14h_GEN_1",
    r"sim_data_26_02_14h_GEN_10",
    r"sim_data_26_02_15h_GEN_8",
    r"sim_data_26_02_15h_GEN_11",
    r"sim_data_26_02_15h_GEN_12",
    r"sim_data_26_02_15h_GEN_13_failed",
    r"sim_data_26_02_15h_GEN_100_failed",
]

# -----------------------
# Load original dataset
# -----------------------

df = pd.read_csv(CSV_PATH, encoding="latin-1")

rows = []

# -----------------------
# Process JSON files
# -----------------------

for folder in DATA_FOLDERS:

    folder_path = os.path.join(BASE_DIR, folder)

    if not os.path.exists(folder_path):
        print(f"Skipping missing folder: {folder}")
        continue

    for file in os.listdir(folder_path):

        if not file.endswith(".json"):
            continue

        file_path = os.path.join(folder_path, file)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # ham -> not spam
            if "ham" in data and data["ham"]:
                rows.append({
                    "message": data["ham"],
                    "is_spam": False
                })

            # spam -> spam
            if "spam" in data and data["spam"]:
                rows.append({
                    "message": data["spam"],
                    "is_spam": True
                })

        except Exception as e:
            print(f"Error reading {file}: {e}")

# -----------------------
# Combine datasets
# -----------------------

generated_df = pd.DataFrame(rows)

mass_df = pd.concat([df, generated_df], ignore_index=True)

# -----------------------
# Save result
# -----------------------

mass_df.to_csv(OUTPUT_PATH, index=False)

print("Done!")
print("Original rows:", len(df))
print("Generated rows:", len(generated_df))
print("Total rows:", len(mass_df))
print("Saved to:", OUTPUT_PATH)