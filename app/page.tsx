'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a bill image first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/web-upload', {
        method: 'POST',
        body: formData,
      });

      // Defensive parsing to prevent React crashes
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = {
          simplifiedSummary: "We received your bill safely, but couldn't parse the details perfectly.",
          amountDue: "Check Document",
          dueDate: "Check Document",
          nextSteps: "Please contact your provider.",
          audioUrl: null
        };
      }

      setResult(data);
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF9F0] p-6 md:p-12 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">SimpliCare</h1>
          <p className="text-lg text-gray-600 font-medium">
            Translating healthcare bureaucracy into actionable human clarity.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/50">
              <label className="cursor-pointer block">
                <span className="block text-xl font-bold text-blue-900 mb-2">
                  Tap to upload your bill photo
                </span>
                <span className="text-gray-500 text-sm">JPG or PNG works best.</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>

            {file && (
              <p className="text-sm font-medium text-green-700 text-center">
                Selected: {file.name}
              </p>
            )}

            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-[#0052A3] hover:bg-blue-800 disabled:bg-gray-300 text-white text-xl font-bold py-4 rounded-2xl transition-colors"
            >
              {loading ? 'Translating medical jargon...' : 'Explain my bill'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        {result && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-blue-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Audio Player */}
            {result.audioUrl && (
              <div className="bg-blue-50 p-4 rounded-2xl">
                <p className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wider">Listen to Summary</p>
                <audio controls className="w-full" src={result.audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Simple Summary</h2>
              <p className="text-2xl font-semibold leading-relaxed text-gray-800">
                {result.simplifiedSummary || result.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Due</h3>
                <p className="text-2xl font-bold text-red-600">{result.amountDue || result.amount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</h3>
                <p className="text-xl font-bold text-gray-800">{result.dueDate || result.date}</p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2">Next Step</h3>
              <p className="text-xl font-bold text-green-900">{result.nextSteps || result.next_action}</p>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
