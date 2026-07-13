import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/errorReporter";

interface Props {
  children: ReactNode;
  name: string;
  fallback?: ReactNode;
  extra?: Record<string, unknown>;
}

interface State {
  hasError: boolean;
}

/**
 * Scoped error boundary for a single UI section (checkout summary, upsell, etc.).
 * Prevents a component crash from blanking the whole page, and reports the error
 * (with stack + component stack + extra snapshot) to the logging endpoint.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Section "${this.props.name}" crashed`, error, info.componentStack);
    reportClientError({
      source: `section:${this.props.name}`,
      message: error?.message,
      stack: error?.stack,
      componentStack: info.componentStack ?? undefined,
      extra: this.props.extra,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      this.props.fallback ?? (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          No se pudo mostrar esta sección. Recarga la página o continúa desde otra parte del checkout.
        </div>
      )
    );
  }
}
