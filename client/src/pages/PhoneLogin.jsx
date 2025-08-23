import { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

function PhoneLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  useEffect(() => {
    // Load reCAPTCHA script manually
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setRecaptchaReady(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const setupRecaptcha = () => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA not loaded'));
          return;
        }

        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
        }

        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response) => {
              console.log("reCAPTCHA solved", response);
              resolve(response);
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
              window.recaptchaVerifier = null;
              reject(new Error('reCAPTCHA expired'));
            }
          },
          auth
        );

        // Render the reCAPTCHA
        window.recaptchaVerifier.render().then(() => {
          resolve();
        }).catch(reject);

      } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
        reject(error);
      }
    });
  };

  const handleSendOtp = async () => {
    if (!phone.match(/^\d{10}$/)) {
      alert("Enter valid 10-digit Indian phone number");
      return;
    }

    if (!recaptchaReady) {
      alert("reCAPTCHA is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);
    try {
      await setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      const result = await signInWithPhoneNumber(auth, "+91" + phone, appVerifier);
      setConfirmationResult(result);
      alert("✅ OTP sent");
    } catch (err) {
      console.error("OTP Error:", err);
      
      // Clear recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      alert("❌ Failed to send OTP: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      alert("Please send OTP first");
      return;
    }

    try {
      const res = await confirmationResult.confirm(otp);
      const token = await res.user.getIdToken();

      const serverRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/phone-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await serverRes.json();
      if (serverRes.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("✅ Login successful");
        window.location.href = "/student-dashboard";
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("OTP Verification Error:", err);
      alert("❌ Invalid OTP");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📱 Phone Login</h2>
      <input 
        placeholder="Phone (10 digit)" 
        value={phone} 
        onChange={e => setPhone(e.target.value)} 
      />
      <button 
        onClick={handleSendOtp} 
        disabled={loading || !recaptchaReady}
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>
      <br /><br />
      <input 
        placeholder="Enter OTP" 
        value={otp} 
        onChange={e => setOtp(e.target.value)} 
      />
      <button onClick={handleVerifyOtp}>Verify OTP</button>
      <div id="recaptcha-container"></div>
      {!recaptchaReady && <p>Loading reCAPTCHA...</p>}
    </div>
  );
}

export default PhoneLogin;