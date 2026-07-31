// details-service.js - API Service for Hotel Details Page
class DetailsService {
    constructor() {
        this.config = this.getApiConfig();
        
        this.endpoints = typeof DETAILS_ENDPOINTS !== 'undefined' ? DETAILS_ENDPOINTS : {
            hotelDetails: 'getHotelDetails',
            availability: 'getAvailability',
            qna: 'getQuestionAndAnswer',
            attractions: 'getPopularAttractionNearBy',
            reviews: 'getHotelReviewScores',
            photos: 'getHotelPhotos',
            policies: 'getHotelPolicies'
        };
    }

    // Get API configuration from API_Key.js
    getApiConfig() {
        if (typeof API_CONFIG !== 'undefined') {
            return API_CONFIG;
        }

        console.warn('API_CONFIG not found. Copy API_Key.example.js to API_Key.js and add your key.');
        return this.getFallbackConfig();
    }

    // Fallback configuration
    getFallbackConfig() {
        return {
            baseUrl: 'https://booking-com15.p.rapidapi.com/api/v1/hotels',
            headers: {
                'x-rapidapi-key': '',
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            },
            cacheExpiry: 24 * 60 * 60 * 1000
        };
    }

    // Generate cache key from endpoint and params
    generateCacheKey(endpoint, params) {
        return `booking_details_${endpoint}_${JSON.stringify(params)}`;
    }

    // Check if cache is valid
    isCacheValid(cacheKey) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (!cachedData) return false;

            const parsedData = JSON.parse(cachedData);
            const now = Date.now();
            return (now - parsedData.timestamp) < this.config.cacheExpiry;
        } catch (error) {
            console.error('Error checking cache validity:', error);
            return false;
        }
    }

    // Get data from cache
    getFromCache(cacheKey) {
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                return parsedData.data;
            }
        } catch (error) {
            console.error('Error retrieving from cache:', error);
        }
        return null;
    }

    // Save data to cache
    saveToCache(cacheKey, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('Data saved to cache:', cacheKey);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    // Make API request
    async makeRequest(endpoint, params) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            console.log('Using cached data for:', endpoint);
            return this.getFromCache(cacheKey);
        }

        // Build URL with parameters
        const urlParams = new URLSearchParams(params);
        const url = `${this.config.baseUrl}/${endpoint}?${urlParams.toString()}`;

        console.log('Making API request to:', endpoint);

        try {
            // The API sends CORS headers, so the browser can call it directly.
            const response = await fetch(url, {
                method: 'GET',
                headers: this.config.headers
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API response received for:', endpoint);
            
            // Validate response structure
            if (!data || data.status === false) {
                throw new Error('Invalid API response structure');
            }
            
            // Save to cache
            this.saveToCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('API request error:', error);
            
            // Fallback to cached data even if expired
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) {
                console.log('Using expired cached data as fallback');
                return cachedData;
            }
            
            throw error;
        }
    }

    // Get hotel details
    async getHotelDetails(hotelId, searchParams = {}) {
        const fallback = DetailsService.defaultDates();
        const params = {
            hotel_id: hotelId,
            adults: searchParams.adults || 2,
            children_age: searchParams.children_age || '',
            room_qty: searchParams.room_qty || 1,
            units: searchParams.units || 'metric',
            temperature_unit: searchParams.temperature_unit || 'c',
            languagecode: searchParams.languagecode || 'en-us',
            currency_code: searchParams.currency_code || 'USD',
            arrival_date: searchParams.arrival_date || fallback.arrival,
            departure_date: searchParams.departure_date || fallback.departure
        };

        return await this.makeRequest(this.endpoints.hotelDetails, params);
    }

    static defaultDates() {
        const iso = date => date.toISOString().split('T')[0];
        const shift = (from, days) => {
            const next = new Date(from);
            next.setDate(next.getDate() + days);
            return next;
        };
        const arrival = shift(new Date(), 21);
        return { arrival: iso(arrival), departure: iso(shift(arrival, 3)) };
    }

    // Get room availability
    async getAvailability(hotelId, searchParams = {}) {
        const fallback = DetailsService.defaultDates();
        const params = {
            hotel_id: hotelId,
            min_date: searchParams.min_date || fallback.arrival,
            max_date: searchParams.max_date || fallback.departure,
            room_qty: searchParams.room_qty || 1,
            adults: searchParams.adults || 2,
            currency_code: searchParams.currency_code || 'USD',
            location: searchParams.location || 'US'
        };

        return await this.makeRequest(this.endpoints.availability, params);
    }

    // Get questions and answers
    async getQnA(hotelId, languagecode = 'en-us') {
        const params = {
            hotel_id: hotelId,
            languagecode: languagecode
        };
        
        return await this.makeRequest(this.endpoints.qna, params);
    }

    // Get popular attractions nearby
    async getAttractions(hotelId, languagecode = 'en-us') {
        const params = {
            hotel_id: hotelId,
            languagecode: languagecode
        };
        
        return await this.makeRequest(this.endpoints.attractions, params);
    }

    // Get hotel review scores
    async getReviewScores(hotelId, languagecode = 'en-us') {
        const params = {
            hotel_id: hotelId,
            languagecode: languagecode
        };
        
        return await this.makeRequest(this.endpoints.reviews, params);
    }

    // Get hotel photos
    async getHotelPhotos(hotelId) {
        const params = {
            hotel_id: hotelId
        };
        
        return await this.makeRequest(this.endpoints.photos, params);
    }

    // Get hotel policies
    async getHotelPolicies(hotelId, languagecode = 'en-us') {
        const params = {
            hotel_id: hotelId,
            languagecode: languagecode
        };
        
        return await this.makeRequest(this.endpoints.policies, params);
    }
}
