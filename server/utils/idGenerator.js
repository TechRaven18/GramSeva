const generateComplaintId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${dateStr}-${randomNum}`;
};

const generateRedemptionId = () => {
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `RDM-${Date.now().toString().slice(-6)}-${randomStr}`;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  generateComplaintId,
  generateRedemptionId,
  generateOTP
};
