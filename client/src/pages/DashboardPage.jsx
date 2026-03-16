import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfpAPI, exportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SectionNavigation from '../components/SectionNavigation';
import SectionView from '../components/SectionView';

export default function DashboardPage() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, progressRes] = await Promise.all([
        rfpAPI.getSections(),
        rfpAPI.getProgress()
      ]);

      setSections(sectionsRes.data);
      setProgress(progressRes.data);
      if (sectionsRes.data.length > 0) {
        setSelectedSection(sectionsRes.data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = format === 'pdf'
        ? await exportAPI.exportPDF()
        : await exportAPI.exportExcel();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RFP_Responses.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError(err.response?.data?.error || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFP data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-600">SelectQuote RFP</h1>
          <p className="text-sm text-gray-600 mt-2">{user?.company_name || user?.email}</p>
        </div>

        {/* Overall Progress */}
        {progress && (
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <h3 className="font-semibold text-gray-700 mb-2">Overall Progress</h3>
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {progress.answered_questions}/{progress.total_questions} answered ({progress.percentage}%)
            </p>
          </div>
        )}

        {/* Sections Navigation */}
        <nav className="p-6 space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedSection?.id === section.id
                  ? 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold">Section {section.section_num}</div>
              <div className="text-xs text-gray-600">{section.section_title}</div>
              <div className="text-xs mt-1">
                {section.answered_questions}/{section.total_questions} answered
              </div>
            </button>
          ))}
        </nav>

        {/* Export & Logout */}
        <div className="p-6 border-t border-gray-200 space-y-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {exporting ? 'Exporting...' : 'Export as PDF'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {exporting ? 'Exporting...' : 'Export as Excel'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {selectedSection && (
          <SectionView
            section={selectedSection}
            onAnswerSaved={loadData}
          />
        )}
      </div>
    </div>
  );
}
