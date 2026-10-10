"""
Tests for Kaggle dataset validation, schema integrity, and fraud prevalence.
"""

import os
import pytest
import pandas as pd
from backend.config import DATA_PATH

def test_dataset_exists_and_schema():
    assert os.path.exists(DATA_PATH), f"Expected dataset at {DATA_PATH}"
    df = pd.read_csv(DATA_PATH)
    assert df.shape == (284807, 31), f"Expected (284807, 31), got {df.shape}"
    
    expected_cols = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount", "Class"]
    assert list(df.columns) == expected_cols

def test_fraud_rate_and_counts():
    df = pd.read_csv(DATA_PATH)
    fraud_count = df["Class"].sum()
    legit_count = (df["Class"] == 0).sum()
    
    assert fraud_count == 492
    assert legit_count == 284315
    
    prevalence = fraud_count / len(df)
    assert abs(prevalence - 0.001727) < 0.0001  # ~0.173%

def test_no_nulls_and_duplicate_handling():
    df = pd.read_csv(DATA_PATH)
    null_count = df.isnull().sum().sum()
    assert null_count == 0, "Dataset should have zero null values"
    
    duplicates = df.duplicated().sum()
    assert duplicates == 1081, f"Expected 1,081 duplicate rows, found {duplicates}"

def test_missing_dataset_handling(monkeypatch):
    from ml.train import run_pipeline
    with pytest.raises(FileNotFoundError):
        run_pipeline(data_path="data/non_existent_creditcard.csv")
