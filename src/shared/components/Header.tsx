import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  ogn?: number;
  userName?: string;
}

export default function Header({ ogn = 0, userName = 'Nông dân' }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-sm text-primary-foreground">
      <div className="flex items-center justify-between h-14 px-4 max-w-[430px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="font-heading font-semibold text-sm truncate max-w-[100px]">{userName}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-3 py-1.5">
          <span className="text-base">🪙</span>
          <span className="font-heading font-bold text-sm">{ogn.toLocaleString('vi-VN')}</span>
          <span className="text-xs opacity-80">OGN</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/camera')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-foreground/10 transition-colors"
          >
            📷
          </button>
          <button
            onClick={() => navigate('/points')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-foreground/10 transition-colors"
          >
            🔔
          </button>
        </div>
      </div>
    </header>
  );
}
