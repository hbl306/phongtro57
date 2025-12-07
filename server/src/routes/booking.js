// src/routes/booking.js
const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/booking');
const verifyToken = require('../middlewares/verifyToken');

router.get('/mine', verifyToken, bookingController.getMyBookings);
router.get(
  '/mine-as-landlord',
  verifyToken,
  bookingController.getLandlordBookings
);

// người THUÊ xác nhận / hủy
router.post('/:id/confirm', verifyToken, bookingController.confirmBooking);
router.post('/:id/cancel', verifyToken, bookingController.cancelBooking);

module.exports = router;
