import { useQuery } from '@tanstack/react-query';
import { getSensorLatest, getSensorHistory, getSensorHourly, getSensorDates, getIoTDevices } from '../api/game-api';
import type { SensorReading, SensorHourlyData, IoTDevice } from '../api/game-api';

export function useSensorLatest(deviceId?: string) {
  return useQuery<SensorReading | null>({
    queryKey: ['sensor', 'latest', deviceId],
    queryFn: () => getSensorLatest(deviceId),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useSensorHistory(deviceId = 'mock-sensor-001', hours = 24) {
  return useQuery<SensorReading[]>({
    queryKey: ['sensor', 'history', deviceId, hours],
    queryFn: () => getSensorHistory(deviceId, hours),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useSensorHourly(date: string, deviceId?: string) {
  return useQuery<SensorHourlyData>({
    queryKey: ['sensor', 'hourly', date, deviceId],
    queryFn: () => getSensorHourly(date, deviceId),
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSensorDates(deviceId?: string) {
  return useQuery<string[]>({
    queryKey: ['sensor', 'dates', deviceId],
    queryFn: () => getSensorDates(deviceId),
    staleTime: 30 * 60 * 1000,
  });
}

export function useIoTDevices() {
  return useQuery<IoTDevice[]>({
    queryKey: ['iot', 'devices'],
    queryFn: getIoTDevices,
    staleTime: 30 * 60 * 1000,
  });
}
