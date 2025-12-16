// OTP Cleanup Service
// Automatically clears expired OTP fields from user documents
// This clears only the OTP fields, NOT the entire user account

const UserModel = require('../Models/User');

/**
 * Clean up expired OTP fields from all users
 * This function finds users with expired OTPs and clears those fields
 */
async function cleanupExpiredOTPs() {
    try {
        const now = new Date();

        // Find users with expired reset OTPs
        const result = await UserModel.updateMany(
            {
                resetOTPExpires: { $ne: null, $lt: now }
            },
            {
                $set: {
                    resetOTP: '',
                    resetOTPExpires: null
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`🧹 Cleaned up ${result.modifiedCount} expired OTP(s) at ${now.toISOString()}`);
        }
    } catch (error) {
        console.error('❌ Error cleaning up expired OTPs:', error.message);
    }
}

/**
 * Start the OTP cleanup service
 * Runs cleanup every 5 minutes
 */
function startOTPCleanupService() {
    // Run cleanup immediately on startup
    cleanupExpiredOTPs();

    // Then run every 5 minutes (300000 ms)
    const intervalId = setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

    console.log('✅ OTP Cleanup Service started - runs every 5 minutes');

    // Return the interval ID in case we need to stop it
    return intervalId;
}

module.exports = {
    cleanupExpiredOTPs,
    startOTPCleanupService
};
