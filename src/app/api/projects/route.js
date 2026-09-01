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

        // Deduplicate hotel lodging costs room-by-room (charging each physical room ONCE, accounting for double occupancy)
        const roomMap = {};
        hotelBookings.forEach(hb => {
          const hotel = (hb.hotelName || 'Unspecified Hotel').trim().toLowerCase();
          const room = (hb.roomNumber || 'Unassigned').trim().toLowerCase();
          const key = `${hotel}-${room}`;
          const days = hb.daysUsed || 1;
          const rate = hb.roomCostPerDay || 0;
          const cost = hb.totalCost > 0 ? hb.totalCost : (days * rate);
          roomMap[key] = { days, rate, cost };
        });

        guests.forEach(g => {
          const hotel = (g.hotelName || '').trim().toLowerCase();
          const room = (g.roomNumber || '').trim().toLowerCase();
          if (room) {
            const key = `${hotel || 'default'}-${room}`;
            const days = g.daysUsed || 1;
            const rate = g.roomCostPerDay || 0;
            const cost = g.hotelCost > 0 ? g.hotelCost : (days * rate);
            if (!roomMap[key] || cost > roomMap[key].cost) {
              roomMap[key] = { days, rate, cost };
            }
          } else if (g.hotelCost > 0) {
            const key = `unallocated-${g._id}`;
            roomMap[key] = { days: g.daysUsed || 1, rate: g.roomCostPerDay || 0, cost: g.hotelCost };
          }
        });

        const totalLodgingCost = Object.values(roomMap).reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalTransportCost = transportBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

        // Count unique hotel + room combinations (same room number = double occupancy / 1 room total)
        const roomsCount = Object.keys(roomMap).filter(k => !k.startsWith('unallocated-')).length;
        const vehiclesCount = transportBookings.length;
        
        // Trains scheduled = standalone trains list + guest arrivals set as Train
        const trainsCount = trainBookings.length + guests.filter(g => g.travelMode === 'Train').length;

        return {
          ...project.toObject(),
          totalHotelCost: totalLodgingCost,
          totalTransportCost,
          totalGuestHotelCost: totalLodgingCost,
          totalCost: totalLodgingCost + totalTransportCost,
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
