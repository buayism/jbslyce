import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUser, updateUserProfile, uploadUserAvatar, mediaUrl, getBarberAverageRating, getRatingsForBarber, submitBarberReply } from '../../lib/api';

function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ bio: '', avatarUrl: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avg, setAvg] = useState({ average: 0, count: 0 });
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [replyEdit, setReplyEdit] = useState({}); // ratingId -> reply text
  const [replySubmitting, setReplySubmitting] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setErr('');
        const data = await getUser(user.id || user.username);
        setProfile({ bio: data.bio || '', avatarUrl: data.avatarUrl || '' });
      } catch (e) {
        setErr(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const loadRatings = async () => {
      if (!user?.barberId) return;
      try {
        setLoadingRatings(true);
        const [a, list] = await Promise.all([
          getBarberAverageRating(user.barberId),
          getRatingsForBarber(user.barberId)
        ]);
        setAvg(a || { average: 0, count: 0 });
        setRatings(Array.isArray(list) ? list : []);
      } catch {
        // non-fatal; keep empty
      } finally {
        setLoadingRatings(false);
      }
    };
    loadRatings();
  }, [user?.barberId]);

  const onUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !user) return;
    try {
      setSaving(true);
      setErr('');
      setMsg('');
      const data = await uploadUserAvatar(user.id || user.username, file);
      setProfile(p => ({ ...p, avatarUrl: data.avatarUrl || p.avatarUrl }));
      setAvatarVersion(v => v + 1);
      setMsg('Avatar updated');
    } catch (ex) {
      setErr(ex.message || 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setErr('');
      setMsg('');
      await updateUserProfile(user.id || user.username, {
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      });
      setMsg('Profile saved');
    } catch (ex) {
      setErr(ex.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : '';

  const handleReplySubmit = async (ratingId, replyText) => {
    try {
      setReplySubmitting({ ...replySubmitting, [ratingId]: true });
      await submitBarberReply(ratingId, replyText);
      // Update local state
      setRatings(ratings.map(r => r.id === ratingId ? { ...r, reply: replyText } : r));
      const copy = { ...replyEdit };
      delete copy[ratingId];
      setReplyEdit(copy);
    } catch (e) {
      alert(e.message || 'Failed to submit reply');
    } finally {
      setReplySubmitting({ ...replySubmitting, [ratingId]: false });
    }
  };

  return (
    <div className="bc-container" style={{ maxWidth: 760, margin: '24px auto' }}>
      {loading ? (
        <p className="muted">Loading profile…</p>
      ) : (
        <div className="panel" style={{ paddingTop: 32, paddingBottom: 32, textAlign: 'center' }}>
          {/* Avatar circle with overlay upload button */}
          <div style={{ position: 'relative', width: 160, height: 160, borderRadius: '50%', margin: '0 auto', background: 'var(--color-surface-2)', backgroundImage: profile.avatarUrl ? `url(${mediaUrl(profile.avatarUrl)}?v=${avatarVersion})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--color-border)' }}>
            <label htmlFor="avatarInput" style={{ position: 'absolute', right: 6, bottom: 6, width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <span role="img" aria-label="upload" style={{ color: 'var(--color-brand-600)' }}>📷</span>
            </label>
            <input id="avatarInput" type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
          </div>

          {/* Name */}
          <h2 style={{ marginTop: 16 }}>{displayName}</h2>

          {/* Bio with small pencil edit + save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            <input
              type="text"
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              placeholder="Add your bio"
              style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', minWidth: 260, textAlign: 'center' }}
            />
            <button className="btn btn-secondary sm" onClick={onSave} disabled={saving} title="Save">
              ✏️
            </button>
          </div>

          {err && <div className="auth-error" style={{ marginTop: 12 }}>{err}</div>}
          {msg && <div className="auth-success" style={{ marginTop: 12 }}>{msg}</div>}

          {/* Average rating */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 700, color: '#facc15', fontSize: 18 }}>{(avg.average || 0).toFixed(1)} ⭐ <span className="muted" style={{ fontWeight: 400, color: '#9ca3af' }}>based on {avg.count || 0} reviews</span></div>
          </div>
        </div>
      )}
      {/* Ratings list */}
      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Recent Reviews</h3>
        {loadingRatings ? (
          <p className="muted">Loading reviews…</p>
        ) : ratings.length === 0 ? (
          <p className="muted">No reviews yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {ratings.map((r, idx) => (
              <div key={idx} style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', borderRadius: 12, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <Stars value={r.rating} />
                    <span className="muted" style={{ fontWeight: 400 }}>| by {formatName(r.clientName)}</span>
                  </div>
                  <div className="muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</div>
                </div>
                {r.feedback && (
                  <div style={{ marginTop: 8, fontStyle: 'italic', color: '#d1d5db' }}>
                    “{r.feedback}”
                  </div>
                )}
                {/* Barber Reply Section */}
                <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #3b82f6' }}>
                  {r.reply && replyEdit[r.id] === undefined ? (
                    <div>
                      <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>→ Your reply:</div>
                      <div style={{ color: '#e5e7eb' }}>{r.reply}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button className="btn btn-secondary sm" onClick={() => setReplyEdit({ ...replyEdit, [r.id]: r.reply })}>Edit</button>
                        <button className="btn btn-secondary sm" onClick={() => handleReplySubmit(r.id, '')}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>→ Reply to {formatName(r.clientName)}:</div>
                      <textarea
                        rows={3}
                        placeholder="Write your reply..."
                        value={replyEdit[r.id] !== undefined ? replyEdit[r.id] : ''}
                        onChange={(e) => setReplyEdit({ ...replyEdit, [r.id]: e.target.value })}
                        style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-ink)', padding: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button className="btn btn-primary sm" onClick={() => handleReplySubmit(r.id, replyEdit[r.id])} disabled={replySubmitting[r.id]}>
                          {replySubmitting[r.id] ? 'Saving...' : 'Submit'}
                        </button>
                        {r.reply && (
                          <button className="btn btn-secondary sm" onClick={() => { const copy = { ...replyEdit }; delete copy[r.id]; setReplyEdit(copy); }}>Cancel</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let ch = '☆';
    if (i <= full) ch = '★';
    else if (i === full + 1 && hasHalf) ch = '★';
    stars.push(<span key={i} style={{ color: '#facc15', fontSize: 16 }}>{ch}</span>);
  }
  return <span>{stars}</span>;
}

function formatName(name) {
  if (!name) return 'Anonymous';
  if (name.length <= 1) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default MyProfile;
