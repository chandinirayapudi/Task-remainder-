// ======================================
// TaskFlow Pro - Reminder Manager
// ======================================

// ==============================
// Elements
// ==============================

const newReminderBtn =
document.getElementById("topbarNewReminderBtn");

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
// Checklist state
// ==============================

let currentChecklist = [];

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
    currentChecklist = [];

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

    // Reset checklist
    document.getElementById("checklistGroup").style.display = "none";
    document.getElementById("checklistContainer").innerHTML = "";
    document.getElementById("enableChecklist").checked = false;
    renderChecklist();

    // Reset location reminder
    locationReminder.checked = false;
    useCurrentLocationBtn.style.display = "none";
    selectedLocationText.style.display = "none";
    selectedLatitude = null;
    selectedLongitude = null;

    // Reset notes
    document.getElementById("notes").value = "";

    modalOverlay.classList.add("active");

}

// ==============================
// Close Modal
// ==============================

function closeReminderModal(){

    reminderForm.reset();

    editingIndex = -1;
    currentChecklist = [];

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
// Checklist Toggle
// ==============================

document.getElementById("enableChecklist").addEventListener("change", function() {
    var group = document.getElementById("checklistGroup");
    group.style.display = this.checked ? "block" : "none";
    if (!this.checked) {
        currentChecklist = [];
        renderChecklist();
    }
});

// ==============================
// Add Checklist Item
// ==============================

document.getElementById("addChecklistBtn").addEventListener("click", addChecklistItem);

document.getElementById("checklistInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        addChecklistItem();
    }
});

function addChecklistItem() {
    var input = document.getElementById("checklistInput");
    var text = input.value.trim();
    if (!text) return;
    currentChecklist.push({ text: text, done: false });
    input.value = "";
    renderChecklist();
}

function renderChecklist() {
    var container = document.getElementById("checklistContainer");
    container.innerHTML = "";
    currentChecklist.forEach(function(item, idx) {
        var div = document.createElement("div");
        div.className = "checklist-item" + (item.done ? " done" : "");
        div.innerHTML =
            '<input type="checkbox" ' + (item.done ? "checked" : "") +
            ' onchange="toggleChecklistItem(' + idx + ')">' +
            '<label onclick="toggleChecklistItem(' + idx + ')">' + escapeHtml(item.text) + '</label>' +
            '<button class="remove-item" onclick="removeChecklistItem(' + idx + ')">×</button>';
        container.appendChild(div);
    });
}

function toggleChecklistItem(idx) {
    currentChecklist[idx].done = !currentChecklist[idx].done;
    renderChecklist();
}

function removeChecklistItem(idx) {
    currentChecklist.splice(idx, 1);
    renderChecklist();
}

function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

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

            }

            catch (error) {

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

    const repeatOption =
    document.getElementById("repeatOption").value;

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

    // Future Date Validation (skip for recurring)

    if (repeatOption === "none") {
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

    // Recurring
    repeat: repeatOption,

    // Checklist
    checklist: currentChecklist.length > 0 ? currentChecklist : [],

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

        // Escape HTML to prevent XSS
        var safeName = escapeHtml(reminder.taskName);
        var safeCategory = escapeHtml(reminder.category);
        var safePriority = escapeHtml(reminder.priority);
        var safeDuration = escapeHtml(reminder.duration || "-");
        var safeNotes = escapeHtml(reminder.notes || "-");

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

        // Recurring badge
        var repeatLabel = "";
        if (reminder.repeat && reminder.repeat !== "none") {
            var labels = { daily: "🔁 Daily", weekly: "🔁 Weekly", monthly: "🔁 Monthly", yearly: "🔁 Yearly" };
            repeatLabel = '<span class="recurring-badge">' + (labels[reminder.repeat] || "🔁 Repeating") + '</span>';
        }

        // Checklist HTML
        var checklistHtml = "";
        if (reminder.checklist && reminder.checklist.length > 0) {
            checklistHtml = '<ul class="card-checklist">';
            reminder.checklist.forEach(function(item) {
                checklistHtml += '<li class="' + (item.done ? "done" : "") + '">' +
                    (item.done ? "☑" : "☐") + " " + escapeHtml(item.text) + '</li>';
            });
            checklistHtml += '</ul>';
        }

        reminderContainer.innerHTML += `

       <div class="reminder-card ${priorityClass}
${reminder.completed ? "completed-card" : ""}"
data-category="${reminder.category}"
data-priority="${reminder.priority}">
            ${repeatLabel}
            <h3>${safeName}</h3>

            <p>📂 ${safeCategory}</p>

            <p>⭐ ${safePriority}</p>

            <p>📅 ${reminder.taskDate}</p>

            <p>🕒 ${reminder.taskTime}</p>

            <p>⏳ ${safeDuration}</p>

            <p>📝 ${safeNotes}</p>
            ${checklistHtml}
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

                <button

                    class="share-btn"

                    onclick="shareReminder(${index})">

                    📤

                </button>

            </div>

        </div>

        `;

    });

}

// ==============================
// Share Reminder
// ==============================

function shareReminder(index) {
    var reminders = getReminders();
    var r = reminders[index];
    var text = "📌 " + r.taskName + "\n";
    text += "📂 " + r.category + " | ⭐ " + r.priority + "\n";
    text += "📅 " + r.taskDate + " 🕒 " + r.taskTime + "\n";
    if (r.duration) text += "⏳ " + r.duration + "\n";
    if (r.notes) text += "📝 " + r.notes + "\n";
    if (r.repeat && r.repeat !== "none") {
        var rLabels = { daily: "Every Day", weekly: "Every Week", monthly: "Every Month", yearly: "Every Year" };
        text += "🔁 " + (rLabels[r.repeat] || "Repeating") + "\n";
    }
    if (r.checklist && r.checklist.length > 0) {
        text += "\n☑️ Checklist:\n";
        r.checklist.forEach(function(item) {
            text += (item.done ? "☑" : "☐") + " " + item.text + "\n";
        });
    }
    text += "\n— Shared from TaskFlow Pro";

    if (navigator.share) {
        navigator.share({ title: r.taskName, text: text }).catch(function() {});
    } else {
        // Fallback: open WhatsApp with pre-filled text
        var waUrl = "https://wa.me/?text=" + encodeURIComponent(text);
        window.open(waUrl, "_blank");
    }
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
// Complete Reminder (with recurring auto-next)
// ==============================

function completeReminder(index){

    const reminders = getReminders();

    const reminder = reminders[index];

    const now = new Date();

    const reminderDateTime = new Date(
        reminder.taskDate + "T" + reminder.taskTime
    );

    // Allow completing tasks for today (even if time is later today)
    // Only block tasks that are scheduled for a future DATE
    var todayStr = new Date().toISOString().split("T")[0];
    if(reminder.taskDate > todayStr){

    showNotification(

        "Future Reminder",

        "This reminder is scheduled for a future date. You can't complete it yet.",

        "warning"

    );

    return;

}

    // If recurring, calculate next date instead of marking complete
    if (reminder.repeat && reminder.repeat !== "none") {
        var nextDate = calculateNextDate(reminder.taskDate, reminder.repeat);
        reminder.taskDate = nextDate;
        // Reset checklist items for next occurrence
        if (reminder.checklist && reminder.checklist.length > 0) {
            reminder.checklist.forEach(function(item) {
                item.done = false;
            });
        }
        reminder.completed = false;
        updateReminder(index, reminder);
        showNotification(
            "Task Repeated",
            "Next occurrence: " + nextDate,
            "info"
        );
    } else {
        completeReminderStorage(index);
        showNotification(
            "Task Completed",
            "Great job! Reminder marked as completed.",
            "success"
        );
    }

    displayReminders();
    displayUpcomingReminders();
    updateDashboardCounts();
    updateAnalytics();

}

// ==============================
// Calculate next date for recurring
// ==============================

function calculateNextDate(currentDate, repeat) {
    var d = new Date(currentDate + "T00:00:00");
    if (repeat === "daily") {
        d.setDate(d.getDate() + 1);
    } else if (repeat === "weekly") {
        d.setDate(d.getDate() + 7);
    } else if (repeat === "monthly") {
        d.setMonth(d.getMonth() + 1);
    } else if (repeat === "yearly") {
        d.setFullYear(d.getFullYear() + 1);
    }
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
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
    reminder.duration || "";

    document.getElementById("notes").value =
    reminder.notes || "";

    // Recurring
    document.getElementById("repeatOption").value =
    reminder.repeat || "none";

    // Checklist
    currentChecklist = (reminder.checklist && reminder.checklist.length > 0)
        ? JSON.parse(JSON.stringify(reminder.checklist))
        : [];

    var enableCb = document.getElementById("enableChecklist");
    enableCb.checked = currentChecklist.length > 0;
    document.getElementById("checklistGroup").style.display =
        currentChecklist.length > 0 ? "block" : "none";
    renderChecklist();

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

        var repeatTag = "";
        if (reminder.repeat && reminder.repeat !== "none") {
            var rr = { daily: "🔁 Daily", weekly: "🔁 Weekly", monthly: "🔁 Monthly", yearly: "🔁 Yearly" };
            repeatTag = ' <span style="font-size:12px;color:#7c3aed;">' + (rr[reminder.repeat] || "") + '</span>';
        }

        container.innerHTML += `

        <div class="upcoming-card">

            <h3>${escapeHtml(reminder.taskName)}${repeatTag}</h3>

            <p>📅 ${formatDate(reminder.taskDate)}</p>

            <p>🕒 ${formatTime(reminder.taskTime)}</p>

            <p>⭐ ${reminder.priority}</p>

        </div>

        `;

    });

}

// ==============================
// Utility functions
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

// ==============================
// Load App
// ==============================

document.addEventListener("DOMContentLoaded", function(){

    displayReminders();

    displayUpcomingReminders();

    updateDashboardCounts();
    updateAnalytics();

    closeReminderModal();

    // Dispatch data changed event after all modules are loaded
    window.dispatchEvent(
        new Event("taskflowDataChanged")
    );

});

// Note: taskflowDataChanged event is now dispatched in DOMContentLoaded below
