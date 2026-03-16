import React, { useState, useEffect, useRef } from 'react';
import { rfpAPI } from '../services/api';

export default function QuestionForm({ question, onSaved }) {
  const [answer, setAnswer] = useState(question.answer_text || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    setAnswer(question.answer_text || '');
  }, [question.id]);

  const saveAnswer = async (value) => {
    try {
      setSaving(true);
      await rfpAPI.saveAnswer(question.id, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error('Error saving answer:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);

    // Auto-save with debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveAnswer(value);
    }, 1000);
  };

  const handleBlur = () => {
    // Save immediately on blur
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (answer !== question.answer_text) {
      saveAnswer(answer);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={answer}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Enter your response here..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
        rows={5}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {saving && <span className="text-blue-600 font-medium">Saving...</span>}
          {saved && <span className="text-green-600 font-medium">✓ Saved</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveAnswer(answer)}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
