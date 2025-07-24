import React, { useState } from 'react';

export default function AuthForm({ onSubmit, type }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ email, password }); }}>
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button type="submit">{type === 'login' ? 'Login' : 'Sign Up'}</button>
    </form>
  );
}
