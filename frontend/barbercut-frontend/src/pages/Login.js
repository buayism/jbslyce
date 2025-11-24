import React from 'react';

function Login() {
  return (
    <div className="page container">
      <h1>Log In</h1>
      <form className="login-form">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" />
        </div>
        <button type="submit" className="btn btn-primary">Log In</button>
      </form>
    </div>
  );
}

export default Login;
