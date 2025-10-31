import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FilterProvider } from "./contexts/FilterContext";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { PrivateRoute } from "./components/PrivateRoute";
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
import WeeklySummaries from "./pages/WeeklySummaries";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Trainers from "./pages/admin/Trainers";
import Teachers from "./pages/admin/Teachers";
import Students from "./pages/admin/Students";
import AdminSchools from "./pages/admin/Schools";
import Geography from "./pages/admin/Geography";

const queryClient = new QueryClient();

// Component to handle root route redirect based on auth status
const RootRedirect = () => {
  const { role, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <Navigate to={role ? "/dashboard" : "/login"} replace />;
};

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
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/sessions" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><Sessions /></PrivateRoute></ProtectedLayout>} />
              <Route path="/sessions/:id" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><SessionDetail /></PrivateRoute></ProtectedLayout>} />
              <Route path="/attendance" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><Attendance /></PrivateRoute></ProtectedLayout>} />
              <Route path="/assessments" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><Assessments /></PrivateRoute></ProtectedLayout>} />
              <Route path="/leaderboard" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><Leaderboard /></PrivateRoute></ProtectedLayout>} />
              <Route path="/reports" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><Reports /></PrivateRoute></ProtectedLayout>} />
              <Route path="/reports/today" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><TodayReport /></PrivateRoute></ProtectedLayout>} />
              <Route path="/reports/drilldown" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><DrilldownReport /></PrivateRoute></ProtectedLayout>} />
              <Route path="/reports/district-compare" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><DistrictCompareReport /></PrivateRoute></ProtectedLayout>} />
              <Route path="/schools" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer']}><Schools /></PrivateRoute></ProtectedLayout>} />
              <Route path="/repository" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer']}><Repository /></PrivateRoute></ProtectedLayout>} />
              <Route path="/hybrid/weekly-summaries" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer']}><WeeklySummaries /></PrivateRoute></ProtectedLayout>} />
              <Route path="/admin/trainers" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin']}><Trainers /></PrivateRoute></ProtectedLayout>} />
              <Route path="/admin/teachers" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin']}><Teachers /></PrivateRoute></ProtectedLayout>} />
              <Route path="/admin/students" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin']}><Students /></PrivateRoute></ProtectedLayout>} />
              <Route path="/admin/schools" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin']}><AdminSchools /></PrivateRoute></ProtectedLayout>} />
              <Route path="/admin/geography" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin']}><Geography /></PrivateRoute></ProtectedLayout>} />
              <Route path="/help" element={<ProtectedLayout><PrivateRoute allowedRoles={['admin', 'trainer', 'teacher']}><Help /></PrivateRoute></ProtectedLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FilterProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
