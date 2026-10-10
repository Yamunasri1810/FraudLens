import {
  OverviewData,
  AnalyticsData,
  AlertsResponse,
  AlertDetailResponse,
  EvaluationData,
  CapacityResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(`Cannot connect to FraudLens backend at ${API_BASE}. Please ensure the FastAPI server is running on port 8000.`);
    }
    throw err;
  }
}

export const api = {
  getHealth: () => fetchJson<{ status: string; service: string; version: string; artifacts_loaded: boolean }>("/health"),
  
  getOverview: (model = "random_forest") => 
    fetchJson<OverviewData>(`/api/overview?model=${model}`),
  
  getAnalytics: () => 
    fetchJson<AnalyticsData>("/api/analytics"),
  
  getModels: () => 
    fetchJson<{ evaluation_protocol: any; models: Record<string, any>; feature_importances: any[] }>("/api/models"),
  
  getAlerts: (params: {
    model?: string;
    capacity?: number;
    page?: number;
    limit?: number;
    priority?: string;
    review_status?: string;
    search?: string;
    time_window_hours?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.model) q.set("model", params.model);
    if (params.capacity) q.set("capacity", params.capacity.toString());
    if (params.page) q.set("page", params.page.toString());
    if (params.limit) q.set("limit", params.limit.toString());
    if (params.priority) q.set("priority", params.priority);
    if (params.review_status) q.set("review_status", params.review_status);
    if (params.search) q.set("search", params.search);
    if (params.time_window_hours) q.set("time_window_hours", params.time_window_hours.toString());
    return fetchJson<AlertsResponse>(`/api/alerts?${q.toString()}`);
  },

  getAlertDetail: (alertId: string, model = "random_forest") => 
    fetchJson<AlertDetailResponse>(`/api/alerts/${alertId}?model=${model}`),

  updateReviewStatus: (alertId: string, reviewStatus: string) =>
    fetchJson<{ success: boolean; alert_id: string; review: any }>(`/api/alerts/${alertId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ review_status: reviewStatus }),
    }),

  updateNote: (alertId: string, noteText: string, noteStatus = "PENDING_APPROVAL", approvedBy?: string) =>
    fetchJson<{ success: boolean; alert_id: string; review: any }>(`/api/alerts/${alertId}/note`, {
      method: "POST",
      body: JSON.stringify({
        note_text: noteText,
        note_status: noteStatus,
        approved_by: approvedBy || null,
      }),
    }),

  getEvaluation: () => 
    fetchJson<EvaluationData>("/api/evaluation"),

  getCapacity: (k = 200, lossPerFraud = 2500, costPerInvestigation = 25) =>
    fetchJson<CapacityResponse>(`/api/capacity?k=${k}&loss_per_fraud=${lossPerFraud}&cost_per_investigation=${costPerInvestigation}`),

  predictTransaction: (payload: { time: number; amount: number; v_features: Record<string, number>; model?: string }) =>
    fetchJson<{
      risk_score: number;
      risk_percentage: number;
      priority_tier: string;
      model_used: string;
      key_feature_deviations: Record<string, number>;
      draft_note: any;
      decision_support_notice: string;
    }>("/api/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getExportCsvUrl: (model = "random_forest") => 
    `${API_BASE}/api/alerts/export?model=${model}`,
};
