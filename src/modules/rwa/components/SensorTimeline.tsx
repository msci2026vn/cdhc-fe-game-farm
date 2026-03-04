import { useState, useMemo } from 'react';
import { useSensorHourly, useSensorDates, useSensorLatest } from '@/shared/hooks/useSensor';

const indicatorStyle = {
  good: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', label: 'Tốt' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', label: 'Cảnh báo' },
  danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Nguy hiểm' },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} giây trước`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  return `${hours} giờ trước`;
}

function MetricCard({ icon, label, value, unit, indicator, fullWidth }: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  indicator?: 'good' | 'warning' | 'danger' | null;
  fullWidth?: boolean;
}) {
  const style = indicator ? indicatorStyle[indicator] : indicatorStyle.good;

  return (
    <div className={`rounded-xl border p-3 ${style.bg} ${style.border} ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500">{icon} {label}</span>
        {indicator && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${style.text}`}>{value}</span>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

function formatDateVN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function SensorTimeline() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [collapsed, setCollapsed] = useState(false);

  const { data: hourlyData, isLoading } = useSensorHourly(selectedDate);
  const { data: availableDates } = useSensorDates();
  const { data: latestReading } = useSensorLatest();

  const hoursWithData = useMemo(() => {
    if (!hourlyData?.hours) return [];
    return hourlyData.hours
      .map((h, i) => (h ? i : -1))
      .filter(i => i >= 0);
  }, [hourlyData]);

  const currentHourData = hourlyData?.hours?.[selectedHour] || null;

  // Find nearest hour with data when switching dates
  const selectDateAndReset = (date: string) => {
    setSelectedDate(date);
    setSelectedHour(new Date().getHours());
  };

  const hasPrev = hoursWithData.some(h => h < selectedHour);
  const hasNext = hoursWithData.some(h => h > selectedHour);

  const goToPrevHour = () => {
    const prev = hoursWithData.filter(h => h < selectedHour).pop();
    if (prev !== undefined) setSelectedHour(prev);
  };

  const goToNextHour = () => {
    const next = hoursWithData.find(h => h > selectedHour);
    if (next !== undefined) setSelectedHour(next);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <div className="text-left">
            <h3 className="font-bold text-farm-brown-dark text-sm">Cảm biến Vườn</h3>
            <p className="text-[10px] text-gray-400">
              {latestReading ? `${latestReading.deviceId} · ${timeAgo(latestReading.recordedAt)}` : 'mock-sensor-001'}
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-stone-400 text-lg">
          {collapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Date picker */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-stone-400 text-[18px]">calendar_today</span>
            <div className="relative flex-1">
              <input
                type="date"
                value={selectedDate}
                min={availableDates?.[availableDates.length - 1]}
                max={availableDates?.[0] || today}
                onChange={(e) => selectDateAndReset(e.target.value)}
                className="w-full px-3 py-1.5 bg-white/80 border border-stone-200 rounded-lg text-sm text-stone-700 font-medium"
              />
            </div>
            {selectedDate !== today && (
              <button
                onClick={() => selectDateAndReset(today)}
                className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg border border-green-200"
              >
                Hôm nay
              </button>
            )}
          </div>

          {/* Hour navigation */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goToPrevHour}
              disabled={!hasPrev}
              className="w-8 h-8 rounded-full bg-white/80 border border-stone-200 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-stone-600 text-[16px]">chevron_left</span>
            </button>
            <div className="text-center min-w-[120px]">
              <span className="font-bold text-stone-700">
                {String(selectedHour).padStart(2, '0')}:00 — {String((selectedHour + 1) % 24).padStart(2, '0')}:00
              </span>
            </div>
            <button
              onClick={goToNextHour}
              disabled={!hasNext}
              className="w-8 h-8 rounded-full bg-white/80 border border-stone-200 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-stone-600 text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Hour dots indicator */}
          <div className="flex justify-center gap-[3px]">
            {Array.from({ length: 24 }, (_, i) => {
              const hasData = hoursWithData.includes(i);
              const isSelected = i === selectedHour;
              return (
                <button
                  key={i}
                  onClick={() => hasData && setSelectedHour(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    isSelected
                      ? 'bg-green-500 scale-150'
                      : hasData
                        ? 'bg-green-300 hover:bg-green-400'
                        : 'bg-gray-200'
                  }`}
                  title={`${String(i).padStart(2, '0')}:00`}
                />
              );
            })}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-[72px] bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-[72px] bg-gray-100 rounded-xl animate-pulse" />
            </div>
          )}

          {/* No data state */}
          {!isLoading && !currentHourData && (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-gray-300 text-4xl block mb-2">sensors_off</span>
              <p className="text-sm text-gray-400">Không có dữ liệu cho giờ này</p>
              {hoursWithData.length > 0 && (
                <button
                  onClick={() => setSelectedHour(hoursWithData[0])}
                  className="mt-2 text-xs text-green-600 font-medium underline"
                >
                  Chuyển đến giờ có dữ liệu
                </button>
              )}
            </div>
          )}

          {/* Sensor data cards */}
          {!isLoading && currentHourData && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCard
                  icon="🌡️"
                  label="Nhiệt độ"
                  value={currentHourData.avgTemperature !== null ? currentHourData.avgTemperature.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '--'}
                  unit="°C"
                  indicator={currentHourData.indicators?.temperature}
                />
                <MetricCard
                  icon="💧"
                  label="Độ ẩm"
                  value={currentHourData.avgHumidity !== null ? currentHourData.avgHumidity.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '--'}
                  unit="%"
                  indicator={currentHourData.indicators?.humidity}
                />
                <MetricCard
                  icon="☀️"
                  label="Ánh sáng"
                  value={currentHourData.avgLightLevel !== null ? currentHourData.avgLightLevel.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) : '--'}
                  unit="lux"
                />
                <MetricCard
                  icon="🌱"
                  label="pH Đất"
                  value={currentHourData.avgSoilPh !== null ? String(currentHourData.avgSoilPh) : '--'}
                  unit=""
                  indicator={currentHourData.indicators?.soilPh}
                />
              </div>
              <MetricCard
                icon="💦"
                label="Độ ẩm đất"
                value={currentHourData.avgSoilMoisture !== null ? currentHourData.avgSoilMoisture.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '--'}
                unit="%"
                fullWidth
              />

              {/* Reading count */}
              <p className="text-[10px] text-gray-400 text-center">
                {currentHourData.readingCount} lần đo trong giờ này
                {selectedDate === today && ' · ' + formatDateVN(selectedDate)}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
