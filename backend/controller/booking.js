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
            paymentStatus: req.body.status || "completed",
            bookingStatus: req.body.status || "completed", // respect status if pending
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

        if (booking.bookingStatus === "completed") {
            // Auto-verify user after completing a journey booking
            if (customerId && customerId.length === 24) {
                try {
                    await User.findByIdAndUpdate(customerId, {
                        isProfileVerified: true,
                        canPostContent: true,
                        verificationStatus: "approved",
                        verificationBadge: "gold"
                    });
                } catch (userErr) {
                    console.error("Error auto-verifying user on booking completion:", userErr);
                }
            }

            // Generate PDF ticket
            const { generateTicketPDF } = require("../utils/pdfGenerator");
            let pdfBuffer = null;
            try {
                const populated = await Booking.findById(newBooking._id)
                    .populate("user")
                    .populate("bus")
                    .populate("operator");
                if (populated) {
                    pdfBuffer = await generateTicketPDF(populated);
                }
            } catch (pdfErr) {
                console.error("Error generating ticket PDF:", pdfErr);
            }

            // Send transactional email
            const emailsToSend = new Set();
            if (email) emailsToSend.add(email.trim().toLowerCase());
            if (userEmail) emailsToSend.add(userEmail.trim().toLowerCase());
            if (emailsToSend.size === 0) {
                emailsToSend.add("customer@redbus-clone.com");
            }

            const emailAttachments = [];
            if (pdfBuffer) {
                emailAttachments.push({
                    filename: `ticket_${bookingId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                });
            }

            for (const recipient of emailsToSend) {
                sendEmail({
                    to: recipient,
                    subject: `Booking Confirmed! ${bookingId}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                            <h2 style="color: #d02b2b; text-align: center;">🎉 Booking Confirmation</h2>
                            <p>Thank you for choosing RedBus. Your booking is confirmed! We have attached your official e-ticket PDF to this email.</p>
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
                            <p style="font-size: 12px; color: #888;">For dynamic schedules or cancellations, visit the My Trips section in your profile. You can also download the PDF ticket directly from the portal at any time.</p>
                        </div>
                    `,
                    attachments: emailAttachments
                }).catch((mailErr) => {
                    console.error(`Mailer send failure to ${recipient} in checkout:`, mailErr);
                });
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

exports.downloadTicket = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("user")
            .populate("bus")
            .populate("operator");

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const { generateTicketPDF } = require("../utils/pdfGenerator");
        const pdfBuffer = await generateTicketPDF(booking);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=ticket_${booking.bookingId}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error("Error generating ticket download PDF:", err);
        res.status(500).json({ error: "Internal server error", message: err.message });
    }
};

exports.triggerSearchAbandonmentImmediate = async (req, res) => {
    try {
        const { source, destination, date } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!source || !destination) {
            return res.status(400).json({ message: "Source and destination are required" });
        }

        // Fetch other buses on the same route
        const otherBuses = await Bus.find({
            "source.city": new RegExp(source, "i"),
            "destination.city": new RegExp(destination, "i")
        }).limit(3);

        const busListHtml = otherBuses.map(b => 
            `<li><strong>${b.busName}</strong> (${b.busNumber}) - Departure: ${b.departureTime}:00 hrs, Fare: INR ${b.totalFare}</li>`
        ).join("");

        const title = "Incomplete Search: Finish Planning Your Trip! 🚌";
        const message = `You searched for buses from ${source} to ${destination}. Finish booking now and get 15% off using code REDBUS15!`;

        // Create in-app notification
        const Notification = require("../models/notification");
        await Notification.create({
            recipient: userId,
            type: "system",
            title,
            message,
            link: `/`
        });

        // Send email
        sendEmail({
            to: user.email,
            subject: `Special Offer: Finish booking from ${source} to ${destination}!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                    <h2 style="color: #d02b2b;">🚌 Finish Your Trip Planning!</h2>
                    <p>Hello ${user.firstName || 'User'},</p>
                    <p>We noticed you searched for travel options from <strong>${source}</strong> to <strong>${destination}</strong> but didn't complete your booking.</p>
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #d97706; margin-top: 0;">🎉 Special 15% Discount Code</h3>
                        <p style="margin: 0; font-size: 16px;">Use coupon code <strong>REDBUS15</strong> at checkout to get an instant 15% off!</p>
                    </div>
                    <h3>Other available buses for your route:</h3>
                    <ul>
                        ${busListHtml || "<li>No alternative buses found. Check portal for more updates.</li>"}
                    </ul>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p>Click <a href="http://localhost:4200/" style="color: #d02b2b; font-weight: bold; text-decoration: none;">here</a> to return to the search list and finish booking.</p>
                </div>
            `
        }).catch((mailErr) => {
            console.error("Search abandonment mailer failure:", mailErr);
        });

        res.status(200).json({ success: true, message: "Real-time search abandonment notification sent" });
    } catch (err) {
        console.error("Error in immediate search abandonment:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.triggerPaymentAbandonmentImmediate = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required" });
        }

        const Booking = require("../models/booking");
        const booking = await Booking.findById(bookingId);

        // Send immediately if payment is not completed
        if (booking && booking.paymentStatus !== "completed") {
            const title = "Finish Your Booking Payment! ⚠️";
            const message = `Your booking ${booking.bookingId} from ${booking.source?.city} to ${booking.destination?.city} is incomplete. Complete payment now to secure your seat.`;

            // Create in-app notification
            const Notification = require("../models/notification");
            await Notification.create({
                recipient: userId,
                type: "system",
                title,
                message,
                link: `/profile?tab=trips`
            });

            // Send email
            sendEmail({
                to: user.email,
                subject: `Urgent: Incomplete payment for booking ${booking.bookingId}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                        <h2 style="color: #d02b2b;">⚠️ Complete Your Payment</h2>
                        <p>Hello ${user.firstName || 'User'},</p>
                        <p>You reached the payment stage for booking <strong>${booking.bookingId}</strong> (${booking.source?.city} to ${booking.destination?.city}) but turned back before finishing the transaction.</p>
                        <p style="color: #d02b2b; font-weight: bold;">Your booking is NOT completed yet, and your seats are not reserved!</p>
                        <p>Seats are filling up fast. Please click the button below to finish your payment and complete your booking:</p>
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="http://localhost:4200/profile?tab=trips" style="background-color: #d02b2b; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Finish Payment</a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 11px; color: #888;">If you did not initiate this transaction, please ignore this email.</p>
                    </div>
                `
            }).catch((mailErr) => {
                console.error("Payment abandonment mailer failure:", mailErr);
            });

            res.status(200).json({ success: true, message: "Real-time payment abandonment notification sent" });
        } else {
            res.status(200).json({ success: false, message: "Booking already completed" });
        }
    } catch (err) {
        console.error("Error in immediate payment abandonment:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.confirmPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.paymentStatus === "completed") {
            return res.status(200).json({ success: true, message: "Booking already completed", booking });
        }

        booking.paymentStatus = "completed";
        booking.bookingStatus = "completed";
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        // 1. Fetch user email & auto-verify
        const User = require("../models/customer");
        let userEmail = null;
        if (booking.user) {
            try {
                const userObj = await User.findById(booking.user);
                if (userObj) {
                    userEmail = userObj.email;
                    await User.findByIdAndUpdate(booking.user, {
                        isProfileVerified: true,
                        canPostContent: true,
                        verificationStatus: "approved",
                        verificationBadge: "gold"
                    });
                }
            } catch (userErr) {
                console.error("Error auto-verifying user:", userErr);
            }
        }

        // 1.5 Create in-app notification in database
        if (booking.user) {
            try {
                const Notification = require("../models/notification");
                await Notification.create({
                    recipient: booking.user,
                    type: "booking_confirmed",
                    title: "Booking Confirmed! 🎉",
                    message: `Your booking ${booking.bookingId} from ${booking.source?.city || "Source"} to ${booking.destination?.city || "Destination"} is confirmed!`,
                    link: `/profile?tab=trips`,
                    entityType: "booking",
                    entityId: booking._id
                });
            } catch (notifyErr) {
                console.error("Error creating booking confirmation notification:", notifyErr);
            }
        }

        // 2. Generate PDF ticket
        const { generateTicketPDF } = require("../utils/pdfGenerator");
        let pdfBuffer = null;
        try {
            const populated = await Booking.findById(updatedBooking._id)
                .populate("user")
                .populate("bus")
                .populate("operator");
            if (populated) {
                pdfBuffer = await generateTicketPDF(populated);
            }
        } catch (pdfErr) {
            console.error("Error generating ticket PDF:", pdfErr);
        }

        // 3. Send transactional email
        const emailsToSend = new Set();
        if (booking.primaryContact?.email) emailsToSend.add(booking.primaryContact.email.trim().toLowerCase());
        if (userEmail) emailsToSend.add(userEmail.trim().toLowerCase());
        if (emailsToSend.size === 0) {
            emailsToSend.add("customer@redbus-clone.com");
        }

        const emailAttachments = [];
        if (pdfBuffer) {
            emailAttachments.push({
                filename: `ticket_${booking.bookingId}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf"
            });
        }

        for (const recipient of emailsToSend) {
            sendEmail({
                to: recipient,
                subject: `Booking Confirmed! ${booking.bookingId}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                        <h2 style="color: #d02b2b; text-align: center;">🎉 Booking Confirmation</h2>
                        <p>Thank you for choosing RedBus. Your booking is confirmed! We have attached your official e-ticket PDF to this email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <table style="width: 100%; font-size: 14px; line-height: 24px;">
                            <tr><td><strong>Booking ID:</strong></td><td>${booking.bookingId}</td></tr>
                            <tr><td><strong>Journey Type:</strong></td><td>BUS</td></tr>
                            <tr><td><strong>Route:</strong></td><td>${booking.source?.city || "Source"} to ${booking.destination?.city || "Destination"}</td></tr>
                            <tr><td><strong>Date & Time:</strong></td><td>${booking.journeyDate || "Today"} at ${booking.departureTime || "12"}:00 hrs</td></tr>
                            <tr><td><strong>Seats booked:</strong></td><td>${booking.seats.join(", ")}</td></tr>
                            <tr><td><strong>Total Fare paid:</strong></td><td>INR ${booking.totalFare || 500}</td></tr>
                        </table>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #888;">For dynamic schedules or cancellations, visit the My Trips section in your profile. You can also download the PDF ticket directly from the portal at any time.</p>
                    </div>
                `,
                attachments: emailAttachments
            }).catch((mailErr) => {
                console.error(`Mailer send failure to ${recipient} in confirmPayment:`, mailErr);
            });
        }

        res.status(200).json(updatedBooking);
    } catch (err) {
        console.error("Error confirming booking payment:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};