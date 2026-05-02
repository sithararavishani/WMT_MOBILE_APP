const Visitor = require('../models/Visitor');
const Room = require('../models/Room');

// ==================== 1. PUBLIC - SUBMIT VISIT REQUEST ====================
const submitVisitRequest = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, preferredRoomType, preferredVisitDate, message } = req.body;
    
    // Validation
    if (!fullName || !phoneNumber || !email || !preferredRoomType || !preferredVisitDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit phone number' });
    }
    
    const visitRequest = await Visitor.create({
      fullName, phoneNumber, email, preferredRoomType, preferredVisitDate, message: message || null
    });
    
    res.status(201).json({ 
      success: true, 
      data: visitRequest,
      message: 'Your visit request has been submitted successfully! We will contact you soon.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 2. ADMIN - GET ALL REQUESTS ====================
const getAllVisitRequests = async (req, res) => {
  try {
    const requests = await Visitor.find().populate('assignedRoomId', 'roomNumber roomType').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 3. ADMIN - GET PENDING REQUESTS ====================
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Visitor.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 4. ADMIN - GET APPROVED REQUESTS ====================
const getApprovedRequests = async (req, res) => {
  try {
    const requests = await Visitor.find({ status: 'approved' }).sort({ preferredVisitDate: 1 });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 5. ADMIN - GET REQUEST BY ID ====================
const getVisitRequestById = async (req, res) => {
  try {
    const request = await Visitor.findById(req.params.id).populate('assignedRoomId', 'roomNumber roomType pricePerMonth');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 6. ADMIN - APPROVE REQUEST ====================
const approveVisitRequest = async (req, res) => {
  try {
    const { assignedRoomId, scheduledTime, adminNotes, approvedBy } = req.body;
    
    let roomNumber = null;
    if (assignedRoomId) {
      const room = await Room.findById(assignedRoomId);
      if (room) {
        roomNumber = room.roomNumber;
      }
    }
    
    const request = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        assignedRoomId: assignedRoomId || null,
        assignedRoomNumber: roomNumber,
        scheduledTime: scheduledTime || null,
        adminNotes: adminNotes || null,
        approvedAt: new Date(),
        approvedBy: approvedBy || 'Admin'
      },
      { returnDocument: 'after' }
    );
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: request,
      message: `Visit request approved for ${request.fullName}`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 7. ADMIN - REJECT REQUEST ====================
const rejectVisitRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    
    const request = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        adminNotes: adminNotes || 'Your request has been rejected'
      },
      { returnDocument: 'after' }
    );
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      data: request,
      message: 'Visit request rejected'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 8. SECURITY - CHECK IN ====================
const checkIn = async (req, res) => {
  try {
    const { securityGuardName, idCardVerified } = req.body;
    
    const request = await Visitor.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    
    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot check-in. Request not approved' });
    }
    
    request.checkInTime = new Date();
    request.securityGuardName = securityGuardName;
    request.idCardVerified = idCardVerified || false;
    request.status = 'completed';
    await request.save();
    
    res.status(200).json({ 
      success: true, 
      data: request,
      message: `Check-in successful. Gate Pass: ${request.gatePassNumber}`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 9. SECURITY - CHECK OUT ====================
const checkOut = async (req, res) => {
  try {
    const request = await Visitor.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    
    if (!request.checkInTime) {
      return res.status(400).json({ success: false, message: 'Visitor has not checked in' });
    }
    
    request.checkOutTime = new Date();
    await request.save();
    
    res.status(200).json({ 
      success: true, 
      data: request,
      message: 'Check-out successful. Thank you for visiting!'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 10. ADMIN - DELETE REQUEST ====================
const deleteVisitRequest = async (req, res) => {
  try {
    const request = await Visitor.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }
    res.status(200).json({ success: true, message: 'Visit request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 11. ADMIN - VISITOR STATISTICS ====================
const getVisitorStatistics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pendingRequests = await Visitor.countDocuments({ status: 'pending' });
    const approvedRequests = await Visitor.countDocuments({ status: 'approved' });
    const completedVisits = await Visitor.countDocuments({ status: 'completed' });
    const rejectedRequests = await Visitor.countDocuments({ status: 'rejected' });
    const totalRequests = await Visitor.countDocuments();
    
    const todayVisits = await Visitor.countDocuments({ checkInTime: { $gte: today } });
    const currentlyInside = await Visitor.countDocuments({ checkInTime: { $ne: null }, checkOutTime: null });
    
    // Get popular room types
    const roomTypeStats = await Visitor.aggregate([
      { $group: { _id: '$preferredRoomType', count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({ 
      success: true, 
      data: {
        pendingRequests,
        approvedRequests,
        completedVisits,
        rejectedRequests,
        totalRequests,
        todayVisits,
        currentlyInside,
        popularRoomTypes: roomTypeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitVisitRequest,
  getAllVisitRequests,
  getPendingRequests,
  getApprovedRequests,
  getVisitRequestById,
  approveVisitRequest,
  rejectVisitRequest,
  checkIn,
  checkOut,
  deleteVisitRequest,
  getVisitorStatistics
};// Visitor Management Module - Student 4 
// Visitor Management Module - Student 4 
