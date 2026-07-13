import mongoose from 'mongoose';

const TransportBookingSchema = new mongoose.Schema(
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
    vehicleName: {
      type: String,
      required: [true, 'Please specify the vehicle name/type'],
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Please specify the vehicle license plate number'],
      trim: true,
    },
    driverName: {
      type: String,
      trim: true,
    },
    driverMobile: {
      type: String,
      trim: true,
    },
    ownershipType: {
      type: String,
      enum: ['Owned', 'Hired'],
      default: 'Hired',
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      trim: true,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Please specify the booking/assignment date'],
    },
    costModel: {
      type: String,
      enum: ['hourly', 'daily'],
      required: [true, 'Please specify whether billing is hourly or daily'],
    },
    costRate: {
      type: Number,
      required: [true, 'Please specify the rate per hour/day'],
      min: [0, 'Rate cannot be negative'],
    },
    duration: {
      type: Number,
      required: [true, 'Please specify the duration (hours/days)'],
      min: [0.1, 'Duration must be greater than 0'],
    },
    fuelPolicy: {
      type: String,
      enum: ['included', 'excluded'],
      required: [true, 'Please specify if fuel is included in rent or not'],
    },
    fuelCost: {
      type: Number,
      default: 0,
      min: [0, 'Fuel cost cannot be negative'],
    },
    otherExpenses: {
      type: Number,
      default: 0,
      min: [0, 'Other expenses cannot be negative'],
    },
    rentPayable: {
      type: Number,
      default: 0,
      min: [0, 'Rent payable cannot be negative'],
    },
    totalCost: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate total cost and reset fuel cost if fuel is included in the rent
TransportBookingSchema.pre('save', function (next) {
  const baseCost = this.costRate * this.duration;
  
  if (this.fuelPolicy === 'included') {
    this.fuelCost = 0;
  }
  
  this.totalCost = baseCost + this.fuelCost + this.otherExpenses;
  next();
});

export default mongoose.models.TransportBooking || mongoose.model('TransportBooking', TransportBookingSchema);
