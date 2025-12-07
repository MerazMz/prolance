const UserModel = require('../Models/User');
const { sendOTPEmail } = require('../services/emailService');
const bcrypt = require('bcrypt');

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP - accepts username or email
const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body; // Can be email or username

        if (!identifier) {
            return res.status(400).json({
                message: 'Please provide email or username',
                success: false
            });
        }

        // Find user by email or username
        const user = await UserModel.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'No account found with this email or username',
                success: false
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with OTP
        user.resetOTP = otp;
        user.resetOTPExpires = otpExpires;
        await user.save();

        // Send OTP email
        try {
            await sendOTPEmail(user.email, user.name, otp);

            res.status(200).json({
                message: 'OTP sent to your email successfully',
                success: true,
                email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for privacy
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            return res.status(500).json({
                message: 'Failed to send OTP email. Please try again.',
                success: false
            });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp) {
            return res.status(400).json({
                message: 'Email/username and OTP are required',
                success: false
            });
        }

        // Find user
        const user = await UserModel.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Check if OTP exists
        if (!user.resetOTP) {
            return res.status(400).json({
                message: 'No OTP request found. Please request a new OTP.',
                success: false
            });
        }

        // Check if OTP is expired
        if (user.resetOTPExpires < Date.now()) {
            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.',
                success: false
            });
        }

        // Verify OTP
        if (user.resetOTP !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP. Please try again.',
                success: false
            });
        }

        // OTP is valid
        res.status(200).json({
            message: 'OTP verified successfully',
            success: true,
            email: user.email
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Reset password with verified OTP
const resetPassword = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;

        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({
                message: 'All fields are required',
                success: false
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
                success: false
            });
        }

        // Find user
        const user = await UserModel.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Verify OTP again
        if (!user.resetOTP || user.resetOTP !== otp) {
            return res.status(400).json({
                message: 'Invalid OTP',
                success: false
            });
        }

        if (user.resetOTPExpires < Date.now()) {
            return res.status(400).json({
                message: 'OTP has expired',
                success: false
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.resetOTP = '';
        user.resetOTPExpires = null;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully',
            success: true
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

module.exports = {
    forgotPassword,
    verifyOTP,
    resetPassword
};
