import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { DirectionProvider } from "@/components/ui/direction"
import { AuthProvider } from "@/hooks/use-auth"
import { QueryProvider } from "@/components/common/query-provider"
import { ErrorBoundary } from "@/components/common/error-boundary"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <DirectionProvider dir="rtl">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </DirectionProvider>
    </ThemeProvider>
  </StrictMode>
)
