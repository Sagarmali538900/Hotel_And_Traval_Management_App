import mongoose from 'mongoose';

const GuestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Guest must be linked to a project'],
    },
    projectName: {
      type: String,
      required: true,
    },
    guestName: {
      type: String,
      required: [true, 'Please provide the guest name'],
      trim: true,
    },
    guestMobile: {
      type: String,
      trim: true,
    },
    numberOfGuests: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least 1 person'],
    },
    
    // Travel details
    travelMode: {
      type: String,
      enum: ['None', 'Train', 'Flight'],
      default: 'None',
    },
    travelCode: {
      type: String,
      trim: true,
    },
    arrivalDate: {
      type: Date,
    },
    arrivalTime: {
      type: String, // HH:MM
      trim: true,
    },
    departureDate: {
      type: Date,
    },
    departureTime: {
      type: String, // HH:MM
      trim: true,
    },

    // Lodging Details
    hotelName: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    roomNotAvailableReason: {
      type: String,
      default: '',
      trim: true,
    },
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
    },
    daysUsed: {
      type: Number,
      default: 0,
      min: [0, 'Days used cannot be negative'],
    },
    roomCostPerDay: {
      type: Number,
      default: 0,
      min: [0, 'Cost per day cannot be negative'],
    },
    hotelCost: {
      type: Number,
      default: 0,
    },

    // Shuttle driver details
    assignedDriverName: {
      type: String,
      default: '',
      trim: true,
    },
    assignedDriverMobile: {
      type: String,
      default: '',
      trim: true,
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

// Pre-save hook to calculate lodging cost
GuestSchema.pre('save', function (next) {
  this.hotelCost = this.daysUsed * this.roomCostPerDay;
  next();
});

export default mongoose.models.Guest || mongoose.model('Guest', GuestSchema);
