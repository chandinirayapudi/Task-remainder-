// ======================================
// TaskFlow Pro - Reminder Manager
// ======================================

// ==============================
// Elements
// ==============================

const newReminderBtn =
document.querySelector(".add-btn");

const quickReminderBtn =
document.getElementById("quickReminderBtn");

const modalOverlay =
document.getElementById("modalOverlay");

const closeModalBtn =
document.getElementById("closeModal");

const cancelBtn =
document.getElementById("cancelBtn");

const reminderForm =
document.getElementById("reminderForm");

const reminderContainer =
document.getElementById("reminderContainer");

// ==============================
// Location Reminder Elements
// ==============================

const locationReminder =
document.getElementById("locationReminder");

const useCurrentLocationBtn =
document.getElementById("useCurrentLocationBtn");

const selectedLocationText =
document.getElementById("selectedLocationText");

let selectedLatitude = null;
let selectedLongitude = null;

// ==============================
// Edit Mode
// ==============================

let editingIndex = -1;

// ==============================
// Open Modal
// ==============================

function openReminderModal(){

    reminderForm.reset();

    editingIndex = -1;

    const now = new Date();

    document.getElementById("taskDate").value =
    now.toISOString().split("T")[0];

    now.setMinutes(now.getMinutes()+5);

    const hours =
    String(now.getHours()).padStart(2,"0");

    const minutes =
    String(now.getMinutes()).padStart(2,"0");

    document.getElementById("taskTime").value =
    `${hours}:${minutes}`;

    modalOverlay.classList.add("active");

}

// ==============================
// Close Modal
// ==============================

function closeReminderModal(){

    reminderForm.reset();

    editingIndex = -1;

    modalOverlay.classList.remove("active");

}

// ==============================
// Button Events
// ==============================

newReminderBtn.addEventListener(
    "click",
    openReminderModal
);

quickReminderBtn.addEventListener(
    "click",
    openReminderModal
);

closeModalBtn.addEventListener(
    "click",
    closeReminderModal
);

cancelBtn.addEventListener(
    "click",
    closeReminderModal
);

modalOverlay.addEventListener(
    "click",
    function(event){

        if(event.target === modalOverlay){

            closeReminderModal();

        }

    }

);

// ==============================
// Location Reminder Toggle
// ==============================

locationReminder.addEventListener("change", function () {

    if (this.checked) {

        useCurrentLocationBtn.style.display = "block";
        selectedLocationText.style.display = "block";

    } else {

        useCurrentLocationBtn.style.display = "none";
        selectedLocationText.style.display = "none";

        selectedLatitude = null;
        selectedLongitude = null;

    }

});

// ==============================
// Use Current Location
// ==============================

useCurrentLocationBtn.addEventListener("click", function () {

    selectedLocationText.textContent =
        "Getting your location...";

    if (!navigator.geolocation) {

        selectedLocationText.textContent =
            "Location is not supported by this device.";

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async function (position) {

            selectedLatitude =
                position.coords.latitude;

            selectedLongitude =
                position.coords.longitude;

            selectedLocationText.textContent =
                "Finding location name...";

            try {

                const url =
                    "https://nominatim.openstreetmap.org/reverse?format=json&lat="
                    + selectedLatitude
                    + "&lon="
                    + selectedLongitude
                    + "&zoom=18&addressdetails=1";

                const response =
                    await fetch(url);

                const data =
                    await response.json();

                const address =
                    data.address || {};

                
                const place =
                 address.village ||
                 address.town ||
                 address.city ||
                 address.suburb ||
                 address.neighbourhood ||
                 address.road ||
                "Selected Location";



                const city =
                    address.city ||
                    address.town ||
                    address.village ||
                    "";

                const state =
                    address.state ||
                    "";

                let readableLocation =
                    place;

                if (city && city !== place) {

                    readableLocation +=
                        ", " + city;

                }

                if (state) {

                    readableLocation +=
                        ", " + state;

                }

                selectedLocationText.textContent =
                    "📍 " + readableLocation;

                console.log(
                    "Latitude:",
                    selectedLatitude
                );

                console.log(
                    "Longitude:",
                    selectedLongitude
                );

                console.log(
                    "Location Name:",
                    readableLocation
                );

            }

            catch (error) {

                console.error(
                    "Reverse geocoding error:",
                    error
                );

                selectedLocationText.textContent =
                    "📍 Location selected";

            }

        },

        function () {

            selectedLocationText.textContent =
                "Unable to get your location.";

        }

    );

});



// ==============================
// Save Reminder
// ==============================

reminderForm.addEventListener("submit", function(event){

    event.preventDefault();

    const taskName =
    document.getElementById("taskName").value.trim();

    const category =
    document.getElementById("category").value;

    const priority =
    document.getElementById("priority").value;

    const taskDate =
    document.getElementById("taskDate").value;

    const taskTime =
    document.getElementById("taskTime").value;

    const duration =
    document.getElementById("duration").value.trim();

    const notes =
    document.getElementById("notes").value.trim();

    // Required Validation

    if(taskName === ""){

      showNotification(
    "Missing Task",
    "Please enter a task name.",
    "error"
);

return;
    }

    if(taskDate === "" || taskTime === ""){

        showNotification(
    "Missing Information",
    "Please select both date and time.",
    "error"
);

return;

    }

    // Future Date Validation

    const currentTime = new Date();

    const selectedTime =
    new Date(taskDate + "T" + taskTime);

    if(selectedTime <= currentTime){

        showNotification(
    "Invalid Date",
    "Please select a future date and time.",
    "error"
);
        return;

    }

    // Reminder Object

const reminder = {

    id: Date.now(),

    taskName: taskName,

    category: category,

    priority: priority,

    taskDate: taskDate,

    taskTime: taskTime,

    duration: duration,

    notes: notes,

    completed: false,

    // Location Reminder
    locationEnabled:
        locationReminder.checked,

    locationName:
        selectedLocationText.textContent,

    latitude:
        selectedLatitude,

    longitude:
        selectedLongitude

};

    // Save or Update
    if(editingIndex === -1){

    addReminder(reminder);

    showNotification(

        "Reminder Saved",

        "Your reminder has been created successfully.",

        "success"

    );

}

else{

    reminder.completed =
    getReminders()[editingIndex].completed;

    updateReminder(editingIndex, reminder);
    showNotification("Reminder Updated", "Reminder updated successfully.", "info");

    editingIndex = -1;

}

displayReminders();

displayUpcomingReminders();

updateDashboardCounts();

closeReminderModal();
});
// ==============================
// Display Reminders
// ==============================

function displayReminders(){

    const reminders = getReminders();

    reminderContainer.innerHTML = "";

    if(reminders.length === 0){

        reminderContainer.innerHTML =

        `<p class="empty-message">

            No reminders yet.

        </p>`;

        return;

    }

    reminders.forEach(function(reminder,index){
        console.log(reminder.priority)

        let priorityClass = "";
        const reminderDate =
new Date(reminder.taskDate + "T" + reminder.taskTime);

const isOverdue =
!reminder.completed &&
reminderDate < new Date();

        if(reminder.priority === "High"){

            priorityClass = "priority-high";

        }

        else if(reminder.priority === "Medium"){

            priorityClass = "priority-medium";

        }

        else{

            priorityClass = "priority-low";

        }

        reminderContainer.innerHTML += `

       <div class="reminder-card ${priorityClass}
${reminder.completed ? "completed-card" : ""}"
data-category="${reminder.category}"
data-priority="${reminder.priority}">
            <h3>${reminder.taskName}</h3>

            <p>📂 ${reminder.category}</p>

            <p>⭐ ${reminder.priority}</p>

            <p>📅 ${reminder.taskDate}</p>

            <p>🕒 ${reminder.taskTime}</p>

            <p>⏳ ${reminder.duration || "-"}</p>

            <p>📝 ${reminder.notes || "-"}</p>
            ${isOverdue ?

`<span class="overdue-badge">

⚠ Overdue

</span>`

: ""}

            <div class="card-buttons">

                <button

                    class="edit-btn"

                    onclick="editReminder(${index})">

                    ✏ Edit

                </button>

                <button

                    class="complete-btn"

                    onclick="completeReminder(${index})"

                    ${reminder.completed ? "disabled" : ""}>

                    ${reminder.completed ? "Completed" : "Complete"}

                </button>

                <button

                    class="delete-btn"

                    onclick="deleteReminderItem(${index})">

                    🗑 Delete

                </button>

            </div>

        </div>

        `;

    });

}

// ==============================
// Delete Reminder
// ==============================

function deleteReminderItem(index){

    deleteReminder(index);
      showNotification(
        "Reminder Deleted",
        "Reminder removed successfully.",
        "error"
    );

    displayReminders();
     displayUpcomingReminders();

    updateDashboardCounts();
    updateAnalytics();

}

// ==============================
// Complete Reminder
// ==============================

function completeReminder(index){

    const reminders = getReminders();

    const reminder = reminders[index];

    const now = new Date();

    const reminderDateTime = new Date(
        reminder.taskDate + "T" + reminder.taskTime
    );

    if(now < reminderDateTime){

    showNotification(

        "Future Reminder",

        "This reminder is scheduled for the future. You can't complete it yet.",

        "warning"

    );

    return;

}

    completeReminderStorage(index);
    showNotification(
    "Task Completed",
    "Great job! Reminder marked as completed.",
    "success"
);

    displayReminders();
    displayUpcomingReminders();
    updateDashboardCounts();
    updateAnalytics();

}

// ==============================
// Edit Reminder
// ==============================

function editReminder(index){

    const reminders = getReminders();

    const reminder = reminders[index];

    document.getElementById("taskName").value =
    reminder.taskName;

    document.getElementById("category").value =
    reminder.category;

    document.getElementById("priority").value =
    reminder.priority;

    document.getElementById("taskDate").value =
    reminder.taskDate;

    document.getElementById("taskTime").value =
    reminder.taskTime;

    document.getElementById("duration").value =
    reminder.duration;

    document.getElementById("notes").value =
    reminder.notes;

    editingIndex = index;

    modalOverlay.classList.add("active");

}
// ==============================
// Dashboard Counts
// ==============================

function updateDashboardCounts(){

    const reminders = getReminders();

    const today = new Date().toISOString().split("T")[0];

    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

    reminders.forEach(function(reminder){

        if(reminder.completed){

            completedCount++;

        }

        if(reminder.taskDate === today){

            todayCount++;

        }

        if(!reminder.completed &&
           reminder.taskDate > today){

            upcomingCount++;

        }

        if(!reminder.completed &&
           reminder.taskDate < today){

            overdueCount++;

        }

    });

    document.getElementById("todayCount").textContent =
    todayCount;

    document.getElementById("upcomingCount").textContent =
    upcomingCount;

    document.getElementById("completedCount").textContent =
    completedCount;

    document.getElementById("overdueCount").textContent =
    overdueCount;

}
// ==============================
// Display Upcoming Reminders
// ==============================

function displayUpcomingReminders(){

    const container =
    document.getElementById("upcomingContainer");

    if(!container) return;

    const reminders = getReminders();

    const now = new Date();

    const upcoming = reminders.filter(function(reminder){
       
        if(reminder.completed) return false;

        const reminderDate =
        new Date(reminder.taskDate + "T" + reminder.taskTime);

        return reminderDate > now;

    });
    console.log("Upcoming reminders:", upcoming.length);
console.log(upcoming);

    upcoming.sort(function(a,b){

        const first =
        new Date(a.taskDate + "T" + a.taskTime);

        const second =
        new Date(b.taskDate + "T" + b.taskTime);

        return first - second;

    });

    container.innerHTML = "";

    if(upcoming.length === 0){

        container.innerHTML = `

            <div class="empty">

                <i class="fa-solid fa-bell-slash"></i>

                <p>No upcoming reminders.</p>

            </div>

        `;

        return;

    }

    upcoming.slice(0,3).forEach(function(reminder){

        container.innerHTML += `

        <div class="upcoming-card">

            <h3>${reminder.taskName}</h3>

            <p>📅 ${formatDate(reminder.taskDate)}</p>

            <p>🕒 ${formatTime(reminder.taskTime)}</p>

            <p>⭐ ${reminder.priority}</p>

        </div>

        `;

    });

}
// ==============================
// Load App
// ==============================
function formatTime(time){

    if(!time) return "";

    let [hour, minute] = time.split(":");

    hour = parseInt(hour);

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if(hour === 0){

        hour = 12;

    }

    return `${hour}:${minute} ${ampm}`;

}
function formatDate(date){

    if(!date) return "";

    const today = new Date();

    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate()+1);

    const reminderDate = new Date(date);

    reminderDate.setHours(0,0,0,0);

    if(reminderDate.getTime() === today.getTime()){

        return "Today";

    }

    if(reminderDate.getTime() === tomorrow.getTime()){

        return "Tomorrow";

    }

    return reminderDate.toLocaleDateString();

}
document.addEventListener("DOMContentLoaded", function(){

    displayReminders();

    displayUpcomingReminders();

    updateDashboardCounts();
    updateAnalytics();

closeReminderModal();

});

window.dispatchEvent(
    new Event("taskflowDataChanged")
);
