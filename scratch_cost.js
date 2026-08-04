import dbConnect from './src/lib/db.js';
import Project from './src/lib/models/Project.js';
import HotelBooking from './src/lib/models/HotelBooking.js';
import TransportBooking from './src/lib/models/TransportBooking.js';
import Guest from './src/lib/models/Guest.js';

async function checkCosts() {
  try {
    await dbConnect();
    const project = await Project.findOne({ name: 'National Convention' });
    if (!project) {
      console.log('Project not found');
      process.exit(0);
    }

    console.log(`=== PROJECT: ${project.name} ===\n`);

    const guests = await Guest.find({ projectId: project._id });
    const hotelBookings = await HotelBooking.find({ projectId: project._id });
    const transportBookings = await TransportBooking.find({ projectId: project._id });

    console.log('--- 1. GUEST ROOM STAYS ---');
    let totalGuestCost = 0;
    guests.forEach(g => {
      console.log(`- Guest: ${g.guestName} | Stay: ${g.daysUsed} nights @ ₹${g.roomCostPerDay} = ₹${g.hotelCost}`);
      totalGuestCost += g.hotelCost || 0;
    });
    console.log(`Total: ₹${totalGuestCost}\n`);

    console.log('--- 2. BULK HOTEL BLOCKS ---');
    let totalHotelBlockCost = 0;
    hotelBookings.forEach(hb => {
      console.log(`- Hotel Booking: ${hb.hotelName} | Room: ${hb.roomNumber} | Total: ₹${hb.totalCost}`);
      totalHotelBlockCost += hb.totalCost || 0;
    });
    console.log(`Total: ₹${totalHotelBlockCost}\n`);

    console.log('--- 3. TRANSPORT FLEET ---');
    let totalTransportCost = 0;
    transportBookings.forEach(tb => {
      console.log(`- Fleet Booking: ${tb.vehicleName} | Driver: ${tb.driverName} | Total: ₹${tb.totalCost}`);
      totalTransportCost += tb.totalCost || 0;
    });
    console.log(`Total: ₹${totalTransportCost}\n`);

    const grandTotal = totalGuestCost + totalHotelBlockCost + totalTransportCost;
    console.log(`========================================`);
    console.log(`GRAND CONSOLIDATED TOTAL: ₹${grandTotal}`);
    console.log(`========================================`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkCosts();
