const Complaint = require('../models/Complaint');
const Resident = require('../models/Resident');

// CREATE COMPLAINT
const createComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body);
    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET ALL COMPLAINTS
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('residentId', 'name email roomId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMPLAINT BY ID
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('residentId', 'name email');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMPLAINTS BY RESIDENT
const getComplaintsByResident = async (req, res) => {
  try {
    const complaints = await Complaint.find({ residentId: req.params.residentId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMPLAINTS BY STATUS
const getComplaintsByStatus = async (req, res) => {
  try {
    const complaints = await Complaint.find({ status: req.params.status });
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMPLAINTS BY PRIORITY
const getComplaintsByPriority = async (req, res) => {
  try {
    const complaints = await Complaint.find({ priority: req.params.priority });
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE COMPLAINT STATUS
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, assignedTo }, { returnDocument: 'after' });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// RESOLVE COMPLAINT
const resolveComplaint = async (req, res) => {
  try {
    const { resolution } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      status: 'resolved', resolution, resolvedAt: new Date()
    }, { returnDocument: 'after' });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// RATE COMPLAINT
const rateComplaint = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { rating, feedback }, { returnDocument: 'after' });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE COMPLAINT
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.status(200).json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET COMPLAINT STATISTICS
const getComplaintStatistics = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const inProgress = await Complaint.countDocuments({ status: 'in_progress' });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const urgent = await Complaint.countDocuments({ priority: 'urgent' });
    const high = await Complaint.countDocuments({ priority: 'high' });
    
    res.status(200).json({ success: true, data: { total, pending, inProgress, resolved, urgent, high } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createComplaint, getAllComplaints, getComplaintById, getComplaintsByResident,
  getComplaintsByStatus, getComplaintsByPriority, updateComplaintStatus, resolveComplaint,
  rateComplaint, deleteComplaint, getComplaintStatistics
};
// Complaint and Cleaning Module - Student 5 
