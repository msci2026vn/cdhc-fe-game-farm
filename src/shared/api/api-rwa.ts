// ═══════════════════════════════════════════════════════════════
// API RWA — Blockchain, Sensors, IoT, Delivery/Garden
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type {
  MyGardenData, GardenSummary, DeliveryHistoryDay,
  ClaimSlotRequest, ClaimSlotResult, ScanClaimRequest, ScanClaimResult,
  VerifyOtpResult, SlotQrData, DeliveryProof,
} from '../types/game-api.types';

// ═══ Phase 5: Blockchain + IoT Types ═══

export interface BlockchainStats {
  rootCount: number;
  totalReadingsOnChain: number;
  deployerBalance: string;
  contractAddress: string;
  chainId: number;
  explorerUrl: string;
}

export interface BlockchainLog {
  id: string;
  merkleRoot: string;
  readingCount: number;
  txHash: string | null;
  blockNumber: number | null;
  gasUsed: string | null;
  chainId: number;
  contractAddress: string | null;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  errorMessage: string | null;
  batchedAt: string;
  submittedAt: string | null;
  confirmedAt: string | null;
  explorerUrl: string | null;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  temperature: string | null;
  humidity: string | null;
  lightLevel: string | null;
  soilPh: string | null;
  soilMoisture: string | null;
  dataHash: string | null;
  blockchainBatchId: string | null;
  recordedAt: string;
  indicators?: {
    temperature: 'good' | 'warning' | 'danger';
    humidity: 'good' | 'warning' | 'danger';
    soilPh: 'good' | 'warning' | 'danger';
  };
}

export interface IoTDevice {
  id: string;
  name: string;
  type: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

// ═══ Phase 5: Blockchain + IoT API Functions ═══

export const getBlockchainStats = async (): Promise<BlockchainStats> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/blockchain/stats`);
  if (!res.ok) throw new Error(`Failed to fetch blockchain stats: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getBlockchainLogs = async (limit = 20): Promise<BlockchainLog[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/blockchain/logs?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch blockchain logs: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getSensorLatest = async (deviceId?: string): Promise<SensorReading | null> => {
  const params = deviceId ? `?deviceId=${deviceId}` : '';
  const res = await fetch(`${API_BASE_URL}/api/rwa/sensors/latest${params}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getSensorLatest'); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(`Failed to fetch sensor latest: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const getSensorHistory = async (deviceId = 'mock-sensor-001', hours = 24): Promise<SensorReading[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/sensors/history?deviceId=${deviceId}&hours=${hours}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getSensorHistory'); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(`Failed to fetch sensor history: ${res.status}`);
  const json = await res.json();
  return json.data;
};

// ═══ Phase 7A: Hourly Aggregation + Available Dates ═══

export interface SensorHourlyRecord {
  hour: number;
  time: string;
  avgTemperature: number | null;
  avgHumidity: number | null;
  avgLightLevel: number | null;
  avgSoilPh: number | null;
  avgSoilMoisture: number | null;
  readingCount: number;
  indicators: {
    temperature: 'good' | 'warning' | 'danger';
    humidity: 'good' | 'warning' | 'danger';
    soilPh: 'good' | 'warning' | 'danger';
  } | null;
}

export interface SensorHourlyData {
  date: string;
  deviceId: string;
  hours: (SensorHourlyRecord | null)[];
}

export const getSensorHourly = async (date: string, deviceId?: string): Promise<SensorHourlyData> => {
  const params = new URLSearchParams({ date });
  if (deviceId) params.set('deviceId', deviceId);
  const res = await fetch(`${API_BASE_URL}/api/rwa/sensors/hourly?${params}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getSensorHourly'); throw new Error('Session expired'); }
  if (res.status === 403) throw new Error('VIP_REQUIRED');
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const getSensorDates = async (deviceId?: string): Promise<string[]> => {
  const params = deviceId ? `?deviceId=${deviceId}` : '';
  const res = await fetch(`${API_BASE_URL}/api/rwa/sensors/dates${params}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getSensorDates'); throw new Error('Session expired'); }
  if (res.status === 403) throw new Error('VIP_REQUIRED');
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data.dates;
};

export const getIoTDevices = async (): Promise<IoTDevice[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/devices`);
  if (!res.ok) throw new Error(`Failed to fetch IoT devices: ${res.status}`);
  const json = await res.json();
  return json.data;
};

// ═══ Phase 8: Camera Livestream ═══

export interface CameraStreamInfo {
  id: string;
  name: string;
  location: string;
  webrtcUrl: string;
  hlsUrl: string | null;
  description: string;
  resolution: string;
}

export const getCameraStreamInfo = async (deviceId?: string): Promise<CameraStreamInfo> => {
  const params = deviceId ? `?deviceId=${deviceId}` : '';
  const res = await fetch(`${API_BASE_URL}/api/rwa/camera/stream-info${params}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getCameraStreamInfo'); throw new Error('Session expired'); }
  if (res.status === 403) throw new Error('VIP_REQUIRED');
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

// ═══ Phase 4: Delivery / My Garden ═══

export const getMyGarden = async (): Promise<MyGardenData> => {
  const url = `${API_BASE_URL}/api/rwa/my-garden`;
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getMyGarden'); throw new Error('Session expired'); }
  if (res.status === 403) throw new Error('VIP_REQUIRED');
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const getGardenSummary = async (): Promise<GardenSummary> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/my-garden/summary`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getGardenSummary'); throw new Error('Session expired'); }
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const getDeliveryHistory = async (): Promise<DeliveryHistoryDay[]> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/delivery-history`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getDeliveryHistory'); throw new Error('Session expired'); }
  if (res.status === 403) throw new Error('VIP_REQUIRED');
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

// ═══ Phase 6C/6F: Delivery OTP + Verify ═══

export const claimDeliverySlot = async (slotId: string, data: ClaimSlotRequest): Promise<ClaimSlotResult> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/delivery/claim/${slotId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 401) { handleUnauthorized('claimDeliverySlot'); throw new Error('Session expired'); }
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const scanClaimDelivery = async (data: ScanClaimRequest): Promise<ScanClaimResult> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/delivery/scan-claim`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status === 401) { handleUnauthorized('scanClaimDelivery'); throw new Error('Session expired'); }
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const manualVerifyDelivery = async (slotId: string, otpCode: string): Promise<VerifyOtpResult> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/delivery/verify-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId, otpCode }),
  });
  if (res.status === 401) { handleUnauthorized('manualVerifyDelivery'); throw new Error('Session expired'); }
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const getSlotQr = async (slotId: string): Promise<SlotQrData> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/delivery/qr/${slotId}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getSlotQr'); throw new Error('Session expired'); }
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};

export const getDeliveryProof = async (slotId: string): Promise<DeliveryProof> => {
  const res = await fetch(`${API_BASE_URL}/api/rwa/delivery/verify/${slotId}`, { credentials: 'include' });
  if (res.status === 401) { handleUnauthorized('getDeliveryProof'); throw new Error('Session expired'); }
  if (!res.ok) { await handleApiError(res); }
  const json = await res.json();
  return json.data;
};
