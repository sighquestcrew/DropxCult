"use client";
import React from "react";
import { AlertCircle } from "lucide-react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center bg-background border border-destructive/20 rounded-lg">
                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                    <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                    <details className="text-xs text-left bg-muted p-4 rounded max-w-full overflow-auto text-muted-foreground">
                        <summary className="cursor-pointer mb-2 font-medium">Error Details</summary>
                        <pre>{this.state.error && this.state.error.toString()}</pre>
                        <pre className="mt-2">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </details>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false });
                            window.location.reload();
                        }}
                        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                    >
                        Reload Editor
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
