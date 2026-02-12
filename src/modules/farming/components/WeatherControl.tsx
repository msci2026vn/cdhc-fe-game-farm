import { useWeatherStore, WEATHER_INFO, TIME_INFO, WeatherType, TimeOfDay } from '../stores/weatherStore';
import { useState } from 'react';

const WEATHERS: WeatherType[] = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'wind', 'cold', 'hot'];
const TIMES: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

export default function WeatherControl() {
  const { weather, timeOfDay, setWeather, setTimeOfDay } = useWeatherStore();
  const [open, setOpen] = useState(false);

  // Safety fallback for invalid weather/time values
  const safeWeather = (WEATHER_INFO[weather]?.emoji ? weather : 'sunny') as WeatherType;
  const safeTimeOfDay = (TIME_INFO[timeOfDay]?.emoji ? timeOfDay : 'day') as TimeOfDay;

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg header-btn-glass"
        title="Thời tiết">
        {WEATHER_INFO[safeWeather].emoji}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white overflow-hidden animate-slide-up">
            <div className="px-5 py-3 flex justify-between items-center"
              style={{ background: 'linear-gradient(135deg, #3498db, #74b9ff)' }}>
              <h3 className="font-heading text-base font-bold text-white">🌤️ Thời tiết & Thời gian</h3>
              <button onClick={() => setOpen(false)} className="text-white/70 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Time of day */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">⏰ Thời gian trong ngày</p>
                <div className="grid grid-cols-4 gap-2">
                  {TIMES.map((t) => (
                    <button key={t} onClick={() => setTimeOfDay(t)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                        safeTimeOfDay === t ? 'border-primary bg-primary/5' : 'border-transparent'
                      }`}
                      style={{ background: safeTimeOfDay === t ? undefined : 'rgba(0,0,0,0.02)' }}>
                      <span className="text-xl">{TIME_INFO[t]?.emoji ?? '☀️'}</span>
                      <span className="text-[10px] font-bold">{TIME_INFO[t]?.label ?? 'Ban ngày'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">🌦️ Thời tiết</p>
                <div className="grid grid-cols-4 gap-2">
                  {WEATHERS.map((w) => (
                    <button key={w} onClick={() => setWeather(w)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                        safeWeather === w ? 'border-primary bg-primary/5' : 'border-transparent'
                      }`}
                      style={{ background: safeWeather === w ? undefined : 'rgba(0,0,0,0.02)' }}>
                      <span className="text-xl">{WEATHER_INFO[w]?.emoji ?? '☀️'}</span>
                      <span className="text-[10px] font-bold">{WEATHER_INFO[w]?.label ?? 'Nắng'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current info */}
              <div className="rounded-xl p-3 text-center text-xs font-semibold text-muted-foreground"
                style={{ background: 'rgba(0,0,0,0.03)' }}>
                Hiện tại: {TIME_INFO[safeTimeOfDay].emoji} {TIME_INFO[safeTimeOfDay].label} · {WEATHER_INFO[safeWeather].emoji} {WEATHER_INFO[safeWeather].label}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
