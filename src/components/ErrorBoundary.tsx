import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Kutilmagan xatolik yuz berdi.";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message.startsWith('{')) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Firebase Xatosi: ${parsed.error}`;
            isFirebaseError = true;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-red-100 dark:border-red-900/20 text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Xatolik yuz berdi</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              {isFirebaseError ? errorMessage : "Ilova ishlashida muammo yuzaga keldi. Iltimos, sahifani yangilang."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:opacity-90 transition-all"
            >
              Sahifani yangilash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
