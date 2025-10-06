import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Save, Plus } from 'lucide-react';
import { assessments, sessions, students } from '@/lib/mockData';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FilterBar } from '@/components/FilterBar';
import { useFilters } from '@/contexts/FilterContext';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';

const Assessments = () => {
  const { filters } = useFilters();
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  const [newEntries, setNewEntries] = useState<Array<{ studentId: string; sessionId: string; score: number }>>([]);

  const {
    items: paginatedAssessments,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(assessments, { initialPageSize: 10 });

  const handleExport = () => {
    toast.success('Export generated successfully');
  };

  const handleSaveChanges = () => {
    const totalChanges = Object.keys(scoreChanges).length + newEntries.length;
    toast.success(`Assessment scores updated for ${totalChanges} records`);
    setScoreChanges({});
    setNewEntries([]);
  };

  const updateScore = (assessmentId: string, newScore: number) => {
    setScoreChanges(prev => ({
      ...prev,
      [assessmentId]: newScore,
    }));
  };

  const getScore = (assessmentId: string, originalScore: number) => {
    return scoreChanges[assessmentId] !== undefined ? scoreChanges[assessmentId] : originalScore;
  };

  const getScoreBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return <Badge className="bg-secondary">Excellent</Badge>;
    if (percentage >= 60) return <Badge variant="default">Good</Badge>;
    if (percentage >= 40) return <Badge variant="outline">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Assessments</h1>
          <p className="text-muted-foreground">View and manage student assessment scores</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(scoreChanges).length > 0 || newEntries.length > 0) && (
            <Button onClick={handleSaveChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes ({Object.keys(scoreChanges).length + newEntries.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <FilterBar />

      <Tabs defaultValue="view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">View Assessments</TabsTrigger>
          <TabsTrigger value="edit">Edit Scores</TabsTrigger>
          <TabsTrigger value="entry">Quick Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Max Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssessments.map(assessment => {
                      const student = students.find(s => s.id === assessment.studentId);
                      const session = sessions.find(s => s.id === assessment.sessionId);
                      const percentage = ((assessment.score / assessment.maxScore) * 100).toFixed(1);

                      return (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{student?.name}</TableCell>
                          <TableCell>{session?.title}</TableCell>
                          <TableCell>{session?.date}</TableCell>
                          <TableCell className="text-right font-semibold">{assessment.score}</TableCell>
                          <TableCell className="text-right">{assessment.maxScore}</TableCell>
                          <TableCell className="text-right text-primary font-semibold">
                            {percentage}%
                          </TableCell>
                          <TableCell>{getScoreBadge(assessment.score, assessment.maxScore)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageInfo={
                  totalItems > 0
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} assessments`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Assessment Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Edit Score</TableHead>
                      <TableHead className="text-right">Max Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssessments.map(assessment => {
                      const student = students.find(s => s.id === assessment.studentId);
                      const session = sessions.find(s => s.id === assessment.sessionId);
                      const currentScore = getScore(assessment.id, assessment.score);
                      const hasChanges = scoreChanges[assessment.id] !== undefined;
                      const percentage = ((currentScore / assessment.maxScore) * 100).toFixed(1);

                      return (
                        <TableRow key={assessment.id} className={hasChanges ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{student?.name}</TableCell>
                          <TableCell>{session?.title}</TableCell>
                          <TableCell>{session?.date}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={assessment.maxScore}
                              value={currentScore}
                              onChange={(e) => updateScore(assessment.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">{assessment.maxScore}</TableCell>
                          <TableCell className="text-right text-primary font-semibold">
                            {percentage}%
                          </TableCell>
                          <TableCell>{getScoreBadge(currentScore, assessment.maxScore)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageInfo={
                  totalItems > 0
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} assessments`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle>Quick Entry Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {students.slice(0, 12).map(student => (
                    <div key={student.id} className="border rounded-lg p-4 space-y-3">
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">Grade {student.grade}</div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Score"
                          className="flex-1"
                          min="0"
                          max="100"
                        />
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assessments;
