export type NavPageId =
  | 'overview'
  | 'explorer'
  | 'customers'
  | 'campaigns'
  | 'predict'
  | 'models'
  | 'history'
  | 'reports'
  | 'settings'
  | 'about'
  | 'profile';


export interface DatasetMeta {
  datasetName: string;
  sourceType: 'uci_default' | 'custom_upload' | 'empty';
  totalRows: number;
  missingValues: number;
  duplicateRows: number;
  uploadedAt: string;
}

export interface ColumnSchemaInfo {
  name: string;
  type: string;
  missingCount: number;
  missingPct: number;
  uniqueCount: number;
  sampleValues: string;
}

export interface NumericalStatInfo {
  column: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
}

export interface DatasetSummaryResponse {
  hasDataset: boolean;
  meta: DatasetMeta;
  rowCount: number;
  columnCount: number;
  subscribedCount: number;
  notSubscribedCount: number;
  subscriptionRate: number;
  columns: ColumnSchemaInfo[];
  numericalStats: NumericalStatInfo[];
}

export interface BankRecordRow {
  id: number;
  age: number;
  job: string;
  marital: string;
  education: string;
  default: string;
  balance: number;
  housing: string;
  loan: string;
  contact: string;
  day: number;
  month: string;
  duration: number;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;
  y: string;
}

export interface DatasetPreviewResponse {
  rows: BankRecordRow[];
  totalFiltered: number;
  totalRows: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OverviewResponse {
  hasDataset: boolean;
  meta?: DatasetMeta;
  kpis?: {
    totalCustomers: number;
    subscribedCustomers: number;
    notSubscribedCustomers: number;
    subscriptionRate: number;
    campaignConversionRate: number;
    averageBalance: number;
    avgSubscribedBalance: number;
    totalCampaignContacts: number;
    bestModelName: string;
    bestModelRocAuc: number;
    bestModelAccuracy: number;
  };
  subscriptionDistribution?: Array<{ name: string; value: number; pct: number; color: string }>;
  monthlyPerformance?: Array<{
    month: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    conversionRate: number;
  }>;
  ageGroupAnalysis?: Array<{
    ageGroup: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    subscriptionRate: number;
  }>;
  jobAnalysis?: Array<{
    job: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    subscriptionRate: number;
  }>;
  educationAnalysis?: Array<{
    education: string;
    total: number;
    subscribed: number;
    subscriptionRate: number;
  }>;
  maritalAnalysis?: Array<{
    marital: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    subscriptionRate: number;
  }>;
  housingComparison?: Array<{
    housingLoan: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    subscriptionRate: number;
  }>;
  campaignContactAnalysis?: Array<{
    contacts: string;
    total: number;
    subscribed: number;
    conversionRate: number;
  }>;
  recentPredictions?: Array<{
    id: number;
    customer_summary: string;
    prediction: string;
    label: string;
    probability: number;
    confidence_tier: string;
    model_name: string;
    created_at: string;
  }>;
}

export interface CustomerInsightsResponse {
  hasDataset: boolean;
  summary?: {
    totalFiltered: number;
    totalDataset: number;
    subscribedCount: number;
    subscriptionRate: number;
    avgBalance: number;
    avgAge: number;
  };
  ageDistribution?: Array<{
    range: string;
    subscribed: number;
    notSubscribed: number;
    total: number;
    rate: number;
  }>;
  jobBreakdown?: Array<{
    job: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    rate: number;
    avgBalance: number;
  }>;
  educationBreakdown?: Array<{
    education: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    rate: number;
  }>;
  maritalBreakdown?: Array<{
    marital: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    rate: number;
  }>;
  balanceAnalysis?: Array<{
    tier: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    rate: number;
  }>;
  loanProfiles?: Array<{
    profile: string;
    total: number;
    subscribed: number;
    rate: number;
  }>;
  contactAnalysis?: Array<{
    contact: string;
    total: number;
    subscribed: number;
    rate: number;
  }>;
}

export interface CampaignAnalyticsResponse {
  hasDataset: boolean;
  contactFrequency?: Array<{
    contacts: string;
    totalCustomers: number;
    subscribed: number;
    notSubscribed: number;
    conversionRate: number;
  }>;
  previousOutcomes?: Array<{
    outcome: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    conversionRate: number;
  }>;
  contactMethods?: Array<{
    method: string;
    total: number;
    subscribed: number;
    conversionRate: number;
  }>;
  monthlyStats?: Array<{
    month: string;
    volume: number;
    subscribed: number;
    conversionRate: number;
  }>;
  durationDistribution?: Array<{
    durationRange: string;
    total: number;
    subscribed: number;
    notSubscribed: number;
    conversionRate: number;
  }>;
  metrics?: {
    avgDurationYes: number;
    avgDurationNo: number;
    pSuccessRate: number;
    cellularRate: number;
    overContactedRate: number;
    optimalCallsRate: number;
    overContactedShare: number;
  };
}

export interface PredictionFormInput {
  age: number;
  job: string;
  marital: string;
  education: string;
  default: string;
  balance: number;
  housing: string;
  loan: string;
  contact: string;
  day: number;
  month: string;
  duration: number;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;
  modelMode: 'pre_call' | 'post_call';
  selectedModelId?: string;
}

export interface PredictionResultResponse {
  id: number;
  createdAt: string;
  prediction: 'yes' | 'no';
  label: 'Likely to Subscribe' | 'Unlikely to Subscribe';
  probability: number;
  confidenceTier: 'High Confidence' | 'Moderate Confidence' | 'Borderline';
  modelName: string;
  modelMode: 'pre_call' | 'post_call';
  topContributions: Array<{
    feature: string;
    value: string | number;
    impact: number;
    direction: 'positive' | 'negative';
    explanation: string;
  }>;
  recommendedAction: {
    priority: 'High Priority Lead' | 'Nurture Lead' | 'Low Priority / Deprioritize';
    channel: string;
    timing: string;
    strategy: string;
    expectedLift: string;
  };
}

export interface ModelMetricItem {
  id: string;
  name: string;
  family: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  precisionNo: number;
  recallNo: number;
  f1No: number;
  confusionMatrix: { tn: number; fp: number; fn: number; tp: number };
  rocCurve: Array<{ x: number; y: number; threshold: number }>;
  prCurve: Array<{ x: number; y: number; threshold: number }>;
  featureImportance: Array<{
    feature: string;
    label: string;
    importance: number;
    category: 'Demographic' | 'Financial' | 'Campaign' | 'Historical';
  }>;
  trainTimeMs: number;
  hyperparameters: Record<string, string | number | boolean>;
  isBest: boolean;
}

export interface PipelineSuite {
  mode: 'pre_call' | 'post_call';
  modeLabel: string;
  modeDescription: string;
  datasetSize: number;
  trainSize: number;
  testSize: number;
  positiveClassRatio: number;
  bestModelName: string;
  bestModelId: string;
  bestModelRocAuc: number;
  bestModelF1: number;
  trainedAt: string;
  models: ModelMetricItem[];
}

export interface ModelPerformanceResponse {
  preCall: PipelineSuite;
  postCall: PipelineSuite;
}

export interface PredictionHistoryRecord {
  id: number;
  customerSummary: string;
  input: PredictionFormInput;
  prediction: 'yes' | 'no';
  label: string;
  probability: number;
  confidenceTier: string;
  modelName: string;
  modelMode: string;
  recommendedAction: {
    priority: string;
    channel: string;
    timing: string;
    strategy: string;
    expectedLift: string;
  };
  createdAt: string;
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  phoneNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  developmentResetToken?: string | null;
  developmentResetUrl?: string | null;
  emailSent?: boolean;
}

