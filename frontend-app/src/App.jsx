import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/pages/auth.css";
import { registerUser, loginUser } from "../services/api";

export default function Auth({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: null }));
  }

  function validate() {
    const errs = {};
    if (mode === "signup" && !form.username.trim()) errs.username = "Username is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    if (mode !== "forgot") {
      if (!form.password) errs.password = "Password is required.";
      else if (mode === "signup" && form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    }
    if (mode === "signup" && form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);

    const run = async () => {
      try {
        if (mode === "forgot") {
          setMode("signin");
          setLoading(false);
          return;
        }
        if (mode === "signup") {
          await registerUser(form.username, form.email, form.password);
        }
        const data = await loginUser(form.email, form.password);
        localStorage.setItem("token", data.access_token);
        const name = form.username.trim() || form.email.split("@")[0];
        onLogin(name);
        navigate("/app");
      } catch (err) {
        setErrors({ form: err.message });
      } finally {
        setLoading(false);
      }
    };

    run();
  }

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setForm({ username: "", email: "", password: "", confirmPassword: "" });
    setShowPassword(false);
  }

  const isSignIn = mode === "signin";
  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true">
        {Array.from({ length: 6 }, (_, col) => (
          <div key={col} className="auth__bg-col">
            {Array.from({ length: 4 }, (_, row) => (
              <div key={row} className="auth__bg-cell" />
            ))}
          </div>
        ))}
      </div>

      <Link to="/" className="auth__back">← Back</Link>

      <div className="auth__card" key={mode}>
        <div className="auth__logo">Schedul<em>a</em></div>

        <div className="auth__heading">
          <h1 className="auth__title">
            {isSignIn && "Welcome back"}
            {isSignUp && "Create account"}
            {isForgot && "Reset password"}
          </h1>
          <p className="auth__sub">
            {isSignIn && "Sign in to your Schedula account."}
            {isSignUp && "Start organising your timetable."}
            {isForgot && "We'll send a reset link to your email."}
          </p>
        </div>

        {!isForgot && (
          <div className="auth__tabs">
            <button type="button" className={`auth__tab${isSignIn ? " auth__tab--active" : ""}`} onClick={() => switchMode("signin")}>Sign in</button>
            <button type="button" className={`auth__tab${isSignUp ? " auth__tab--active" : ""}`} onClick={() => switchMode("signup")}>Sign up</button>
          </div>
        )}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>

          {isSignUp && (
            <div className={`auth__field${errors.username ? " auth__field--error" : ""}`}>
              <label className="auth__label">Username</label>
              <input className="auth__input" type="text" name="username" value={form.username} onChange={handleChange} placeholder="username" autoComplete="username" autoFocus />
              {errors.username && <span className="auth__error">{errors.username}</span>}
            </div>
          )}

          <div className={`auth__field${errors.email ? " auth__field--error" : ""}`}>
            <label className="auth__label">Email</label>
            <input className="auth__input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" autoComplete="email" autoFocus={!isSignUp} />
            {errors.email && <span className="auth__error">{errors.email}</span>}
          </div>

          {!isForgot && (
            <div className={`auth__field${errors.password ? " auth__field--error" : ""}`}>
              <div className="auth__label-row">
                <label className="auth__label">Password</label>
                {isSignIn && <button type="button" className="auth__forgot-link" onClick={() => switchMode("forgot")}>Forgot password?</button>}
              </div>
              <div className="auth__input-wrap">
                <input className="auth__input" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder={isSignUp ? "At least 8 characters" : "Enter your password"} autoComplete={isSignUp ? "new-password" : "current-password"} />
                <button type="button" className="auth__eye" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && <span className="auth__error">{errors.password}</span>}
            </div>
          )}

          {isSignUp && (
            <div className={`auth__field${errors.confirmPassword ? " auth__field--error" : ""}`}>
              <label className="auth__label">Confirm password</label>
              <input className="auth__input" type={showPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" />
              {errors.confirmPassword && <span className="auth__error">{errors.confirmPassword}</span>}
            </div>
          )}

          {errors.form && (
            <div className="auth__field auth__field--error">
              <span className="auth__error">{errors.form}</span>
            </div>
          )}

          <button className={`auth__submit${loading ? " auth__submit--loading" : ""}`} type="submit" disabled={loading}>
            {loading ? <span className="auth__spinner" /> : (
              <>{isSignIn && "Sign in"}{isSignUp && "Create account"}{isForgot && "Send reset link"}</>
            )}
          </button>

        </form>

        <div className="auth__footer">
          {isForgot ? (
            <button type="button" className="auth__switch" onClick={() => switchMode("signin")}>← Back to sign in</button>
          ) : (
            <p className="auth__switch-text">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="auth__switch" onClick={() => switchMode(isSignIn ? "signup" : "signin")}>
                {isSignIn ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}