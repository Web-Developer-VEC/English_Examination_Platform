import React, { useState } from "react";
import { Mail, User, Lock, Eye, EyeOff, LogIn, UserCog } from "lucide-react";
import Register from "../auth/Register"
import "../auth/LoginForm.css";
import Footer from "../common/footer.jsx"
import { loginUser } from "../../services/authService.js";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { saveStudentSession, clearStudentSession, clearAdminSession } from "../../utils/helpers";

const StudentLogin = () => {
  clearStudentSession();
  clearAdminSession();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  });
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setLoginError("");
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

        sessionStorage.removeItem(
          "adminSession"
        );

        toast.success("Login successfull");
        saveStudentSession({
          token: response.token,
          user: response.user
        });
        setTimeout(() => {
          navigate("/student/dashboard");
        }, 2000);
        
      }

    } catch (error) {

      console.error("Login error:", error);

      if (error.response) {
        setLoginError("Wrong username or password");
      } else {
        setLoginError("Unable to connect to server");
      }
    }
  };

  return (<>
    <ToastContainer position="bottom-right" autoClose="2000"/>
    <div className="flex pt-10 justify-center"><div className="login-card">
      {/* Heading */}
      <div className="login-heading">
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
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        {loginError && (
          <p className="mt-3 text-center text-red-600 text-sm font-medium">
            {loginError}
          </p>
        )}
        <button type="submit" className="login-submit">
          <LogIn size={18} />
          Login
        </button>

        <div className="login-footer">
          {/* <>
<button
  type="button"
  className="login-footer__link"
  onClick={() => navigate("/forgot-password")}
>
  Forgot your password?
</button>           
 <p className="login-footer__link">Contact your mentor</p>  
            <button type="button" className="login-signup" onClick={() => navigate("/register")} >
              New Student? Sign Up
            </button> 
          </> */}
        </div>
      </form>
    </div>
    </div>
    <Footer />
  </>
  );
};

export default StudentLogin;