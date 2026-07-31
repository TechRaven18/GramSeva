const API_HOST = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5002' : 
  (window.location.hostname.includes('onrender.com') ? `https://${window.location.hostname.replace('frontend', 'backend')}` : ''));
const API_BASE = `${API_HOST}/api`;

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('panchayat_token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  let data = {};
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { message: text };
    }
  }
  if (!res.ok) {
    throw new Error(data.message || `Server request failed with status ${res.status}`);
  }
  return data;
};

export const authAPI = {
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },
  sendRegistrationOTP: async (data) => {
    const res = await fetch(`${API_BASE}/auth/send-registration-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  verifyRegistrationOTP: async (data) => {
    const res = await fetch(`${API_BASE}/auth/verify-registration-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  completeRegistration: async (data) => {
    const res = await fetch(`${API_BASE}/auth/complete-registration`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  sendLoginOTP: async (data) => {
    const res = await fetch(`${API_BASE}/auth/send-login-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  loginWithOTP: async (data) => {
    const res = await fetch(`${API_BASE}/auth/login-with-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  forgotPassword: async (data) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  resetPasswordWithOTP: async (data) => {
    const res = await fetch(`${API_BASE}/auth/reset-password-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  changePassword: async (data) => {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

export const locationAPI = {
  getDistricts: async () => {
    const res = await fetch(`${API_BASE}/locations/districts`);
    return handleResponse(res);
  },
  getBlocks: async (district) => {
    const res = await fetch(`${API_BASE}/locations/blocks?district=${encodeURIComponent(district)}`);
    return handleResponse(res);
  },
  getPanchayats: async (district, block) => {
    const res = await fetch(`${API_BASE}/locations/panchayats?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`);
    return handleResponse(res);
  },
  getVillages: async (jurisdictionId) => {
    const res = await fetch(`${API_BASE}/locations/villages?jurisdictionId=${jurisdictionId}`);
    return handleResponse(res);
  },
  getAllJurisdictions: async () => {
    const res = await fetch(`${API_BASE}/locations/all`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getTopPanchayats: async () => {
    const res = await fetch(`${API_BASE}/locations/top-panchayats`);
    return handleResponse(res);
  }
};

export const complaintAPI = {
  createComplaint: async (formData) => {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  },
  getMyComplaints: async (status = 'ALL') => {
    const res = await fetch(`${API_BASE}/complaints/my?status=${status}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getStaffQueue: async (status = 'ALL', category = 'ALL') => {
    const res = await fetch(`${API_BASE}/complaints/staff-queue?status=${status}&category=${category}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getDetails: async (id) => {
    const res = await fetch(`${API_BASE}/complaints/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateStatus: async (id, data) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  overridePriority: async (id, data) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/priority-override`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getFlaggedComplaints: async () => {
    const res = await fetch(`${API_BASE}/complaints/flagged`, { headers: getHeaders() });
    return handleResponse(res);
  },
  reviewFraudComplaint: async (id, data) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/fraud-review`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  addComment: async (id, formData) => {
    const res = await fetch(`${API_BASE}/complaints/${id}/comments`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(res);
  }
};

export const rewardAPI = {
  getPartnerShops: async () => {
    const res = await fetch(`${API_BASE}/rewards/partner-shops`);
    return handleResponse(res);
  },
  getMyRewards: async () => {
    const res = await fetch(`${API_BASE}/rewards/my`, { headers: getHeaders() });
    return handleResponse(res);
  },
  requestRedemption: async (data) => {
    const res = await fetch(`${API_BASE}/rewards/request-redemption`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  verifyRedemption: async (data) => {
    const res = await fetch(`${API_BASE}/rewards/verify-redemption`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};

export const adminAPI = {
  createStaff: async (data) => {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getStaffList: async () => {
    const res = await fetch(`${API_BASE}/admin/staff`, { headers: getHeaders() });
    return handleResponse(res);
  },
  toggleStaffStatus: async (id) => {
    const res = await fetch(`${API_BASE}/admin/staff/${id}/toggle-status`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  deleteStaff: async (id) => {
    const res = await fetch(`${API_BASE}/admin/staff/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  resetStaffPassword: async (id, data) => {
    const res = await fetch(`${API_BASE}/admin/staff/${id}/reset-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getHeaders() });
    return handleResponse(res);
  }
};
