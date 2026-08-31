// ======================================
// TaskFlow Pro - Reminder Notifications
// Sound alerts + spoken reminders + browser notifications
// ======================================

(function () {
    'use strict';

    var notifiedReminders = {};
    var CHECK_INTERVAL = 30000;

    // ======================================
    // Generate alert sound using Web Audio API
    // ======================================

    function playAlertSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Three-tone beep pattern
            var frequencies = [800, 1000, 800];
            var now = ctx.currentTime;

            frequencies.forEach(function (freq, i) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.4, now + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.18);
                osc.start(now + i * 0.2);
                osc.stop(now + i * 0.2 + 0.2);
            });
        } catch (e) {
            // Audio not available
        }
    }

    // ======================================
    // Spoken reminder using SpeechSynthesis
    // ======================================

    function speakReminder(text) {
        if (!('speechSynthesis' in window)) return;
        try {
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        } catch (e) {
            // Speech not available
        }
    }

    // ======================================
    // Request browser notification permission
    // ======================================

    function requestNotificationPermission(callback) {
        if (!('Notification' in window)) {
            if (callback) callback('not-supported');
            return;
        }
        if (Notification.permission === 'granted') {
            if (callback) callback('granted');
            return;
        }
        if (Notification.permission === 'denied') {
            if (callback) callback('denied');
            return;
        }
        Notification.requestPermission().then(function (permission) {
            if (callback) callback(permission);
        }).catch(function () {
            if (callback) callback('error');
        });
    }

    // ======================================
    // Show browser notification
    // ======================================

    function showBrowserNotification(title, body) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try {
            var notification = new Notification(title, {
                body: body,
                icon: 'favicon.ico',
                badge: 'favicon.ico',
                tag: 'taskflow-reminder',
                requireInteraction: true,
                silent: true  // We handle sound ourselves
            });
            notification.onclick = function () {
                window.focus();
                notification.close();
            };
            setTimeout(function () { notification.close(); }, 15000);
        } catch (e) {
            // Fallback
        }
    }

    // ======================================
    // Full alert: sound + speech + browser notification + toast
    // ======================================

    function fireAlert(title, body, speakText) {
        // 1. Play sound
        playAlertSound();

        // 2. Browser notification
        showBrowserNotification(title, body);

        // 3. Spoken reminder
        if (speakText) {
            speakReminder(speakText);
        }

        // 4. In-app toast
        if (typeof showNotification === 'function') {
            showNotification(title, body, 'warning');
        }
    }

    // ======================================
    // Check for due reminders
    // ======================================

    function checkDueReminders() {
        var notificationsEnabled = localStorage.getItem('taskflow_notifications');
        if (notificationsEnabled === 'false') return;
        if (typeof getReminders !== 'function') return;

        var reminders = getReminders();
        var now = new Date();

        reminders.forEach(function (reminder) {
            if (reminder.completed) return;

            var reminderTime = new Date(reminder.taskDate + 'T' + reminder.taskTime);
            var reminderId = reminder.id || (reminder.taskDate + '-' + reminder.taskTime);

            if (notifiedReminders[reminderId]) return;

            var diffMs = reminderTime.getTime() - now.getTime();
            var diffMin = diffMs / (1000 * 60);

            // Due now (within -1.5 to +1.5 minutes)
            if (diffMin >= -1.5 && diffMin <= 1.5) {
                fireAlert(
                    '⏰ Reminder: ' + reminder.taskName,
                    'Category: ' + reminder.category + ' | Priority: ' + reminder.priority,
                    'Reminder! ' + reminder.taskName
                );
                notifiedReminders[reminderId] = true;
            }

            // 5 minutes before
            if (diffMin >= 4 && diffMin <= 6 && !notifiedReminders[reminderId + '-5min']) {
                fireAlert(
                    '📋 Upcoming in 5 min: ' + reminder.taskName,
                    'Scheduled for ' + reminder.taskTime,
                    'Upcoming in 5 minutes: ' + reminder.taskName
                );
                notifiedReminders[reminderId + '-5min'] = true;
            }
        });
    }

    // ======================================
    // Initialize
    // ======================================

    document.addEventListener('DOMContentLoaded', function () {
        // Request permission on first user click (Edge requirement)
        var userClicked = false;
        function onFirstUserClick() {
            if (userClicked) return;
            userClicked = true;
            requestNotificationPermission(function (status) {
                console.log('Notification permission:', status);
            });
            document.removeEventListener('click', onFirstUserClick);
        }
        document.addEventListener('click', onFirstUserClick);

        checkDueReminders();
        setInterval(checkDueReminders, CHECK_INTERVAL);
    });

    window.requestTaskFlowNotifications = requestNotificationPermission;

})();
