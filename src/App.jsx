import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';

const POPULAR_LOCATIONS = [
  "Greater Noida, Knowledge Park III",
  "Noida Sector 62",
  "Delhi, Connaught Place",
  "Delhi University, North Campus",
  "Gurugram, Cyber City",
  "Ghaziabad, Raj Nagar"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // Dashboard & Advanced Filters State
  const [circles, setCircles] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [radiusKm, setRadiusKm] = useState(10);
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // New Circle Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Computer Science & Python');
  const [level, setLevel] = useState('Beginner Friendly');
  const [location, setLocation] = useState('');
  const [isWomenOnly, setIsWomenOnly] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'study_circles'), orderBy('createdAt', 'desc'));
      const unsubscribeCircles = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCircles(list);
      }, (err) => {
        console.log("Firestore sync notice: Using offline demo state if rules restrict", err);
      });
      return () => unsubscribeCircles();
    } catch (e) {
      console.log(e);
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLocationInput = (val) => {
    setSearchLocation(val);
    if (val.trim().length > 0) {
      const filtered = POPULAR_LOCATIONS.filter(loc => loc.toLowerCase().includes(val.toLowerCase()));
      setLocationSuggestions(filtered);
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!title || !location) return;
    try {
      await addDoc(collection(db, 'study_circles'), {
        title,
        category,
        level,
        location,
        isWomenOnly,
        hostEmail: user.email,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setLocation('');
      setShowModal(false);
    } catch (err) {
      alert("Error creating circle: " + err.message);
    }
  };

  if (!user) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={{textAlign: 'center', marginBottom: '24px'}}>
            <h1 style={{color: '#4f46e5', fontSize: '28px', margin: '0 0 8px 0'}}>SkillMate</h1>
            <p style={{color: '#6b7280', fontSize: '14px'}}>AI-Powered Student Peer & Study Circle Portal</p>
          </div>
          
          <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div>
              <label style={styles.label}>Institutional Email</label>
              <input 
                type="email" 
                placeholder="student@college.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <button type="submit" style={styles.primaryButton}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{display: 'flex', alignItems: 'center', margin: '20px 0', color: '#9ca3af', fontSize: '12px'}}>
            <div style={{flex: 1, height: '1px', backgroundColor: '#e5e7eb'}}></div>
            <span style={{padding: '0 10px'}}>OR</span>
            <div style={{flex: 1, height: '1px', backgroundColor: '#e5e7eb'}}></div>
          </div>

          <button onClick={handleGoogleSignIn} style={styles.googleButton}>
            🔍 Continue with Google
          </button>

          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              style={styles.textButton}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredCircles = circles.filter(c => {
    if (womenOnlyFilter && !c.isWomenOnly) return false;
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (searchLocation && !c.location.toLowerCase().includes(searchLocation.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <div style={styles.avatar}>
            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{margin: 0, fontSize: '18px', color: '#1f2937'}}>SkillMate Hub</h2>
            <span style={{fontSize: '12px', color: '#10b981'}}>● Live Peer Sync Active</span>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <span style={{fontSize: '13px', color: '#4b5563', display: window.innerWidth < 600 ? 'none' : 'block'}}>{user.email}</span>
          <button onClick={() => signOut(auth)} style={styles.logoutButton}>Logout</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        
        {/* AI Smart Suggestion Banner */}
        <div style={styles.aiBanner}>
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <span style={{fontSize: '24px'}}>✨</span>
            <div>
              <h4 style={{margin: '0 0 4px 0', color: '#3730a3'}}>AI Skill Match Recommendation</h4>
              <p style={{margin: 0, fontSize: '13px', color: '#4338ca'}}>Based on your engineering & Python track, matching with 3 active data science study circles nearby.</p>
            </div>
          </div>
        </div>

        {/* Advanced Filter Toolbar */}
        <div style={styles.filterCard}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px'}}>
            
            {/* Smart Location Input with Autocomplete */}
            <div style={{position: 'relative'}}>
              <label style={styles.label}>Smart Location Search</label>
              <input 
                type="text" 
                placeholder="Type location (e.g. Greater Noida)..."
                value={searchLocation}
                onChange={(e) => handleLocationInput(e.target.value)}
                style={styles.input}
              />
              {locationSuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  {locationSuggestions.map((sug, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSearchLocation(sug); setLocationSuggestions([]); }}
                      style={styles.suggestionItem}
                    >
                      📍 {sug}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Radius Slider */}
            <div>
              <label style={styles.label}>Radius Range: <b>{radiusKm} km</b></label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={radiusKm} 
                onChange={(e) => setRadiusKm(e.target.value)}
                style={{width: '100%', marginTop: '8px', accentColor: '#4f46e5'}}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label style={styles.label}>Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={styles.input}
              >
                <option value="All">All Categories</option>
                <option value="Computer Science & Python">Computer Science & Python</option>
                <option value="Engineering Mathematics">Engineering Mathematics</option>
                <option value="Sustainable Cities & EVs">Sustainable Cities & EVs</option>
              </select>
            </div>
          </div>

          {/* Checkbox Filters */}
          <div style={{marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <input 
              type="checkbox" 
              id="womenFilter" 
              checked={womenOnlyFilter} 
              onChange={(e) => setWomenOnlyFilter(e.target.checked)}
              style={{width: '18px', height: '18px', accentColor: '#ec4899'}}
            />
            <label htmlFor="womenFilter" style={{fontSize: '14px', color: '#db2777', fontWeight: '600', cursor: 'pointer'}}>
              🛡️ Women-Only Study Circles / Safe Peer Groups
            </label>
          </div>
        </div>

        {/* Header & Host Action */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h3 style={{margin: 0, color: '#1f2937'}}>Live Cloud Study Circles ({filteredCircles.length})</h3>
          <button onClick={() => setShowModal(true)} style={styles.primaryButtonSmall}>
            + Host New Circle
          </button>
        </div>

        {/* Circles Grid */}
        {filteredCircles.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{margin: 0, color: '#6b7280'}}>No study circles found matching your location or filters. Host one now!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredCircles.map(circle => (
              <div key={circle.id} style={styles.circleCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <h4 style={{margin: '0 0 8px 0', color: '#111827', fontSize: '18px'}}>{circle.title}</h4>
                  {circle.isWomenOnly && <span style={styles.badgePink}>Women-Only</span>}
                </div>
                <div style={styles.tagBadge}>{circle.category}</div>
                <p style={{margin: '8px 0', fontSize: '13px', color: '#d97706'}}>⚡ {circle.level}</p>
                <p style={{margin: '4px 0', fontSize: '13px', color: '#4b5563'}}>📍 {circle.location}</p>
                <div style={{marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: '11px', color: '#9ca3af'}}>Host: {circle.hostEmail}</span>
                  <button style={styles.joinButton}>Join Circle</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Host New Circle Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{marginTop: 0, color: '#1f2937'}}>Host a New Study Circle</h3>
            <form onSubmit={handleCreateCircle} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div>
                <label style={styles.label}>Circle Title / Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. Python & ML Practical Prep" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.input}>
                  <option value="Computer Science & Python">Computer Science & Python</option>
                  <option value="Engineering Mathematics">Engineering Mathematics</option>
                  <option value="Sustainable Cities & EVs">Sustainable Cities & EVs</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Location / Meet Spot</label>
                <input 
                  type="text" 
                  placeholder="e.g. Greater Noida, Knowledge Park III Cafe" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  required 
                  style={styles.input}
                />
              </div>

              <div style={{display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0'}}>
                <input 
                  type="checkbox" 
                  id="modalWomenOnly" 
                  checked={isWomenOnly} 
                  onChange={(e) => setIsWomenOnly(e.target.checked)}
                  style={{width: '16px', height: '16px', accentColor: '#ec4899'}}
                />
                <label htmlFor="modalWomenOnly" style={{fontSize: '13px', color: '#db2777', fontWeight: '600'}}>
                  Mark as Women-Only Circle
                </label>
              </div>

              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="submit" style={styles.primaryButton}>Publish Circle</button>
                <button type="button" onClick={() => setShowModal(false)} style={styles.secondaryButton}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  authContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '16px'
  },
  authCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '400px'
  },
  dashboardContainer: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'sans-serif'
  },
  navbar: {
    backgroundColor: 'white',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  logoutButton: {
    padding: '6px 12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  mainContent: {
    padding: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  aiBanner: {
    backgroundColor: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px'
  },
  filterCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  primaryButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  googleButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  primaryButtonSmall: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  secondaryButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  textButton: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    cursor: 'pointer',
    fontSize: '13px'
  },
  errorBox: {
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '13px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  circleCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  tagBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    width: 'fit-content'
  },
  badgePink: {
    padding: '2px 8px',
    backgroundColor: '#fce7f3',
    color: '#db2777',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '700'
  },
  joinButton: {
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  emptyState: {
    backgroundColor: 'white',
    padding: '40px',
    textAlign: 'center',
    borderRadius: '10px',
    border: '1px dashed #d1d5db'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '450px'
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10
  },
  suggestionItem: {
    padding: '10px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6'
  }
};
