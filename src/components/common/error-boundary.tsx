import { Component, type ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh items-center justify-center p-6">
          <div className="max-w-md">
            <Alert variant="destructive">
              <AlertTitle>خطایی رخ داد</AlertTitle>
              <AlertDescription>
                {this.state.error?.message ?? "خطای ناشناخته"}
              </AlertDescription>
            </Alert>
            <Button
              className="mt-4 w-full"
              onClick={() => window.location.reload()}
            >
              تلاش مجدد
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
