import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { PlannerPage } from './pages/PlannerPage'
import { RecipeListPage } from './pages/RecipeListPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="bg-gray-50 min-h-svh pb-16">
          <Routes>
            <Route path="/" element={<RecipeListPage />} />
            <Route path="/planner" element={<PlannerPage />} />
          </Routes>
        </div>
        <BottomNav />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
