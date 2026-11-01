export type CompartmentId =
  | 'bridge'
  | 'nico-ermes'
  | 'dna'
  | 'lewis'
  | 'forge'
  | 'route'
  | 'faraday'
  | 'ledger'
  | 'architecture';

export interface SystemTelemetry {
  faradayBattery: number;
  faradayStatus: 'OPTIMAL' | 'MODERATE' | 'CRITICAL_OVERRIDE';
  lastSentiment: string;
  runwayMonths: number;
  monthlyBudget: number;
  currentBalance: number;
  monthlySpend: number;
  activeShifts: ShiftItem[];
  examsCountdown: ExamItem[];
  gpuColabStatus: {
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    device: string;
    tunnel: string;
    vllmPort: number;
    activeModel: string;
    utilization: string;
    vramUsed: string;
  };
  hasApiKey: boolean;
  timestamp: string;
}

export interface ShiftItem {
  id: string;
  day: string;
  date: string;
  start: string;
  end: string;
  role: string;
}

export interface ExamItem {
  id: string;
  subject: string;
  date: string;
  daysLeft: number;
}

export interface ExpenseItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  item: string;
  method: string;
  status: 'APPENDED_SHEET' | 'PENDING' | 'RECONCILED';
  dnaStubCreated?: boolean;
}

export interface DnaNote {
  id: string;
  title: string;
  path: string;
  tags: string[];
  type: string;
  created: string;
  status: 'raw' | 'enzymatically-validated' | 'vectorized';
  content: string;
}

export interface RoutingLogItem {
  id: string;
  timestamp: string;
  source: 'TELEGRAM_TEXT' | 'TELEGRAM_VOICE' | 'TELEGRAM_IMAGE' | 'WEBHOOK_API';
  rawInput: string;
  intent: string;
  targetCompartment: string;
  functionName: string;
  parameters: Record<string, any>;
  subRoutines: { module: string; action: string; details: string }[];
  telegramResponse: string;
  latencyMs: number;
  status: 'SUCCESS' | 'REJECTED_WHITELIST' | 'GUARDRAIL_BLOCKED' | 'ERROR';
}

export interface FeynmanChallengeResponse {
  score: number;
  verdict: string;
  strengths: string[];
  logicalGaps: string[];
  ruthlessChallenge: string;
}
