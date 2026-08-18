import React, { useState } from "react";
import { Mail, User, Lock, Eye, EyeOff, LogIn, UserCog } from "lucide-react";
import Register from "../auth/Register"
import { toast, ToastContainer } from "react-toastify";
import "../auth/LoginForm.css";
import Footer from "../common/footer.jsx"
import { loginUser } from "../../services/authService.js";
import { Navigate, useNavigate } from "react-router-dom";
import {saveStudentSession} from "../../utils/helpers";

const StudentLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser(
        formData.identifier,
        formData.password,
        "student"
      );

      if (response.success) {
        sessionStorage.setItem(
          "studentSession",
          JSON.stringify({
            token: response.token,
            user: response.user
          })
        );

        navigate("/student/start-test");
      }

    } catch (error) {

      console.error("Login error:", error);

      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Unable to connect to server");
      }
    }
  };

  return (<>
    <div className="flex pt-20 justify-center"><div className="login-card">
      {/* Heading */}
      <div className="login-heading">
        <ToastContainer position="bottom-right" autoClose={3000} />

        <User className="login-heading__icon" size={22} />

        <h2>Student Login</h2>
      </div>

      {/* Form */}
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="identifier">User Name</label>
          <div className="login-input">
            <User size={18} />
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="Enter your User Name"
              value={formData.identifier}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="login-input__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="login-submit">
          <LogIn size={18} />
          Login
        </button>

        {/*<div className="login-footer">
          <>
            <p className="login-footer__link">Forgot your password?</p>
            <p className="login-footer__link">Contact your mentor</p>
            <button type="button" className="login-signup" onClick={() => navigate("/register")} >
              New Student? Sign Up
            </button>
          </>
        </div>*/}
      </form>
    </div>
    </div>
    <Footer />
  </>
  );
};

export default StudentLogin;