import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Guest from '@/lib/models/Guest';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const guest = await Guest.findById(id);
    if (!guest) {
      return NextResponse.json({ success: false, error: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error('Error fetching guest detail:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const guest = await Guest.findById(id);
    if (!guest) {
      return NextResponse.json({ success: false, error: 'Guest not found' }, { status: 404 });
    }

    // Update fields
    if (body.guestName) guest.guestName = body.guestName;
    if (body.guestMobile !== undefined) guest.guestMobile = body.guestMobile;
    if (body.numberOfGuests !== undefined) guest.numberOfGuests = body.numberOfGuests;
    
    // Travel details
    if (body.travelMode !== undefined) guest.travelMode = body.travelMode;
    if (body.travelCode !== undefined) guest.travelCode = body.travelCode;
    if (body.arrivalDate !== undefined) guest.arrivalDate = body.arrivalDate;
    if (body.arrivalTime !== undefined) guest.arrivalTime = body.arrivalTime;
    if (body.departureDate !== undefined) guest.departureDate = body.departureDate;
    if (body.departureTime !== undefined) guest.departureTime = body.departureTime;

    // Lodging Details
    if (body.hotelName !== undefined) guest.hotelName = body.hotelName;
    if (body.roomNumber !== undefined) guest.roomNumber = body.roomNumber;
    if (body.roomNotAvailableReason !== undefined) guest.roomNotAvailableReason = body.roomNotAvailableReason;
    if (body.checkInDate !== undefined) guest.checkInDate = body.checkInDate;
    if (body.checkOutDate !== undefined) guest.checkOutDate = body.checkOutDate;
    if (body.daysUsed !== undefined) guest.daysUsed = body.daysUsed;
    if (body.roomCostPerDay !== undefined) guest.roomCostPerDay = body.roomCostPerDay;

    // Shuttle driver details
    if (body.assignedDriverName !== undefined) guest.assignedDriverName = body.assignedDriverName;
    if (body.assignedDriverMobile !== undefined) guest.assignedDriverMobile = body.assignedDriverMobile;
    
    if (body.notes !== undefined) guest.notes = body.notes;

    const updatedGuest = await guest.save(); // pre-save recalculates lodging cost automatically
    return NextResponse.json({ success: true, data: updatedGuest });
  } catch (error) {
    console.error('Error updating guest detail:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const guest = await Guest.findByIdAndDelete(id);
    if (!guest) {
      return NextResponse.json({ success: false, error: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
