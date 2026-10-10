import os
import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
import requests
import streamlit as st

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, roc_auc_score
from xgboost import XGBClassifier


# ============================================================
# 1. CONFIGURATION
# ============================================================

DATASET_PATH = r"C:\Users\raghu\Desktop\hexaware_hackathon\creditcard.csv"
POLICY_PATH = r"C:\Users\raghu\Desktop\hexaware_hackathon\fraud_policy.txt"

OLLAMA_URL = "http://localhost:11434"
CHAT_MODEL = "llama3.2"

AI_TIMEOUT_SECONDS = 45
AI_MAX_TOKENS = 160

REVIEW_AMOUNT = 10000
HIGH_AMOUNT = 25000

VERIFIED_USERS = {
    "RAGHUL",
    "VISWA",
    "YAMUNA",
}

UNKNOWN_SENDER_WEIGHT = 45
UNKNOWN_RECEIVER_WEIGHT = 30
REVIEW_AMOUNT_WEIGHT = 10
HIGH_AMOUNT_WEIGHT = 20
MODEL_REVIEW_WEIGHT = 10
MODEL_HIGH_WEIGHT = 20


# ============================================================
# 2. STREAMLIT CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="FraudLens AI",
    page_icon="🛡️",
    layout="wide",
)

st.title("🛡️ FraudLens AI")

st.caption(
    "Verified Payment Processing | Suspicious Activity Detection "
    "| XGBoost | RAG + LLM Investigation"
)


# ============================================================
# 3. DATASET LOADING
# ============================================================

@st.cache_data(show_spinner=False)
def load_cached_dataset(path, modified_time):
    if path.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(path)

    return pd.read_csv(path)


def load_dataset():
    if not os.path.isfile(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    return load_cached_dataset(
        DATASET_PATH,
        os.path.getmtime(DATASET_PATH),
    )


# ============================================================
# 4. RAG POLICY INDEX
# ============================================================

def split_policy(text, max_chars=1200):
    paragraphs = [
        paragraph.strip()
        for paragraph in text.replace("\r", "").split("\n\n")
        if paragraph.strip()
    ]

    chunks = []
    current = ""

    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 2 <= max_chars:
            current = (
                current + "\n\n" + paragraph
            ).strip()
        else:
            if current:
                chunks.append(current)

            while len(paragraph) > max_chars:
                chunks.append(paragraph[:max_chars])
                paragraph = paragraph[max_chars:]

            current = paragraph

    if current:
        chunks.append(current)

    return chunks


@st.cache_resource(show_spinner=False)
def load_policy_index(policy_path, modified_time):
    with open(
        policy_path,
        "r",
        encoding="utf-8",
    ) as file:
        policy_text = file.read()

    chunks = split_policy(policy_text)

    if not chunks:
        return [], None, None

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=12000,
    )

    matrix = vectorizer.fit_transform(chunks)

    return chunks, vectorizer, matrix


def retrieve_policy(question, top_k=3):
    """
    Retrieve relevant policy passages using local TF-IDF search.

    The function does not require an embedding model and normally
    retrieves policy passages quickly.
    """

    if not os.path.isfile(POLICY_PATH):
        print(f"Policy file not found: {POLICY_PATH}")
        return []

    try:
        chunks, vectorizer, matrix = load_policy_index(
            POLICY_PATH,
            os.path.getmtime(POLICY_PATH),
        )

        if vectorizer is None or not chunks:
            return []

        query_vector = vectorizer.transform([question])

        similarities = cosine_similarity(
            query_vector,
            matrix,
        ).flatten()

        indexes = np.argsort(similarities)[::-1][:top_k]

        results = []

        for index in indexes:
            # Exclude unrelated chunks with zero similarity.
            if similarities[index] <= 0:
                continue

            results.append({
                "source": Path(policy_path_name()).name,
                "chunk": int(index + 1),
                "text": chunks[index],
                "similarity": float(similarities[index]),
            })

        return results

    except Exception as error:
        print(f"Policy retrieval error: {error}")
        return []


def policy_path_name():
    return POLICY_PATH


# ============================================================
# 5. OLLAMA CONNECTION
# ============================================================

def check_ollama():
    response = requests.get(
        f"{OLLAMA_URL}/api/tags",
        timeout=5,
    )

    response.raise_for_status()

    return [
        model["name"]
        for model in response.json().get("models", [])
    ]


def ask_ollama(prompt, timeout=AI_TIMEOUT_SECONDS):
    """
    Generate a concise AI response.

    The timeout limits the wait for the request. It does not
    guarantee that every response will finish within 30 seconds.
    """

    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": CHAT_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are FraudLens AI, a fraud investigation analyst. "
                        "Answer using the transaction facts and retrieved "
                        "policy evidence. Explain the actual decision and "
                        "risk signals. Never invent evidence. A demo risk "
                        "score is not a fraud probability. Do not claim that "
                        "a real payment was executed or blocked. Keep the "
                        "answer concise and cite supplied policy chunks."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "stream": False,
            "keep_alive": "10m",
            "options": {
                "temperature": 0.2,
                "num_predict": AI_MAX_TOKENS,
            },
        },
        timeout=timeout,
    )

    response.raise_for_status()

    answer = response.json().get(
        "message", {}
    ).get("content", "").strip()

    if not answer:
        raise RuntimeError("Ollama returned an empty response.")

    return answer


# ============================================================
# 6. OPTIONAL XGBOOST MODEL
# ============================================================

@st.cache_resource(show_spinner=False)
def train_model(path, modified_time):
    df = load_cached_dataset(
        path,
        modified_time,
    ).copy()

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    lookup = {
        str(column).lower(): column
        for column in df.columns
    }

    target = (
        lookup.get("class")
        or lookup.get("is_fraud")
        or lookup.get("fraud")
    )

    if target is None:
        raise ValueError(
            "Expected a target column named Class, is_fraud, or fraud."
        )

    y = pd.to_numeric(
        df[target],
        errors="coerce",
    )

    valid = y.notna()

    df = df.loc[valid].copy()
    y = y.loc[valid].astype(int)

    if y.nunique() != 2:
        raise ValueError(
            "The target must contain both classes 0 and 1."
        )

    X = df.drop(
        columns=[target],
    ).select_dtypes(
        include=[np.number],
    ).copy()

    if X.empty:
        raise ValueError("No numeric features were found.")

    X = X.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    medians = X_train.median().fillna(0)

    X_train = X_train.fillna(medians).fillna(0)
    X_test = X_test.fillna(medians).fillna(0)

    # Limit the training subset for faster experimentation.
    training_limit = 50000

    if len(X_train) > training_limit:
        X_train, _, y_train, _ = train_test_split(
            X_train,
            y_train,
            train_size=training_limit,
            random_state=42,
            stratify=y_train,
        )

    counts = y_train.value_counts()

    imbalance_ratio = (
        counts.get(0, 1)
        / max(counts.get(1, 1), 1)
    )

    model = XGBClassifier(
        n_estimators=80,
        max_depth=3,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="binary:logistic",
        eval_metric="aucpr",
        scale_pos_weight=float(imbalance_ratio),
        random_state=42,
        n_jobs=4,
        tree_method="hist",
    )

    model.fit(X_train, y_train)

    probabilities = model.predict_proba(X_test)[:, 1]

    metrics = {
        "rows": len(df),
        "fraud": int((y == 1).sum()),
        "legitimate": int((y == 0).sum()),
        "pr_auc": float(
            average_precision_score(y_test, probabilities)
        ),
        "roc_auc": float(
            roc_auc_score(y_test, probabilities)
        ),
    }

    return (
        model,
        list(X.columns),
        medians,
        metrics,
    )


# ============================================================
# 7. TRANSACTION ANALYSIS
# ============================================================

def analyze_transaction(
    sender,
    receiver,
    amount,
    model_data,
):
    sender = sender.strip().upper()
    receiver = receiver.strip().upper()

    signals = []
    score = 0

    sender_verified = sender in VERIFIED_USERS
    receiver_verified = receiver in VERIFIED_USERS

    # Sender verification.
    if sender_verified:
        signals.append(
            f"Sender {sender} is on the configured verified-user list."
        )
    else:
        score += UNKNOWN_SENDER_WEIGHT
        signals.append(
            f"Sender {sender} is not verified "
            f"(+{UNKNOWN_SENDER_WEIGHT} risk points)."
        )

    # Receiver verification.
    if receiver_verified:
        signals.append(
            f"Receiver {receiver} is on the configured verified-user list."
        )
    else:
        score += UNKNOWN_RECEIVER_WEIGHT
        signals.append(
            f"Receiver {receiver} is not verified "
            f"(+{UNKNOWN_RECEIVER_WEIGHT} risk points)."
        )

    # Amount thresholds.
    if amount >= HIGH_AMOUNT:
        score += HIGH_AMOUNT_WEIGHT
        signals.append(
            f"Amount ₹{amount:,.2f} reaches the high-amount threshold "
            f"of ₹{HIGH_AMOUNT:,} (+{HIGH_AMOUNT_WEIGHT} risk points)."
        )

    elif amount >= REVIEW_AMOUNT:
        score += REVIEW_AMOUNT_WEIGHT
        signals.append(
            f"Amount ₹{amount:,.2f} reaches the review threshold "
            f"of ₹{REVIEW_AMOUNT:,} (+{REVIEW_AMOUNT_WEIGHT} risk points)."
        )

    # Optional model output.
    model_score = None

    model_note = (
        "XGBoost was not used. The result uses the configured rules only."
    )

    if model_data is not None:
        model, features, medians, _ = model_data

        row = {}

        for feature in features:
            if feature.lower() == "amount":
                row[feature] = float(amount)

            elif feature.lower() == "time":
                row[feature] = 0.0

            else:
                row[feature] = float(
                    medians.get(feature, 0.0)
                )

        frame = pd.DataFrame(
            [row],
            columns=features,
        )

        model_score = float(
            model.predict_proba(frame)[0][1]
        )

        if model_score >= 0.5:
            score += MODEL_HIGH_WEIGHT

            signals.append(
                f"XGBoost score {model_score:.4f} reaches the demo "
                f"high-score cutoff of 0.50 (+{MODEL_HIGH_WEIGHT} points)."
            )

        elif model_score >= 0.2:
            score += MODEL_REVIEW_WEIGHT

            signals.append(
                f"XGBoost score {model_score:.4f} reaches the demo "
                f"review cutoff of 0.20 (+{MODEL_REVIEW_WEIGHT} points)."
            )

        model_note = (
            "The form does not collect all original dataset features. "
            "Missing features are filled with training medians, and Time "
            "is set to zero. With anonymized V1-V28 features, this score "
            "is not reliable for a real transaction."
        )

    risk_score = min(max(score, 0), 100)

    # Payment decision is based on verification and configured thresholds.
    if not sender_verified:
        decision = "BLOCKED — SENDER NOT VERIFIED"
        payment_status = "NOT ALLOWED"

    elif not receiver_verified:
        decision = "SUSPICIOUS ACTIVITY — REVIEW RECEIVER"
        payment_status = "REQUIRES REVIEW"

    elif amount >= HIGH_AMOUNT:
        decision = "HIGH-VALUE PAYMENT — REVIEW REQUIRED"
        payment_status = "REQUIRES REVIEW"

    else:
        decision = "APPROVED BY DEMO RULES"
        payment_status = "ALLOWED"

    if not signals:
        signals.append(
            "No configured suspicious-activity rules were triggered."
        )

    return {
        "sender": sender,
        "receiver": receiver,
        "amount_inr": float(amount),
        "sender_verified": sender_verified,
        "receiver_verified": receiver_verified,
        "decision": decision,
        "payment_status": payment_status,
        "risk_score": risk_score,
        "model_score": model_score,
        "signals": signals,
        "model_note": model_note,
    }


# ============================================================
# 8. IMMEDIATE EXPLANATION
# ============================================================

def immediate_explanation(tx):
    """
    Display an immediate explanation without waiting for Ollama.
    """

    lines = [
        f"### Decision: {tx['decision']}",
        "",
        f"- **Sender:** {tx['sender']}",
        f"- **Sender verified:** "
        f"{'Yes' if tx['sender_verified'] else 'No'}",
        f"- **Receiver:** {tx['receiver']}",
        f"- **Receiver verified:** "
        f"{'Yes' if tx['receiver_verified'] else 'No'}",
        f"- **Amount:** ₹{tx['amount_inr']:,.2f}",
        f"- **Rule-based risk score:** {tx['risk_score']} / 100",
        f"- **Payment status:** {tx['payment_status']}",
        "",
        "### Reasons",
    ]

    for signal in tx["signals"]:
        lines.append(f"- {signal}")

    if tx["model_score"] is not None:
        lines.extend([
            "",
            f"**Experimental XGBoost score:** {tx['model_score']:.4f}",
            "",
            tx["model_note"],
        ])

    lines.extend([
        "",
        "### Important limitation",
        "The displayed risk score is a demonstration score, not a "
        "calibrated probability of fraud. The payment decision is simulated "
        "and does not move or block real money.",
    ])

    return "\n".join(lines)


# ============================================================
# 9. OPTIMIZED RAG + LLM EXPLANATION
# ============================================================

def generate_combined_explanation(tx):
    """
    1. Retrieve relevant policy passages.
    2. Send a compact prompt to Ollama.
    3. Return the answer and the evidence used.
    """

    query = (
        f"verified sender unknown receiver payment review "
        f"risk score suspicious activity amount INR "
        f"{tx['amount_inr']} decision {tx['decision']} "
        + " ".join(tx["signals"])
    )

    # RAG retrieval.
    sources = retrieve_policy(
        query,
        top_k=2,
    )

    evidence = "\n\n".join(
        f"[{source['source']}, chunk {source['chunk']}]\n"
        f"{source['text']}"
        for source in sources
    )

    if not evidence:
        evidence = (
            "No relevant policy passage was retrieved. "
            "Use only the supplied transaction facts. "
            "Do not invent policy requirements."
        )

    # Compact prompt to reduce LLM processing time.
    prompt = f"""
Explain this FraudLens transaction in under 120 words.

TRANSACTION:
{json.dumps(tx, ensure_ascii=False)}

RETRIEVED POLICY EVIDENCE:
{evidence}

Include:
1. Why the payment is allowed, blocked, or requires review.
2. The exact triggered risk signals and displayed score.
3. Relevant policy evidence with source and chunk citations.
4. One recommended next step.

Do not invent facts. The score is a demo score, not a fraud probability.
Do not claim real money was transferred or blocked.
If policy evidence is missing, state that explicitly.
"""

    # LLM generation.
    answer = ask_ollama(
        prompt,
        timeout=AI_TIMEOUT_SECONDS,
    )

    return answer, sources


# ============================================================
# 10. SESSION STATE
# ============================================================

if "transaction" not in st.session_state:
    st.session_state.transaction = None

if "model_data" not in st.session_state:
    st.session_state.model_data = None

if "combined_explanation" not in st.session_state:
    st.session_state.combined_explanation = None


# ============================================================
# 11. SIDEBAR
# ============================================================

with st.sidebar:
    st.header("FraudLens Settings")

    st.write("**Verified demo users**")
    st.write(", ".join(sorted(VERIFIED_USERS)))

    st.write("**Ollama model**")
    st.code(CHAT_MODEL)

    st.write("**Dataset path**")
    st.code(DATASET_PATH)

    st.write("**Policy path**")
    st.code(POLICY_PATH)

    if st.button("Check Ollama"):
        try:
            models = check_ollama()

            st.success("Ollama is running.")
            st.write(models)

            if not any(
                model == CHAT_MODEL
                or model.startswith(CHAT_MODEL + ":")
                for model in models
            ):
                st.warning(
                    f"{CHAT_MODEL} is not listed. Run "
                    f"`ollama pull {CHAT_MODEL}`."
                )

        except Exception as error:
            st.error(f"Ollama unavailable: {error}")

    st.caption("Review threshold: ₹10,000")
    st.caption("High-amount threshold: ₹25,000")


# ============================================================
# 12. MAIN TABS
# ============================================================

tab_payment, tab_data = st.tabs([
    "💳 Payment & Fraud Analysis",
    "📊 Dataset Information",
])


# ============================================================
# TAB 1: PAYMENT AND FRAUD ANALYSIS
# ============================================================

with tab_payment:
    st.subheader("Payment Verification")

    st.write(
        "Choose the sender, receiver, and payment amount. "
        "FraudLens will display its demo payment decision and reasons."
    )

    account_options = sorted(
        VERIFIED_USERS
        | {
            "UNKNOWN001",
            "UNKNOWN002",
            "SUSPICIOUS001",
            "SUSPICIOUS002",
            "OTHER_UNKNOWN",
        }
    )

    col1, col2 = st.columns(2)

    with col1:
        sender = st.selectbox(
            "Sender account",
            account_options,
            index=account_options.index("RAGHUL"),
        )

    with col2:
        receiver = st.selectbox(
            "Receiver account",
            account_options,
            index=account_options.index("VISWA"),
        )

    amount = st.number_input(
        "Payment amount (₹)",
        min_value=0.0,
        value=500.0,
        step=100.0,
    )

    st.caption(
        "Verification is simulated using the configured demo-user list."
    )

    # Optional model training.
    with st.expander("Optional: XGBoost model"):
        st.write(
            "The payment rules work without training the model. "
            "Train XGBoost only if you want its experimental score "
            "included in the analysis."
        )

        if st.button("Train XGBoost"):
            try:
                with st.spinner("Training XGBoost model..."):
                    st.session_state.model_data = train_model(
                        DATASET_PATH,
                        os.path.getmtime(DATASET_PATH),
                    )

                st.success("XGBoost model is ready.")

            except Exception as error:
                st.error(f"Training failed: {error}")

    if st.session_state.model_data:
        metrics = st.session_state.model_data[3]

        st.caption(
            f"Model ready | PR-AUC: {metrics['pr_auc']:.4f} | "
            f"ROC-AUC: {metrics['roc_auc']:.4f}"
        )

    if st.button(
        "Verify & Analyze Payment",
        type="primary",
        use_container_width=True,
    ):
        start_time = time.time()

        tx = analyze_transaction(
            sender,
            receiver,
            amount,
            st.session_state.model_data,
        )

        st.session_state.transaction = tx
        st.session_state.combined_explanation = None

        st.session_state.analysis_seconds = (
            time.time() - start_time
        )

    # Render the saved result after Streamlit reruns.
    tx = st.session_state.transaction

    if tx:
        st.divider()

        if tx["payment_status"] == "ALLOWED":
            st.success(f"✅ {tx['decision']}")

        elif tx["payment_status"] == "NOT ALLOWED":
            st.error(f"🚫 {tx['decision']}")

        else:
            st.warning(f"⚠️ {tx['decision']}")

        col1, col2, col3 = st.columns(3)

        col1.metric(
            "Rule-based risk score",
            f"{tx['risk_score']} / 100",
        )

        col2.metric(
            "Sender",
            "Verified" if tx["sender_verified"] else "Unknown",
        )

        col3.metric(
            "Receiver",
            "Verified" if tx["receiver_verified"] else "Unknown",
        )

        st.caption(
            "Initial rule assessment time: "
            f"{st.session_state.get('analysis_seconds', 0):.3f} seconds"
        )

        # Immediate explanation.
        st.markdown(
            immediate_explanation(tx)
        )

        if tx["model_score"] is not None:
            st.warning(tx["model_note"])

        st.divider()

        # Combined RAG and LLM feature.
        st.subheader(
            "🧠 Combined RAG + LLM Investigation Explanation"
        )

        st.write(
            "The application retrieves relevant policy passages and "
            "combines them with the current transaction evidence."
        )

        if st.button(
            "Generate RAG + LLM Explanation",
            type="primary",
            use_container_width=True,
        ):
            st.session_state.combined_explanation = None

            try:
                with st.spinner(
                    "Retrieving policy evidence and generating explanation..."
                ):
                    answer, sources = generate_combined_explanation(tx)

                st.session_state.combined_explanation = {
                    "answer": answer,
                    "sources": sources,
                }

            except requests.exceptions.Timeout:
                st.session_state.combined_explanation = {
                    "answer": (
                        "Ollama exceeded the response time limit. "
                        "The payment decision and immediate reasons above "
                        "remain available. Retry after the model is ready."
                    ),
                    "sources": [],
                }

            except Exception as error:
                st.session_state.combined_explanation = {
                    "answer": (
                        f"AI explanation could not be generated: {error}. "
                        "The immediate rule-based result remains available."
                    ),
                    "sources": [],
                }

        explanation = st.session_state.combined_explanation

        if explanation:
            st.markdown("### AI Investigation Report")
            st.markdown(explanation["answer"])

            sources = explanation["sources"]

            if sources:
                with st.expander("View RAG policy evidence"):
                    for source in sources:
                        st.markdown(
                            f"**{source['source']} — "
                            f"chunk {source['chunk']}**"
                        )

                        st.caption(
                            f"Similarity: {source['similarity']:.3f}"
                        )

                        st.write(source["text"])

            else:
                st.info(
                    "No relevant policy passages were retrieved. "
                    "Check the policy file and the terms in its contents."
                )


# ============================================================
# TAB 2: DATASET INFORMATION
# ============================================================

with tab_data:
    st.subheader("Dataset Information")

    st.write(
        "This dataset supports model experimentation. It does not "
        "contain the verified sender and receiver identities used "
        "by the payment form."
    )

    if st.button("Load Dataset Information"):
        try:
            with st.spinner("Loading dataset..."):
                df = load_dataset()

            st.session_state.data_info_loaded = True

        except Exception as error:
            st.error(f"Dataset loading failed: {error}")

    if st.session_state.get("data_info_loaded", False):
        try:
            df = load_dataset()

            total_rows, total_columns = df.shape

            col1, col2, col3 = st.columns(3)

            col1.metric(
                "Total rows",
                f"{total_rows:,}",
            )

            col2.metric(
                "Total columns",
                total_columns,
            )

            lookup = {
                str(column).lower(): column
                for column in df.columns
            }

            target = (
                lookup.get("class")
                or lookup.get("is_fraud")
                or lookup.get("fraud")
            )

            if target:
                labels = pd.to_numeric(
                    df[target],
                    errors="coerce",
                ).dropna()

                fraud_count = int(
                    (labels == 1).sum()
                )

                legitimate_count = int(
                    (labels == 0).sum()
                )

                fraud_rate = (
                    100 * fraud_count / len(labels)
                    if len(labels)
                    else 0
                )

                col3.metric(
                    "Dataset fraud rate",
                    f"{fraud_rate:.4f}%",
                )

                st.subheader("Class Distribution")

                distribution = pd.DataFrame({
                    "Class": [
                        "Legitimate (0)",
                        "Fraud (1)",
                    ],
                    "Count": [
                        legitimate_count,
                        fraud_count,
                    ],
                })

                st.dataframe(
                    distribution,
                    use_container_width=True,
                )

                st.bar_chart(
                    distribution.set_index("Class")
                )

            st.subheader("Dataset Preview")

            st.dataframe(
                df.head(10),
                use_container_width=True,
            )

            st.subheader("Column Details")

            details = pd.DataFrame({
                "Column": df.columns,

                "Data type": [
                    str(df[column].dtype)
                    for column in df.columns
                ],

                "Missing values": [
                    int(df[column].isna().sum())
                    for column in df.columns
                ],

                "Unique values": [
                    int(df[column].nunique())
                    for column in df.columns
                ],
            })

            st.dataframe(
                details,
                use_container_width=True,
            )

            st.subheader("Descriptive Statistics")

            st.dataframe(
                df.describe(
                    include="all"
                ).transpose(),
                use_container_width=True,
            )

        except Exception as error:
            st.error(
                f"Could not display dataset information: {error}"
            )