import React, { useState, useEffect } from 'react';
import { rfpAPI } from '../services/api';
import QuestionForm from './QuestionForm';

export default function SectionView({ section, onAnswerSaved }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [section.id]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await rfpAPI.getQuestions(section.id);
      setQuestions(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const answeredCount = questions.filter(q => q.answer_text).length;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading questions...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Section {section.section_num}: {section.section_title}
        </h2>
        <p className="text-gray-600 mb-4">{section.description}</p>

        {/* Progress bar */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {answeredCount} of {questions.length} questions answered
            </span>
            <span className="text-sm font-semibold text-indigo-600">
              {questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {question.question_num}
                </h3>
                <p className="text-gray-700 mb-3">{question.question_text}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                    question.priority
                  )}`}
                >
                  {question.priority}
                </span>
                {question.answer_text && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                    ✓ Answered
                  </span>
                )}
              </div>
            </div>

            <QuestionForm
              question={question}
              onSaved={loadQuestions}
            />

            {question.updated_at && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(question.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
