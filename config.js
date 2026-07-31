// config.js - names of the API endpoints used by each page

// Used by the details page
const DETAILS_ENDPOINTS = {
    hotelDetails: 'getHotelDetails',
    availability: 'getAvailability',
    qna: 'getQuestionAndAnswer',
    attractions: 'getPopularAttractionNearBy',
    reviews: 'getHotelReviewScores',
    photos: 'getHotelPhotos',
    policies: 'getHotelPolicies'
};

// Used by the homepage and the search results page
const HOMEPAGE_ENDPOINTS = {
    searchDestination: 'searchDestination',
    searchHotels: 'searchHotels'
};
