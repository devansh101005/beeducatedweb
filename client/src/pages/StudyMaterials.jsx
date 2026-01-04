import { useEffect, useState } from "react";
import axios from "axios";

function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/resources`);
        setMaterials(res.data);
      } catch (err) {
        console.error("Failed to fetch materials", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const formatCategory = (category) => {
    if (category === "General") {
      return "Study Material";
    }
    return category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Study Materials
          </h1>
          <p className="text-gray-600 text-lg">Access learning resources and downloadable content</p>
        </div>

        {materials.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Materials Yet</h2>
            <p className="text-gray-600">No materials have been uploaded yet. Check back later!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{mat.title}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                          Class {mat.classLevel}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                          {formatCategory(mat.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <span>Download</span>
                    <span>📥</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyMaterials;
