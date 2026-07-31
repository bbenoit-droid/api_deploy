// api-service.js - API Service with Caching
class ApiService {
    constructor() {
        // Use global API_CONFIG from API_Key.js
        this.config = typeof API_CONFIG !== 'undefined' ? API_CONFIG : {
            baseUrl: 'https://booking-com15.p.rapidapi.com/api/v1/hotels',
            headers: {
                'x-rapidapi-key': '',
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            },
            cacheExpiry: 24 * 60 * 60 * 1000
        };
        
        const stay = ApiService.upcomingStay();

        this.endpoints = {
            uniqueProperties: {
                url: 'searchHotels',
                params: {
                    dest_id: '-2181358',
                    search_type: 'city',
                    arrival_date: stay.arrival,
                    departure_date: stay.departure,
                    adults: 1,
                    children_age: '0,17',
                    room_qty: 1,
                    page_number: 1,
                    units: 'metric',
                    temperature_unit: 'c',
                    languagecode: 'en-us',
                    currency_code: 'USD'
                }
            },
            weekendDeals: {
                url: 'searchHotels',
                params: {
                    dest_id: '-2180508',
                    search_type: 'city',
                    arrival_date: stay.weekendArrival,
                    departure_date: stay.weekendDeparture,
                    adults: 2,
                    children_age: '0,17',
                    room_qty: 1,
                    page_number: 1,
                    units: 'metric',
                    temperature_unit: 'c',
                    languagecode: 'en-us',
                    currency_code: 'USD'
                }
            }
        };
    }

    // Dates must stay in the future or the API rejects the search.
    static upcomingStay() {
        const iso = date => date.toISOString().split('T')[0];
        const shift = (from, days) => {
            const next = new Date(from);
            next.setDate(next.getDate() + days);
            return next;
        };

        const today = new Date();
        const arrival = shift(today, 21);

        // Next Friday -> Sunday for the weekend collection.
        const friday = shift(today, ((5 - today.getDay() + 7) % 7) || 7);

        return {
            arrival: iso(arrival),
            departure: iso(shift(arrival, 4)),
            weekendArrival: iso(friday),
            weekendDeparture: iso(shift(friday, 2))
        };
    }

    // Human-readable range for the weekend deals heading.
    weekendLabel() {
        const format = value => new Date(`${value}T12:00:00`)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const params = this.endpoints.weekendDeals.params;
        return `${format(params.arrival_date)} – ${format(params.departure_date)}`;
    }

    // Generate cache key from endpoint and params
    generateCacheKey(endpoint, params) {
        return `booking_api_${endpoint}_${JSON.stringify(params)}`;
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
        const cacheKey = this.generateCacheKey(endpoint.url, params);
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            console.log('Using cached data for:', endpoint.url);
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData && cachedData.data && cachedData.data.hotels) {
                return cachedData;
            }
        }

        // Build URL with parameters
        const urlParams = new URLSearchParams(params);
        const url = `${this.config.baseUrl}/${endpoint.url}?${urlParams.toString()}`;

        console.log('Making API request to:', url);

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
            console.log('API response received:', data);
            
            // Validate response structure
            if (!data || !data.data || !data.data.hotels) {
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
            
            // Return mock data if everything fails
            console.log('Using mock data as final fallback');
            return this.getMockData(endpoint);
        }
    }

    // Mock data for fallback. isSample marks the response so the page can tell
    // the user these are examples and not live results.
    getMockData(endpoint) {
        const mockData = {
            status: true,
            message: "Success",
            timestamp: Date.now(),
            isSample: true,
            data: {
                hotels: [
                    {
                        hotel_id: 1300650,
                        property: {
                            id: 1300650,
                            name: "Gorillas Lake Kivu Hotel",
                            wishlistName: "Gisenyi",
                            reviewScore: 7.1,
                            reviewScoreWord: "Good",
                            reviewCount: 172,
                            photoUrls: [
                                "https://cf.bstatic.com/xdata/images/hotel/square500/42541114.jpg?k=11ec41d109d7729f3cba191ed82174e4f86e53e4b660d6b45c73a86ace5fe8d8&o="
                            ],
                            priceBreakdown: {
                                grossPrice: {
                                    value: 504.0001,
                                    currency: "USD"
                                },
                                strikethroughPrice: {
                                    value: 720,
                                    currency: "USD"
                                },
                                benefitBadges: [
                                    {
                                        text: "Black Friday Deal"
                                    }
                                ]
                            }
                        }
                    },
                    {
                        hotel_id: 1947209,
                        property: {
                            id: 1947209,
                            name: "Paradise Malahide",
                            wishlistName: "Gisenyi",
                            reviewScore: 8.2,
                            reviewScoreWord: "Very Good",
                            reviewCount: 221,
                            photoUrls: [
                                "https://cf.bstatic.com/xdata/images/hotel/square500/562046540.jpg?k=c56b282296686b5f8474e15c59f3323cf22aafa0f60780d3eb81b45360eddf21&o="
                            ],
                            priceBreakdown: {
                                grossPrice: {
                                    value: 418.95,
                                    currency: "USD"
                                },
                                strikethroughPrice: {
                                    value: 465.5,
                                    currency: "USD"
                                },
                                benefitBadges: [
                                    {
                                        text: "Mobile-only price"
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        };
        
        return mockData;
    }

    // Fetch unique properties
    async fetchUniqueProperties() {
        return await this.makeRequest(this.endpoints.uniqueProperties, this.endpoints.uniqueProperties.params);
    }

    // Fetch weekend deals
    async fetchWeekendDeals() {
        return await this.makeRequest(this.endpoints.weekendDeals, this.endpoints.weekendDeals.params);
    }
}
