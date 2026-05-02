// Room Management Module - Sithara

const Room = require('../models/Room');
const Resident = require('../models/Resident');

// ==================== 1. CREATE ROOM ====================
const createRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      roomType,
      capacity,
      pricePerMonth,
      description,
      facilities,
      images,
      status
    } = req.body;

    // Validation
    if (!roomNumber || !roomType || !capacity || !pricePerMonth) {
      return res.status(400).json({
        success: false,
        message: 'Room number, type, capacity and price are required'
      });
    }

    // Check if room number already exists
    const normalizedRoomNumber = roomNumber.toUpperCase();
    const existingRoom = await Room.findOne({ roomNumber: normalizedRoomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room ${normalizedRoomNumber} already exists`
      });
    }

    // Create new room with images and status
    const room = new Room({
      roomNumber: roomNumber.toUpperCase(),
      roomType,
      capacity,
      pricePerMonth,
      description: description || '',
      facilities: facilities || [],
      images: images || [],
      ...(status && { status })
    });

    await room.save();

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 2. GET ALL ROOMS ====================
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 3. GET SINGLE ROOM ====================
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 4. GET AVAILABLE ROOMS ====================
const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      isActive: true,
      status: 'available'
    }).sort({ pricePerMonth: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 5. UPDATE ROOM ====================
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if room number is being updated
    if (updateData.roomNumber) {
      const normalizedRoomNumber = updateData.roomNumber.toUpperCase();
      const existingRoom = await Room.findOne({ 
        roomNumber: normalizedRoomNumber,
        _id: { $ne: id } // Exclude current room
      });
      
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: `Room ${normalizedRoomNumber} already exists`
        });
      }
      updateData.roomNumber = normalizedRoomNumber;
    }

    const room = await Room.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 6. UPDATE ROOM STATUS ====================
const updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: available, occupied, maintenance, reserved'
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 7. DELETE ROOM (SOFT DELETE) ====================
const deleteRoom = async (req, res) => {
  try {
    const residentsInRoom = await Resident.countDocuments({
      roomId: req.params.id,
      status: 'active'
    });

    if (residentsInRoom > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with active residents'
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: 'after' }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 8. FILTER BY ROOM TYPE ====================
const filterByRoomType = async (req, res) => {
  try {
    const { roomType } = req.params;
    const validTypes = ['Single', 'Double', 'Triple', 'Shared'];

    if (!validTypes.includes(roomType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room type. Must be: Single, Double, Triple, Shared'
      });
    }

    const rooms = await Room.find({ isActive: true, roomType });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 9. FILTER BY STATUS ====================
const filterByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const rooms = await Room.find({ isActive: true, status });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 10. FILTER BY PRICE RANGE ====================
const filterByPriceRange = async (req, res) => {
  try {
    const { min, max } = req.query;
    let filter = { isActive: true };

    if (min) {
      filter.pricePerMonth = { $gte: parseInt(min) };
    }
    if (max) {
      filter.pricePerMonth = { ...filter.pricePerMonth, $lte: parseInt(max) };
    }

    const rooms = await Room.find(filter).sort({ pricePerMonth: 1 });
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 11. SEARCH ROOMS ====================
const searchRooms = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const rooms = await Room.find({
      isActive: true,
      $or: [
        { roomNumber: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 12. ROOM STATISTICS ====================
const getRoomStatistics = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments({ isActive: true });
    const availableRooms = await Room.countDocuments({ isActive: true, status: 'available' });
    const occupiedRooms = await Room.countDocuments({ isActive: true, status: 'occupied' });
    const maintenanceRooms = await Room.countDocuments({ isActive: true, status: 'maintenance' });
    const reservedRooms = await Room.countDocuments({ isActive: true, status: 'reserved' });

    const allRooms = await Room.find({ isActive: true });
    let totalCapacity = 0;
    let currentOccupancy = 0;
    let totalImages = 0;

    allRooms.forEach(room => {
      totalCapacity += room.capacity;
      currentOccupancy += room.currentOccupancy;
      totalImages += room.images?.length || 0;
    });

    const occupancyRate = totalCapacity > 0
      ? ((currentOccupancy / totalCapacity) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        reservedRooms,
        totalCapacity,
        currentOccupancy,
        occupancyRate: `${occupancyRate}%`,
        totalImages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 13. ADD ROOM IMAGES ====================
const addRoomImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required'
      });
    }

    // Check if adding images would exceed 5
    if ((room.images?.length || 0) + images.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed per room. You already have ' + (room.images?.length || 0) + ' images'
      });
    }

    // Add new images
    room.images = [...(room.images || []), ...images];
    await room.save();

    res.status(200).json({
      success: true,
      data: room.images,
      message: `${images.length} image(s) added successfully. Total images: ${room.images.length}/5`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 14. REPLACE ALL ROOM IMAGES ====================
const replaceRoomImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required'
      });
    }

    if (images.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed per room'
      });
    }

    // Replace all images
    room.images = images;
    await room.save();

    res.status(200).json({
      success: true,
      data: room.images,
      message: `${images.length} image(s) saved successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 15. DELETE SINGLE ROOM IMAGE ====================
const deleteRoomImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const index = parseInt(imageIndex);
    if (isNaN(index) || index < 0 || index >= (room.images?.length || 0)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    room.images.splice(index, 1);
    await room.save();

    res.status(200).json({
      success: true,
      data: room.images,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 16. DELETE ALL ROOM IMAGES ====================
const deleteAllRoomImages = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    room.images = [];
    await room.save();

    res.status(200).json({
      success: true,
      message: 'All images deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 17. REMINDER SYSTEM ====================
const setReminder = async (req, res) => {
  try {
    const { reminderDate, reminderMessage } = req.body;

    if (!reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'Reminder date is required'
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        reminderEnabled: true,
        reminderDate,
        reminderMessage: reminderMessage || 'Room is available for booking'
      },
      { returnDocument: 'after' }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        roomNumber: room.roomNumber,
        reminderDate: room.reminderDate,
        reminderMessage: room.reminderMessage,
        reminderEnabled: room.reminderEnabled
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getActiveReminders = async (req, res) => {
  try {
    const reminders = await Room.find({
      reminderEnabled: true,
      isActive: true,
      reminderDate: { $ne: null }
    }).select('roomNumber roomType pricePerMonth reminderDate reminderMessage images');

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        reminderEnabled: false,
        reminderDate: null,
        reminderMessage: null
      },
      { returnDocument: 'after' }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 18. PUBLIC ROOMS FOR VISITORS ====================
const getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .select('roomNumber roomType capacity pricePerMonth description facilities images status');

    const statistics = {
      totalRooms: await Room.countDocuments({ isActive: true }),
      availableRooms: await Room.countDocuments({ isActive: true, status: 'available' }),
      occupiedRooms: await Room.countDocuments({ isActive: true, status: 'occupied' })
    };

    const roomTypes = await Room.distinct('roomType', { isActive: true });

    const minPriceRoom = await Room.findOne({ isActive: true }).sort({ pricePerMonth: 1 });
    const maxPriceRoom = await Room.findOne({ isActive: true }).sort({ pricePerMonth: -1 });

    res.status(200).json({
      success: true,
      data: {
        rooms,
        statistics,
        filters: {
          roomTypes,
          priceRange: {
            min: minPriceRoom?.pricePerMonth || 0,
            max: maxPriceRoom?.pricePerMonth || 0
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 19. SORT BY PRICE ====================
const sortByPrice = async (req, res) => {
  try {
    const { order } = req.query;
    const sortOrder = order === 'desc' ? -1 : 1;

    const rooms = await Room.find({ isActive: true })
      .sort({ pricePerMonth: sortOrder });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 20. FILTER BY CAPACITY ====================
const filterByCapacity = async (req, res) => {
  try {
    const { capacity } = req.params;
    const minCapacity = parseInt(capacity);

    if (isNaN(minCapacity)) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a number'
      });
    }

    const rooms = await Room.find({
      isActive: true,
      capacity: { $gte: minCapacity }
    }).sort({ capacity: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== 21. GET RESIDENTS IN ROOM ====================
const getResidentsInRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const residents = await Resident.find({
      roomId: req.params.id,
      status: 'active'
    }).select('name email phone');

    res.status(200).json({
      success: true,
      data: {
        room: {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          capacity: room.capacity,
          currentOccupancy: room.currentOccupancy,
          images: room.images
        },
        residents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  // Basic CRUD
  createRoom,
  getAllRooms,
  getRoomById,
  getAvailableRooms,
  updateRoom,
  updateRoomStatus,
  deleteRoom,

  // Filters & Search
  filterByRoomType,
  filterByStatus,
  filterByPriceRange,
  filterByCapacity,
  searchRooms,
  sortByPrice,

  // Statistics & Reports
  getRoomStatistics,
  getResidentsInRoom,

  // Images (New)
  addRoomImages,
  replaceRoomImages,
  deleteRoomImage,
  deleteAllRoomImages,

  // Reminders
  setReminder,
  getActiveReminders,
  deleteReminder,

  // Public
  getPublicRooms
};
// Room Management Module - Sithara 
