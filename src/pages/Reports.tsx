import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Reports = () => {
  const reports = [
    {
      id: 1,
      title: 'Hierarchical Drill-Down Report',
      description: 'Hierarchical drill-down report showing attendance and assessment metrics at all geographic levels',
      icon: BarChart3,
      color: 'text-primary',
      path: '/reports/drilldown',
    },
    {
      id: 2,
      title: 'District Comparison Report',
      description: 'Compare average scores and attendance rates across all districts in Punjab',
      icon: TrendingUp,
      color: 'text-secondary',
      path: '/reports/district-compare',
    },
    {
      id: 3,
      title: "Today's Activity Report",
      description: 'Real-time snapshot of ongoing sessions, attendance counts, and active locations',
      icon: FileText,
      color: 'text-accent',
      path: '/reports/today',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Access comprehensive training program reports and analytics</p>
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
