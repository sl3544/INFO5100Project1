# Script for data preprocessing
import pandas as pd
import json

# Load the data into a pandas DataFrame
df = pd.read_csv("vgsales.csv")
genre_totals = df.groupby('Genre')['Global_Sales'].sum().sort_values(ascending=False)

aggregation = df.groupby(['Genre', 'Platform']).agg({
    'NA_Sales': 'sum',
    'EU_Sales': 'sum',
    'JP_Sales': 'sum',
    'Other_Sales': 'sum',
    'Global_Sales': 'sum'
}).round(2)

# Sort the results first by the order of genre_totals, then by Global_Sales within each genre
aggregation = aggregation.reset_index()
aggregation['Genre_Order'] = aggregation['Genre'].map(genre_totals.rank(method='first', ascending=False))
aggregation = aggregation.sort_values(['Genre_Order', 'Global_Sales'], ascending=[True, False])
aggregation = aggregation.set_index(['Genre', 'Platform']).drop('Genre_Order', axis=1)

total_global_sales = aggregation['Global_Sales'].sum()
aggregation['Percentage'] = (aggregation['Global_Sales'] / total_global_sales * 100).round(2)

# Save the aggregated data to a CSV file
output_file = 'game_sales_by_genre_and_platform.csv'
aggregation.to_csv(output_file)


# Convert the DataFrame to a nested dictionary structure
df = pd.read_csv("game_sales_by_genre_and_platform.csv")

# Convert the DataFrame to a list of dictionaries (flat structure)
json_data = df.to_dict(orient='records')

# Save the aggregated data to a JSON file
output_file = 'game_sales.json'
with open(output_file, 'w') as f:
    json.dump(json_data, f, indent=2)
