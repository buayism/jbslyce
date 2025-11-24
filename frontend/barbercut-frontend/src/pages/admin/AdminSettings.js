import React from 'react';

export default function AdminSettings() {
  return (
    <div>
      <h2 className="selection-title" style={{ marginTop: 0 }}>Settings</h2>
      <div className="card">
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); }}>
          <label>
            <span>Shop Name</span>
            <input type="text" placeholder="JB Slyce" />
          </label>
          <label>
            <span>Logo</span>
            <input type="file" disabled />
          </label>
          <label>
            <span>Working Hours</span>
            <input type="text" placeholder="Mon–Sat, 9:00–18:00" />
          </label>
          <label>
            <span>Contact Email</span>
            <input type="email" placeholder="contact@example.com" />
          </label>
          <div>
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
