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
          const checkIn = hb.bookingDate ? new Date(hb.bookingDate).toISOString() : null;
          let checkOut = null;
          if (hb.bookingDate && hb.daysUsed) {
            const d = new Date(hb.bookingDate);
            d.setDate(d.getDate() + hb.daysUsed);
            checkOut = d.toISOString();
          }
          roomMap[key] = { days, rate, occupants: [], bulkBlock: hb, checkIn, checkOut };
        });

        guests.forEach(g => {
          const hotel = (g.hotelName || '').trim().toLowerCase();
          const room = (g.roomNumber || '').trim().toLowerCase();
          const checkIn = g.checkInDate || g.arrivalDate;
          const checkOut = g.checkOutDate || g.departureDate;
          if (room) {
            const key = `${hotel || 'default'}-${room}`;
            if (!roomMap[key]) {
              roomMap[key] = {
                days: g.daysUsed || 1,
                rate: g.roomCostPerDay || 0,
                occupants: [g],
                bulkBlock: null,
                checkIn: checkIn ? new Date(checkIn).toISOString() : null,
                checkOut: checkOut ? new Date(checkOut).toISOString() : null
              };
            } else {
              roomMap[key].occupants.push(g);
              if (checkIn && (!roomMap[key].checkIn || new Date(checkIn) < new Date(roomMap[key].checkIn))) {
                roomMap[key].checkIn = new Date(checkIn).toISOString();
              }
              if (checkOut && (!roomMap[key].checkOut || new Date(checkOut) > new Date(roomMap[key].checkOut))) {
                roomMap[key].checkOut = new Date(checkOut).toISOString();
              }
            }
          } else {
            const key = `unallocated-${g._id}`;
            roomMap[key] = {
              days: g.daysUsed || 1,
              rate: g.roomCostPerDay || 0,
              cost: g.hotelCost || 0,
              isUnallocated: true
            };
          }
        });

        Object.values(roomMap).forEach(r => {
          if (r.isUnallocated) return;
          if (r.checkIn && r.checkOut) {
            const dIn = new Date(r.checkIn);
            const dOut = new Date(r.checkOut);
            const diffMs = dOut.getTime() - dIn.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
              r.days = Math.max(r.days || 1, diffDays);
            }
          }
          if (r.bulkBlock && r.bulkBlock.roomCostPerDay > 0) {
            r.rate = r.bulkBlock.roomCostPerDay;
          } else if (r.occupants && r.occupants.length > 0) {
            const maxRate = Math.max(...r.occupants.map(o => o.roomCostPerDay || 0));
            const sumRates = r.occupants.reduce((sum, o) => sum + (o.roomCostPerDay || 0), 0);
            r.rate = maxRate >= 3000 ? maxRate : sumRates;
          }
          r.cost = (r.days || 1) * (r.rate || 0);
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
