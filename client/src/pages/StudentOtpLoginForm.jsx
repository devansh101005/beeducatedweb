import { useState } from "react";
import "./StudentOtpLoginForm.css";

function StudentOtpLoginForm() {
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOtp = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/offline-auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ OTP sent to registered phone.");
        setStep(2);
      } else {
        setMessage(data.error || "❌ Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/offline-auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, otp })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("✅ Login successful!");
        window.location.href = "/student-dashboard";
      } else {
        setMessage(data.error || "❌ OTP verification failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="otp-login-container">
      <h2>Offline Student Login</h2>
      {step === 1 ? (
        <>
          <label>Student ID:</label>
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
          <button onClick={handleSendOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <label>Enter OTP:</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </>
      )}
      {message && <p className="msg">{message}</p>}
    </div>
  );
}

export default StudentOtpLoginForm;