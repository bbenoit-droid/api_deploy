// API_Key.example.js - template for the API configuration
//
// Copy this file to API_Key.js and paste your own RapidAPI key below.
// API_Key.js is listed in .gitignore so the real key is never committed.
//
// Get a free key by subscribing to the Booking.com API on RapidAPI:
// https://rapidapi.com/DataCrawler/api/booking-com15

const API_CONFIG = {
    baseUrl: 'https://booking-com15.p.rapidapi.com/api/v1/hotels',
    headers: {
        'x-rapidapi-key': 'PASTE_YOUR_RAPIDAPI_KEY_HERE',
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
    },
    cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG };
}
