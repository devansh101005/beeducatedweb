import { useEffect, useState } from "react";
import axios from "axios";
import "./StudyMaterials.css";

function StudyMaterials() {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/resources`);
        setMaterials(res.data);
      } catch (err) {
        console.error("Failed to fetch materials", err);
      }
    };
    fetchMaterials();
  }, []);

  return (
    <div className="materials-page">
      <h2>📚 Study Materials</h2>
      {materials.length === 0 ? (
        <p>No materials uploaded yet.</p>
      ) : (
        <ul className="materials-list">
          {materials.map((mat) => (
            <li key={mat.id}>
              <h4>{mat.title}</h4>
              <p>Class: {mat.classLevel} | Category: {mat.category}</p>
              <a href={mat.url} target="_blank" rel="noopener noreferrer">📥 Download</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StudyMaterials;
