import React, { useState } from 'react';
import { X, CheckCircle, Clock, AlertCircle, FileDown, Loader2 } from 'lucide-react';
import { getTeacherSpeakingAssessmentPdf } from '@/lib/api';
import { toast } from 'sonner';

interface TeacherAssessmentDetailProps {
  assessment: any;
  onClose: () => void;
  onEditPhase: (phase: 'pre' | 'mid' | 'post') => void;
}

// Full question text for each criterion (Speaking Assessment detail modal)
const TEACHER_CRITERIA = [
  { id: 'Fluency', label: 'Fluency', question: 'How would you rate the teacher\'s fluency and smoothness in speaking?' },
  { id: 'Sentences', label: 'Complete Sentences', question: 'How well does the teacher use complete sentences when speaking?' },
  { id: 'Accuracy', label: 'Accuracy', question: 'How accurate is the teacher\'s use of language and grammar when speaking?' },
  { id: 'Pronunciation', label: 'Pronunciation', question: 'How would you rate the teacher\'s pronunciation and clarity of speech?' },
  { id: 'Vocabulary', label: 'Vocabulary', question: 'How well does the teacher use vocabulary appropriate to the context?' },
  { id: 'Confidence', label: 'Confidence', question: 'How confidently does the teacher speak?' },
  { id: 'Asking', label: 'Asking Questions', question: 'How well does the teacher ask questions to clarify or engage?' },
  { id: 'Answering', label: 'Answering Questions', question: 'How well does the teacher answer questions when asked?' },
  { id: 'ClassroomInstructions', label: 'Classroom Instructions', question: 'How well does the teacher give clear classroom instructions?' },
  { id: 'Feedback', label: 'Feedback', question: 'How well does the teacher give constructive feedback?' },
  { id: 'EngagingStudents', label: 'Engaging Students', question: 'How well does the teacher engage students in speaking?' },
  { id: 'ProfessionalInteraction', label: 'Professional Interaction', question: 'How would you rate the teacher\'s professional interaction?' },
  { id: 'Passion', label: 'Passion for Teaching', question: 'How would you rate the teacher\'s passion for teaching?' },
  { id: 'RoleModel', label: 'Role Model', question: 'How well does the teacher act as a role model in speaking?' },
];

const TeacherAssessmentDetail: React.FC<TeacherAssessmentDetailProps> = ({
  assessment,
  onClose,
  onEditPhase,
}) => {
  const categories = TEACHER_CRITERIA;
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const blob = await getTeacherSpeakingAssessmentPdf(assessment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher-speaking-assessment-${String(assessment.teacherName || assessment.id).replace(/\s+/g, '-')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
    pre_completed: { label: 'Pre Completed', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    mid_completed: { label: 'Post Completed', color: 'bg-green-100 text-green-700', icon: AlertCircle },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  };

  const statusInfo = statusConfig[assessment.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const renderStars = (value: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((num) => (
          <span key={num} className={`text-lg ${value >= num ? 'text-yellow-500' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({value}/5)</span>
      </div>
    );
  };

  const renderPhaseSection = (phase: 'pre' | 'mid' | 'post', title: string) => {
    const prefix = phase;
    const totalScore = assessment[`${prefix}TotalScore`] ?? 0;
    const assessedAt = assessment[`${prefix}AssessedAt`];
    const isCompleted = totalScore > 0;

    // Determine if this phase can be edited based on current status
    // Post phase (old DB post) hidden; only pre and mid (user-facing Post) shown
    const phaseEditAllowed =
      (phase === 'pre' && (assessment.status === 'pre_completed' || assessment.status === 'mid_completed' || assessment.status === 'completed')) ||
      (phase === 'mid' && (assessment.status === 'mid_completed' || assessment.status === 'completed'));

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <Clock className="w-3 h-3 mr-1" /> Not Started
              </span>
            )}
            {phaseEditAllowed && (
              <button
                onClick={() => onEditPhase(phase)}
                className="text-sm text-[#673AB7] hover:text-[#5E35A6] font-medium"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {isCompleted ? (
          <>
            <div className="mb-4 px-4 py-2 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">
                Rating Scale: 1 = Poor | 2 = Average | 3 = Good | 4 = Very Good | 5 = Excellent
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              {categories.map((cat) => {
                // Map category ID to database field name (e.g., 'pre' + 'Sentences' = 'preSentences')
                const fieldName = `${prefix}${cat.id}`;
                const value = assessment[fieldName];
                // Ensure we have a valid number (0-5)
                const rating = typeof value === 'number' && value >= 0 && value <= 5 ? value : 0;
                return (
                  <div key={cat.id} className="py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 mb-1">{cat.question ?? cat.label}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{cat.label}</span>
                      {renderStars(rating)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div>
                <span className="text-sm text-gray-500">Total Score:</span>
                <span className="ml-2 text-xl font-bold text-[#673AB7]">{totalScore}/70</span>
              </div>
              {assessedAt && (
                <span className="text-sm text-gray-500">
                  Assessed on: {new Date(assessedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Assessment not yet completed for this phase</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Teacher Speaking Assessment</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span><strong>Teacher:</strong> {assessment.teacherName}</span>
                <span><strong>School:</strong> {assessment.schoolName}</span>
                {(assessment.emisCode ?? assessment.schoolEmisCode) && (
                  <span><strong>EMIS Code:</strong> {assessment.emisCode ?? assessment.schoolEmisCode}</span>
                )}
                <span><strong>Trainer:</strong> {assessment.trainerName ?? '—'}</span>
                {assessment.district && <span><strong>District:</strong> {assessment.district}</span>}
                {assessment.division && <span><strong>Division:</strong> {assessment.division}</span>}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  <StatusIcon className="w-4 h-4 mr-1.5" />
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Phase Sections: Pre and Post only (Post = mid in DB); original post hidden */}
        <div className="p-6 space-y-6">
          {renderPhaseSection('pre', 'Pre-Assessment')}
          {renderPhaseSection('mid', 'Post-Assessment')}

          {/* Comments (phase-wise, from preNotes/midNotes; can be auto-generated by score %) */}
          {(assessment.preNotes || assessment.midNotes || assessment.notes) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Pre-Assessment Comment</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{assessment.preNotes || '—'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Post-Assessment Comment</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{assessment.midNotes || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex-1 flex items-center justify-center gap-2 bg-[#673AB7] hover:bg-[#5E35A6] disabled:opacity-60 text-white px-4 py-2 rounded-md font-medium"
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export PDF
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssessmentDetail;

