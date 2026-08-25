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

        // Count unique hotel + room combinations (same room number = double occupancy / 1 room total)
        const uniqueRooms = new Set();
        hotelBookings.forEach(hb => {
          const hotel = (hb.hotelName || 'default').trim().toLowerCase();
          const room = (hb.roomNumber || '').trim().toLowerCase();
          if (room) {
            uniqueRooms.add(`${hotel}-${room}`);
          }
        });
        guests.forEach(g => {
          const hotel = (g.hotelName || 'default').trim().toLowerCase();
          const room = (g.roomNumber || '').trim().toLowerCase();
          if (room) {
            uniqueRooms.add(`${hotel}-${room}`);
          }
        });
        const roomsCount = uniqueRooms.size;
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
