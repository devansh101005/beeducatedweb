import React from "react";
import ann from '../assets/ann.png';

const AnnouncementModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/40 flex justify-center items-center z-[9999]">
      <div className="bg-white p-6 md:p-8 rounded-xl max-w-lg w-[90%] relative shadow-2xl animate-fade-in">
        <button
          className="absolute top-3 right-4 bg-black text-white border-none text-2xl cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors duration-200"
          onClick={onClose}
        >
          ×
        </button>
        <div className="mt-0">
          <h2 className="mt-0 text-2xl font-bold text-gray-800 mb-4">Announcement</h2>
          {/* <p className="mt-2.5 text-base text-gray-700">{message}</p> */}
          <p className="mt-2.5 text-base text-gray-700 mb-4">
            Registration process of test series has started for class 10th and 12th 🎉
          </p>
          <img
            src={ann}
            alt="Announcement"
            className="w-full max-w-md h-auto mx-auto rounded-lg shadow-md md:w-96 md:h-[550px] md:ml-5"
          />
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
