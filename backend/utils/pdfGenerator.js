const PDFDocument = require("pdfkit");

/**
 * Generate a PDF Ticket Buffer from a Booking document
 * @param {Object} booking - Populated Booking model instance
 * @returns {Promise<Buffer>}
 */
const generateTicketPDF = (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Color Palette
      const brandColor = "#d84e55"; // RedBus Red
      const darkColor = "#1f2937";  // Dark Gray
      const lightBg = "#f9fafb";    // Off-white
      const borderTheme = "#e5e7eb"; // Light border

      // ────────────────────────────────────────────────────────
      // HEADER SECTION
      // ────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 100).fill(brandColor);

      // Logo Text & Slogan
      doc.fillColor("#ffffff").fontSize(26).font("Helvetica-Bold").text("redBus Clone", 40, 25);
      doc.fontSize(10).font("Helvetica-Oblique").text("No. 1 Online Booking Experience", 40, 56);

      // Booking Reference (Right aligned in header)
      doc.fillColor("#ffffff").fontSize(10).font("Helvetica").text("TICKET REF NUMBER", 420, 25, { align: "right" });
      doc.fontSize(16).font("Helvetica-Bold").text(booking.bookingId || "N/A", 420, 40, { align: "right" });
      doc.fontSize(10).font("Helvetica").text(`Status: ${(booking.bookingStatus || "Confirmed").toUpperCase()}`, 420, 60, { align: "right" });

      // Move cursor past the header banner
      doc.y = 120;

      // ────────────────────────────────────────────────────────
      // ROUTE & JOURNEY DETAILS
      // ────────────────────────────────────────────────────────
      const journeyType = (booking.metadata?.type || "bus").toUpperCase();
      doc.fillColor(brandColor).fontSize(14).font("Helvetica-Bold").text(`${journeyType} TICKET & JOURNEY DETAILS`);
      doc.moveDown(0.3);

      // Draw gray box for journey details
      doc.rect(40, doc.y, doc.page.width - 80, 110).fill(lightBg).stroke(borderTheme);
      
      const boxTop = doc.y + 15;
      doc.fillColor(darkColor);

      // Left column: Source & Destination
      doc.fontSize(10).font("Helvetica-Bold").text("FROM", 60, boxTop);
      doc.fontSize(14).text(booking.source?.city || "Source City", 60, boxTop + 15);
      doc.fontSize(9).font("Helvetica-Oblique").text(`Departure: ${booking.departureTime || "00"}:00 hrs`, 60, boxTop + 35);

      doc.fontSize(10).font("Helvetica-Bold").text("TO", 60, boxTop + 55);
      doc.fontSize(14).text(booking.destination?.city || "Destination City", 60, boxTop + 70);
      doc.fontSize(9).font("Helvetica-Oblique").text(`Arrival: ${booking.arrivalTime || "00"}:00 hrs`, 60, boxTop + 90);

      // Middle Column: Date & Duration
      const dateString = booking.journeyDate ? new Date(booking.journeyDate).toDateString() : "Today";
      doc.fontSize(10).font("Helvetica-Bold").text("DATE OF JOURNEY", 250, boxTop);
      doc.fontSize(11).font("Helvetica").text(dateString, 250, boxTop + 15);
      
      doc.fontSize(10).font("Helvetica-Bold").text("ESTIMATED DURATION", 250, boxTop + 50);
      doc.fontSize(11).font("Helvetica").text(booking.metadata?.duration || "6 Hours", 250, boxTop + 65);

      // Right Column: Carrier Details
      const carrierName = booking.operator?.operatorName || booking.bus?.operatorName || "RedBus Express";
      const busNum = booking.bus?.busNumber || "DL-01-AB-1234";
      const busName = booking.bus?.busName || "Sleeper Class";
      
      doc.fontSize(10).font("Helvetica-Bold").text("OPERATOR / COMPANY", 400, boxTop);
      doc.fontSize(11).font("Helvetica").text(carrierName, 400, boxTop + 15);
      
      doc.fontSize(10).font("Helvetica-Bold").text("VEHICLE / SERVICE INFO", 400, boxTop + 50);
      doc.fontSize(10).font("Helvetica").text(`${busName}`, 400, boxTop + 65);
      doc.fontSize(10).font("Helvetica-Bold").text(`No: ${busNum}`, 400, boxTop + 78);

      // Move below the journey details box
      doc.y = boxTop + 115;

      // ────────────────────────────────────────────────────────
      // PASSENGER DETAILS TABLE
      // ────────────────────────────────────────────────────────
      doc.fillColor(brandColor).fontSize(14).font("Helvetica-Bold").text("PASSENGER DETAILS");
      doc.moveDown(0.3);

      const tableTop = doc.y;
      
      // Draw Table Header
      doc.rect(40, tableTop, doc.page.width - 80, 20).fill(brandColor);
      doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
      doc.text("S.No.", 50, tableTop + 5);
      doc.text("Passenger Name", 100, tableTop + 5);
      doc.text("Gender / Age", 280, tableTop + 5);
      doc.text("Seat / Berth", 400, tableTop + 5);
      doc.text("Total Paid", 500, tableTop + 5);

      let rowY = tableTop + 20;
      const passengers = booking.passengers || [];
      const seats = booking.seats || ["1A"];

      passengers.forEach((p, index) => {
        // Alternating row background
        if (index % 2 === 0) {
          doc.rect(40, rowY, doc.page.width - 80, 20).fill("#f3f4f6");
        }
        
        doc.fillColor(darkColor).fontSize(9).font("Helvetica");
        doc.text(String(index + 1), 50, rowY + 5);
        doc.text(p.name || "Passenger", 100, rowY + 5);
        doc.text(`${(p.gender || "M").toUpperCase()} / ${p.age || 30} yrs`, 280, rowY + 5);
        doc.text(seats[index] || seats[0] || "N/A", 400, rowY + 5);
        doc.text(`INR ${booking.totalFare || booking.baseFare || 500}`, 500, rowY + 5);
        
        rowY += 20;
      });

      // Draw table borders
      doc.rect(40, tableTop, doc.page.width - 80, rowY - tableTop).stroke(borderTheme);

      doc.y = rowY + 15;

      // ────────────────────────────────────────────────────────
      // BOOKED BY & PAYMENT SUMMARY
      // ────────────────────────────────────────────────────────
      const splitY = doc.y;
      
      // Left side: Booked By details
      doc.fillColor(brandColor).fontSize(12).font("Helvetica-Bold").text("BOOKED BY DETAILS", 40, splitY);
      doc.moveDown(0.3);
      doc.fillColor(darkColor).fontSize(9).font("Helvetica");
      
      const bookerName = booking.primaryContact?.name || (booking.user ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() : "RedBus Customer");
      doc.text(`Name:  ${bookerName}`, 40);
      doc.text(`Email: ${booking.primaryContact?.email || "customer@redbus-clone.com"}`, 40);
      doc.text(`Phone: +91 ${booking.primaryContact?.phone || "9999999999"}`, 40);
      
      if (booking.isBusinessTravel && booking.businessDetails) {
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").text("GST Invoice Details:", 40);
        doc.font("Helvetica").text(`Company: ${booking.businessDetails.companyName || ""}`, 40);
        doc.font("Helvetica").text(`GSTIN:   ${booking.businessDetails.gstNumber || ""}`, 40);
      }

      // Right side: Payment Details
      doc.fillColor(brandColor).fontSize(12).font("Helvetica-Bold").text("PAYMENT SUMMARY", 320, splitY);
      doc.moveDown(0.3);
      doc.fillColor(darkColor).fontSize(9).font("Helvetica");
      
      const basePrice = booking.baseFare || (booking.totalFare - 15);
      doc.text(`Base Fare:`, 320, doc.y, { continued: true }).text(`INR ${basePrice}`, { align: "right" });
      doc.text(`Insurance:`, 320, doc.y, { continued: true }).text(`INR ${booking.insurance?.included ? booking.insurance.amount : 0}`, { align: "right" });
      doc.text(`Taxes & GST:`, 320, doc.y, { continued: true }).text(`INR ${booking.taxes || 0}`, { align: "right" });
      
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").text(`Total Paid:`, 320, doc.y, { continued: true }).text(`INR ${booking.totalFare}`, { align: "right" });
      doc.fontSize(8).font("Helvetica-Oblique").text(`Paid via ${booking.paymentMethod?.toUpperCase() || "UPI"} - Transaction Complete`, 320, doc.y + 3);

      doc.y = Math.max(doc.y, splitY + 100) + 15;

      // ────────────────────────────────────────────────────────
      // TERMS & CONDITIONS
      // ────────────────────────────────────────────────────────
      doc.fillColor(brandColor).fontSize(11).font("Helvetica-Bold").text("TERMS & CONDITIONS", 40);
      doc.moveDown(0.3);
      
      doc.fillColor("#6b7280").fontSize(7.5).font("Helvetica").text(
        "1. Boarding reporting time: Please report at the boarding point at least 15 minutes before the scheduled departure time.\n" +
        "2. Identity check: Passengers must carry a valid government-issued photo identity card (Aadhaar, Passport, Driving License, etc.) during travel.\n" +
        "3. Luggage limit: A maximum of 15kg personal luggage per passenger is allowed. Valuable items are carried at owner's risk.\n" +
        "4. Cancellation policy: Cancellations can be requested via the 'My Trips' portal. Refund percentages vary depending on operator policies.\n" +
        "5. Contact carrier: In case of delay or queries, contact the operator at the customer service number provided in the portal.\n" +
        "6. Covid guidelines: Passengers are requested to follow local government travel guidelines and wear face masks if recommended.",
        40, doc.y, { lineGap: 3 }
      );

      // Footer brand signoff
      doc.moveDown(2);
      doc.fillColor("#9ca3af").fontSize(8).text("Thank you for traveling with redBus Clone! Have a safe and happy journey.", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTicketPDF };
