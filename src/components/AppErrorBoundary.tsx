import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageCircle, RefreshCw } from "lucide-react";
import { reportClientError } from "@/lib/errorReporter";


interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
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
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Carga segura</h1>
            <p className="text-sm text-muted-foreground">
              La tienda tuvo un problema al cargar esta vista. No recargaremos en bucle; puedes intentar abrirla de nuevo.
            </p>
          </div>
          <div className="grid gap-2">
            <Button
              onClick={() => this.setState({ hasError: false })}
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