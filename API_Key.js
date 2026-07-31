// API_Key.js - Centralized API Configuration
//
// This file holds the RapidAPI key and is listed in .gitignore so it is not
// committed. See API_Key.example.js for the template.

const API_CONFIG = {
    baseUrl: 'https://booking-com15.p.rapidapi.com/api/v1/hotels',
    headers: {
        'x-rapidapi-key': 'df63a52205mshee02062c6a569d7p17be64jsna7f1f6521830',
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
    },
    cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG };
}
