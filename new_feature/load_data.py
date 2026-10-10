import os
import pandas as pd
import snowflake.connector

from dotenv import load_dotenv
from snowflake.connector.pandas_tools import write_pandas

load_dotenv()

# 1. Load the Kaggle dataset
df = pd.read_csv("creditcard.csv")

# 2. Prepare the transaction ID
df.insert(0, "TRANSACTION_ID", range(1, len(df) + 1))

# 3. Rename columns to match the Snowflake table
df.rename(
    columns={
        "Time": "TRANSACTION_TIME",
        "Amount": "AMOUNT",
        "Class": "ACTUAL_CLASS"
    },
    inplace=True
)

df.columns = [col.upper() for col in df.columns]


# 4. Connect to Snowflake
conn = snowflake.connector.connect(
    account="IJDRURO-GD88203",
    user="RAGHULPRASANNA",
    password="RaghulPrasanna@2004",
    warehouse="COMPUTE_WH",
    database="FRAUDLENS_DB",
    schema="RAW_DATA",
    role="ACCOUNTADMIN"
)


try:
    # 5. Upload data to the existing table
    success, chunks, rows, output = write_pandas(
        conn=conn,
        df=df,
        table_name="TRANSACTIONS",
        database="FRAUDLENS_DB",
        schema="RAW_DATA",
        auto_create_table=False,
        overwrite=False
    )

    print("Upload successful:", success)
    print("Chunks uploaded:", chunks)
    print("Rows uploaded:", rows)

finally:
    conn.close()


    

