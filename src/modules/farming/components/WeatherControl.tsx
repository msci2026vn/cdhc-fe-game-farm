import { useWeatherStore, WEATHER_INFO, TIME_INFO, WeatherType, TimeOfDay } from '../stores/weatherStore';
import { useState } from 'react';

const WEATHERS: WeatherType[] = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'wind', 'cold', 'hot'];
const TIMES: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

export default function WeatherControl() {
  const { weather, timeOfDay, temperature, humidity, windSpeed, location, lastUpdated } = useWeatherStore();
  const [open, setOpen] = useState(false);

  // Safety fallback for invalid weather/time values
  const safeWeather = (WEATHER_INFO[weather]?.emoji ? weather : 'sunny') as WeatherType;
  const safeTimeOfDay = (TIME_INFO[timeOfDay]?.emoji ? timeOfDay : 'day') as TimeOfDay;

  const formatFullDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '---'; }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return '--:--'; }
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg header-btn-glass relative group"
        title="Thông tin thời tiết">
        {WEATHER_INFO[safeWeather].emoji}
        <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white/95 overflow-hidden shadow-2xl animate-modal-slide-up border-t border-white/20">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-[#1e3799] to-[#0984e3]">
              <div className="flex flex-col">
                <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  🌤️ Thời tiết & Thời gian
                </h3>
                <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider">Tự động đồng bộ từ API</span>
              </div>
              <button onClick={() => setOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Status & Time */}
              <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl">
                  {WEATHER_INFO[safeWeather].emoji}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">{location.province || 'Vị trí hiện tại'}</div>
                  <div className="text-xl font-bold text-slate-800">{formatTime(new Date().toISOString())}</div>
                  <div className="text-xs text-slate-500 font-medium">{formatFullDate(new Date().toISOString())}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-800 tracking-tight">{temperature}°C</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Nhiệt độ</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">💧</div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Độ ẩm</div>
                    <div className="text-sm font-bold text-slate-700">{humidity}%</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600">💨</div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Cấp gió</div>
                    <div className="text-sm font-bold text-slate-700">{windSpeed} km/h</div>
                  </div>
                </div>
              </div>

              {/* Status Reference (Read-only) */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">⏰ Chu kỳ thời gian</p>
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">ĐANG ĐẾN</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMES.map((t) => (
                      <div key={t}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${safeTimeOfDay === t
                            ? 'bg-amber-50 ring-2 ring-amber-500/50 grayscale-0 opacity-100 scale-105 shadow-md'
                            : 'bg-slate-50/50 grayscale opacity-40 scale-100'
                          }`}>
                        <span className="text-xl">{TIME_INFO[t]?.emoji ?? '☀️'}</span>
                        <span className="text-[9px] font-bold text-slate-600">{TIME_INFO[t]?.label ?? '---'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">🌦️ Hình thái thời tiết</p>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full ring-1 ring-blue-200">HIỆN TẠI</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {WEATHERS.map((w) => (
                      <div key={w}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${safeWeather === w
                            ? 'bg-blue-50 ring-2 ring-blue-500/50 grayscale-0 opacity-100 scale-105 shadow-md'
                            : 'bg-slate-50/50 grayscale opacity-40 scale-100'
                          }`}>
                        <span className="text-xl">{WEATHER_INFO[w]?.emoji ?? '☀️'}</span>
                        <span className="text-[9px] font-bold text-slate-600">{WEATHER_INFO[w]?.label ?? '---'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sync Info */}
              <div className="rounded-2xl p-4 flex items-center justify-between bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cập nhật lúc:</span>
                </div>
                <div className="text-xs font-black text-slate-700 font-mono">
                  {formatTime(lastUpdated)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
