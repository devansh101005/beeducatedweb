import { useState } from 'react';
import axios from 'axios';
//import "./StudentApplyForm.css";

function StudentApplyForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', grade_level: ''
  });

  const [files, setFiles] = useState({
    resume: null,
    marksheet: [],
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
    files.marksheet.forEach(file => data.append("marksheet", file));
    files.idcard.forEach(file => data.append("idcard", file));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/apply/student`,
         data, 
         
        {headers: { 'Content-Type': 'multipart/form-data' }}
      );
      alert("Student application submitted!");
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <h2>Student Application</h2>
      <input name="name" placeholder="Name" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="phone" placeholder="Phone" onChange={handleChange} required />
      <input name="address" placeholder="Address" onChange={handleChange} required />
      <input name="grade_level" placeholder="Grade Level" onChange={handleChange} required />

      <label>Resume (PDF)</label>
      <input type="file" name="resume" accept=".pdf" onChange={handleFileChange} />

      <label>Marksheets (10th/12th)</label>
      <input type="file" name="marksheet" multiple accept=".pdf,.jpg,.png" onChange={handleFileChange} />

      <label>ID Proof (PAN, Aadhaar)</label>
      <input type="file" name="idcard" multiple accept=".pdf,.jpg,.png" onChange={handleFileChange} />

      <button type="submit">Submit</button>
    </form>
  );
}

export default StudentApplyForm;