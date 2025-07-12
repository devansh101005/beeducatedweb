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
data.append('file', file);
data.append('title', form.title);
data.append('category', form.category);
data.append('classLevel', form.classLevel);
try {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/materials/upload`, data);
    setMsg(`✅ Uploaded successfully! Link: ${res.data.url}`);
  } catch (err) {
    setMsg('❌ Upload failed');
  }
};

return (
<div style={{ padding: '2rem' }}>
<h2>Upload Study Material</h2>
<form onSubmit={handleUpload} encType="multipart/form-data">
<input name="title" placeholder="Title" onChange={handleChange} required />
<input name="category" placeholder="Category (JEE/NEET/NDA/...)" onChange={handleChange} required />
<input name="classLevel" placeholder="Class (Nursery/5th/12th/...)" onChange={handleChange} required />
<input type="file" onChange={(e) => setFile(e.target.files[0])} required />
<button type="submit">Upload</button>
</form>
{msg && <p>{msg}</p>}
</div>
);
}

export default AdminUploadMaterial;