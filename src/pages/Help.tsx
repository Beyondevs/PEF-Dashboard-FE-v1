import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Phone, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Help = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">Get assistance with the portal</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Program Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The Punjab English Training Portal is designed to monitor and manage English-language training programs across Punjab province.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Key Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Session management and scheduling</li>
                <li>Real-time attendance tracking</li>
                <li>Student assessment recording</li>
                <li>Teacher performance leaderboard</li>
                <li>Comprehensive reporting and analytics</li>
                <li>Hybrid monitoring for low-connectivity areas</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Punjab Education Foundation</h4>
              <p className="text-sm text-muted-foreground">
                For program inquiries and support
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm">+92-42-111-723-723</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm">info@pef.edu.pk</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Premier DLC</h4>
              <p className="text-sm text-muted-foreground">
                For technical support and training
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span className="text-sm">support@premierdlc.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Guides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto flex-col items-start p-4">
                  <FileText className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-semibold">How to Mark Attendance</span>
                  <span className="text-xs text-muted-foreground mt-1">Step-by-step guide</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to Mark Attendance</DialogTitle>
                  <DialogDescription>Follow these steps to mark attendance for a session</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 1: Navigate to Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to the Sessions page from the left sidebar and find the session you want to mark attendance for.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 2: Open Session Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Click the "View" button or the session title to open the session details page.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 3: Mark Attendance</h4>
                    <p className="text-sm text-muted-foreground">
                      Click "Mark Attendance (Teachers)" or "Mark Attendance (Students)" buttons to open the attendance checklist.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 4: Toggle Present/Absent</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the checkboxes or toggle switches to mark each person as present or absent. The system saves automatically.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto flex-col items-start p-4">
                  <FileText className="h-6 w-6 mb-2 text-secondary" />
                  <span className="font-semibold">How to Enter Assessments</span>
                  <span className="text-xs text-muted-foreground mt-1">Student scoring guide</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to Enter Assessments</DialogTitle>
                  <DialogDescription>Record student assessment scores</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 1: Open Completed Session</h4>
                    <p className="text-sm text-muted-foreground">
                      Find a completed session from the Sessions page.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 2: Click Enter Assessments</h4>
                    <p className="text-sm text-muted-foreground">
                      Click the "Enter Assessments" button to open the scoring grid.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 3: Enter Scores</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter scores (0-10) for each student who attended the session. Scores are validated automatically.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 4: Save All</h4>
                    <p className="text-sm text-muted-foreground">
                      Click "Save All" to record the assessment scores. These will contribute to the teacher leaderboard calculations.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto flex-col items-start p-4">
                  <FileText className="h-6 w-6 mb-2 text-accent" />
                  <span className="font-semibold">Understanding the Leaderboard</span>
                  <span className="text-xs text-muted-foreground mt-1">Ranking system explained</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Understanding the Leaderboard</DialogTitle>
                  <DialogDescription>How teacher rankings are calculated</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Composite Score Formula</h4>
                    <p className="text-sm text-muted-foreground">
                      By default, the composite score is calculated as:
                      <br />
                      <code className="bg-muted px-2 py-1 rounded mt-1 block">
                        Composite = (Attendance% × 70%) + (Avg Student Score% × 30%)
                      </code>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Attendance Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      Percentage of sessions attended by the teacher out of total sessions scheduled for their school.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Average Student Score</h4>
                    <p className="text-sm text-muted-foreground">
                      Average assessment scores (as percentage) of all students from the teacher's school.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Adjustable Weights</h4>
                    <p className="text-sm text-muted-foreground">
                      You can adjust the weights using the sliders on the Leaderboard page to see how different factors affect rankings.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
