import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import HotelBooking from '@/lib/models/HotelBooking';
import TransportBooking from '@/lib/models/TransportBooking';
import TrainBooking from '@/lib/models/TrainBooking';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const hotelBookings = await HotelBooking.find({ projectId: id }).sort({ bookingDate: 1 });
    const transportBookings = await TransportBooking.find({ projectId: id }).sort({ bookingDate: 1 });
    const trainBookings = await TrainBooking.find({ projectId: id }).sort({ arrivalDate: 1, arrivalTime: 1 });

    const totalHotelCost = hotelBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
    const totalTransportCost = transportBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        project,
        hotelBookings,
        transportBookings,
        trainBookings,
        totalHotelCost,
        totalTransportCost,
        grandTotal: totalHotelCost + totalTransportCost,
      },
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const project = await Project.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // If project name was changed, sync cache in all bookings
    if (body.name) {
      await HotelBooking.updateMany({ projectId: id }, { projectName: body.name });
      await TransportBooking.updateMany({ projectId: id }, { projectName: body.name });
      await TrainBooking.updateMany({ projectId: id }, { projectName: body.name });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Cascade delete all bookings for this project
    await HotelBooking.deleteMany({ projectId: id });
    await TransportBooking.deleteMany({ projectId: id });
    await TrainBooking.deleteMany({ projectId: id });

    return NextResponse.json({ success: true, message: 'Project and all associated bookings deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
