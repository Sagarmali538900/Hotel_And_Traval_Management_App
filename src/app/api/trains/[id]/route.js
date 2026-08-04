import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TrainBooking from '@/lib/models/TrainBooking';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const booking = await TrainBooking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Train booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching train booking detail:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const booking = await TrainBooking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Train booking not found' }, { status: 404 });
    }

    // Compare timings to see if we should record history
    const prevArrTime = booking.arrivalTime;
    const prevDepTime = booking.departureTime;
    const prevArrDate = new Date(booking.arrivalDate).toISOString().split('T')[0];
    const prevDepDate = new Date(booking.departureDate).toISOString().split('T')[0];

    const newArrTime = body.arrivalTime || prevArrTime;
    const newDepTime = body.departureTime || prevDepTime;
    const newArrDate = body.arrivalDate ? new Date(body.arrivalDate).toISOString().split('T')[0] : prevArrDate;
    const newDepDate = body.departureDate ? new Date(body.departureDate).toISOString().split('T')[0] : prevDepDate;

    const timingChanged =
      prevArrTime !== newArrTime ||
      prevDepTime !== newDepTime ||
      prevArrDate !== newArrDate ||
      prevDepDate !== newDepDate;

    if (timingChanged) {
      booking.history.push({
        previousArrivalDate: booking.arrivalDate,
        previousArrivalTime: booking.arrivalTime,
        previousDepartureDate: booking.departureDate,
        previousDepartureTime: booking.departureTime,
        reason: body.changeReason || 'Schedule timings adjusted',
      });
    }

    // Update other fields
    if (body.guestName) booking.guestName = body.guestName;
    if (body.guestMobile !== undefined) booking.guestMobile = body.guestMobile;
    if (body.numberOfGuests !== undefined) booking.numberOfGuests = body.numberOfGuests;
    if (body.trainName) booking.trainName = body.trainName;
    if (body.trainCode) booking.trainCode = body.trainCode;
    if (body.arrivalDate) booking.arrivalDate = body.arrivalDate;
    if (body.arrivalTime) booking.arrivalTime = body.arrivalTime;
    if (body.departureDate) booking.departureDate = body.departureDate;
    if (body.departureTime) booking.departureTime = body.departureTime;
    if (body.assignedDriverName !== undefined) booking.assignedDriverName = body.assignedDriverName;
    if (body.assignedDriverMobile !== undefined) booking.assignedDriverMobile = body.assignedDriverMobile;
    if (body.notes !== undefined) booking.notes = body.notes;

    const updatedBooking = await booking.save();
    return NextResponse.json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating train booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const booking = await TrainBooking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Train booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Train booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting train booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
