import {
  ApiError,
  ValidationErrorDetail,
  FarmerProfile,
  ProfileUpdateRequest,
  CropRecommendation,
  CropSelection,
  CropSuitabilityCheck,
  CropSelectRequest,
  CropRecommendationByPincodeResponse,
  VoiceRequest,
  VoiceResponse,
  VoicePollResponse,
  DiseaseDiagnosis,
  DiseasePredictResponse,
  MarketPrice,
  WeatherResponse,
  Task,
  Notification,
  LocationData,
  SoilData,
  WeatherData,
  DataSourceInfo,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("farmvoice_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("farmvoice_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("farmvoice_token");
      localStorage.removeItem("farmvoice_auth");
      localStorage.removeItem("farmvoice_user");
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Always try to update token from localStorage before request if running on client
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("farmvoice_token");
      if (storedToken) {
        this.token = storedToken;
      }
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        this.clearToken();

        // Dispatch global auth error event for the AuthContext to handle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('farmvoice:auth-error'));
        }

        const errorMsg = response.status === 403
          ? "Access forbidden. Please log in again."
          : "Session expired. Please log in again.";
        return { error: errorMsg };
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle Pydantic validation errors (422) - detail is an array
        let errorMessage = "An error occurred";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // Format validation errors
            errorMessage = (data.detail as ValidationErrorDetail[])
              .map((err) => {
                const field = err.loc?.join(".") || "field";
                return `${field}: ${err.msg || "Invalid value"}`;
              })
              .join(", ");
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        return { error: errorMessage };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  public async post<T>(
    endpoint: string,
    body: unknown,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // Auth endpoints
  async register(phoneNumber: string, password: string, name?: string) {
    const response = await this.request<{
      access_token: string;
      token_type: string;
      user: { id: string; phone_number: string; name: string };
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber, password, name }),
    });

    if (response.data) {
      this.setToken(response.data.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("farmvoice_auth", "true");
        localStorage.setItem("farmvoice_user", response.data.user.phone_number);
        localStorage.setItem("farmvoice_user_id", response.data.user.id);
        localStorage.setItem("farmvoice_user_name", response.data.user.name);
      }
    }

    return response;
  }

  async login(phoneNumber: string, password: string) {
    const response = await this.request<{
      access_token: string;
      token_type: string;
      user: { id: string; phone_number: string; name: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber, password }),
    });

    if (response.data) {
      this.setToken(response.data.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("farmvoice_auth", "true");
        localStorage.setItem("farmvoice_user", response.data.user.phone_number);
        localStorage.setItem("farmvoice_user_id", response.data.user.id);
        localStorage.setItem("farmvoice_user_name", response.data.user.name);
      }
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<{
      id: string;
      email: string;
      name: string;
    }>("/api/auth/me");
  }

  // Crop recommendation
  async getCropRecommendations(
    soilType: string,
    climate: string,
    season: string,
  ) {
    return this.request<
      Array<{
        name: string;
        suitability: number;
        description: string;
        benefits: string[];
      }>
    >("/api/crop/recommend", {
      method: "POST",
      body: JSON.stringify({ soil_type: soilType, climate, season }),
    });
  }

  // Disease diagnosis
  async diagnoseDisease(crop: string, symptoms: string, imageUrl?: string) {
    return this.request<DiseaseDiagnosis>("/api/disease/diagnose", {
      method: "POST",
      body: JSON.stringify({ crop, symptoms, image_url: imageUrl }),
    });
  }

  // Predict diseases (Scraping)
  async predictDisease(cropName: string) {
    return this.request<DiseasePredictResponse>("/api/disease/predict", {
      method: "POST",
      body: JSON.stringify({ crop_name: cropName }),
    });
  }

  // Market prices
  async getMarketPrices() {
    return this.request<MarketPrice[]>("/api/market/prices");
  }

  // Voice assistant - Synchronous / Blocking
  async processVoiceQuery(
    query: string,
    language: string = "en",
    lat?: number,
    lon?: number,
  ) {
    return this.request<VoiceResponse>("/api/voice/chat", {
      method: "POST",
      body: JSON.stringify({
        text: query,
        lang: language,
        lat: lat,
        lon: lon,
        context: {
          language: language,
        },
      } satisfies VoiceRequest),
    });
  }

  // Poll for voice response (async mode)
  async getVoiceChatResult(requestId: string) {
    return this.request<VoicePollResponse>(`/api/voice/chat/result/${requestId}`);
  }

  // Farmer profile
  async getFarmerProfile() {
    return this.request<FarmerProfile>("/api/farmer/profile");
  }

  async updateFarmerProfile(profile: ProfileUpdateRequest) {
    return this.request<FarmerProfile>("/api/farmer/profile", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  }

  // Crop recommendations by pincode
  async getCropRecommendationsByPincode(pincode: string) {
    return this.request<CropRecommendationByPincodeResponse>(
      "/api/crop/recommend-by-pincode",
      {
        method: "POST",
        body: JSON.stringify({ pincode }),
      },
    );
  }

  // Check crop suitability
  async checkCropSuitability(cropName: string, pincode?: string) {
    return this.request<CropSuitabilityCheck>("/api/crop/check-suitability", {
      method: "POST",
      body: JSON.stringify({ crop_name: cropName, pincode }),
    });
  }

  // Select crop
  async selectCrop(cropData: CropSelectRequest) {
    return this.request<CropSelection>("/api/crop/select", {
      method: "POST",
      body: JSON.stringify(cropData),
    });
  }

  // Get daily tasks
  async getDailyTasks(tab?: string) {
    const endpoint = tab ? `/api/tasks?tab=${tab}` : "/api/tasks";
    return this.request<Task[]>(endpoint);
  }

  // Get notifications
  async getNotifications() {
    return this.request<Notification[]>("/api/notifications");
  }

  // Get selected crops
  async getSelectedCrops() {
    return this.request<CropSelection[]>("/api/crops/selected");
  }

  // Get weather data
  async getWeather(lat: number, lon: number) {
    return this.request<WeatherResponse>(
      `/api/weather?latitude=${lat}&longitude=${lon}`,
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
