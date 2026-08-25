import mongoose from 'mongoose';

const HotelBookingSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Booking must be linked to a project'],
    },
    projectName: {
      type: String,
      required: true,
    },
    hotelName: {
      type: String,
      required: [true, 'Please specify the hotel name'],
      trim: true,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Please specify the booking date'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Please specify the room number/identifier'],
      trim: true,
    },
    daysUsed: {
      type: Number,
      required: [true, 'Please specify the number of days the room is used'],
      min: [1, 'Must use the room for at least 1 day'],
    },
    roomCostPerDay: {
      type: Number,
      default: 0,
      min: [0, 'Cost per day cannot be negative'],
    },
    totalCost: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate total cost before saving
HotelBookingSchema.pre('save', function (next) {
  this.totalCost = this.daysUsed * this.roomCostPerDay;
  next();
});

export default mongoose.models.HotelBooking || mongoose.model('HotelBooking', HotelBookingSchema);
