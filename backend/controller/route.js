const Route=require("../models/route");
const Bus=require("../models/bus");
const Booking=require("../models/booking");

exports.getoneroute = async(req,res) => {
    try {
        let departure = req.params.departure;
        let arrival= req.params.arrival;
        let date= req.params.date;

        // Query directly from Bus model
        // Match source.city and destination.city case-insensitively
        const filter = {
            "source.city": { $regex: new RegExp(`^${departure}$`, "i") },
            "destination.city": { $regex: new RegExp(`^${arrival}$`, "i") },
            isActive: true,
            isDeleted: false
        };

        const buses = await Bus.find(filter);

        // Map bus fields to legacy formats expected by frontend
        const matchedbuses = buses.map(bus => {
            const busObj = bus.toObject ? bus.toObject() : bus;
            return {
                ...busObj,
                rating: [busObj.averageRating || 4.0], // single-element array containing averageRating
                liveTracking: busObj.features && busObj.features.liveTracking ? 1 : 0,
                reschedulable: busObj.features && busObj.features.reschedulable ? 1 : 0,
                routes: busObj.routes ? busObj.routes.toString() : "60c72b2f9b1d8b22a0f8eb05"
            };
        });

        // Dynamically build route object
        let durationVal = 6;
        if (matchedbuses.length > 0) {
            const durStr = matchedbuses[0].duration || "6h 00m";
            const match = durStr.match(/(\d+)h/);
            if (match) durationVal = parseInt(match[1]);
        }

        const route = {
            _id: matchedbuses.length > 0 ? matchedbuses[0].routes : "60c72b2f9b1d8b22a0f8eb05",
            departureLocation: { name: departure, subLocations: [] },
            arrivalLocation: { name: arrival, subLocations: [] },
            duration: durationVal
        };

        const booking = await Booking.find().lean().exec();
        const busidwithseatobj = {};
        for (let i = 0; i < matchedbuses.length; i++) {
            let currentbusseats = [];
            const busbooking = booking.filter((booking) => {
                return (
                    booking.departureDetails &&
                    booking.departureDetails.date === date &&
                    booking.busId &&
                    booking.busId.toString() === matchedbuses[i]._id.toString()
                );
            });
            busbooking.forEach((booking) => {
                currentbusseats = [...currentbusseats, ...booking.seats];
            });
            busidwithseatobj[matchedbuses[i]._id.toString()] = currentbusseats;
        }

        res.send({ route: route, matchedBuses: matchedbuses, busidwithseatobj });
    } catch (err) {
        console.error("Error in getoneroute:", err);
        res.status(500).send({ message: "Internal server error", error: err.message });
    }
};