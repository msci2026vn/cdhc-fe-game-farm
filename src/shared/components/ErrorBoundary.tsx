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
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">🐛</div>
          <h2 className="text-lg font-bold text-stone-800">{i18n.t('oops_error_occurred')}</h2>
          <p className="text-sm text-stone-500">
            {i18n.t('app_crashed_reload')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
          >
            {i18n.t('reload_page')}
          </button>
        </div>
      </div>
    );
  }
}
