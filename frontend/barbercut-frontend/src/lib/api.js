const ENV_API = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ? process.env.REACT_APP_API_BASE : null;
export const API_BASE = ENV_API || ((typeof window !== 'undefined' && window.location && window.location.hostname)
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : 'http://localhost:8080');

export async function createReservation({ barberId, clientId, slotISO, notes = '', serviceName, serviceDurationMinutes }) {
  const res = await fetch(`${API_BASE}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barberId, clientId, slot: slotISO, notes, serviceName, serviceDurationMinutes })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create reservation');
  }
  return res.json();
}

export async function getBarberRatingSummary(barberId) {
  const res = await fetch(`${API_BASE}/api/barbers/${encodeURIComponent(barberId)}/rating-summary`);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to load rating summary');
  }
  return res.json();
}

export async function getClientReservations(clientId) {
  const res = await fetch(`${API_BASE}/api/reservations/client/${clientId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch reservations');
  }
  return res.json();
}

export async function cancelReservation(reservationId) {
  const res = await fetch(`${API_BASE}/api/reservations/${reservationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error('Failed to cancel reservation');
  }
  return true;
}

export async function getPendingReservationsForBarber(barberId) {
  const res = await fetch(`${API_BASE}/api/reservations/barber/${barberId}/pending`);
  if (!res.ok) {
    throw new Error('Failed to fetch pending reservations');
  }
  return res.json();
}

export async function updateReservationStatus(reservationId, status) {
  const res = await fetch(`${API_BASE}/api/reservations/${reservationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to update status');
  }
  return res.json();
}

export async function createSlot({ barberId, startISO, durationMinutes }) {
  const res = await fetch(`${API_BASE}/api/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barberId, startISO, durationMinutes })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to create slot');
  }
  return res.json();
}

export async function getSlotsForBarber(barberId) {
  const res = await fetch(`${API_BASE}/api/slots/barber/${barberId}`);
  if (!res.ok) {
    throw new Error('Failed to load slots');
  }
  return res.json();
}

export async function getReservationsForBarberAll(barberId) {
  const res = await fetch(`${API_BASE}/api/reservations/barber/${barberId}/all`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to load reservations');
  }
  return res.json();
}

export async function getReservationsForBarberAllMerged(barberId) {
  const urlMerged = `${API_BASE}/api/reservations/barber/${barberId}/all-merged`;
  let res = await fetch(urlMerged);
  if (res.status === 404) {
    // Fallback to legacy endpoint if merged is not available yet
    const urlAll = `${API_BASE}/api/reservations/barber/${barberId}/all`;
    res = await fetch(urlAll);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to load reservations');
  }
  return res.json();
}

export async function getBarbers() {
  const res = await fetch(`${API_BASE}/api/users/barbers`);
  if (!res.ok) {
    throw new Error('Failed to load barbers');
  }
  return res.json();
}

export async function getUser(id) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to load user');
  }
  return res.json();
}

export async function updateUserProfile(id, { bio, avatarUrl }) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(id)}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio, avatarUrl })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to update profile');
  }
  return res.json();
}

export async function uploadUserAvatar(id, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(id)}/avatar`, {
    method: 'POST',
    body: fd
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to upload avatar');
  }
  return res.json();
}

export async function deleteSlot(slotId) {
  const res = await fetch(`${API_BASE}/api/slots/${encodeURIComponent(slotId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to delete slot');
  }
  // Backend returns plain text, not JSON
  const text = await res.text();
  return { message: text };
}

export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  // treat as server relative
  return `${API_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

// Ratings
export async function getBarberAverageRating(barberId) {
  const res = await fetch(`${API_BASE}/api/ratings/barber/${encodeURIComponent(barberId)}/average`);
  if (!res.ok) {
    throw new Error('Failed to load rating');
  }
  return res.json(); // { barberId, average, count }
}

export async function createRating({ barberId, clientId, reservationId, rating, feedback }) {
  const res = await fetch(`${API_BASE}/api/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barberId, clientId, reservationId, rating, feedback })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to submit rating');
  }
  return res.json();
}

export async function getMyRatingForReservation(reservationId, clientId) {
  const res = await fetch(`${API_BASE}/api/ratings/reservation/${encodeURIComponent(reservationId)}/mine?clientId=${encodeURIComponent(clientId)}`);
  if (res.status === 204) return null;
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to check rating');
  }
  return res.json();
}

export async function getRatingsForBarber(barberId) {
  const res = await fetch(`${API_BASE}/api/ratings/barber/${encodeURIComponent(barberId)}`);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to load ratings');
  }
  return res.json();
}

export async function getRatingsForClient(clientId) {
  const res = await fetch(`${API_BASE}/api/ratings/client/${encodeURIComponent(clientId)}`);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to load reviews');
  }
  return res.json();
}

export async function submitBarberReply(ratingId, reply) {
  const res = await fetch(`${API_BASE}/api/ratings/${encodeURIComponent(ratingId)}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || 'Failed to submit reply');
  }
  return res.json();
}
