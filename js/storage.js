// ==========================================
// TaskFlow Pro
// Local Storage Manager
// ==========================================

const STORAGE_KEY = "taskflow_reminders";

/**
 * Get all reminders
 */
function getReminders() {

    const reminders = localStorage.getItem(STORAGE_KEY);

    return reminders ? JSON.parse(reminders) : [];

}

/**
 * Save all reminders
 */
function saveReminders(reminders) {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(reminders)

    );

}

/**
 * Add one reminder
 */
function addReminder(reminder) {

    const reminders = getReminders();

    reminders.push(reminder);

    saveReminders(reminders);

}

/**
 * Delete reminder
 */
function deleteReminder(index) {

    const reminders = getReminders();

    reminders.splice(index, 1);

    saveReminders(reminders);

}

/**
 * Update reminder
 */
function updateReminder(index, updatedReminder) {

    const reminders = getReminders();

    reminders[index] = updatedReminder;

    saveReminders(reminders);

}

/**
 * Clear all reminders
 */
function clearAllReminders() {

    localStorage.removeItem(STORAGE_KEY);

}
// ==============================
// Complete Reminder
// ==============================

function completeReminderStorage(index){

    const reminders = getReminders();

    reminders[index].completed = true;

    localStorage.setItem("taskflow_reminders", JSON.stringify(reminders));

}