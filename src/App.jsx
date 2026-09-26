import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [circles, setCircles] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Computer Science & Python');
  const [location, setLocation] = useState('');
  const [isWomenOnly, setIsWomenOnly] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'study_circles'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setCircles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setError(err.message); }
  };

  const handleGoogle = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { setError(err.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !location) return;
    await addDoc(collection(db, 'study_circles'), {
      title, category, location, isWomenOnly, hostEmail: user.email, createdAt: serverTimestamp()
    });
    setTitle(''); setLocation(''); setShowModal(false);
  };

  if (!user) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#f3f4f6',padding:'16px',fontFamily:'sans-serif'}}>
        <div style={{background:'white',padding:'32px',borderRadius:'12px',width:'100%',maxWidth:'400px',boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
          <h2 style={{color:'#4f46e5',textAlign:'center',marginTop:0}}>SkillMate</h2>
          <p style={{color:'#6b7280',fontSize:'13px',textAlign:'center',marginBottom:'20px'}}>Student Peer Learning Portal</p>
          <form onSubmit={handleAuth} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{padding:'10px',borderRadius:'6px',border:'1px solid #d1d5db'}} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{padding:'10px',borderRadius:'6px',border:'1px solid #d1d5db'}} />
            {error && <div style={{color:'red',fontSize:'12px'}}>{error}</div>}
            <button type="submit" style={{padding:'10px',background:'#4f46e5',color:'white',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>{isSignUp ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <button onClick={handleGoogle} style={{width:'100%',padding:'10px',marginTop:'12px',background:'white',color:'#374151',border:'1px solid #d1d5db',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>Continue with Google</button>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{background:'none',border:'none',color:'#4f46e5',marginTop:'16px',cursor:'pointer',width:'100%',fontSize:'13px'}}>{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</button>
        </div>
      </div>
    );
  }

  const filtered = circles.filter(c => {
    if (womenOnlyFilter && !c.isWomenOnly) return false;
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (searchLocation && !c.location.toLowerCase().includes(searchLocation.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:'sans-serif'}}>
      <header style={{background:'white',padding:'12px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #e5e7eb'}}>
        <h3 style={{margin:0,color:'#4f46e5'}}>SkillMate Hub</h3>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'13px',color:'#4b5563'}}>{user.email}</span>
          <button onClick={() => signOut(auth)} style={{padding:'6px 12px',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>Logout</button>
        </div>
      </header>
      <div style={{padding:'20px',maxWidth:'1000px',margin:'0 auto'}}>
        <div style={{background:'white',padding:'16px',borderRadius:'8px',marginBottom:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px'}}>
            <input type="text" placeholder="Search Location..." value={searchLocation} onChange={e => setSearchLocation(e.target.value)} style={{padding:'8px',borderRadius:'4px',border:'1px solid #d1d5db'}} />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{padding:'8px',borderRadius:'4px',border:'1px solid #d1d5db'}}>
              <option value="All">All Categories</option>
              <option value="Computer Science & Python">Computer Science & Python</option>
              <option value="Engineering Mathematics">Engineering Mathematics</option>
              <option value="Sustainable Cities & EVs">Sustainable Cities & EVs</option>
            </select>
          </div>
          <div style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
            <input type="checkbox" id="wom" checked={womenOnlyFilter} onChange={e => setWomenOnlyFilter(e.target.checked)} />
            <label htmlFor="wom" style={{color:'#db2777',fontWeight:'bold',fontSize:'13px',cursor:'pointer'}}>🛡️ Women-Only Study Circles Only</label>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h4 style={{margin:0}}>Study Circles ({filtered.length})</h4>
          <button onClick={() => setShowModal(true)} style={{padding:'8px 16px',background:'#4f46e5',color:'white',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>+ Host Circle</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'16px'}}>
          {filtered.map(c => (
            <div key={c.id} style={{background:'white',padding:'16px',borderRadius:'8px',border:'1px solid #e5e7eb',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <h4 style={{margin:'0 0 8px 0'}}>{c.title}</h4>
                {c.isWomenOnly && <span style={{background:'#fce7f3',color:'#db2777',padding:'2px 6px',borderRadius:'10px',fontSize:'10px',fontWeight:'bold'}}>Women-Only</span>}
              </div>
              <span style={{background:'#f3f4f6',padding:'2px 6px',borderRadius:'4px',fontSize:'11px'}}>{c.category}</span>
              <p style={{margin:'8px 0 4px 0',fontSize:'13px',color:'#4b5563'}}>📍 {c.location}</p>
              <span style={{fontSize:'11px',color:'#9ca3af'}}>Host: {c.hostEmail}</span>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',padding:'16px',zIndex:1000}}>
          <div style={{background:'white',padding:'24px',borderRadius:'8px',width:'100%',maxWidth:'400px'}}>
            <h3 style={{marginTop:0}}>Host Study Circle</h3>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <input type="text" placeholder="Title (e.g. Python Group)" value={title} onChange={e => setTitle(e.target.value)} required style={{padding:'8px',borderRadius:'4px',border:'1px solid #d1d5db'}} />
              <select value={category} onChange={e => setCategory(e.target.value)} style={{padding:'8px',borderRadius:'4px',border:'1px solid #d1d5db'}}>
                <option value="Computer Science & Python">Computer Science & Python</option>
                <option value="Engineering Mathematics">Engineering Mathematics</option>
                <option value="Sustainable Cities & EVs">Sustainable Cities & EVs</option>
              </select>
              <input type="text" placeholder="Location (e.g. Greater Noida)" value={location} onChange={e => setLocation(e.target.value)} required style={{padding:'8px',borderRadius:'4px',border:'1px solid #d1d5db'}} />
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input type="checkbox" id="modWom" checked={isWomenOnly} onChange={e => setIsWomenOnly(e.target.checked)} />
                <label htmlFor="modWom" style={{color:'#db2777',fontSize:'13px',fontWeight:'bold',cursor:'pointer'}}>Mark as Women-Only</label>
              </div>
              <button type="submit" style={{padding:'10px',background:'#4f46e5',color:'white',border:'none',borderRadius:'6px',fontWeight:'bold',cursor:'pointer'}}>Publish</button>
              <button type="button" onClick={() => setShowModal(false)} style={{padding:'8px',background:'#e5e7eb',border:'none',borderRadius:'6px',cursor:'pointer'}}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
