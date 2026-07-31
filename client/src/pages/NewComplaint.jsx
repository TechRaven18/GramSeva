import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { locationAPI, complaintAPI } from '../services/api';
import { Upload, Sparkles, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const CIVIC_CATEGORIES = [
  'Damaged Electric Pole / Wire Hazard',
  'Open Manhole',
  'Drainage & Sanitation Overflow',
  'Damaged Road / Pothole',
  'Non-functional Tube Well / Water Supply',
  'Streetlight / Electrical Failure',
  'Garbage Accumulation',
  'Other'
];

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Location State
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [panchayats, setPanchayats] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState(user?.address?.district || '');
  const [selectedBlock, setSelectedBlock] = useState(user?.address?.block || '');
  const [selectedPanchayat, setSelectedPanchayat] = useState(user?.address?.panchayat || '');
  const [selectedVillage, setSelectedVillage] = useState(user?.address?.village || '');
  const [landmark, setLandmark] = useState(user?.address?.landmark || '');
  const [category, setCategory] = useState(''); // Default empty for optional AI auto-detection
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    locationAPI.getDistricts().then(res => {
      setDistricts(res.districts || []);
      if (user?.address?.district) {
        locationAPI.getBlocks(user.address.district).then(bRes => {
          setBlocks(bRes.blocks || []);
          if (user?.address?.block) {
            locationAPI.getPanchayats(user.address.district, user.address.block).then(pRes => {
              setPanchayats(pRes.panchayats || []);
              const matched = (pRes.panchayats || []).find(p => p.panchayat === user.address.panchayat);
              if (matched) setVillages(matched.villages || []);
            });
          }
        });
      }
    }).catch(err => console.error(err));
  }, [user]);

  const handleDistrictChange = async (e) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    setSelectedBlock('');
    setSelectedPanchayat('');
    setSelectedVillage('');
    setBlocks([]); setPanchayats([]); setVillages([]);
    if (dist) {
      const res = await locationAPI.getBlocks(dist);
      setBlocks(res.blocks || []);
    }
  };

  const handleBlockChange = async (e) => {
    const blk = e.target.value;
    setSelectedBlock(blk);
    setSelectedPanchayat('');
    setSelectedVillage('');
    setPanchayats([]); setVillages([]);
    if (selectedDistrict && blk) {
      const res = await locationAPI.getPanchayats(selectedDistrict, blk);
      setPanchayats(res.panchayats || []);
    }
  };

  const handlePanchayatChange = async (e) => {
    const panchayatName = e.target.value;
    setSelectedPanchayat(panchayatName);
    setSelectedVillage('');
    setVillages([]);
    const matchedJur = panchayats.find(p => p.panchayat === panchayatName);
    if (matchedJur) {
      setVillages(matchedJur.villages || []);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('district', selectedDistrict);
      formData.append('block', selectedBlock);
      formData.append('panchayat', selectedPanchayat);
      formData.append('village', selectedVillage);
      formData.append('landmark', landmark);
      
      // Determine category payload
      let finalCategory = category;
      if (category === 'Other' && customCategory.trim()) {
        finalCategory = customCategory.trim();
      } else if (!category) {
        finalCategory = 'AUTO_DETECT';
      }

      formData.append('category', finalCategory);
      formData.append('description', description);

      if (imageFiles.length > 0) {
        imageFiles.forEach(file => formData.append('images', file));
      }

      const res = await complaintAPI.createComplaint(formData);
      navigate(`/complaint/${res.complaint._id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="app-container" style={{ maxWidth: '800px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.6rem', borderRadius: '12px' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', color: '#004071', fontWeight: '800' }}>File Civic Complaint</h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>
                Your report will be automatically routed directly to your local Panchayat authority.
              </p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', margin: '1.25rem 0', fontWeight: '600' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            {/* Location Hierarchy Box */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: '800', color: '#004071', fontSize: '1rem', marginBottom: '1rem' }}>
                📍 Problem Jurisdiction Location
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <select className="form-select" value={selectedDistrict} onChange={handleDistrictChange} required>
                    <option value="">Select District</option>
                    {districts.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Block *</label>
                  <select className="form-select" value={selectedBlock} onChange={handleBlockChange} disabled={!selectedDistrict} required>
                    <option value="">Select Block</option>
                    {blocks.map((b, i) => <option key={i} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Panchayat / Municipality *</label>
                  <select className="form-select" value={selectedPanchayat} onChange={handlePanchayatChange} disabled={!selectedBlock} required>
                    <option value="">Select Panchayat</option>
                    {panchayats.map((p, i) => <option key={i} value={p.panchayat}>{p.panchayat}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Village / Locality *</label>
                  <select className="form-select" value={selectedVillage} onChange={(e) => setSelectedVillage(e.target.value)} disabled={!selectedPanchayat} required>
                    <option value="">Select Village</option>
                    {villages.map((v, i) => <option key={i} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Exact Landmark / Location Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Near Community Center, opposite electric pole #42"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Problem Details */}
            <div className="form-group">
              <label className="form-label">
                Problem Category *
              </label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">-- Select Problem Category --</option>
                {CIVIC_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Custom Category Text Box if "Other" is selected */}
            {category === 'Other' && (
              <div className="form-group" style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                <label className="form-label" style={{ color: '#0369a1', fontWeight: '700' }}>Specify Your Problem / Issue:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Describe your specific problem (e.g. Damaged Culvert Bridge, Stray Cattle Hazard, Mud Blockage)..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Problem Description *</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Describe the condition, scale, and hazard risk clearly..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Photo Upload */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '800', color: '#004071' }}>Upload Complaint Evidence Photo(s)</label>
              <div style={{
                border: '2px dashed #cbd5e1',
                padding: '1.75rem 1.5rem',
                borderRadius: '12px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}>
                <Upload size={36} color="#0284c7" style={{ marginBottom: '0.5rem' }} />
                <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.95rem' }}>
                  Click below to select evidence photos from your device
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: '500' }}>
                  Supports JPG, PNG, WEBP formats (Max 3 photos).
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="complaint-image-input"
                />
                <label htmlFor="complaint-image-input" className="btn" style={{ marginTop: '1rem', cursor: 'pointer', background: '#004071', color: '#ffffff', fontWeight: '700', padding: '0.55rem 1.25rem', borderRadius: '6px' }}>
                  📸 Choose Photo Files
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} alt="Preview" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #0284c7', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn" style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', background: 'linear-gradient(135deg, #004071 0%, #0284c7 100%)', color: '#ffffff', fontWeight: '700', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 64, 113, 0.25)' }} disabled={loading}>
              {loading ? 'Submitting & Registering Complaint...' : 'Submit Complaint to Local Panchayat Authority'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
