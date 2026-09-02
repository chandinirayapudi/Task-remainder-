// ======================================
// TaskFlow Pro
// Analytics Module
// ======================================

function updateAnalytics() {


const reminders = getReminders();

let total = reminders.length;
let completed = 0;
let pending = 0;
let overdue = 0;

const now = new Date();

reminders.forEach(function(reminder) {

    if (reminder.completed) {

        completed++;

    } else {

        pending++;

        const reminderDate = new Date(
            reminder.taskDate + "T" + reminder.taskTime
        );

        if (reminderDate < now) {

            overdue++;

        }

    }

});


// Basic statistics

document.getElementById("analyticsTotal").textContent =
    total;

document.getElementById("analyticsCompleted").textContent =
    completed;

document.getElementById("analyticsPending").textContent =
    pending;

document.getElementById("analyticsOverdue").textContent =
    overdue;


// Completion percentage

let percentage = 0;

if (total > 0) {

    percentage = Math.round(
        (completed / total) * 100
    );

}

document.getElementById("completionRate").textContent =
    percentage + "%";

document.getElementById("completionProgress").style.width =
    percentage + "%";


// Category statistics

updateCategoryStats(reminders);


}

// ======================================
// Category Statistics
// ======================================

function updateCategoryStats(reminders) {

const categoryStats =
    document.getElementById("categoryStats");

const categories = {};

reminders.forEach(function(reminder) {

    if (!categories[reminder.category]) {

        categories[reminder.category] = 0;

    }

    categories[reminder.category]++;

});

categoryStats.innerHTML = "";

if (Object.keys(categories).length === 0) {

    categoryStats.innerHTML =
        "<p>No task data available.</p>";

    return;

}

Object.keys(categories).forEach(function(category) {

    categoryStats.innerHTML += `

        <div class="category-row">

            <span>${category}</span>

            <strong>${categories[category]}</strong>

        </div>

    `;

});

}

// ======================================
// Load Analytics
// ======================================

document.addEventListener(
"DOMContentLoaded",
function() {

    updateAnalytics();

}
);


window.addEventListener("taskflowDataChanged", function() {

    updateAnalytics();

});