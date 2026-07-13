import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to MongoDB Atlas!',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to MongoDB Atlas',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
