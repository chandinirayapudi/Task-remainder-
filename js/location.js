
// ======================================
// TaskFlow Pro
// location.js
// ======================================

console.log("LOCATION JS LOADED");

// ======================================
// Elements
// ======================================

const sidebarLocationBtn =
    document.getElementById("sidebarLocationBtn");

const locationSection =
    document.querySelector(".location-section");

const getLocationBtn =
    document.getElementById("getLocationBtn");

const locationStatus =
    document.getElementById("locationStatus");


// ======================================
// Map Variable
// ======================================

let locationMap = null;
let locationMarker = null;


// ======================================
// Open Location Page
// ======================================

sidebarLocationBtn.addEventListener("click", (event) => {

    event.preventDefault();

    document.querySelector(".welcome-card").style.display = "none";
    document.querySelector(".cards").style.display = "none";
    document.querySelector(".reminder-section").style.display = "none";
    document.querySelector(".analytics-section").style.display = "none";
    document.querySelector(".upcoming").style.display = "none";

    locationSection.style.display = "block";

    document.querySelectorAll("nav a").forEach(link => {
        link.classList.remove("active");
    });

    sidebarLocationBtn.classList.add("active");

});


// ======================================
// Get Current Location
// ======================================

getLocationBtn.addEventListener("click", () => {

    locationStatus.textContent =
        "Getting your location...";

    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Geolocation is not supported by this browser.";

        return;
    }

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            locationStatus.textContent =
                `Location detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;


            // ======================================
            // Create Map Only Once
            // ======================================

            if (!locationMap) {

                locationMap = L.map("locationMap")
                    .setView(
                        [latitude, longitude],
                        15
                    );

                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        attribution:
                            "&copy; OpenStreetMap contributors"
                    }
                ).addTo(locationMap);

                locationMarker = L.marker(
                    [latitude, longitude]
                )
                    .addTo(locationMap)
                    .bindPopup("You are here")
                    .openPopup();

            } else {

                // Update existing map

                locationMap.setView(
                    [latitude, longitude],
                    15
                );

                locationMarker.setLatLng(
                    [latitude, longitude]
                );

            }

        },

        (error) => {

            console.error("Location error:", error);

            locationStatus.textContent =
                "Location permission was denied or unavailable.";

        }

    );

});
