// ======================================
// TaskFlow Pro - Settings Module
// ======================================

let settingsOverlay = null;

function createSettingsPanel() {

    if (document.getElementById("settingsOverlay")) {
        settingsOverlay = document.getElementById("settingsOverlay");
        return;
    }

    settingsOverlay = document.createElement("div");
    settingsOverlay.id = "settingsOverlay";

    settingsOverlay.innerHTML = `
        <div class="settings-modal">

            <div class="settings-header">
                <h2>
                    <i class="fa-solid fa-gear"></i>
                    Settings
                </h2>

                <button id="closeSettingsBtn">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="settings-body">

                <div class="settings-item">
                    <div>
                        <h3>🌐 Language</h3>
                        <p>Choose language for voice input and smart parsing.</p>
                    </div>

                    <select id="languageSelect" class="settings-select">
                        <option value="auto">Auto (Detect)</option>
                        <option value="en-US">English</option>
                        <option value="te-IN">తెలుగు (Telugu)</option>
                        <option value="hi-IN">हिन्दी (Hindi)</option>
                    </select>
                </div>

                <div class="settings-item">
                    <div>
                        <h3>🗣️ Mother Tongue</h3>
                        <p>Select your mother tongue for better voice recognition.</p>
                    </div>

                    <select id="motherTongueSelect" class="settings-select">
                        <option value="none">None</option>
                        <option value="te-IN">తెలుగు (Telugu)</option>
                        <option value="hi-IN">हिन्दी (Hindi)</option>
                    </select>
                </div>

                <div class="settings-item">
                    <div>
                        <h3>Dark Mode</h3>
                        <p>Use a darker appearance for the app.</p>
                    </div>

                    <label class="settings-switch">
                        <input type="checkbox" id="darkModeToggle">
                        <span></span>
                    </label>
                </div>

                <div class="settings-item">
                    <div>
                        <h3>Notifications</h3>
                        <p>Enable reminder notifications.</p>
                    </div>

                    <label class="settings-switch">
                        <input type="checkbox" id="notificationToggle">
                        <span></span>
                    </label>
                </div>

                <div class="settings-item">
                    <div>
                        <h3>💾 Backup Reminders</h3>
                        <p>Download all reminders as a file.</p>
                    </div>

                    <button id="backupBtn" class="settings-action-btn">
                        Backup
                    </button>
                </div>

                <div class="settings-item">
                    <div>
                        <h3>📂 Restore Reminders</h3>
                        <p>Upload a backup file to restore reminders.</p>
                    </div>

                    <button id="restoreBtn" class="settings-action-btn">
                        Restore
                    </button>
                    <input type="file" id="restoreFileInput" accept=".json" style="display:none;">
                </div>

                <div class="settings-item danger-item">
                    <div>
                        <h3>Clear All Reminders</h3>
                        <p>Delete all saved reminders from this device.</p>
                    </div>

                    <button id="clearRemindersBtn" class="danger-btn">
                        Clear
                    </button>
                </div>

            </div>

            <div class="settings-footer">
                <button id="settingsDoneBtn">
                    Done
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(settingsOverlay);

    addSettingsStyles();

    setupSettingsEvents();
}

function openSettings() {

    createSettingsPanel();

    settingsOverlay.classList.add("active");

    loadSettings();
}

function closeSettings() {

    if (settingsOverlay) {
        settingsOverlay.classList.remove("active");
    }
}

function loadSettings() {

    const darkMode =
        localStorage.getItem("taskflow_dark_mode") === "true";

    const notifications =
        localStorage.getItem("taskflow_notifications") !== "false";

    const savedLanguage =
        localStorage.getItem("taskflow_language") || "auto";

    const savedMotherTongue =
        localStorage.getItem("taskflow_mother_tongue") || "none";

    const darkToggle =
        document.getElementById("darkModeToggle");

    const notificationToggle =
        document.getElementById("notificationToggle");

    const languageSelect =
        document.getElementById("languageSelect");

    const motherTongueSelect =
        document.getElementById("motherTongueSelect");

    if (darkToggle) {
        darkToggle.checked = darkMode;
    }

    if (notificationToggle) {
        notificationToggle.checked = notifications;
    }

    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }

    if (motherTongueSelect) {
        motherTongueSelect.value = savedMotherTongue;
    }
}

function setupSettingsEvents() {

    document
        .getElementById("closeSettingsBtn")
        .addEventListener("click", closeSettings);

    document
        .getElementById("settingsDoneBtn")
        .addEventListener("click", closeSettings);

    document
        .getElementById("darkModeToggle")
        .addEventListener("change", function () {

            localStorage.setItem(
                "taskflow_dark_mode",
                this.checked
            );

            document.body.classList.toggle(
                "dark-mode",
                this.checked
            );
        });

    document
        .getElementById("languageSelect")
        .addEventListener("change", function () {

            var val = this.value;
            var label = this.options[this.selectedIndex].text;

            if (val === "auto") {
                localStorage.setItem("taskflow_language", "auto");
            } else {
                localStorage.setItem("taskflow_language", val);
            }

            showNotification(
                "Language Changed",
                "Voice input will now use " + label + ".",
                "info"
            );
        });

    document
        .getElementById("motherTongueSelect")
        .addEventListener("change", function () {

            var val = this.value;
            var label = this.options[this.selectedIndex].text;

            localStorage.setItem("taskflow_mother_tongue", val);

            if (val === "none") {
                showNotification(
                    "Mother Tongue Removed",
                    "Voice recognition will use your selected language only.",
                    "info"
                );
            } else {
                showNotification(
                    "Mother Tongue Set",
                    "Voice input will now recognize " + label + " better.",
                    "info"
                );
            }
        });

    document
        .getElementById("notificationToggle")
        .addEventListener("change", function () {

            localStorage.setItem(
                "taskflow_notifications",
                this.checked
            );

            // Request browser notification permission when enabled
            if (this.checked && typeof window.requestTaskFlowNotifications === 'function') {
                window.requestTaskFlowNotifications(function (status) {
                    if (status === 'granted') {
                        showNotification(
                            'Notifications Enabled',
                            'You will receive reminders when tasks are due.',
                            'success'
                        );
                    } else if (status === 'denied') {
                        showNotification(
                            'Notifications Blocked',
                            'Please allow notifications in your browser settings (click the lock icon in the address bar).',
                            'warning'
                        );
                    }
                });
            }
        });

    document
        .getElementById("clearRemindersBtn")
        .addEventListener("click", function () {

            const confirmed = confirm(
                "Are you sure you want to delete all reminders?"
            );

            if (!confirmed) return;

            if (typeof clearAllReminders === "function") {
                clearAllReminders();
            } else {
                localStorage.removeItem("taskflow_reminders");
            }

            if (typeof displayReminders === "function") {
                displayReminders();
            }

            if (typeof displayUpcomingReminders === "function") {
                displayUpcomingReminders();
            }

            if (typeof updateDashboardCounts === "function") {
                updateDashboardCounts();
            }

            if (typeof updateAnalytics === "function") {
                updateAnalytics();
            }

            closeSettings();
        });

    // Backup
    document.getElementById("backupBtn").addEventListener("click", function () {
        var reminders = getReminders();
        if (reminders.length === 0) {
            showNotification("No Data", "There are no reminders to back up.", "warning");
            return;
        }
        var data = JSON.stringify(reminders, null, 2);
        var blob = new Blob([data], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "taskflow-backup-" + new Date().toISOString().split("T")[0] + ".json";
        a.click();
        URL.revokeObjectURL(url);
        showNotification("Backup Saved", "Your reminders have been downloaded.", "success");
    });

    // Restore
    document.getElementById("restoreBtn").addEventListener("click", function () {
        document.getElementById("restoreFileInput").click();
    });

    document.getElementById("restoreFileInput").addEventListener("change", function (event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var restored = JSON.parse(e.target.result);
                if (!Array.isArray(restored)) {
                    showNotification("Invalid File", "The file format is not correct.", "error");
                    return;
                }
                var confirmed = confirm("This will replace all current reminders with the backup. Continue?");
                if (!confirmed) return;
                saveReminders(restored);
                showNotification("Restored", restored.length + " reminders restored successfully.", "success");
                closeSettings();
                if (typeof displayReminders === "function") displayReminders();
                if (typeof displayUpcomingReminders === "function") displayUpcomingReminders();
                if (typeof updateDashboardCounts === "function") updateDashboardCounts();
                if (typeof updateAnalytics === "function") updateAnalytics();
            } catch (err) {
                showNotification("Error", "Could not read the backup file.", "error");
            }
        };
        reader.readAsText(file);
        this.value = "";
    });

    settingsOverlay.addEventListener("click", function (event) {

        if (event.target === settingsOverlay) {
            closeSettings();
        }

    });
}

function addSettingsStyles() {

    if (document.getElementById("settingsDynamicStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "settingsDynamicStyles";

    style.textContent = `
        #settingsOverlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
        }

        #settingsOverlay.active {
            display: flex;
        }

        .settings-modal {
            width: min(520px, 100%);
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
            overflow: hidden;
        }

        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }

        .settings-header h2 {
            margin: 0;
        }

        .settings-header button {
            border: none;
            background: transparent;
            font-size: 20px;
            cursor: pointer;
        }

        .settings-body {
            padding: 10px 20px;
        }

        .settings-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 18px 0;
            border-bottom: 1px solid #eee;
        }

        .settings-item h3 {
            margin: 0 0 5px;
            font-size: 16px;
        }

        .settings-item p {
            margin: 0;
            font-size: 13px;
            color: #777;
        }

        .settings-footer {
            padding: 16px 20px;
            text-align: right;
        }

        #settingsDoneBtn {
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            cursor: pointer;
            background: #5146e5;
            color: white;
        }

        .danger-btn {
            border: none;
            background: #ef4444;
            color: white;
            padding: 9px 16px;
            border-radius: 7px;
            cursor: pointer;
        }

        .settings-action-btn {
            border: none;
            background: #4f46e5;
            color: white;
            padding: 9px 16px;
            border-radius: 7px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .settings-action-btn:hover {
            background: #4338ca;
        }

        .settings-select {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            flex-shrink: 0;
        }

        body.dark-mode .settings-select {
            background: #374151;
            color: #f9fafb;
            border-color: #4b5563;
        }

        .settings-switch {
            position: relative;
            width: 46px;
            height: 24px;
            flex-shrink: 0;
        }

        .settings-switch input {
            display: none;
        }

        .settings-switch span {
            position: absolute;
            inset: 0;
            background: #ccc;
            border-radius: 30px;
            cursor: pointer;
        }

        .settings-switch span::before {
            content: "";
            position: absolute;
            width: 18px;
            height: 18px;
            left: 3px;
            top: 3px;
            background: white;
            border-radius: 50%;
            transition: 0.2s;
        }

        .settings-switch input:checked + span {
            background: #5146e5;
        }

        .settings-switch input:checked + span::before {
            transform: translateX(22px);
        }

        body.dark-mode {
            background: #111827;
            color: #f9fafb;
        }

        body.dark-mode .settings-modal {
            background: #1f2937;
            color: #f9fafb;
        }

        body.dark-mode .settings-item {
            border-color: #374151;
        }

        body.dark-mode .settings-item p {
            color: #9ca3af;
        }
    `;

    document.head.appendChild(style);
}

function detectDeviceLanguage() {
    var saved = localStorage.getItem("taskflow_language");

    // Skip if user chose any language (including auto)
    if (saved) {
        return;
    }

    var detected = "en-US"; // default

    // Check navigator.languages array (full list of user's preferred languages)
    var langs = navigator.languages || [];
    for (var i = 0; i < langs.length; i++) {
        var lang = langs[i].toLowerCase();
        if (lang.startsWith("hi")) { detected = "hi-IN"; break; }
        if (lang.startsWith("te")) { detected = "te-IN"; break; }
    }

    // Also check navigator.language (primary language)
    if (detected === "en-US") {
        var primary = (navigator.language || navigator.userLanguage || "").toLowerCase();
        if (primary.startsWith("hi")) detected = "hi-IN";
        else if (primary.startsWith("te")) detected = "te-IN";
    }

    localStorage.setItem("taskflow_language", detected);
}

document.addEventListener("DOMContentLoaded", function () {

    // Apply dark mode on page load if previously enabled
    const savedDarkMode = localStorage.getItem("taskflow_dark_mode") === "true";
    if (savedDarkMode) {
        document.body.classList.add("dark-mode");
    }

    // Auto-detect device language on first launch
    detectDeviceLanguage();

    createSettingsPanel();

    const quickSettings =
        document.getElementById("quickSettingsBtn");

    if (quickSettings) {

        quickSettings.addEventListener("click", function () {
            openSettings();
        });

    }

});