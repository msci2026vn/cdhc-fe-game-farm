interface PrayerInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}

export function PrayerInput({
  value,
  onChange,
  maxLength = 500,
  minLength = 10,
  disabled = false,
}: PrayerInputProps) {
  const charCount = value.length;
  const isValid = charCount >= minLength && charCount <= maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Nhập lời cầu nguyện của bạn..."
        disabled={disabled}
        rows={4}
        className={`w-full rounded-xl p-4 bg-white/10 backdrop-blur-sm border
          text-white placeholder:text-white/40 resize-none font-body text-base
          focus:outline-none focus:ring-2 focus:ring-white/30
          ${charCount > 0 && !isValid ? 'border-red-400/50' : 'border-white/20'}
          disabled:opacity-50`}
      />
      <div className="flex justify-between text-xs px-1">
        <span className={charCount > 0 && charCount < minLength ? 'text-red-400' : 'text-white/40'}>
          {charCount > 0 && charCount < minLength && `Tối thiểu ${minLength} ký tự`}
        </span>
        <span className={charCount > maxLength * 0.9 ? 'text-yellow-400' : 'text-white/40'}>
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
