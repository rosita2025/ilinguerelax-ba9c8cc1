import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, RefreshCw } from "lucide-react";
import { reportClientError } from "@/lib/errorReporter";


interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  countdown: number;
  retryCount: number;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, countdown: 5, retryCount: 0 };
  private timer: ReturnType<typeof setInterval> | null = null;

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, countdown: 5 };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.clearTimer();
      this.setState({ hasError: false, countdown: 5, retryCount: 0 });
    }
    if (this.state.hasError && !prevState.hasError) {
      this.startTimer();
    }
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  private startTimer() {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.setState((s) => {
        if (s.countdown <= 1) {
          this.clearTimer();
          if (s.retryCount < 2) {
            return { hasError: false, countdown: 5, retryCount: s.retryCount + 1 };
          }
          return { ...s, countdown: 0 };
        }
        return { ...s, countdown: s.countdown - 1 };
      });
    }, 1000);
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render recovered", error, info.componentStack);
    reportClientError({
      source: "react.errorBoundary",
      message: error?.message,
      stack: error?.stack,
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <section className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-lg space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Recargando…</h1>
            <p className="text-sm text-muted-foreground">
              La tienda tuvo un problema al cargar. Recargaremos automáticamente en{" "}
              <span className="font-bold text-primary">{this.state.countdown}s</span>.
            </p>
          </div>
          <div className="grid gap-2">
            <Button
              onClick={() => this.setState({ hasError: false, countdown: 5, retryCount: 0 })}
              size="lg"
              className="w-full gap-2 text-base font-semibold"
            >
              <RefreshCw className="h-5 w-5" /> Intentar de nuevo
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Ayuda por WhatsApp
              </a>
            </Button>
          </div>
        </section>
      </main>
    );
  }
}