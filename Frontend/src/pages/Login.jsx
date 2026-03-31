// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import ThemeToggle from '../components/ThemeToggle';

// const EyeIcon = ({ open }) =>
//   open ? (
//     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
//     </svg>
//   ) : (
//     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//       <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
//       <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
//       <line x1="1" y1="1" x2="23" y2="23"/>
//     </svg>
//   );

// export default function Login() {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [showPass, setShowPass] = useState(false);
//   const [errors, setErrors] = useState({});

//   const validate = () => {
//     const e = {};
//     if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
//     if (!form.password) e.password = 'Password is required';
//     return e;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const errs = validate();
//     if (Object.keys(errs).length) { setErrors(errs); return; }
//     localStorage.setItem('user', 'true');
//     navigate('/planner');
//   };

//   const set = (field) => (e) => {
//     setForm(prev => ({ ...prev, [field]: e.target.value }));
//     if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
//   };

//   return (
//     <div className="auth-center">

//       <div className="auth-center-top">
//         <ThemeToggle />
//       </div>

//       <div className="auth-center-card">

//         {/* Logo */}
//         <div className="auth-center-brand">
//           <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
//             <circle cx="15" cy="15" r="15" fill="var(--accent-light)"/>
//             <path d="M15 6v18M9 10l6 3 6-3" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//           <span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
//             VITA-FLOW
//           </span>
//         </div>

//         <h2 className="auth-form-title" style={{ textAlign: 'center', marginBottom: 4 }}>Welcome back</h2>
//         <p className="auth-form-subtitle" style={{ textAlign: 'center', marginBottom: 28 }}>Sign in to your account to continue</p>

//         <form onSubmit={handleSubmit} className="auth-form-stack" noValidate>

//           {/* Email */}
//           <div className="form-field">
//             <label htmlFor="email">Email address</label>
//             <input
//               id="email"
//               className={`form-input${errors.email ? ' error' : ''}`}
//               type="email"
//               placeholder="jane@example.com"
//               autoComplete="email"
//               value={form.email}
//               onChange={set('email')}
//             />
//             {errors.email && <span style={{ fontSize: 12, color: 'var(--error)' }}>{errors.email}</span>}
//           </div>

//           {/* Password */}
//           <div className="form-field">
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//               <label htmlFor="password">Password</label>
//               <span className="link" style={{ fontSize: 12 }}>Forgot password?</span>
//             </div>
//             <div className="input-wrapper">
//               <input
//                 id="password"
//                 className={`form-input${errors.password ? ' error' : ''}`}
//                 type={showPass ? 'text' : 'password'}
//                 placeholder="Your password"
//                 autoComplete="current-password"
//                 value={form.password}
//                 onChange={set('password')}
//               />
//               <span className="input-icon-right" onClick={() => setShowPass(p => !p)}>
//                 <EyeIcon open={showPass} />
//               </span>
//             </div>
//             {errors.password && <span style={{ fontSize: 12, color: 'var(--error)' }}>{errors.password}</span>}
//           </div>

//           <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>
//             Sign in
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
//           </button>

//         </form>

//         <p className="auth-form-footer">
//           Don't have an account?{' '}
//           <Link to="/register" className="link">Create one</Link>
//         </p>

//       </div>
//     </div>
//   );
// }

// 1. Import your new apiClient at the top
import apiClient from '../api/apiClient'; 

// ... (Keep your EyeIcon and component definition the same)

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  // 2. Add a 'loading' state so the button shows progress
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  // 3. Make this function 'async'
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true); // Start loading
    try {
      // 4. Send the data to your backend
      const response = await apiClient.post('/api/auth/login', {
        email: form.email,
        password: form.password
      });

      // 5. Store the actual user/token from the backend
      // Assuming your backend returns { token: "...", user: {...} }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // 6. Navigate to your dashboard
      navigate('/planner');
    } catch (err) {
      // 7. Handle backend errors (e.g. "User not found")
      setErrors({ 
        form: err.response?.data?.message || 'Login failed. Please try again.' 
      });
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // ... (Inside your return statement, update the button)

  return (
    // ... same code as before until the form
    <form onSubmit={handleSubmit} className="auth-form-stack" noValidate>
      
      {/* 8. Add a generic error message display if login fails */}
      {errors.form && (
        <div style={{ color: 'var(--error)', textAlign: 'center', marginBottom: 10 }}>
          {errors.form}
        </div>
      )}

      {/* ... inputs stay the same ... */}

      <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
        {!loading && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        )}
      </button>
    </form>
  );
}