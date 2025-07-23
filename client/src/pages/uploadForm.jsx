// import { useState } from "react";
// import axios from "axios";

// function UploadForm() {
//   const [form, setForm] = useState({ title: '', category: '', classLevel: '' });
//   const [file, setFile] = useState(null);
//   const [message, setMessage] = useState('');

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!file) return alert("Please select a file");

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("title", form.title);
//     formData.append("category", form.category);
//     formData.append("classLevel", form.classLevel);

//     try {
//       const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/resources/upload`, formData);
//       setMessage(`✅ Uploaded: ${res.data.material.url}`);
//     } catch (err) {
//       console.error(err);
//       setMessage("❌ Upload failed");
//     }
//   };

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h2>Upload Study Material</h2>
//       <form onSubmit={handleSubmit} encType="multipart/form-data">
//         <input name="title" placeholder="Title" onChange={handleChange} required />
//         <select name="classLevel" onChange={handleChange} required>
//           <option value="">Select Class</option>
//           <option value="Nursery">Nursery</option>
//           <option value="Class-1">Class 1</option>
//           {/* Add up to Class-12 */}
//           <option value="Class-12">Class 12</option>
//         </select>
//         <select name="category" onChange={handleChange} required>
//           <option value="">Select Category</option>
//           <option value="JEE">JEE</option>
//           <option value="NEET">NEET</option>
//           <option value="NDA">NDA</option>
//         </select>
//         <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
//         <button type="submit">Upload</button>
//       </form>
//       {message && <p>{message}</p>}
//     </div>
//   );
// }

// export default UploadForm;
