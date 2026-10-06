import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Card, Heading, Text } from "./ui";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "2rem auto" }}>
          <Card variant="surface">
            <div className="stack-4" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  margin: "0 auto",
                  borderRadius: "50%",
                  backgroundColor: "rgba(225, 29, 72, 0.15)",
                  color: "var(--rose, #e11d48)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                }}
              >
                ⚠️
              </div>

              <div className="stack-1">
                <Heading level="h2">{this.props.fallbackTitle ?? "Something went wrong"}</Heading>
                <Text variant="small">
                  An unexpected error occurred while rendering this view. Your session and saved data are safe.
                </Text>
              </div>

              {this.state.error?.message && (
                <div
                  style={{
                    backgroundColor: "var(--surface-muted, #f8f9fa)",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    fontFamily: "monospace",
                    fontSize: "0.825rem",
                    textAlign: "left",
                    color: "var(--rose, #e11d48)",
                    overflowX: "auto",
                  }}
                >
                  {this.state.error.message}
                </div>
              )}

              <div className="row-2 wrap" style={{ justifyContent: "center" }}>
                <Button size="md" variant="primary" onClick={this.handleReset}>
                  Reload Page
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.href = "/discover";
                  }}
                >
                  Go to Discover
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
