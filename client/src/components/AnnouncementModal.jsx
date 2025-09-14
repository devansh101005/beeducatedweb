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
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
