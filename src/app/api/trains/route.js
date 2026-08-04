import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TrainBooking from '@/lib/models/TrainBooking';
import Project from '@/lib/models/Project';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const filter = projectId ? { projectId } : {};
    
    // Sort chronologically by arrival date, then by arrival time (HH:MM string)
    const bookings = await TrainBooking.find(filter).sort({ arrivalDate: 1, arrivalTime: 1 });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching train bookings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (
      !body.projectId ||
      !body.guestName ||
      !body.numberOfGuests ||
      !body.trainName ||
      !body.trainCode ||
      !body.arrivalDate ||
      !body.arrivalTime ||
      !body.departureDate ||
      !body.departureTime
    ) {
      return NextResponse.json(
        { success: false, error: 'All primary train and arrival/departure details are required' },
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

    const booking = await TrainBooking.create(bookingData);
    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating train booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
