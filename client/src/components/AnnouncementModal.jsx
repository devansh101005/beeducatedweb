import React from "react";
import "./AnnouncementModal.css";

const AnnouncementModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="modal-body">
          <h2>Announcement</h2>
          {/* <p>{message}</p> */}
          <p>Registration process of test series has started for class 10th and 12th 🎉</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
