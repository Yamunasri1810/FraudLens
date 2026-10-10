export interface DatasetSummary {
  total_transactions: number;
  test_transactions: number;
  fraud_prevalence_pct: number;
  test_actual_frauds: number;
}

export interface ModelMetrics {
  id: string;
  name: string;
  type: string;
  average_precision: number;
  roc_auc: number;
  precision_at_200: number;
  recall_at_200: number;
  fraud_in_top_200: number;
  description: string;
  confusion_matrix?: number[][];
  hyperparameters?: Record<string, any>;
}

export interface AnalystReview {
  alert_id: string;
  review_status: string;
  note_text?: string;
  note_status: string;
  approved_by?: string;
  updated_at: string;
}

export interface OverviewData {
  dataset: DatasetSummary;
  selected_model: ModelMetrics;
  capacity_k: number;
  investigation_summary: {
    queue_size: number;
    reviewed_count: number;
    confirmed_fraud_count: number;
    legitimate_cleared_count: number;
    under_review_count: number;
    pending_count: number;
  };
  recent_analyst_activity: AnalystReview[];
}

export interface EdaInsight {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
}

export interface AnalyticsData {
  dataset_summary: {
    total_transactions: number;
    fraud_count: number;
    legit_count: number;
    fraud_prevalence_pct: number;
    duplicate_count: number;
    missing_values: number;
    total_features: number;
  };
  amount_comparison: {
    fraud: { median: number; mean: number; max: number };
    legitimate: { median: number; mean: number; max: number };
  };
  amount_distribution: { bucket: string; legitimate: number; fraud: number }[];
  pca_features: Record<string, { fraud_mean: number; legit_mean: number; correlation: number; divergence: number }>;
  hourly_data: { hour: number; transactions: number; fraud_count: number; fraud_rate_pct: number }[];
  key_insights: EdaInsight[];
  pca_disclaimer: string;
}

export interface AlertItem {
  rank: number;
  id: string;
  original_index: number;
  test_index: number;
  model: string;
  time: number;
  amount: number;
  risk_score: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  review_status: "Pending" | "Under Review" | "Confirmed Fraud" | "Legitimate";
  note_status?: "PENDING_APPROVAL" | "APPROVED";
  has_note?: boolean;
  is_fraud_ground_truth?: number;
  top_features: Record<string, number>;
  all_features?: Record<string, number>;
}

export interface AlertsResponse {
  model: string;
  capacity_k: number;
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
  queue_precision_at_capacity: number;
  actual_fraud_count_in_capacity: number;
  items: AlertItem[];
  disclaimer: string;
}

export interface AlertDetailResponse {
  alert: AlertItem;
  review_status: string;
  investigation_note: {
    text: string;
    status: "PENDING_APPROVAL" | "APPROVED";
    approved_by?: string;
    updated_at?: string;
  };
  safety_disclaimer: string;
}

export interface EvaluationData {
  models: Record<string, ModelMetrics>;
  evaluation_protocol: Record<string, any>;
  curves: {
    precision_recall: {
      logistic_regression: { recall: number; precision: number }[];
      random_forest: { recall: number; precision: number }[];
      baseline_prevalence: number;
    };
    roc: {
      logistic_regression: { fpr: number; tpr: number }[];
      random_forest: { fpr: number; tpr: number }[];
    };
  };
  methodology: Record<string, { title: string; explanation: string }>;
}

export interface CapacityResponse {
  capacity_k: number;
  matched_k: number;
  total_evaluation_frauds: number;
  metrics_at_k: {
    k: number;
    rf_precision: number;
    rf_recall: number;
    rf_frauds_caught: number;
    lr_precision: number;
    lr_recall: number;
    lr_frauds_caught: number;
  };
  cost_assumptions: {
    loss_per_missed_fraud: number;
    cost_per_investigation: number;
  };
  financial_impact: {
    random_forest: {
      frauds_prevented: number;
      frauds_missed: number;
      investigation_expense: number;
      fraud_loss_prevented: number;
      net_financial_benefit: number;
      roi_multiple: number;
    };
    logistic_regression: {
      frauds_prevented: number;
      frauds_missed: number;
      investigation_expense: number;
      fraud_loss_prevented: number;
      net_financial_benefit: number;
      roi_multiple: number;
    };
    unprioritized_random_sampling: {
      frauds_prevented: number;
      frauds_missed: number;
      investigation_expense: number;
      fraud_loss_prevented: number;
      net_financial_benefit: number;
    };
  };
  all_capacity_points: Array<{
    k: number;
    rf_precision: number;
    rf_recall: number;
    rf_frauds_caught: number;
    lr_precision: number;
    lr_recall: number;
    lr_frauds_caught: number;
  }>;
  disclaimer: string;
}
