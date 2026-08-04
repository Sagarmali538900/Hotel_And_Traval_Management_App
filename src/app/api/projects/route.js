import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import HotelBooking from '@/lib/models/HotelBooking';
import TransportBooking from '@/lib/models/TransportBooking';
import TrainBooking from '@/lib/models/TrainBooking';
import Guest from '@/lib/models/Guest';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: -1 });

    // Aggregate statistics for each project including Guests
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const hotelBookings = await HotelBooking.find({ projectId: project._id });
        const transportBookings = await TransportBooking.find({ projectId: project._id });
        const trainBookings = await TrainBooking.find({ projectId: project._id });
        const guests = await Guest.find({ projectId: project._id });

        const totalHotelCost = hotelBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const totalTransportCost = transportBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const totalGuestHotelCost = guests.reduce((sum, g) => sum + (g.hotelCost || 0), 0);

        // Rooms assigned = bulk crew lodging rooms + guests with rooms allocated
        const roomsCount = hotelBookings.length + guests.filter(g => g.roomNumber && g.roomNumber.trim()).length;
        const vehiclesCount = transportBookings.length;
        
        // Trains scheduled = standalone trains list + guest arrivals set as Train
        const trainsCount = trainBookings.length + guests.filter(g => g.travelMode === 'Train').length;

        return {
          ...project.toObject(),
          totalHotelCost,
          totalTransportCost,
          totalGuestHotelCost,
          totalCost: totalHotelCost + totalTransportCost + totalGuestHotelCost,
          roomsCount,
          vehiclesCount,
          trainsCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: projectsWithStats });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    if (!body.name || !body.clientName) {
      return NextResponse.json(
        { success: false, error: 'Project name and client name are required' },
        { status: 400 }
      );
    }

    const project = await Project.create(body);
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A project with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
