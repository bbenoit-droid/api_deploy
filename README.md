# GuestBridge Rwanda

GuestBridge Rwanda is a hotel search website that I built to help people find and compare hotels. The website gets hotel information from the Booking.com API through RapidAPI and allows users to search for hotels, filter the results, sort them, and save hotels they are interested in.


**Live website:** https://www.guestbridgerwanda.tech
**Demo video:** *Add video link here*

## What the project does

When looking for a hotel, users normally have to check different websites and compare the information themselves. I wanted to make this easier by putting the hotel information in one place.

With GuestBridge Rwanda, a user can search for a destination and then see hotels with information such as price, rating, stars and available facilities.

The main things the user can do are:

* Search for a destination
* Choose check-in and check-out dates
* Select the number of guests and rooms
* Filter hotels based on price, rating, stars and facilities
* Sort hotels by price, rating or star level
* Search for a hotel by name
* Change between list and grid views
* Save hotels for later
* View more information about a hotel

I also added login and sign-up pages so that saved hotels and recent searches can be kept separately for different users.

---

## Main features

### Hotel search

The home page has a search form where the user can enter a destination. The destination suggestions come from the API.

The user can also select:

* Check-in date
* Check-out date
* Number of guests
* Number of rooms

I used Flatpickr for the date selection.

### Filters and sorting

After searching, users can narrow down the results using different filters.

The filters include:

* Maximum price
* Minimum guest rating
* Star level
* Facilities such as WiFi and parking

Users can also sort the results by:

* Price from low to high
* Price from high to low
* Guest rating
* Star level
* Original API order

There is also a search box for finding a hotel by its name.

### Hotel details

When a user selects a hotel, they can see more information about it.

The details page includes:

* Hotel photos
* Facilities
* Review scores
* Nearby attractions
* House rules
* Guest questions and answers

I separated the requests for these sections so that if one part of the API fails, the whole page does not stop working.

### Accounts

The website has a simple sign-up and login system.

Users can:

* Create an account
* Log in and log out
* Save hotels
* See their recent searches

The accounts are stored in the browser using `localStorage`. This is only for demonstrating the login functionality because the project does not have a backend database.

### Other features

I also added:

* Light and dark mode
* Responsive design for smaller screens
* List and grid views
* Error messages when API requests fail
* Retry buttons
* Local caching to reduce API requests

---

# Running the project

The project uses plain HTML, CSS and JavaScript, so it does not require a complicated setup.

### 1. Download the project

```bash
git clone https://github.com/bbenoit-droid/api_deploy
cd api_deploy
```

### 2. Add the API key

The API key is not included in the repository.

First copy the example file:

```bash
cp API_Key.example.js API_Key.js
```

Then open `API_Key.js` and replace:

```text
df63a52205mshee02062c6a569d7p17be64jsna7f1f6521830
```

with your RapidAPI key.

The API I used is the Booking.com API available through RapidAPI.

### 3. Run the project

One simple way to run it is using Python:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

If using XAMPP, the project can also be placed inside the `htdocs` folder.

The project should be run through a web server instead of opening the HTML file directly because some API requests will not work correctly with `file://`.

---

# Deployment

For the deployment part of the project, I used two Ubuntu web servers running Nginx and an HAProxy load balancer.

The setup is:

```text
                    User
                      |
                      |
              guestbridgerwanda.tech
                      |
                      v
                HAProxy (Lb01)
                 /          \
                /            \
               v              v
          Web01              Web02
          Nginx              Nginx
             \                /
              \              /
               GuestBridge App
```

The two web servers contain the same copy of the website.

### Web servers

**Web01**

```text
3.91.180.172
/var/www/html/hotelapi
```

**Web02**

```text
18.212.73.129
/var/www/html/hotelapi
```

Both servers use Nginx to serve the website.

The basic Nginx configuration is:

```nginx
server {
    listen 80;
    listen [::]:80;

    root /var/www/html/hotelapi;
    index index.html;

    server_name guestbridgerwanda.tech www.guestbridgerwanda.tech;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

I also added an `X-Served-By` header so I could check which server was responding to each request.

```nginx
add_header X-Served-By $hostname;
```

### HAProxy

HAProxy is used to distribute requests between the two web servers.

The backend uses round-robin:

```text
frontend guestbridge_front
    bind *:80
    default_backend guestbridge_back

backend guestbridge_back
    balance roundrobin
    server web01 3.91.180.172:80 check
    server web02 18.212.73.129:80 check
```

The `roundrobin` option means requests are sent between Web01 and Web02.

The `check` option allows HAProxy to check whether a server is still available.

---

# Testing the load balancer

I tested the load balancer using `curl`.

```bash
for i in $(seq 1 6); do curl -sI https://www.guestbridgerwanda.tech | grep -i X-Served-By; done
```

The result was:

```text
x-served-by: 7102-web-01
x-served-by: 7102-web-02
x-served-by: 7102-web-01
x-served-by: 7102-web-02
x-served-by: 7102-web-01
x-served-by: 7102-web-02
```

This showed that HAProxy was distributing the requests between the two servers.

I also tested what happens when Nginx is stopped on one of the servers. HAProxy then sends the requests to the other available server.

---

# API

The main API used in this project is the **Booking.com API (`booking-com15`)** from DataCrawler through RapidAPI.

I used different endpoints for different parts of the website.

| Endpoint                     | What I used it for   |
| ---------------------------- | -------------------- |
| `searchDestination`          | Finding destinations |
| `searchHotels`               | Searching for hotels |
| `getHotelDetails`            | Hotel information    |
| `getHotelPhotos`             | Hotel photos         |
| `getHotelReviewScores`       | Review scores        |
| `getPopularAttractionNearBy` | Nearby attractions   |
| `getHotelPolicies`           | Hotel rules          |
| `getQuestionAndAnswer`       | Guest questions      |

The API has a limited number of requests on the free plan. The BASIC plan I used allows 50 requests per month.

Because I was testing the website many times during development, I added caching using `localStorage`. API responses are stored for 24 hours, which reduces the number of requests made when the same information is requested again.

When the API limit is reached, the website shows a message instead of making it look like the data is still live.

---

# Trying the website

You do not need an account to search for hotels.

To test the account features:

1. Click **Log in**
2. Select **Sign up**
3. Enter a name and email
4. Create a password with at least 8 characters
5. Log in with the account

For example:

```text
Name: Test User
Email: test@example.com
Password: guestbridge123
```

The account is saved in the browser's `localStorage`.

This is not meant to be a production authentication system. It was mainly added to demonstrate how the login and saved hotel functionality works.

---

# Error handling

I tried to make the website handle API problems instead of just showing a blank page.

Some of the things I added include:

* Error messages when an API request fails
* A **Try again** button
* Cached results when possible
* A message when the API is unavailable
* Sample hotel data on the home page when live data cannot be loaded
* A warning when sample data is being shown

I made sure the sample hotels are clearly marked as sample data so that users do not think the prices are real.

On the hotel search and details pages, I chose to show an error instead of showing made-up hotel information.

---

# Security

There are a few security measures in the project.

### API key

The API key is not committed to GitHub.

`API_Key.js` is included in `.gitignore`, while the repository contains an example file instead.

### API data

Data received from the API is passed through an `escapeHtml` function before being added to the page. This helps prevent unwanted HTML or JavaScript from being inserted into the website.

### Login

Passwords are not stored as plain text. The project uses SHA-256 hashing with a random salt.

However, the login system still has an important limitation: everything is stored in `localStorage`.

Because there is no backend database, this should not be considered a secure production authentication system. It is mainly a demonstration of how a login system could work.

A real version of the project would move the authentication to a backend server and store users in a database.

---

# Project files

The main files in the project are:

| File                  | Purpose                        |
| --------------------- | ------------------------------ |
| `index.html`          | Home page                      |
| `search-results.html` | Hotel search results           |
| `Details.html`        | Hotel details                  |
| `login.html`          | Login and sign-up              |
| `style.css`           | Main website styling           |
| `ui.js`               | Common UI functions            |
| `auth.js`             | Login and sign-up functions    |
| `API_Key.js`          | API key                        |
| `API_Key.example.js`  | API key example                |
| `config.js`           | API endpoint settings          |
| `api-service.js`      | API requests for the home page |
| `search-service.js`   | Destination and hotel searches |
| `details-service.js`  | Hotel details requests         |

---

# Challenges I faced

## API request limit

One of the main problems I had was the API request limit.

During development, I was refreshing the pages a lot and quickly used up the available requests.

I solved this by saving API responses in `localStorage` for 24 hours. This also made the website faster when loading information that had already been requested.

## API failures

At first, I used sample hotel information whenever something went wrong. The problem with this was that users could think the sample prices were real.

I changed this so that sample data is only used on the home page and is clearly labelled. On the search and details pages, the website shows an error instead.

## CORS

I also tried using public CORS proxy services when I was developing the project.

After testing, I found that the API already provided the CORS headers that I needed. I therefore removed the proxies because they were not necessary and would also add another service between my website and the API.

## Dates

Another issue was the dates used for some of the hotel searches.

The API does not accept dates that have already passed. Some of my original featured searches stopped working after the dates became old.

I changed the code so that the dates are calculated from the current date instead of being permanently written into the page.

---

# Credits

I built GuestBridge Rwanda as a university project.

The main technologies I used were:

* HTML
* CSS
* JavaScript
* RapidAPI
* Booking.com API
* Nginx
* HAProxy
* Linux/Ubuntu

I also used **Flatpickr** for the date picker.

The hotel information comes from the Booking.com API by DataCrawler through RapidAPI.

The interface was built using plain HTML, CSS and JavaScript without using a large frontend framework.
