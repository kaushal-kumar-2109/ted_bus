const Customer = require('../models/customer');
const { generateAccessToken } = require("../utils/generateToken");

exports.addnewcustomer = async (req, res) => {
    try {
        const { name, email, googleId, profilepicture } = req.body;
        
        let existingCustomer = await Customer.findOne({ email: email });
        
        if (existingCustomer) {
            // Auto-verify if not already verified for a professional demo experience
            if (!existingCustomer.isProfileVerified || !existingCustomer.canPostContent) {
                existingCustomer.isProfileVerified = true;
                existingCustomer.canPostContent = true;
                existingCustomer.verificationStatus = "approved";
                existingCustomer.verificationBadge = "gold";
                await existingCustomer.save();
            }
            
            const payload = { userId: existingCustomer._id, email: existingCustomer.email, role: existingCustomer.role };
            const token = generateAccessToken(payload);
            
            return res.status(200).json({
                success: true,
                user: {
                    id: existingCustomer._id,
                    _id: existingCustomer._id,
                    name: existingCustomer.fullName || `${existingCustomer.firstName} ${existingCustomer.lastName}`,
                    email: existingCustomer.email,
                    profilepicture: existingCustomer.profilePicture || profilepicture
                },
                token
            });
        } else {
            // Split name into first and last name
            const nameParts = (name || "Google User").split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || "User";
            
            // Generate unique phone and dummy password
            const cleanGoogleId = (googleId || "").replace(/\D/g, "");
            const phone = "9" + (cleanGoogleId.substring(cleanGoogleId.length - 9) || Math.floor(100000000 + Math.random() * 900000000));
            const password = Math.random().toString(36).substring(7) + "Aa1!";
            
            const customer = new Customer({
                firstName,
                lastName,
                email,
                phone,
                password,
                profilePicture: profilepicture,
                isProfileVerified: true,
                canPostContent: true,
                verificationStatus: "approved",
                verificationBadge: "gold",
                isEmailVerified: true,
                isPhoneVerified: true
            });
            
            const newCustomer = await customer.save();
            
            const payload = { userId: newCustomer._id, email: newCustomer.email, role: newCustomer.role };
            const token = generateAccessToken(payload);
            
            return res.status(201).json({
                success: true,
                user: {
                    id: newCustomer._id,
                    _id: newCustomer._id,
                    name: `${newCustomer.firstName} ${newCustomer.lastName}`,
                    email: newCustomer.email,
                    profilepicture: newCustomer.profilePicture
                },
                token
            });
        }
    } catch (error) {
        console.error('error adding customer', error);
        res.status(500).json({ success: false, error: "internal server error", message: error.message });
    }
}