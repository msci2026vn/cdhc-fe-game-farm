import { Component, type ReactNode } from 'react';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-gradient-to-b from-red-50 to-orange-50">
        <div className="max-w-sm w-full space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-2">🐛</div>
            <h2 className="text-lg font-bold text-stone-800">{i18n.t('oops_error_occurred')}</h2>
            <p className="text-sm text-stone-500">{i18n.t('app_crashed_reload')}</p>
          </div>
          
          {this.state.error && (
            <div className="bg-white/80 p-3 rounded-xl border border-red-200 text-left overflow-auto max-h-[300px]">
              <p className="font-mono text-xs text-red-600 font-bold mb-1">{this.state.error.toString()}</p>
              <pre className="font-mono text-[10px] text-gray-700 whitespace-pre-wrap leading-tight">
                {this.state.error.stack}
              </pre>
            </div>
          )}

          <div className="text-center mt-4">
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then((regs) => {
                    for (const reg of regs) reg.unregister();
                    window.location.reload();
                  }).catch(() => window.location.reload());
                } else {
                  window.location.reload();
                }
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all w-full"
            >
              {i18n.t('reload_page')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
