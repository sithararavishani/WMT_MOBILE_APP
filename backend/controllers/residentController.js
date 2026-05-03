const Resident = require('../models/Resident');
const Room = require('../models/Room');

// ==================== 1. CREATE RESIDENT ====================
const createResident = async (req, res) => {
  try {
    const { email, nic } = req.body;
    
    const existingEmail = await Resident.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    const existingNic = await Resident.findOne({ nic });
    if (existingNic) {
      return res.status(400).json({ success: false, message: 'NIC already exists' });
    }
    
    const resident = await Resident.create(req.body);
    res.status(201).json({ success: true, data: resident });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 2. GET ALL RESIDENTS ====================
const getAllResidents = async (req, res) => {
  try {
    const residents = await Resident.find({ status: { $ne: 'left' } }).populate('roomId', 'roomNumber roomType');
    res.status(200).json({ success: true, count: residents.length, data: residents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 3. GET SINGLE RESIDENT ====================
const getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id).populate('roomId', 'roomNumber roomType pricePerMonth');
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 4. UPDATE RESIDENT ====================
const updateResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { returnDocument: 'after', runValidators: true }
    );
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 5. DELETE RESIDENT ====================
const deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    
    if (resident.roomId) {
      await Room.findByIdAndUpdate(resident.roomId, { $inc: { currentOccupancy: -1 } });
    }
    
    await Resident.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Resident deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 6. ASSIGN ROOM TO RESIDENT ====================
const assignRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }
    
    if (resident.roomId) {
      await Room.findByIdAndUpdate(resident.roomId, { $inc: { currentOccupancy: -1 } });
      resident.roomHistory.push({
        roomId: resident.roomId,
        roomNumber: resident.roomNumber,
        vacatedDate: new Date()
      });
    }
    
    resident.roomId = roomId;
    resident.roomNumber = room.roomNumber;
    await resident.save();
    
    await Room.findByIdAndUpdate(roomId, { $inc: { currentOccupancy: 1 } });
    
    res.status(200).json({ 
      success: true, 
      data: resident, 
      message: `Room ${room.roomNumber} assigned successfully` 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 7. UPDATE RESIDENT STATUS ====================
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'blocked', 'left'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    
    resident.status = status;
    if (status === 'left') {
      resident.checkOutDate = new Date();
      if (resident.roomId) {
        await Room.findByIdAndUpdate(resident.roomId, { $inc: { currentOccupancy: -1 } });
        resident.roomId = null;
      }
    }
    
    await resident.save();
    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 8. SEARCH RESIDENTS ====================
const searchResidents = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }
    
    const residents = await Resident.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { nic: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).populate('roomId', 'roomNumber');
    
    res.status(200).json({ success: true, count: residents.length, data: residents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 9. GET RESIDENTS BY STATUS ====================
const getResidentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const residents = await Resident.find({ status }).populate('roomId', 'roomNumber');
    res.status(200).json({ success: true, count: residents.length, data: residents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 10. GET RESIDENTS BY ROOM ====================
const getResidentsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const residents = await Resident.find({ roomId, status: 'active' });
    res.status(200).json({ success: true, count: residents.length, data: residents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 11. UPDATE PROFILE IMAGE ====================
const updateProfileImage = async (req, res) => {
  try {
    const { profileImage } = req.body;
    const resident = await Resident.findByIdAndUpdate(
      req.params.id, 
      { profileImage }, 
      { returnDocument: 'after' }
    );
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    res.status(200).json({ success: true, data: { profileImage: resident.profileImage } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 11b. GET MY PROFILE (SELF-SERVICE) ====================
const getMyProfile = async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const resident = await Resident.findOne({ email }).populate('roomId', 'roomNumber roomType pricePerMonth');
    if (!resident) return res.status(404).json({ success: false, message: 'Resident profile not found' });
    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 11c. BOOK ROOM (resident self-service) ====================
const bookRoom = async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: 'roomId is required' });

    const resident = await Resident.findOne({ email });
    if (!resident) return res.status(404).json({ success: false, message: 'Resident profile not found. Contact admin.' });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.status !== 'available') return res.status(400).json({ success: false, message: `Room is not available (status: ${room.status})` });
    if (room.currentOccupancy >= room.capacity) return res.status(400).json({ success: false, message: 'Room is full' });

    if (resident.roomId) {
      await Room.findByIdAndUpdate(resident.roomId, { $inc: { currentOccupancy: -1 } });
      resident.roomHistory.push({ roomId: resident.roomId, roomNumber: resident.roomNumber, vacatedDate: new Date() });
    }

    resident.roomId = roomId;
    resident.roomNumber = room.roomNumber;
    await resident.save();
    await Room.findByIdAndUpdate(roomId, { $inc: { currentOccupancy: 1 } });

    res.status(200).json({ success: true, data: resident, message: `Room ${room.roomNumber} booked successfully` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 12. UPDATE MY PROFILE (SELF-SERVICE) ====================
const updateMyProfile = async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, phone, course, year, nic, guardianName, guardianPhone, permanentAddress } = req.body;
    const allowedUpdates = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (course !== undefined) allowedUpdates.course = course;
    if (year !== undefined) allowedUpdates.year = year;
    if (nic !== undefined) allowedUpdates.nic = nic;
    if (guardianName !== undefined) allowedUpdates.guardianName = guardianName;
    if (guardianPhone !== undefined) allowedUpdates.guardianPhone = guardianPhone;
    if (permanentAddress !== undefined) allowedUpdates.permanentAddress = permanentAddress;

    const resident = await Resident.findOneAndUpdate(
      { email },
      { $set: allowedUpdates },
      { returnDocument: 'after', runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident profile not found. Ask an admin to create your profile first.' });
    }

    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== 13. GET ROOM HISTORY ====================
const getRoomHistory = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .select('name roomHistory')
      .populate('roomHistory.roomId', 'roomNumber roomType');
    
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }
    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createResident,
  getAllResidents,
  getResidentById,
  updateResident,
  deleteResident,
  assignRoom,
  updateStatus,
  searchResidents,
  getResidentsByStatus,
  getResidentsByRoom,
  updateProfileImage,
  getRoomHistory,
  updateMyProfile,
  getMyProfile,
  bookRoom
};