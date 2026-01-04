import { useState } from 'react';
import axios from 'axios';

function StudentApplyForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', grade_level: ''
  });

  const [files, setFiles] = useState({
    resume: null,
    marksheet: [],
    idcard: []
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: name === "resume" ? uploadedFiles[0] : Array.from(uploadedFiles)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    if (files.resume) data.append("resume", files.resume);
    files.marksheet.forEach(file => data.append("marksheet", file));
    files.idcard.forEach(file => data.append("idcard", file));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/apply/student`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setMessage('Application submitted successfully!');
      setForm({ name: '', email: '', phone: '', address: '', grade_level: '' });
      setFiles({ resume: null, marksheet: [], idcard: [] });
    } catch (err) {
      console.error(err);
      setMessage('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message.includes('successfully');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Student Application</h1>
            <p className="text-gray-600 mt-1">Fill in your details to apply</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
              isSuccess
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {isSuccess ? '✅' : '❌'} {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                name="name"
                value={form.name}
                placeholder="Enter your full name"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder="your@email.com"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  placeholder="Your phone number"
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                name="address"
                value={form.address}
                placeholder="Your address"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
              <input
                name="grade_level"
                value={form.grade_level}
                placeholder="e.g., Class 10"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* File Uploads */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF)</label>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marksheets (10th/12th)</label>
                  <input
                    type="file"
                    name="marksheet"
                    multiple
                    accept=".pdf,.jpg,.png"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (PAN, Aadhaar)</label>
                  <input
                    type="file"
                    name="idcard"
                    multiple
                    accept=".pdf,.jpg,.png"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentApplyForm;
