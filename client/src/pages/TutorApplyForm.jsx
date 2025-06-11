import { useState } from 'react';
import axios from 'axios';

function TutorApplyForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', qualification: '', subject_expertise: '', experience_years: ''
  });

  const [files, setFiles] = useState({
    resume: null,
    idcard: []
  });

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
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    if (files.resume) data.append("resume", files.resume);
    files.idcard.forEach(file => data.append("idcard", file));

    try {
      await axios.post('/api/apply/tutor', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Tutor application submitted!");
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <h2>Tutor Application</h2>
      <input name="name" placeholder="Name" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="phone" placeholder="Phone" onChange={handleChange} required />
      <input name="qualification" placeholder="Qualification" onChange={handleChange} required />
      <input name="subject_expertise" placeholder="Subjects" onChange={handleChange} required />
      <input name="experience_years" placeholder="Experience" type="number" onChange={handleChange} required />

      <label>Resume (PDF)</label>
      <input type="file" name="resume" accept=".pdf" onChange={handleFileChange} />

      <label>ID Proof (PAN, Aadhaar)</label>
      <input type="file" name="idcard" multiple accept=".pdf,.jpg,.png" onChange={handleFileChange} />

      <button type="submit">Submit</button>
    </form>
  );
}

export default TutorApplyForm;