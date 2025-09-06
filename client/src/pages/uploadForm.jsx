// // import { useState } from "react";
// // import axios from "axios";

// // function UploadForm() {
// //   const [form, setForm] = useState({ title: '', classLevel: '' });
// //   const [file, setFile] = useState(null);
// //   const [message, setMessage] = useState('');

// //   const handleChange = (e) => {
// //     setForm({ ...form, [e.target.name]: e.target.value });
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!file) return alert("Please select a file");

// //     const formData = new FormData();
// //     formData.append("file", file);
// //     formData.append("title", form.title);
// //     formData.append("classLevel", form.classLevel);

// //     try {
// //       const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/resources/upload`, formData);
// //       setMessage(`✅ Uploaded: ${res.data.material.url}`);
// //       // Reset form after successful upload
// //       setForm({ title: '', classLevel: '' });
// //       setFile(null);
// //     } catch (err) {
// //       console.error(err);
// //       setMessage("❌ Upload failed");
// //     }
// //   };

// //   return (
// //     <div style={{ padding: '2rem' }}>
// //       <h2>Upload Study Material</h2>
// //       <form onSubmit={handleSubmit} encType="multipart/form-data">
// //         <input 
// //           name="title" 
// //           placeholder="Title" 
// //           value={form.title}
// //           onChange={handleChange} 
// //           required 
// //         />
// //         <select 
// //           name="classLevel" 
// //           value={form.classLevel}
// //           onChange={handleChange} 
// //           required
// //         >
// //           <option value="">Select Class</option>
// //           <option value="Nursery">Nursery</option>
// //           <option value="LKG">LKG</option>
// //           <option value="UKG">UKG</option>
// //           <option value="Class-1">Class 1</option>
// //           <option value="Class-2">Class 2</option>
// //           <option value="Class-3">Class 3</option>
// //           <option value="Class-4">Class 4</option>
// //           <option value="Class-5">Class 5</option>
// //           <option value="Class-6">Class 6</option>
// //           <option value="Class-7">Class 7</option>
// //           <option value="Class-8">Class 8</option>
// //           <option value="Class-9">Class 9</option>
// //           <option value="Class-10">Class 10</option>
// //           <option value="Class-11">Class 11</option>
// //           <option value="Class-12">Class 12</option>
// //         </select>
// //         <input 
// //           type="file" 
// //           onChange={(e) => setFile(e.target.files[0])} 
// //           required 
// //         />
// //         <button type="submit">Upload</button>
// //       </form>
// //       {message && <p>{message}</p>}
// //     </div>
// //   );
// // }

// // export default UploadForm;


// import { useState } from "react";
// import axios from "axios";

// function UploadForm() {
//   const [form, setForm] = useState({ title: '', classLevel: '', category: '' });
//   const [file, setFile] = useState(null);
//   const [message, setMessage] = useState('');

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!file) return setMessage("❌ Please select a file");

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("title", form.title);
//     formData.append("classLevel", form.classLevel);
//     formData.append("category", form.category);

//     try {
//       const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/materials/upload`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       if (res.data.success) {
//         setMessage(`✅ Uploaded: ${res.data.url}`);
//       } else {
//         setMessage("❌ Upload failed: Unexpected response");
//       }
//       // Reset form after successful upload
//       setForm({ title: '', classLevel: '', category: '' });
//       setFile(null);
//     } catch (err) {
//       console.error("Upload error:", err.response?.data || err.message);
//       setMessage(`❌ Upload failed: ${err.response?.data?.error || err.message}`);
//     }
//   };

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h2>Upload Study Material</h2>
//       <form onSubmit={handleSubmit} encType="multipart/form-data">
//         <input
//           type="text"
//           name="title"
//           placeholder="Title"
//           value={form.title}
//           onChange={handleChange}
//           required
//         />
//         <select
//           name="classLevel"
//           value={form.classLevel}
//           onChange={handleChange}
//           required
//         >
//           <option value="">Select Class</option>
//           <option value="Nursery">Nursery</option>
//           <option value="LKG">LKG</option>
//           <option value="UKG">UKG</option>
//           <option value="Class-1">Class 1</option>
//           <option value="Class-2">Class 2</option>
//           <option value="Class-3">Class 3</option>
//           <option value="Class-4">Class 4</option>
//           <option value="Class-5">Class 5</option>
//           <option value="Class-6">Class 6</option>
//           <option value="Class-7">Class 7</option>
//           <option value="Class-8">Class 8</option>
//           <option value="Class-9">Class 9</option>
//           <option value="Class-10">Class 10</option>
//           <option value="Class-11">Class 11</option>
//           <option value="Class-12">Class 12</option>
//         </select>
//         <select
//           name="category"
//           value={form.category}
//           onChange={handleChange}
//           required
//         >
//           <option value="">Select Category</option>
//           <option value="Math">Math</option>
//           <option value="Science">Science</option>
//           <option value="English">English</option>
//           <option value="History">History</option>
//         </select>
//         <input
//           type="file"
//           onChange={handleFileChange}
//           required
//         />
//         <button type="submit">Upload</button>
//       </form>
//       {message && <p style={{ color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
//     </div>
//   );
// }

// export default UploadForm;


import { useState } from "react";
import axios from "axios";

function UploadForm() {
  const [form, setForm] = useState({ title: '', classLevel: '', category: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("❌ Please select a file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", form.title);
    formData.append("classLevel", form.classLevel);
    formData.append("category", form.category);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/materials/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setMessage(`✅ Uploaded: ${res.data.url}`);
      } else {
        setMessage("❌ Upload failed: Unexpected response");
      }
      setForm({ title: '', classLevel: '', category: '' });
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setMessage(`❌ Upload failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Upload Study Material</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <select
          name="classLevel"
          value={form.classLevel}
          onChange={handleChange}
          required
        >
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
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
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
        <input
          type="file"
          onChange={handleFileChange}
          required
        />
        <button type="submit">Upload</button>
      </form>
      {message && <p style={{ color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
}

export default UploadForm;