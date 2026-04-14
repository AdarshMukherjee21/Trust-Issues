import json
import csv
from pathlib import Path

# 1. Define your paths
base_dir = Path("sms")
output_csv = Path("sms/data/spam_accumilated.csv")

# Ensure the output data folder exists just in case
output_csv.parent.mkdir(parents=True, exist_ok=True)

total_rows_added = 0

# 2. Open the CSV file to write
# Using utf-8 encoding is crucial to prevent crashes from special characters or emojis
with open(output_csv, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    
    # Write the header row
    writer.writerow(["message", "is_spam"])
    
    # 3. Recursively find all JSON files in the 'sms' directory and its subfolders
    for json_file in base_dir.rglob("*.json"):
        try:
            with open(json_file, 'r', encoding='utf-8') as jf:
                content = jf.read().strip()
                
                # Skip completely blank files
                if not content:
                    continue
                
                # Parse the JSON
                data = json.loads(content)
                
                # Sometimes generators output a single JSON object, sometimes a list of objects.
                # This ensures we handle both smoothly.
                if isinstance(data, dict):
                    data = [data]
                
                # 4. Extract pairs and write to CSV
                for pair in data:
                    if isinstance(pair, dict):
                        # Add ham message if it exists and isn't empty
                        if pair.get("ham") and str(pair["ham"]).strip():
                            writer.writerow([pair["ham"], "FALSE"])
                            total_rows_added += 1
                            
                        # Add spam message if it exists and isn't empty
                        if pair.get("spam") and str(pair["spam"]).strip():
                            writer.writerow([pair["spam"], "TRUE"])
                            total_rows_added += 1

        except json.JSONDecodeError:
            print(f"⚠️ Skipping {json_file}: Contains invalid JSON formatting.")
        except Exception as e:
            print(f"❌ Error reading {json_file}: {e}")

# 5. Print the final success message
print("-" * 30)
print(f"✅ Data compilation complete!")
print(f"🎯 Total rows successfully appended to CSV: {total_rows_added}")
print(f"📁 Saved to: {output_csv}")
print("-" * 30)