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
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
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
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Recarga la página</h1>
            <p className="text-sm text-muted-foreground">
              La tienda no pudo cargar correctamente. Puedes recargar o pedir ayuda por WhatsApp.
            </p>
          </div>
          <div className="grid gap-2">
            <Button onClick={() => window.location.reload()} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" /> Recargar
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <a href="https://wa.me/112512724704" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </section>
      </main>
    );
  }
}