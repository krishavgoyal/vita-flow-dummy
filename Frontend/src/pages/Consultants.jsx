import React, { useState, useEffect, useMemo } from 'react';
import { getConsultants } from '../api/apiClient';

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: 'rgba(16,185,129,0.15)', text: '#059669' },
  { bg: 'rgba(30,64,175,0.15)',  text: '#1E40AF' },
  { bg: 'rgba(124,58,237,0.15)', text: '#7C3AED' },
  { bg: 'rgba(217,119,6,0.15)', text: '#D97706' },
];

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─────────────────────────────────────────────
   BOOKING MODAL
───────────────────────────────────────────── */
function BookingModal({ consultant, onClose }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const availableDays = (() => {
    const d = consultant.available_days.toLowerCase();
    if (d.includes('monday to friday'))   return ['Mon','Tue','Wed','Thu','Fri'];
    if (d.includes('monday to saturday')) return ['Mon','Tue','Wed','Thu','Fri','Sat'];
    if (d.includes('monday, wednesday'))  return ['Mon','Wed','Fri'];
    if (d.includes('tuesday, thursday'))  return ['Tue','Thu','Sat'];
    return DAYS;
  })();

  const timeSlots = (() => {
    const raw = consultant.available_time.replace(/\./g, '').toUpperCase();
    const match = raw.match(/(\d+)(AM|PM)\s*-\s*(\d+)(AM|PM)/);
    if (!match) return [];
    let [, sh, sp, eh, ep] = match;
    let start = parseInt(sh) + (sp === 'PM' && sh !== '12' ? 12 : 0);
    let end   = parseInt(eh) + (ep === 'PM' && eh !== '12' ? 12 : 0);
    const slots = [];
    for (let h = start; h < end; h++) {
      const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
      slots.push(label);
    }
    return slots;
  })();

  const canBook = selectedDay && selectedTime;
  const handleBook = () => { if (!canBook) return; setSuccess(true); };
  const col = AVATAR_COLORS[(consultant.idx ?? 0) % AVATAR_COLORS.length];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose}><XIcon /></button>

        {success ? (
          <div className="success-state">
            <div className="success-icon"><CheckIcon /></div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Booking confirmed!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Session with <strong>{consultant.name}</strong> on{' '}
                <strong>{selectedDay}</strong> at <strong>{selectedTime}</strong>.<br />
                Confirmation sent to {consultant.email}.
              </div>
            </div>
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div className="cons-avatar" style={{ width: 52, height: 52, fontSize: 18, background: col.bg, color: col.text }}>
                {initials(consultant.name)}
              </div>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>Book a session</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {consultant.name} · {consultant.specialization}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  ₹{consultant.charges} / session · {consultant.location}
                </div>
              </div>
            </div>

            <div className="modal-section-label" style={{ marginTop: 0 }}>Select a day</div>
            <div className="day-pills">
              {DAYS.map(d => {
                const available = availableDays.includes(d);
                return (
                  <button
                    key={d}
                    className={`day-pill${selectedDay === d ? ' active' : ''}${!available ? ' disabled' : ''}`}
                    style={!available ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                    onClick={() => available && setSelectedDay(d)}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <div className="modal-section-label">Select a time slot</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {timeSlots.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: '1.5px solid',
                    borderColor: selectedTime === t ? 'var(--accent)' : 'var(--border-default)',
                    background: selectedTime === t ? 'var(--accent)' : 'transparent',
                    color: selectedTime === t ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 150ms',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="modal-section-label">Note for the consultant (optional)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. I want to discuss my meal plan and weight loss goal…"
              rows={3}
              style={{
                width: '100%', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-default)',
                background: 'var(--bg-input)', color: 'var(--text-primary)',
                padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-body)',
                outline: 'none', resize: 'vertical', transition: 'border-color 200ms',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />

            <button
              className="btn-primary"
              style={{ marginTop: 20, opacity: canBook ? 1 : 0.45, cursor: canBook ? 'pointer' : 'not-allowed' }}
              onClick={handleBook}
              disabled={!canBook}
            >
              Confirm booking · ₹{consultant.charges}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONSULTANT CARD
───────────────────────────────────────────── */
function ConsultantCard({ consultant, index, onBook }) {
  const col = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className="cons-card">
      <div className="cons-card-top">
        <div className="cons-avatar" style={{ background: col.bg, color: col.text }}>
          {initials(consultant.name)}
        </div>
        <div>
          <div className="cons-name">{consultant.name}</div>
          <div className={`cons-spec ${consultant.specialization}`}>{consultant.specialization}</div>
        </div>
      </div>

      <div className="cons-info-list">
        <div className="cons-info-row"><LocationIcon /><span>{consultant.location}</span></div>
        <div className="cons-info-row"><ClockIcon /><span>{consultant.available_time}</span></div>
        <div className="cons-info-row"><CalendarIcon /><span>{consultant.available_days}</span></div>
        <div className="cons-info-row"><PhoneIcon /><span>{consultant.contact_no}</span></div>
      </div>

      <div>
        <div className="cons-charge-label">Consultation fee</div>
        <div className="cons-charge">₹{consultant.charges}</div>
      </div>

      <div className="cons-card-footer">
        <button className="btn-sm-ghost" onClick={() => window.open(`mailto:${consultant.email}`)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Email
        </button>
        <button className="btn-sm-primary" onClick={() => onBook({ ...consultant, idx: index })}>
          <CalendarIcon />
          Book session
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Consultants() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [booking, setBooking] = useState(null);

  const tabs = ['All', 'Dietician', 'Physician'];

  // ── Fetch from real backend ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getConsultants();
        setConsultants(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load consultants.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return consultants.filter(c => {
      const matchSpec = filter === 'All' || c.specialization === filter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.specialization.toLowerCase().includes(q);
      return matchSpec && matchSearch;
    });
  }, [consultants, filter, search]);

  // ── Loading state ──
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: 'var(--text-muted)', fontSize: 15 }}>
      Loading consultants...
    </div>
  );

  // ── Error state ──
  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: 'var(--error)', fontSize: 15 }}>
      {error}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Consultants</div>
          <div className="page-subtitle">Book a session with a specialist — diet or fitness</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {filtered.length} consultant{filtered.length !== 1 ? 's' : ''} available
        </div>
      </div>

      <div className="page-body">
        <div className="cons-header">
          <div className="filter-tabs">
            {tabs.map(t => (
              <button key={t} className={`filter-tab${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="cons-search-wrap">
            <span className="cons-search-icon"><SearchIcon /></span>
            <input
              className="cons-search"
              type="text"
              placeholder="Search by name, city or specialty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="cons-grid">
            {filtered.map((c, index) => (
              <ConsultantCard key={c.cons_id} consultant={c} index={index} onBook={setBooking} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span style={{ fontSize: 36 }}>🔍</span>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>No consultants found</div>
            <div style={{ fontSize: 13 }}>Try a different filter or search term</div>
          </div>
        )}
      </div>

      {booking && (
        <BookingModal consultant={booking} onClose={() => setBooking(null)} />
      )}
    </>
  );
}
