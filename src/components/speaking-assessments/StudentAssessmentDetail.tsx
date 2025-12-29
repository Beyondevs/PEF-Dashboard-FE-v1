import React from 'react';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface StudentAssessmentDetailProps {
  assessment: any;
  onClose: () => void;
  onEditPhase: (phase: 'pre' | 'mid' | 'post') => void;
}

const StudentAssessmentDetail: React.FC<StudentAssessmentDetailProps> = ({
  assessment,
  onClose,
  onEditPhase,
}) => {
  const categories = [
    { id: 'Fluency', label: 'Fluency' },
    { id: 'CompleteSentences', label: 'Complete Sentences' },
    { id: 'Accuracy', label: 'Accuracy' },
    { id: 'Pronunciation', label: 'Pronunciation' },
    { id: 'Vocabulary', label: 'Vocabulary' },
    { id: 'Confidence', label: 'Confidence' },
    { id: 'AskingQuestions', label: 'Asking Questions' },
    { id: 'AnsweringQuestions', label: 'Answering Questions' },
    { id: 'SharingInfo', label: 'Sharing Information' },
    { id: 'Describing', label: 'Describing' },
    { id: 'Feelings', label: 'Expressing Feelings' },
    { id: 'Audience', label: 'Speaking for Audience' },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
    pre_completed: { label: 'Pre Completed', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
    mid_completed: { label: 'Mid Completed', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
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
    const canEdit = assessment.status !== 'pending' || phase === 'pre';

    // Determine if this phase can be edited based on current status
    const phaseEditAllowed =
      (phase === 'pre' && (assessment.status === 'pre_completed' || assessment.status === 'mid_completed' || assessment.status === 'completed')) ||
      (phase === 'mid' && (assessment.status === 'mid_completed' || assessment.status === 'completed')) ||
      (phase === 'post' && assessment.status === 'completed');

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {categories.map((cat) => {
                // Map category ID to database field name (e.g., 'pre' + 'Fluency' = 'preFluency')
                const fieldName = `${prefix}${cat.id}`;
                const value = assessment[fieldName];
                // Ensure we have a valid number (0-5)
                const rating = typeof value === 'number' && value >= 0 && value <= 5 ? value : 0;
                return (
                  <div key={cat.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">{cat.label}</span>
                    {renderStars(rating)}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div>
                <span className="text-sm text-gray-500">Total Score:</span>
                <span className="ml-2 text-xl font-bold text-[#673AB7]">{totalScore}/60</span>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Speaking Assessment</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span><strong>Student:</strong> {assessment.studentName}</span>
                <span><strong>School:</strong> {assessment.schoolName}</span>
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

        {/* Phase Sections */}
        <div className="p-6 space-y-6">
          {renderPhaseSection('pre', 'Pre-Assessment')}
          {renderPhaseSection('mid', 'Mid-Assessment')}
          {renderPhaseSection('post', 'Post-Assessment')}

          {/* Notes */}
          {assessment.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes</h3>
              <p className="text-gray-600">{assessment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentDetail;

