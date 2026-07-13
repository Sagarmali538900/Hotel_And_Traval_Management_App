import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HotelBooking from '@/lib/models/HotelBooking';
import Project from '@/lib/models/Project';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const filter = projectId ? { projectId } : {};
    const bookings = await HotelBooking.find(filter).sort({ bookingDate: -1 });
    
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching hotel bookings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.projectId || !body.hotelName || !body.bookingDate || !body.roomNumber || !body.daysUsed || !body.roomCostPerDay) {
      return NextResponse.json(
        { success: false, error: 'All fields are required except notes' },
        { status: 400 }
      );
    }

    // Resolve project name to cache it
    const project = await Project.findById(body.projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Linked project not found' }, { status: 404 });
    }

    const bookingData = {
      ...body,
      projectName: project.name,
    };

    const booking = await HotelBooking.create(bookingData);
    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating hotel booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await HotelBooking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Hotel booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
