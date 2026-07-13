import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import HotelBooking from '@/lib/models/HotelBooking';
import TransportBooking from '@/lib/models/TransportBooking';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({}).sort({ createdAt: -1 });

    // Aggregate statistics for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const hotelBookings = await HotelBooking.find({ projectId: project._id });
        const transportBookings = await TransportBooking.find({ projectId: project._id });

        const totalHotelCost = hotelBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const totalTransportCost = transportBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        const roomsCount = hotelBookings.length;
        const vehiclesCount = transportBookings.length;

        return {
          ...project.toObject(),
          totalHotelCost,
          totalTransportCost,
          totalCost: totalHotelCost + totalTransportCost,
          roomsCount,
          vehiclesCount,
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
    // Handle duplicate project name
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A project with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
