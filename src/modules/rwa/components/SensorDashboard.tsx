import { useSensorLatest } from '@/shared/hooks/useSensor';

const indicatorColor = {
  good: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', bar: 'bg-green-500', label: 'Tốt' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', bar: 'bg-yellow-500', label: 'Cảnh báo' },
  danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', bar: 'bg-red-500', label: 'Nguy hiểm' },
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

function MetricCard({ icon, label, value, unit, indicator }: {
  icon: string;
  label: string;
  value: string | null;
  unit: string;
  indicator?: 'good' | 'warning' | 'danger';
}) {
  const num = value ? parseFloat(value) : null;
  const style = indicator ? indicatorColor[indicator] : indicatorColor.good;

  return (
    <div className={`rounded-xl border p-3 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500">{icon} {label}</span>
        {indicator && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${style.text}`}>
          {num !== null ? num.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '--'}
        </span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

export default function SensorDashboard() {
  const { data: reading, isLoading, isError } = useSensorLatest();

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !reading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <p className="text-sm text-gray-500 text-center py-4">
          Không thể tải dữ liệu cảm biến
        </p>
      </div>
    );
  }

  const ind = reading.indicators;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-farm-brown-dark flex items-center gap-1.5">
            <span className="text-lg">📡</span> Cảm biến Vườn
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {reading.deviceId} &middot; Đang hoạt động
          </p>
        </div>
        <span className="text-[10px] text-gray-400">
          {timeAgo(reading.recordedAt)}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          icon="🌡️"
          label="Nhiệt độ"
          value={reading.temperature}
          unit="°C"
          indicator={ind?.temperature}
        />
        <MetricCard
          icon="💧"
          label="Độ ẩm"
          value={reading.humidity}
          unit="%"
          indicator={ind?.humidity}
        />
        <MetricCard
          icon="☀️"
          label="Ánh sáng"
          value={reading.lightLevel}
          unit="lux"
        />
        <MetricCard
          icon="🌱"
          label="pH Đất"
          value={reading.soilPh}
          unit=""
          indicator={ind?.soilPh}
        />
      </div>

      {/* Soil moisture - full width */}
      <MetricCard
        icon="💦"
        label="Độ ẩm đất"
        value={reading.soilMoisture}
        unit="%"
      />
    </div>
  );
}
