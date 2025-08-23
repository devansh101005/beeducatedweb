import { useEffect, useState } from "react";
import axios from "axios";

function MaterialsList() {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/resources`)
      .then(res => setMaterials(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📚 Study Materials</h2>
      <ul>
        {materials.map((mat) => (
          <li key={mat.id}>
            <strong>{mat.title}</strong> ({mat.classLevel}, {mat.category}) —{" "}
            <a href={mat.url} target="_blank" rel="noreferrer">Download</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MaterialsList;
