import pandas as pd

# 1. Define paths
original_csv_path = 'sms/data/spam.csv'
new_csv_path = 'sms/data/spam_accumilated.csv'
final_output_path = 'sms/data/spam_final_merged.csv'

print("🔄 Loading datasets...")

# 2. Load the original CSV
# Using latin-1 because the original Kaggle/standard spam dataset is encoded that way
df_original = pd.read_csv(original_csv_path, encoding='latin-1')


# 3. Load the newly accumulated CSV
df_new = pd.read_csv(new_csv_path, encoding='utf-8')



# Convert TRUE/FALSE (strings or booleans) to 1 and 0
# We use a lambda to handle both string 'TRUE' and boolean True just in case


# 4. Combine them!
print(f"📊 Original dataset rows: {len(df_original)}")
print(f"📊 New dataset rows: {len(df_new)}")

df_combined = pd.concat([df_original, df_new], ignore_index=True)

# 5. Clean up (Drop empty rows and duplicates)

initial_combined_len = len(df_combined)
df_combined.drop_duplicates(keep='first', inplace=True)
duplicates_removed = initial_combined_len - len(df_combined)

# 6. Save the ultimate mega-dataset
df_combined.to_csv(final_output_path, index=False, encoding='utf-8')

print("-" * 30)
print("✅ Merge Successful!")
print(f"🧹 Removed {duplicates_removed} duplicate rows.")
print(f"🎯 Final dataset size: {len(df_combined)} rows.")
print(f"📁 Saved as: {final_output_path}")
print("-" * 30)