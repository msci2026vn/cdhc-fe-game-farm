import { Component, type ReactNode } from 'react';

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
          <h2 className="text-lg font-bold text-stone-800">Oops! Có lỗi xảy ra</h2>
          <p className="text-sm text-stone-500">
            Ứng dụng gặp sự cố bất ngờ. Vui lòng tải lại trang.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
