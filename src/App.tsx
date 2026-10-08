import { RouterProvider } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { router } from "@/routes"

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" dir="rtl" />
    </>
  )
}

export default App
