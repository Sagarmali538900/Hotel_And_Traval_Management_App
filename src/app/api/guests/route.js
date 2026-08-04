import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Guest from '@/lib/models/Guest';
import Project from '@/lib/models/Project';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const filter = projectId ? { projectId } : {};
    // Sort guest list alphabetically by name
    const guests = await Guest.find(filter).sort({ guestName: 1 });

    return NextResponse.json({ success: true, data: guests });
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.projectId || !body.guestName) {
      return NextResponse.json(
        { success: false, error: 'Project and guest name are required' },
        { status: 400 }
      );
    }

    // Resolve project name to cache it
    const project = await Project.findById(body.projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Linked project not found' }, { status: 404 });
    }

    const guestData = {
      ...body,
      projectName: project.name,
    };

    const guest = await Guest.create(guestData);
    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (error) {
    console.error('Error creating guest:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
