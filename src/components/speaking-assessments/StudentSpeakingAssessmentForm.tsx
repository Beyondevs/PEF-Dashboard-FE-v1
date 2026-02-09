import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fillStudentSpeakingAssessment, AssessmentPhase } from '@/lib/api';

interface StudentSpeakingAssessmentFormProps {
  assessment: any;
  phaseToFill?: AssessmentPhase; // Optional: if provided, edit this phase; otherwise use nextPhase
  onClose: () => void;
  onSuccess: () => void;
}

const StudentSpeakingAssessmentForm: React.FC<StudentSpeakingAssessmentFormProps> = ({
  assessment,
  phaseToFill,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'fluency', label: 'Fluency', desc: 'Speaks smoothly and easily without long pauses.' },
    { id: 'completeSentences', label: 'Speaking in Complete Sentences', desc: 'Can express ideas in full sentences, not just single words.' },
    { id: 'accuracy', label: 'Accuracy', desc: 'Uses correct grammar, tenses, and sentence structure.' },
    { id: 'pronunciation', label: 'Pronunciation', desc: 'Speaks clearly and is easy to understand.' },
    { id: 'vocabulary', label: 'Vocabulary', desc: 'Uses common everyday words correctly.' },
    { id: 'confidence', label: 'Confidence', desc: 'Speaks clearly and confidently.' },
    { id: 'askingQuestions', label: 'Asking Questions', desc: 'Can ask clear and simple questions.' },
    { id: 'answeringQuestions', label: 'Answering Questions', desc: 'Can give clear and relevant answers.' },
    { id: 'sharingInfo', label: 'Asking and Sharing Information', desc: 'Can ask and answer questions about routines, past, or future events.' },
    { id: 'describing', label: 'Describing and Explaining', desc: 'Can describe people, places, and events clearly using simple details.' },
    { id: 'feelings', label: 'Expressing Thoughts and Feelings', desc: 'Can give opinion, make requests, and apologize politely.' },
    { id: 'audience', label: 'Speaking for an Audience', desc: 'Can speak clearly when giving a short presentation.' },
  ];

  // Use phaseToFill if provided (for editing), otherwise use nextPhase (for new fill)
  const activePhase = (phaseToFill || assessment.nextPhase) as AssessmentPhase;
  const isEditing = !!phaseToFill;

  // Pre-populate form data when editing
  useEffect(() => {
    if (isEditing && assessment) {
      const prefix = activePhase;
      const initialData: Record<string, number> = {};
      
      // Map assessment fields to form data
      const fieldMapping: Record<string, string> = {
        fluency: 'Fluency',
        completeSentences: 'CompleteSentences',
        accuracy: 'Accuracy',
        pronunciation: 'Pronunciation',
        vocabulary: 'Vocabulary',
        confidence: 'Confidence',
        askingQuestions: 'AskingQuestions',
        answeringQuestions: 'AnsweringQuestions',
        sharingInfo: 'SharingInfo',
        describing: 'Describing',
        feelings: 'Feelings',
        audience: 'Audience',
      };

      Object.entries(fieldMapping).forEach(([formKey, assessmentKey]) => {
        const value = assessment[`${prefix}${assessmentKey}`];
        if (value && value > 0) {
          initialData[formKey] = value;
        }
      });

      setFormData(initialData);
      // Phase-specific notes first, then fallback to legacy `notes`
      setNotes(assessment?.[`${prefix}Notes`] || assessment.notes || '');
    } else {
      // For new fill, ensure form is empty
      setFormData({});
      setNotes('');
    }
  }, [isEditing, activePhase, assessment]);

  const phaseLabel = {
    pre: 'Pre-Assessment',
    mid: 'Post-Assessment',
    post: 'Post-Assessment',
  };

  const handleRating = (id: string, value: number) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all categories are filled
    const missingCategories = categories.filter((cat) => !formData[cat.id] || formData[cat.id] < 1);
    if (missingCategories.length > 0) {
      setError(`Please rate all categories. Missing: ${missingCategories.map((c) => c.label).join(', ')}`);
      return;
    }

    setLoading(true);

    const payload = {
      phase: activePhase,
      fluency: formData.fluency,
      completeSentences: formData.completeSentences,
      accuracy: formData.accuracy,
      pronunciation: formData.pronunciation,
      vocabulary: formData.vocabulary,
      confidence: formData.confidence,
      askingQuestions: formData.askingQuestions,
      answeringQuestions: formData.answeringQuestions,
      sharingInfo: formData.sharingInfo,
      describing: formData.describing,
      feelings: formData.feelings,
      audience: formData.audience,
      notes: notes || undefined,
    };

    try {
      await fillStudentSpeakingAssessment(assessment.id, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  if (!activePhase) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Assessment Complete</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600">All assessment phases have been completed for this student.</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-[#673AB7] hover:bg-[#5E35A6] text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F0EBF8] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-lg border-t-[10px] border-[#673AB7] shadow-md p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                Student Speaking {phaseLabel[activePhase]} {isEditing ? '(Edit)' : ''}
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                Student: <strong>{assessment.studentName}</strong> | School: <strong>{assessment.schoolName}</strong>
              </p>
              <p className="text-sm mb-2 text-gray-600">
                Please rate each statement based on the student's current speaking ability.
              </p>
              <p className="text-sm font-medium text-gray-700">
                1 = Poor, 2 = Average, 3 = Good, 4 = Very Good, 5 = Excellent
              </p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Rating Sections */}
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="mb-6">
                <span className="font-semibold">{cat.label}: </span>
                <span className="text-gray-700">{cat.desc}</span>
                <span className="text-red-500 ml-1">*</span>
              </div>
              <div className="flex justify-between items-center max-w-md mx-auto py-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex flex-col items-center mx-2">
                    <span className="text-xs text-gray-500 mb-2">{num}</span>
                    <button
                      type="button"
                      onClick={() => handleRating(cat.id, num)}
                      className={`text-2xl transition-all transform hover:scale-125 ${
                        formData[cat.id] >= num ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <label className="block mb-4 text-base font-medium">Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:border-[#673AB7] focus:ring-1 focus:ring-[#673AB7] outline-none"
              rows={3}
              placeholder="Any additional observations..."
            />
          </div>

          {/* Footer Buttonss */}
          <div className="flex justify-between items-center pt-6 pb-4">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? 'bg-gray-400' : 'bg-[#673AB7] hover:bg-[#5E35A6]'
              } text-white px-8 py-2 rounded font-medium transition-colors shadow-md`}
            >
              {loading ? 'Saving...' : `${isEditing ? 'Update' : 'Submit'} ${phaseLabel[activePhase]}`}
            </button>
            <button
              type="button"
              onClick={() => setFormData({})}
              className="text-[#673AB7] font-medium hover:bg-purple-50 px-4 py-2 rounded"
            >
              Clear form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSpeakingAssessmentForm;
