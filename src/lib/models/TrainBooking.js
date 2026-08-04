import mongoose from 'mongoose';

const TrainBookingSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Train booking must be linked to a project'],
    },
    projectName: {
      type: String,
      required: true,
    },
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    guestMobile: {
      type: String,
      trim: true,
    },
    numberOfGuests: {
      type: Number,
      default: 1,
      min: [1, 'Number of guests must be at least 1'],
      required: true,
    },
    trainName: {
      type: String,
      required: [true, 'Train name is required'],
      trim: true,
    },
    trainCode: {
      type: String,
      required: [true, 'Train code is required'],
      trim: true,
    },
    arrivalDate: {
      type: Date,
      required: [true, 'Arrival date in Pune is required'],
    },
    arrivalTime: {
      type: String, // Format: "HH:MM"
      required: [true, 'Arrival time is required'],
    },
    departureDate: {
      type: Date,
      required: [true, 'Departure date from Pune is required'],
    },
    departureTime: {
      type: String, // Format: "HH:MM"
      required: [true, 'Departure time is required'],
    },
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
    history: [
      {
        changedAt: {
          type: Date,
          default: Date.now,
        },
        previousArrivalDate: Date,
        previousArrivalTime: String,
        previousDepartureDate: Date,
        previousDepartureTime: String,
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.TrainBooking || mongoose.model('TrainBooking', TrainBookingSchema);
