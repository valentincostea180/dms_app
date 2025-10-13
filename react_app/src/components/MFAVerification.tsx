import { useState } from "react";

interface MFAVerificationProps {
  onVerified: (token: string) => void;
  onCancel: () => void;
}

const MFAVerification = ({ onVerified, onCancel }: MFAVerificationProps) => {
  const [email, setEmail] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"email" | "verification">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestCode = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5000/request-mfa-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setStep("verification");
      } else {
        setError(data.message || "Failed to send MFA code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!mfaCode) {
      setError("MFA code is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5000/verify-mfa-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: mfaCode }),
      });

      const data = await response.json();

      if (data.status === "success") {
        onVerified(data.token);
      } else {
        setError(data.message || "Invalid verification code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>DMS-2 Digitalization Tool</h1>
      <p>Secure Production Management System</p>

      <div className="mfa-container">
        {step === "email" ? (
          <>
            <h3>Enter Your Company Email</h3>
            <div className="form-group">
              <input
                type="email"
                className="form-control"
                placeholder="company@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="button-group">
              <button
                onClick={handleRequestCode}
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </button>
              <button
                onClick={onCancel}
                className="btn btn-secondary btn-lg"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Enter Verification Code</h3>
            <p>We sent a verification code to {email}</p>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(e) =>
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={loading}
              />
              <small className="text-muted">
                Check your email for the verification code
              </small>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="button-group">
              <button
                onClick={handleVerifyCode}
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                className="btn btn-secondary btn-lg"
                disabled={loading}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MFAVerification;
