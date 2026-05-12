import React, { Component, ComponentType, PropsWithChildren } from "react";

import { ErrorFallback, ErrorFallbackProps } from "@/components/ErrorFallback";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

type ErrorBoundaryState = { error: Error | null };

/**
 * This is a special case for for using the class components. Error boundaries must be class components because React only provides error boundary functionality through lifecycle methods (componentDidCatch and getDerivedStateFromError) which are not available in functional components.
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static defaultProps: Partial<ErrorBoundaryProps> = {
    FallbackComponent: ErrorFallback,
    onError: (error: Error, stackTrace: string) => {
      try {
        // Ensure we always surface errors to console for web/devtools and CI logs
        // Keep this lightweight and safe if console isn't available in some runtimes
        // eslint-disable-next-line no-console
        console.error("ErrorBoundary caught error:", error, stackTrace);
      } catch (e) {
        // noop
      }
    },
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // Always log to console first so terminal/DevTools capture it immediately
    try {
      // eslint-disable-next-line no-console
      console.error("Uncaught component error:", error, info.componentStack);
    } catch (e) {
      // ignore
    }

    if (typeof this.props.onError === "function") {
      try {
        this.props.onError(error, info.componentStack);
      } catch (e) {
        // ensure any user-provided handler does not crash the boundary
        // eslint-disable-next-line no-console
        console.error("Error in onError handler:", e);
      }
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { FallbackComponent } = this.props;

    return this.state.error && FallbackComponent ? (
      <FallbackComponent
        error={this.state.error}
        resetError={this.resetError}
      />
    ) : (
      this.props.children
    );
  }
}
