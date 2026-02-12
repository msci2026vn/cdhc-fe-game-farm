import { useWeatherStore, WeatherType, TimeOfDay } from '../stores/weatherStore';
import { useMemo } from 'react';

const SKY_GRADIENTS: Record<TimeOfDay, string> = {
  dawn: 'linear-gradient(180deg, #ff9a9e 0%, #fecfef 30%, #ffecd2 60%, #e8f5e9 100%)',
  day: 'linear-gradient(180deg, #c8e6ff 0%, #e8f5e9 35%, #f5e6d3 100%)',
  dusk: 'linear-gradient(180deg, #a18cd1 0%, #fbc2eb 25%, #f6a085 50%, #f5e6d3 100%)',
  night: 'linear-gradient(180deg, #0c1445 0%, #1a237e 30%, #1b2838 60%, #263238 100%)',
};

function RainDrops() {
  const drops = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${0.5 + Math.random() * 0.5}s`,
      height: 10 + Math.random() * 15,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {drops.map((d, i) => (
        <div key={i} className="absolute animate-rain-drop"
          style={{
            left: d.left,
            top: -20,
            width: 2,
            height: d.height,
            background: 'linear-gradient(180deg, transparent, rgba(174,214,241,0.6))',
            borderRadius: 2,
            animationDelay: d.delay,
            animationDuration: d.duration,
          }} />
      ))}
    </div>
  );
}

function SnowFlakes() {
  const flakes = useMemo(() =>
    Array.from({ length: 30 }, () => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 4}s`,
      size: 4 + Math.random() * 8,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {flakes.map((f, i) => (
        <div key={i} className="absolute animate-snow-fall rounded-full"
          style={{
            left: f.left,
            top: -10,
            width: f.size,
            height: f.size,
            background: 'rgba(255,255,255,0.9)',
            animationDelay: f.delay,
            animationDuration: f.duration,
          }} />
      ))}
    </div>
  );
}

function StormFlash() {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 animate-storm-flash"
      style={{ background: 'rgba(255,255,255,0.1)' }} />
  );
}

function WindLines() {
  const lines = useMemo(() =>
    Array.from({ length: 8 }, () => ({
      top: `${10 + Math.random() * 80}%`,
      delay: `${Math.random() * 3}s`,
      width: 30 + Math.random() * 60,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {lines.map((l, i) => (
        <div key={i} className="absolute animate-wind-blow h-px"
          style={{
            top: l.top,
            left: -100,
            width: l.width,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animationDelay: l.delay,
          }} />
      ))}
    </div>
  );
}

function FogOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20"
      style={{ background: 'rgba(200,220,240,0.3)', backdropFilter: 'blur(1px)' }} />
  );
}

function NightStars() {
  const stars = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 40}%`,
      size: 1 + Math.random() * 2,
      delay: `${Math.random() * 3}s`,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full animate-pulse"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: 'white',
            opacity: 0.7,
            animationDelay: s.delay,
          }} />
      ))}
    </div>
  );
}

function getWeatherEffects(weather: WeatherType, timeOfDay: TimeOfDay) {
  const effects: JSX.Element[] = [];

  if (timeOfDay === 'night') effects.push(<NightStars key="stars" />);

  switch (weather) {
    case 'rain':
      effects.push(<RainDrops key="rain" />);
      break;
    case 'storm':
      effects.push(<RainDrops key="rain" />);
      effects.push(<StormFlash key="flash" />);
      effects.push(<WindLines key="wind" />);
      break;
    case 'snow':
      effects.push(<SnowFlakes key="snow" />);
      break;
    case 'wind':
      effects.push(<WindLines key="wind" />);
      break;
    case 'cold':
      effects.push(<FogOverlay key="fog" />);
      effects.push(<SnowFlakes key="snow-light" />);
      break;
    case 'hot':
      // heat shimmer handled via CSS
      break;
  }

  return effects;
}

export default function WeatherOverlay() {
  const weather = useWeatherStore((s) => s.weather);
  const timeOfDay = useWeatherStore((s) => s.timeOfDay);
  const effects = getWeatherEffects(weather, timeOfDay);

  const safeTimeOfDay = SKY_GRADIENTS[timeOfDay] ? timeOfDay : 'day';

  return (
    <>
      {/* Sky gradient overlay */}
      <div className="absolute inset-0 z-0 transition-all duration-1000"
        style={{ background: SKY_GRADIENTS[safeTimeOfDay] }} />

      {/* Dark tint for night */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.3)' }} />
      )}

      {/* Storm darkening */}
      {weather === 'storm' && (
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'rgba(30,30,50,0.35)' }} />
      )}

      {/* Cloud darkening (Overcast) */}
      {(weather === 'cloudy' || weather === 'rain') && (
        <div className="absolute inset-0 z-[1] pointer-events-none transition-all duration-1000"
          style={{ background: 'rgba(0,0,0,0.1)' }} />
      )}

      {/* Ground Overlay (The "Floor") */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 z-[2] transition-all duration-1000 pointer-events-none"
        style={{
          background: weather === 'snow'
            ? 'linear-gradient(0deg, #f0f8ff 20%, transparent 100%)' // Snow ground
            : weather === 'rain' || weather === 'storm'
              ? 'linear-gradient(0deg, rgba(44, 62, 80, 0.1) 20%, transparent 100%)' // Wet ground
              : 'transparent'
        }}
      />

      {/* Ice/Frost for Cold */}
      {weather === 'cold' && (
        <div className="absolute inset-0 z-[10] pointer-events-none border-[15px] border-white/5"
          style={{ boxShadow: 'inset 0 0 100px rgba(255,255,255,0.1)' }} />
      )}

      {/* Heat shimmer */}
      {weather === 'hot' && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3 z-20 pointer-events-none animate-heat-shimmer"
          style={{ background: 'linear-gradient(0deg, rgba(255,160,0,0.12), transparent)' }} />
      )}

      {effects}
    </>
  );
}
