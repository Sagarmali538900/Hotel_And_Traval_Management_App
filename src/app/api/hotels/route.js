import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import HotelBooking from '@/lib/models/HotelBooking';
import Project from '@/lib/models/Project';

import Guest from '@/lib/models/Guest';

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

    if (!body.projectId || !body.hotelName || !body.bookingDate || !body.roomNumber || !body.daysUsed) {
      return NextResponse.json(
        { success: false, error: 'Linked project, hotel name, booking date, room number, and stay duration are required' },
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

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { projectId, oldHotelName, oldRoomNumber, newHotelName, newRoomNumber, roomCostPerDay, daysUsed, bookingDate, notes } = body;

    if (!projectId || !oldRoomNumber) {
      return NextResponse.json({ success: false, error: 'Project ID and Room Number are required' }, { status: 400 });
    }

    const targetHotel = newHotelName || oldHotelName || 'Hotel';
    const targetRoom = newRoomNumber || oldRoomNumber;
    const rate = Number(roomCostPerDay) || 0;
    const duration = Number(daysUsed) || 1;
    const totalCost = rate * duration;

    // 1. Update matching HotelBooking bulk block or create one
    let booking = await HotelBooking.findOne({
      projectId,
      hotelName: { $regex: new RegExp(`^${oldHotelName || ''}$`, 'i') },
      roomNumber: { $regex: new RegExp(`^${oldRoomNumber}$`, 'i') }
    });

    if (booking) {
      booking.hotelName = targetHotel;
      booking.roomNumber = targetRoom;
      booking.roomCostPerDay = rate;
      booking.daysUsed = duration;
      booking.totalCost = totalCost;
      if (bookingDate) booking.bookingDate = bookingDate;
      if (notes !== undefined) booking.notes = notes;
      await booking.save();
    } else if (targetHotel && targetRoom) {
      const project = await Project.findById(projectId);
      booking = await HotelBooking.create({
        projectId,
        projectName: project ? project.name : '',
        hotelName: targetHotel,
        roomNumber: targetRoom,
        roomCostPerDay: rate,
        daysUsed: duration,
        totalCost: totalCost,
        bookingDate: bookingDate || new Date(),
        notes: notes || ''
      });
    }

    // 2. Update all Guest stay documents assigned to this room
    const guestFilter = {
      projectId,
      roomNumber: { $regex: new RegExp(`^${oldRoomNumber}$`, 'i') }
    };

    const guests = await Guest.find(guestFilter);
    for (const g of guests) {
      g.hotelName = targetHotel;
      g.roomNumber = targetRoom;
      g.roomCostPerDay = rate;
      g.daysUsed = duration;
      g.hotelCost = totalCost;
      if (bookingDate) {
        g.checkInDate = new Date(bookingDate);
        const out = new Date(bookingDate);
        out.setDate(out.getDate() + duration);
        g.checkOutDate = out;
      }
      await g.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Room details updated successfully',
      data: { booking, updatedGuestsCount: guests.length }
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const roomNumber = searchParams.get('roomNumber');

    if (id) {
      const booking = await HotelBooking.findByIdAndDelete(id);
      if (booking) {
        await Guest.updateMany(
          { projectId: booking.projectId, roomNumber: booking.roomNumber },
          { $set: { hotelName: 'Unallocated', roomNumber: 'Unallocated', hotelCost: 0, daysUsed: 1 } }
        );
      }
      return NextResponse.json({ success: true, message: 'Hotel booking deleted successfully' });
    }

    if (projectId && roomNumber) {
      await HotelBooking.deleteMany({
        projectId,
        roomNumber: { $regex: new RegExp(`^${roomNumber}$`, 'i') }
      });

      await Guest.updateMany(
        { projectId, roomNumber: { $regex: new RegExp(`^${roomNumber}$`, 'i') } },
        { $set: { hotelName: 'Unallocated', roomNumber: 'Unallocated', hotelCost: 0, daysUsed: 1 } }
      );

      return NextResponse.json({ success: true, message: 'Room deleted and occupants unallocated successfully' });
    }

    return NextResponse.json({ success: false, error: 'Booking ID or Project ID and Room Number are required' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting hotel booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
