import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, TrendingUp, ArrowRight, AlertCircle, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Reports = () => {
  const { role } = useAuth();
  
  const allReports = [
    {
      id: 1,
      title: 'Hierarchical Drill-Down Report',
      description: 'Hierarchical drill-down report showing attendance and assessment metrics at all geographic levels',
      icon: BarChart3,
      color: 'text-primary',
      path: '/reports/drilldown',
      restrictedRoles: ['trainer'], // Hide from trainers - admin only
    },
    {
      id: 2,
      title: 'District Comparison Report',
      description: 'Compare average scores and attendance rates across all districts in Punjab',
      icon: TrendingUp,
      color: 'text-secondary',
      path: '/reports/district-compare',
      restrictedRoles: ['trainer'], // Hide from trainers - admin only
    },
    {
      id: 3,
      title: "Today's Activity Report",
      description: 'Real-time snapshot of ongoing sessions, attendance counts, and active locations',
      icon: FileText,
      color: 'text-accent',
      path: '/reports/today',
    },
    {
      id: 4,
      title: 'Attendance Marking Status Report',
      description: 'View which sessions have attendance marked and which are still pending',
      icon: AlertCircle,
      color: 'text-amber-600',
      path: '/reports/attendance-marking',
      restrictedRoles: ['client', 'trainer'], // Hide from client and trainer roles
    },
    {
      id: 5,
      title: 'Speaking Assessment Report',
      description: 'View comprehensive reports on student and teacher speaking skills assessments across all phases',
      icon: Mic,
      color: 'text-purple-600',
      path: '/speaking-assessments/reports',
      restrictedRoles: ['teacher', 'student'], // Hide from teachers and students
    },
  ];

  // Filter out reports that are restricted for the current user's role
  const reports = allReports.filter(report => {
    if (report.restrictedRoles && role) {
      return !report.restrictedRoles.includes(role);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">
          {role === 'trainer' 
            ? 'View reports and analytics for your assigned sessions and schools'
            : 'Access comprehensive training program reports and analytics'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(report => (
          <Link key={report.id} to={report.path}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <report.icon className={`h-10 w-10 ${report.color}`} />
                <CardTitle className="mt-4">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <Button className="w-full" variant="outline">
                  View Report
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reports;
