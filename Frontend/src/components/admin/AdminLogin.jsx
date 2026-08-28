import React, { useState } from "react";
import { Mail, User, Lock, Eye, EyeOff, LogIn, UserCog } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "../auth/LoginForm.css";
import { loginUser } from "../../services/authService";
import { saveAdminSession } from "../../utils/helpers";
import Footer from "../common/footer.jsx";
import { Navigate, useNavigate } from "react-router-dom";

const AdminLogin = () => {
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
                formData.password
            );

            if (response.success) {
                sessionStorage.removeItem(
                    "studentSession"
                );
                // Save admin session


                // Optional: remove old student session
                sessionStorage.removeItem(
                    "studentSession"
                );
                saveAdminSession({
                    token: response.token,
                    sessionId: response.sessionId,
                    expiresAt: response.expiresAt,
                    user: response.user
                });
                navigate("/admin");
            }

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            if (error.response) {

                toast.error(
                    error.response.data.message
                );

            } else {

                toast.error(
                    "Unable to connect to server"
                );
            }
        }
    };

    return (
        <>
            <div className="flex justify-center">
                <div className="flex justify-center pt-10">
                    <div className="login-card">
                        <ToastContainer position="bottom-right" autoClose={3000} />

                        {/* Heading */}
                        <div className="login-heading">
                            <UserCog className="login-heading__icon" size={22} />
                            <h2>Admin Login</h2>
                        </div>

                        {/* Form */}
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="login-field">
                                <label htmlFor="identifier">Email Address</label>
                                <div className="login-input">
                                    <Mail size={18} />
                                    <input
                                        id="identifier"
                                        name="identifier"
                                        type="email"
                                        placeholder='Enter your Email'
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

                            <div className="login-footer">
                                <>
                                    <button
                                        type="button"
                                        className="login-footer__link"
                                        onClick={() => navigate("/forgot-password")}
                                    >
                                        Forgot your password?
                                    </button>
                                    {/* <p className="login-footer__link">Ask other admin to reset the password</p> */}
                                </>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </>

    );
};
export default AdminLogin;