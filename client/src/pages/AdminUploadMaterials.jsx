import { useState } from 'react';
import axios from 'axios';

function AdminUploadMaterial() {
  const [form, setForm] = useState({ title: '', category: '', classLevel: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpload = async (e) => {
    e.preventDefault();
    const data = new FormData();
    if (!file) {
      setMsg('❌ Please select a file');
      return;
    }
    data.append('file', file);
    data.append('title', form.title);
    data.append('category', form.category);
    data.append('classLevel', form.classLevel);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/materials/upload`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg(`✅ Uploaded successfully! Link: ${res.data.url}`);
      setForm({ title: '', category: '', classLevel: '' });
      setFile(null);
    } catch (err) {
      setMsg(`❌ Upload failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Upload Study Material</h2>
      <form onSubmit={handleUpload} encType="multipart/form-data">
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="">Select Category</option>
          <option value="JEE">JEE</option>
          <option value="NEET">NEET</option>
          <option value="NDA">NDA</option>
          <option value="RIMC">RIMC</option>
          <option value="RMS">RMS</option>
          <option value="SSC">SSC</option>
          <option value="Olympiad">Olympiad</option>
          <option value="CUET">CUET</option>
          <option value="General">General</option>
        </select>
        <select name="classLevel" value={form.classLevel} onChange={handleChange} required>
          <option value="">Select Class</option>
          <option value="Nursery">Nursery</option>
          <option value="LKG">LKG</option>
          <option value="UKG">UKG</option>
          <option value="Class-1">Class 1</option>
          <option value="Class-2">Class 2</option>
          <option value="Class-3">Class 3</option>
          <option value="Class-4">Class 4</option>
          <option value="Class-5">Class 5</option>
          <option value="Class-6">Class 6</option>
          <option value="Class-7">Class 7</option>
          <option value="Class-8">Class 8</option>
          <option value="Class-9">Class 9</option>
          <option value="Class-10">Class 10</option>
          <option value="Class-11">Class 11</option>
          <option value="Class-12">Class 12</option>
        </select>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}

export default AdminUploadMaterial;