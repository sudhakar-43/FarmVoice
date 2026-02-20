/**
 * Shared TypeScript types for FarmVoice Pro
 * 
 * This file contains all type definitions used across the application
 * to replace `any` types with proper TypeScript interfaces.
 */

// ============================================================================
// API Error Types
// ============================================================================

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiError {
  detail?: string | ValidationErrorDetail[] | Record<string, unknown>;
  message?: string;
  error?: string;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email?: string;
  phone_number: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

// ============================================================================
// Farmer Profile Types
// ============================================================================

export interface FarmerProfile {
  id?: string;
  user_id?: string;
  full_name?: string;
  phone?: string;
  location_address?: string;
  acres_of_land?: number;
  pincode?: string;
  region?: string;
  soil_type?: string;
  primary_crop?: string;
  farming_experience?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  phone?: string;
  location_address?: string;
  acres_of_land?: number;
  pincode?: string;
  region?: string;
  soil_type?: string;
  primary_crop?: string;
  farming_experience?: string;
  latitude?: number;
  longitude?: number;
  location_permission?: boolean;
  microphone_permission?: boolean;
  onboarding_completed?: boolean;
}

// ============================================================================
// Crop Selection & Recommendation Types
// ============================================================================

export interface CropRecommendation {
  name: string;
  suitability?: number;
  suitability_score?: number;
  description?: string;
  benefits?: string[];
  confidence?: number;
  reasons?: string[];
}

export interface CropSelection {
  id: string;
  crop_name: string;
  crop_id?: string;
  suitability_score?: number;
  suitability?: number;
  acres_allocated?: number;
  planting_date?: string;
  expected_harvest_date?: string;
  status?: "planned" | "planted" | "growing" | "ready" | "harvested" | "active";
  location?: CropLocation;
  created_at?: string;
}

export interface CropLocation {
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface CropSuitabilityCheck {
  crop_name: string;
  is_suitable: boolean;
  suitability_score: number;
  soil_match?: boolean;
  climate_match?: boolean;
  weather_match?: boolean;
  recommendations?: string[];
  warnings?: string[];
  pincode?: string;
}

export interface CropSelectRequest {
  crop_name: string;
  crop_id?: string;
  suitability_score?: number;
  acres_allocated?: number;
  planting_date?: string;
  location?: {
    pincode?: string;
    city?: string;
    district?: string;
    state?: string;
  };
}

// ============================================================================
// Location, Weather & Soil Types
// ============================================================================

export interface LocationData {
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  display_name?: string;
}

export interface SoilData {
  type?: string;
  ph?: number;
  n?: number; // Nitrogen
  p?: number; // Phosphorus
  k?: number; // Potassium
  organic_carbon?: number;
  description?: string;
}

export interface WeatherData {
  current?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    wind_speed?: number;
    wind_deg?: number;
    clouds?: number;
    description?: string;
    feels_like?: number;
    visibility?: number;
    uv_index?: number;
    precipitation?: number;
    condition?: string;
  };
  forecast?: WeatherForecast[];
  hourly?: WeatherHourly[];
  season?: string;
  last_updated?: string;
}

export interface WeatherForecast {
  date: string;
  temp_min?: number;
  min_temp?: number;
  temp_max?: number;
  max_temp?: number;
  humidity?: number;
  avg_humidity_24h?: number;
  description?: string;
  icon?: string;
  precipitation?: number;
  next_24h_precip_probability?: number;
  wind_speed?: number;
}

export interface WeatherHourly {
  time: string;
  temperature?: number;
  humidity?: number;
  description?: string;
  icon?: string;
  precipitation_probability?: number;
}

export interface ClimateData {
  type?: string;
  avg_temperature?: number;
  avg_rainfall?: number;
  season?: string;
}

// ============================================================================
// Voice Assistant Types
// ============================================================================

export interface VoiceRequest {
  text: string;
  lang?: string;
  lat?: number;
  lon?: number;
  context?: {
    language?: string;
    location?: LocationData;
    user_preferences?: Record<string, unknown>;
  };
}

export interface CanvasSpec {
  type: "chart" | "map" | "table" | "card" | "list";
  title?: string;
  data?: Record<string, unknown>;
  config?: Record<string, unknown>;
  actions?: CanvasAction[];
}

export interface CanvasAction {
  type: "navigate" | "refresh" | "detail";
  target?: string;
  payload?: Record<string, unknown>;
  label?: string;
}

export interface UIUpdate {
  refresh_tasks?: boolean;
  refresh_crops?: boolean;
  refresh_weather?: boolean;
  refresh_market?: boolean;
  show_notification?: boolean;
  notification_type?: "success" | "error" | "warning" | "info";
  notification_message?: string;
}

export interface TimingData {
  processing_time_ms?: number;
  response_time_ms?: number;
  total_time_ms?: number;
  timestamps?: {
    received_at?: string;
    processed_at?: string;
    responded_at?: string;
  };
}

export interface ToolResult {
  tool_name: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  execution_time_ms?: number;
}

export interface VoiceResponse {
  speech?: string;
  response?: string;
  mode?: "ack" | "final" | "streaming";
  request_id?: string;
  status?: "processing" | "completed" | "error";
  canvas_spec?: CanvasSpec;
  ui?: UIUpdate;
  ui_updates?: UIUpdate;
  timings?: TimingData;
  tool_results?: ToolResult[];
  error?: string;
  context?: Record<string, unknown>;
}

export interface VoicePollResponse extends VoiceResponse {
  status: "processing" | "completed" | "error";
}

// ============================================================================
// Disease Management Types
// ============================================================================

export interface DiseaseDiagnosis {
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  treatment: string[];
  prevention: string[];
  confidence?: number;
  image_url?: string;
}

export interface DiseasePrediction {
  name: string;
  symptoms: string;
  control: string;
  image_url?: string;
  severity?: string;
  confidence?: number;
}

export interface DiseasePredictResponse {
  diseases: DiseasePrediction[];
  crop: string;
  timestamp?: string;
}

// ============================================================================
// Market & Weather Types
// ============================================================================

export interface MarketPrice {
  crop: string;
  price: number;
  unit: string;
  change: number;
  trend: "up" | "down" | "stable";
  market: string;
  updated_at: string;
}

export interface WeatherResponse {
  location: LocationData;
  current: {
    temperature: number;
    humidity: number;
    description: string;
    feels_like?: number;
    wind_speed?: number;
  };
  forecast: WeatherForecast[];
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  title: string;
  description: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  start_time?: string;
  end_time?: string;
}

// ============================================================================
// Task & Notification Types
// ============================================================================

export interface Task {
  id: string;
  task: string;
  date: string;
  time?: string;
  status: "pending" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  source?: "manual" | "smart-weather" | "smart-disease" | "smart-schedule";
  meta?: TaskMeta;
  crop_name?: string;
  completed_at?: string;
}

export interface TaskMeta {
  weather_condition?: string;
  disease_risk?: string;
  growth_stage?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: number | string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  date: string;
  read: boolean;
  action_url?: string;
  action_label?: string;
}

// ============================================================================
// Crop Recommendation by Pincode Response
// ============================================================================

export interface CropRecommendationByPincodeResponse {
  pincode: string;
  location: LocationData;
  soil: SoilData;
  climate: string | ClimateData;
  weather: WeatherData;
  suitable_crops: string[];
  recommendations: CropRecommendation[];
  data_sources: DataSourceInfo;
}

export interface DataSourceInfo {
  soil_source?: string;
  weather_source?: string;
  climate_source?: string;
  last_updated?: string;
  [key: string]: unknown;
}

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
