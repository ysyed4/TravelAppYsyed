import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";
import user_icon from "/Users/yousefali/Desktop/se3316-lab4-ysyed4/lab-4-ysyed4/client/login-signup/src/Components/Assets/person.png";
import email_icon from "/Users/yousefali/Desktop/se3316-lab4-ysyed4/lab-4-ysyed4/client/login-signup/src/Components/Assets/email.png";
import password_icon from "/Users/yousefali/Desktop/se3316-lab4-ysyed4/lab-4-ysyed4/client/login-signup/src/Components/Assets/password.png";

export const LoginSignup = () => {
  const [action, setAction] = useState("Login");
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationLink, setVerificationLink] = useState("");
  const navigate = useNavigate();
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = async () => {
    try {
      let response;
  
      if (action === "Sign Up") {
        response = await fetch("http://localhost:3000/api/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            nickname: formData.nickname,
          }),
        });
      } else {
        response = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
      }
  
      const data = await response.json();
  
      if (response.ok) {
        if (action === "Sign Up" && data.verificationLink) {
          setSuccessMessage(`Registration successful! Please verify your email.`);
          setVerificationLink(data.verificationLink);
        } else if (action === "Login") {
          if (data.user.disabled) {
            setErrorMessage("Your account is disabled. Please contact support.");
            setSuccessMessage("");
            return;
          }
  
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.user._id);
          localStorage.setItem("roles", JSON.stringify(data.user.roles));
          setSuccessMessage("Logging you in!");
  
          if (data.user.roles.includes("admin")) {
            navigate("/admin");
          } else {
            navigate("/home");
          }
        }
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "An error occurred");
        setSuccessMessage("");
      }
    } catch (error) {
      setErrorMessage("Error during submission: " + error.message);
      setSuccessMessage("");
    }
  };
  

  const handleVerificationLinkClick = () => {
    setVerificationLink("");
    setSuccessMessage("Email verified! Please log in!");
  };

  const handleGuestContinue = () => {
    navigate("/guest");
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        {action === "Sign Up" && (
          <div className="input">
            <img src={user_icon} alt="User Icon" />
            <input
              type="text"
              name="nickname"
              placeholder="Nickname"
              value={formData.nickname}
              onChange={handleInputChange}
            />
          </div>
        )}

        <div className="input">
          <img src={email_icon} alt="Email Icon" />
          <input
            type="email"
            name="email"
            placeholder="Email Id"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="input">
          <img src={password_icon} alt="Password Icon" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
      </div>
      {action === "Login" && (
        <div className="forgot-password">
          Lost Password? <span>Click Here</span>
        </div>
      )}
      <div className="submit-container">
        <div
          className={action === "Login" ? "submit gray" : "submit"}
          onClick={() => setAction("Sign Up")}
        >
          Sign Up
        </div>
        <div
          className={action === "Sign Up" ? "submit gray" : "submit"}
          onClick={() => setAction("Login")}
        >
          Login
        </div>
        <div className="submit" onClick={handleFormSubmit}>
          {action}
        </div>
      </div>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {verificationLink && (
        <div className="verification-link">
          <p>Click link to verify email:</p>
          <a
            href={verificationLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleVerificationLinkClick}
          >
            Verify Email
          </a>
        </div>
      )}
      <div className="guest-container">
        Would You Like To Continue as Guest?{""}
        <span onClick={handleGuestContinue}>Click Here</span>
      </div>
    </div>
  );
};
