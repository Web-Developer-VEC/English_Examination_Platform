import React, { useEffect, useState } from "react";
import { Mail, User, Lock, Eye, EyeOff, LogIn, UserCog } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "../auth/LoginForm.css";
import { loginUser } from "../../services/authService";
import { saveAdminSession, clearAdminSession, clearStudentSession } from "../../utils/helpers";
import Footer from "../common/footer.jsx";
import { Navigate, useNavigate } from "react-router-dom";

const AdminLogin = () => {
    

    const navigate = useNavigate();

    useEffect(() => {
        clearAdminSession();
        clearStudentSession();
    }, []);

    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [formData, setFormData] = useState({ identifier: "", password: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setLoginError("");
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
                toast.success("Login successfull");
                
                saveAdminSession({
                    token: response.token,
                    sessionId: response.sessionId,
                    expiresAt: response.expiresAt,
                    user: response.user
                });
                setTimeout(() => {
                    navigate("/admin");
                }, 2000);

            }

        } catch (error) {

            if (error.response) {

                setLoginError("Wrong Username or Password");

            } else {

                setLoginError("Unable to connect to server");
            }
        }
    };

    return (
        <>
            <ToastContainer position="bottom-right" autoClose="2000" />
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
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="login-submit">
                                <LogIn size={18} />
                                Login
                            </button>
                            {loginError && (
                                <p className="mt-3 text-center text-red-600 text-sm font-medium">
                                    {loginError}
                                </p>
                            )}

                            <div className="login-footer">
                                <>
                                    <button
                                        type="button"
                                        className="login-footer__link"
                                        onClick={() => navigate("/forgot-password")}
                                    >
                                        Reset your password
                                    </button>
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