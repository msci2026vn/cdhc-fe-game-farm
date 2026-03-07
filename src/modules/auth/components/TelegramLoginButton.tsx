import { useEffect, useRef, useCallback } from 'react';

interface TelegramWidgetUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramWidgetUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | undefined;
  usePic?: boolean;
  lang?: string;
}

export function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  usePic = true,
  lang = 'vi',
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<string>('');

  const stableOnAuth = useCallback(onAuth, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!containerRef.current) return;

    // Unique global callback name
    const cbName = `__tg_login_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    callbackRef.current = cbName;
    (window as any)[cbName] = (user: TelegramWidgetUser) => stableOnAuth(user);

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', `${cbName}(user)`);
    script.setAttribute('data-corner-radius', String(cornerRadius));
    script.setAttribute('data-lang', lang);
    if (usePic) script.setAttribute('data-userpic', 'true');
    if (requestAccess) script.setAttribute('data-request-access', requestAccess);

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete (window as any)[cbName];
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, lang, stableOnAuth]);

  return <div ref={containerRef} className="flex justify-center" />;
}
