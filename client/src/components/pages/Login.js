import React, { useState } from 'react';
import axios from 'axios';
import AuthForm from '../components/AuthForm';

export default function Login() {
  const [message, setMessage] = useState('');
  const handleLogin = async ({ email, password }) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setMessage('Login successful!');
      // Redirect or update UI as needed
    } catch (err) {
      setMessage('Login failed: ' + err.response.data.msg);
    }
  };
  return (
    <div>
      <h2>Login</h2>
      <AuthForm onSubmit={handleLogin} type="login" />
      <p>{message}</p>
    </div>
  );
}
