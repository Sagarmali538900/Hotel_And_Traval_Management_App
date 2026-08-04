const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI environment variable is missing.");
  process.exit(1);
}

async function check() {
  try {
    await mongoose.connect(uri);
    
    // Define schemas inline to avoid ES module import conflicts
    const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({ name: String, clientName: String }));
    const Guest = mongoose.models.Guest || mongoose.model('Guest', new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId, guestName: String, hotelCost: Number, travelMode: String, daysUsed: Number, roomCostPerDay: Number, roomNumber: String }));
    const HotelBooking = mongoose.models.HotelBooking || mongoose.model('HotelBooking', new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId, hotelName: String, totalCost: Number, roomNumber: String }));
    const TransportBooking = mongoose.models.TransportBooking || mongoose.model('TransportBooking', new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId, vehicleName: String, totalCost: Number, driverName: String }));

    const project = await Project.findOne({ name: 'National Convention' });
    if (!project) {
      console.log('Project "National Convention" not found');
      process.exit(0);
    }
    
    console.log(`=== PROJECT: ${project.name} ===\n`);
    
    const guests = await Guest.find({ projectId: project._id });
    const hotelBookings = await HotelBooking.find({ projectId: project._id });
    const transportBookings = await TransportBooking.find({ projectId: project._id });

    console.log('--- 1. GUEST ROOM STAYS (RSVP HUB) ---');
    let totalGuestCost = 0;
    guests.forEach(g => {
      console.log(`- Guest: ${g.guestName} | Room: ${g.roomNumber || 'Pending'} | Stay: ${g.daysUsed || 0} nights @ ₹${g.roomCostPerDay || 0} = ₹${g.hotelCost || 0}`);
      totalGuestCost += g.hotelCost || 0;
    });
    console.log(`Total Guest Lodging: ₹${totalGuestCost}\n`);

    console.log('--- 2. GENERAL HOTEL BULK BLOCKS ---');
    let totalHotelBlockCost = 0;
    hotelBookings.forEach(hb => {
      console.log(`- Hotel Booking: ${hb.hotelName} | Room: ${hb.roomNumber || 'None'} | Total: ₹${hb.totalCost || 0}`);
      totalHotelBlockCost += hb.totalCost || 0;
    });
    console.log(`Total Bulk Blocks: ₹${totalHotelBlockCost}\n`);

    console.log('--- 3. TRANSPORT & FLEETS ---');
    let totalTransportCost = 0;
    transportBookings.forEach(tb => {
      console.log(`- Fleet Booking: ${tb.vehicleName} | Driver: ${tb.driverName || 'None'} | Total: ₹${tb.totalCost || 0}`);
      totalTransportCost += tb.totalCost || 0;
    });
    console.log(`Total Transport: ₹${totalTransportCost}\n`);

    const grandTotal = totalGuestCost + totalHotelBlockCost + totalTransportCost;
    console.log(`========================================`);
    console.log(`GRAND CONSOLIDATED TOTAL: ₹${grandTotal}`);
    console.log(`========================================`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
