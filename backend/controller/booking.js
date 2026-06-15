const Booking = require("../models/booking");
const Bus = require("../models/bus");
const User = require("../models/customer");
const { sendEmail } = require("../utils/mailer");

exports.addbooking = async (req, res) => {
    try {
        const {
            customerId,
            busId,
            passengerDetails,
            email,
            phoneNumber,
            fare,
            seats,
            departureDetails,
            arrivalDetails,
            duration,
            isBusinessTravel,
            isInsurance,
            isCovidDonated,
            bookingDate,
            type // 'bus' | 'cab' | 'train'
        } = req.body;

        // Find associated bus (or operator)
        let operatorId = "60c72b2f9b1d8b22a0f8eb01"; // fallback default operator ID
        let busName = "RedBus Express";
        let busNumber = "DL-01-AB-1234";

        if (busId && busId.length === 24) {
            const bus = await Bus.findById(busId);
            if (bus) {
                operatorId = bus.operatorId;
                busName = bus.busName;
                busNumber = bus.busNumber;
            }
        }

        // Generate booking ID
        const bookingId = "RB-" + Math.floor(100000 + Math.random() * 900000);

        // Fetch user account email if customerId is valid
        let userEmail = null;
        if (customerId && customerId.length === 24) {
            try {
                const userObj = await User.findById(customerId);
                if (userObj) {
                    userEmail = userObj.email;
                }
            } catch (userErr) {
                console.error("Error fetching user account for booking:", userErr);
            }
        }

        // Normalize passenger list
        const passengers = (passengerDetails || []).map(p => ({
            name: p.name || "Passenger",
            email: email || "passenger@redbus-clone.com",
            phone: phoneNumber || "9999999999",
            gender: p.gender || "male",
            age: p.age || 30
        }));

        // Normalize seats to an array of strings
        let normalizedSeats = ["1A"];
        if (Array.isArray(seats)) {
            normalizedSeats = seats;
        } else if (typeof seats === "string") {
            normalizedSeats = seats.split(",").map(s => s.trim());
        } else if (seats) {
            normalizedSeats = [String(seats)];
        }

        const booking = new Booking({
            bookingId,
            user: customerId || "60c72b2f9b1d8b22a0f8eb00", // fallback user ID
            bus: busId || "60c72b2f9b1d8b22a0f8eb02", // fallback bus ID
            operator: operatorId,
            source: {
                city: departureDetails?.city || "Source",
                state: "State"
            },
            destination: {
                city: arrivalDetails?.city || "Destination",
                state: "State"
            },
            journeyDate: departureDetails?.date ? new Date(departureDetails.date) : new Date(),
            departureTime: departureDetails?.time || "12",
            arrivalTime: arrivalDetails?.time || "18",
            passengers,
            seats: normalizedSeats,
            seatsCount: normalizedSeats.length,
            baseFare: fare || 500,
            totalFare: fare || 500,
            paymentMethod: "upi",
            paymentStatus: "completed",
            bookingStatus: "completed", // Auto-mark completed for immediate reviews testing
            isBusinessTravel: !!isBusinessTravel,
            insurance: {
                included: !!isInsurance,
                amount: isInsurance ? 15 : 0
            },
            primaryContact: {
                email: email || "customer@redbus-clone.com",
                phone: phoneNumber || "9999999999"
            },
            metadata: {
                type: type || "bus",
                isCovidDonated: !!isCovidDonated,
                duration: duration || "6 hours"
            }
        });

        const newBooking = await booking.save();

        // Send transactional email
        const emailsToSend = new Set();
        if (email) emailsToSend.add(email.trim().toLowerCase());
        if (userEmail) emailsToSend.add(userEmail.trim().toLowerCase());
        if (emailsToSend.size === 0) {
            emailsToSend.add("customer@redbus-clone.com");
        }

        for (const recipient of emailsToSend) {
            try {
                await sendEmail({
                    to: recipient,
                    subject: `Booking Confirmed! ${bookingId}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                            <h2 style="color: #d02b2b; text-align: center;">🎉 Booking Confirmation</h2>
                            <p>Thank you for choosing RedBus. Your booking is confirmed!</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <table style="width: 100%; font-size: 14px; line-height: 24px;">
                                <tr><td><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
                                <tr><td><strong>Journey Type:</strong></td><td>${(type || "Bus").toUpperCase()}</td></tr>
                                <tr><td><strong>Route:</strong></td><td>${departureDetails?.city || "Source"} to ${arrivalDetails?.city || "Destination"}</td></tr>
                                <tr><td><strong>Date & Time:</strong></td><td>${departureDetails?.date || "Today"} at ${departureDetails?.time || "12"}:00 hrs</td></tr>
                                <tr><td><strong>Seats booked:</strong></td><td>${normalizedSeats.join(", ")}</td></tr>
                                <tr><td><strong>Total Fare paid:</strong></td><td>INR ${fare || 500}</td></tr>
                            </table>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888;">For dynamic schedules or cancellations, visit the My Trips section in your profile.</p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error(`Mailer send failure to ${recipient} in checkout:`, mailErr);
            }
        }

        res.status(201).json(newBooking);
    } catch (err) {
        console.error("Error creating booking:", err);
        res.status(500).json({ error: "Internal server error", message: err.message });
    }
}

exports.getBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await Booking.find({ user: id }).populate("bus").populate("review").lean().exec();

        // Map database objects back to legacy attributes
        const mapped = bookings.map(b => ({
            _id: b._id,
            customerId: b.user,
            busId: b.bus?._id || b.bus,
            departureDetails: {
                city: b.source?.city || "Source",
                time: b.departureTime || "00",
                date: b.journeyDate ? new Date(b.journeyDate).toISOString().split('T')[0] : ""
            },
            arrivalDetails: {
                city: b.destination?.city || "Destination",
                time: b.arrivalTime || "00",
                date: b.journeyDate ? new Date(b.journeyDate).toISOString().split('T')[0] : ""
            },
            passengerDetails: (b.passengers || []).map(p => ({
                name: p.name,
                gender: p.gender,
                age: p.age
            })),
            fare: b.totalFare || b.baseFare || 0,
            status: b.bookingStatus || "completed",
            type: b.metadata?.type || "bus",
            bookingId: b.bookingId,
            email: b.primaryContact?.email || (b.passengers && b.passengers[0]?.email) || "",
            phoneNumber: b.primaryContact?.phone || (b.passengers && b.passengers[0]?.phone) || "",
            hasReviewed: b.hasReviewed || false,
            reviewRating: b.reviewRating,
            review: b.review || null
        }));

        res.send(mapped);
    } catch (err) {
        console.error("Error retrieving bookings:", err);
        res.status(500).json({ error: "Internal server error", message: err.message });
    }
}