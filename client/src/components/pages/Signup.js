import React, { useState } from 'react';
import axios from 'axios';
import AuthForm from '../components/AuthForm';

export default function Signup() {
  const [message, setMessage] = useState('');
  const handleSignup = async ({ email, password }) => {
    try {
      await axios.post('http://localhost:5000/api/auth/signup', { email, password });
      setMessage('Signup successful. You can now login.');
    } catch (err) {
      setMessage('Signup failed: ' + err.response.data.msg);
    }
  };
  return (
    <div>
      <h2>Sign Up</h2>
      <AuthForm onSubmit={handleSignup} type="signup" />
      <p>{message}</p>
    </div>
  );
}
