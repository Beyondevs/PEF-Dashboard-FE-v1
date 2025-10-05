import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FilterProvider } from "./contexts/FilterContext";
import { ProtectedLayout } from "./components/ProtectedLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import Attendance from "./pages/Attendance";
import Assessments from "./pages/Assessments";
import Leaderboard from "./pages/Leaderboard";
import Reports from "./pages/Reports";
import TodayReport from "./pages/reports/TodayReport";
import DrilldownReport from "./pages/reports/DrilldownReport";
import DistrictCompareReport from "./pages/reports/DistrictCompareReport";
import Schools from "./pages/Schools";
import Repository from "./pages/Repository";
import PaperRegisters from "./pages/PaperRegisters";
import WeeklySummaries from "./pages/WeeklySummaries";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FilterProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/sessions" element={<ProtectedLayout><Sessions /></ProtectedLayout>} />
              <Route path="/sessions/:id" element={<ProtectedLayout><SessionDetail /></ProtectedLayout>} />
              <Route path="/attendance" element={<ProtectedLayout><Attendance /></ProtectedLayout>} />
              <Route path="/assessments" element={<ProtectedLayout><Assessments /></ProtectedLayout>} />
              <Route path="/leaderboard" element={<ProtectedLayout><Leaderboard /></ProtectedLayout>} />
              <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
              <Route path="/reports/today" element={<ProtectedLayout><TodayReport /></ProtectedLayout>} />
              <Route path="/reports/drilldown" element={<ProtectedLayout><DrilldownReport /></ProtectedLayout>} />
              <Route path="/reports/district-compare" element={<ProtectedLayout><DistrictCompareReport /></ProtectedLayout>} />
              <Route path="/schools" element={<ProtectedLayout><Schools /></ProtectedLayout>} />
              <Route path="/repository" element={<ProtectedLayout><Repository /></ProtectedLayout>} />
              <Route path="/hybrid/paper-registers" element={<ProtectedLayout><PaperRegisters /></ProtectedLayout>} />
              <Route path="/hybrid/weekly-summaries" element={<ProtectedLayout><WeeklySummaries /></ProtectedLayout>} />
              <Route path="/help" element={<ProtectedLayout><Help /></ProtectedLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
