import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TransportBooking from '@/lib/models/TransportBooking';
import Project from '@/lib/models/Project';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const filter = projectId ? { projectId } : {};
    const bookings = await TransportBooking.find(filter).sort({ bookingDate: -1 });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching transport bookings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (
      !body.projectId ||
      !body.vehicleName ||
      !body.vehicleNumber ||
      !body.bookingDate ||
      !body.costModel ||
      body.costRate === undefined ||
      body.duration === undefined ||
      !body.fuelPolicy
    ) {
      return NextResponse.json(
        { success: false, error: 'All primary vehicle and rate fields are required' },
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

    const booking = await TransportBooking.create(bookingData);
    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating transport booking:', error);
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

    const booking = await TransportBooking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Transport booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting transport booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
