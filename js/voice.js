// ======================================
// TaskFlow Pro - Voice Reminder Module
// Uses browser Web Speech API
// ======================================

(function () {
    'use strict';

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var voiceSupported = !!SpeechRecognition;
    var voiceBtn = null;
    var voiceStatus = null;
    var isListening = false;
    var recognition = null;

    var MONTHS = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
    };

    var CATEGORY_RULES = [
        { category: 'Study',    keywords: ['study', 'learn', 'read', 'homework', 'exam', 'class', 'course', 'python', 'java', 'code', 'coding', 'programming', 'lecture', 'tutorial', 'revision', 'practice', 'test', 'chapter', 'book', 'notes', 'assignment'] },
        { category: 'Work',     keywords: ['meeting', 'work', 'office', 'project', 'deadline', 'report', 'presentation', 'client', 'boss', 'interview', 'resume', 'email', 'conference', 'colleague', 'task', 'submit', 'review'] },
        { category: 'Medicine', keywords: ['medicine', 'doctor', 'medication', 'pill', 'appointment', 'health', 'hospital', 'checkup', 'prescription', 'pharmacy', 'tablet', 'dose', 'dentist', 'therapy'] },
        { category: 'Shopping', keywords: ['buy', 'shop', 'grocery', 'groceries', 'purchase', 'order', 'market', 'supermarket', 'mall', 'store', 'amazon', 'delivery', 'price', 'discount', 'coupon'] },
        { category: 'Personal', keywords: ['birthday', 'call', 'visit', 'party', 'gift', 'wish', 'wedding', 'anniversary', 'date', 'dinner', 'lunch', 'movie', 'friend', 'family', 'home', 'clean', 'cook', 'wash', 'iron', 'gym', 'workout', 'exercise', 'walk', 'yoga'] },
        { category: 'Music',    keywords: ['music', 'song', 'concert', 'guitar', 'piano', 'sing', 'band', 'album', 'listen', 'playlist'] }
    ];

    document.addEventListener('DOMContentLoaded', function () {
        voiceBtn = document.getElementById('voiceReminderBtn');
        voiceStatus = document.getElementById('voiceStatus');

        var topbarVoiceBtn = document.getElementById('topbarVoiceBtn');
        if (topbarVoiceBtn) {
            topbarVoiceBtn.addEventListener('click', function () {
                if (typeof openReminderModal === 'function') {
                    openReminderModal();
                }
                setTimeout(function () {
                    if (voiceBtn && voiceSupported) {
                        toggleVoice();
                    }
                }, 300);
            });
        }

        if (!voiceBtn) return;

        if (!voiceSupported) {
            voiceBtn.style.display = 'none';
            showVoiceStatus('Voice input is not supported in this browser.', 'info');
            return;
        }

        voiceBtn.addEventListener('click', toggleVoice);
    });

    function toggleVoice() {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }

    function startListening() {
        if (isListening) return;

        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = function () {
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.setAttribute('aria-label', 'Listening… tap to stop');
            voiceBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
            showVoiceStatus('Listening…', 'listening');
        };

        recognition.onresult = function (event) {
            var transcript = event.results[0][0].transcript.trim();
            showVoiceStatus('Voice captured', 'success');
            parseAndFillForm(transcript);
        };

        recognition.onerror = function (event) {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                showVoiceStatus('Microphone permission denied', 'error');
            } else if (event.error === 'no-speech') {
                showVoiceStatus('No speech detected. Please try again.', 'warning');
            } else {
                showVoiceStatus('Speech recognition error: ' + event.error, 'error');
            }
            resetListeningState();
        };

        recognition.onend = function () {
            resetListeningState();
        };

        try {
            recognition.start();
        } catch (e) {
            showVoiceStatus('Could not start speech recognition.', 'error');
            resetListeningState();
        }
    }

    function stopListening() {
        if (recognition && isListening) {
            recognition.stop();
        }
    }

    function resetListeningState() {
        isListening = false;
        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
            voiceBtn.setAttribute('aria-label', 'Voice Reminder — tap to speak');
            voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
    }

    function showVoiceStatus(message, type) {
        if (!voiceStatus) return;
        voiceStatus.textContent = message;
        voiceStatus.className = 'voice-status voice-status--' + (type || 'info');
        voiceStatus.style.display = 'block';
        if (type !== 'listening') {
            setTimeout(function () {
                voiceStatus.style.display = 'none';
            }, 4000);
        }
    }

    // ======================================
    // Remove filler phrases
    // ======================================

    function removeFillerPhrases(text) {
        var patterns = [
            /^remind me to\s+/i,
            /^remember to\s+/i,
            /^i need to\s+/i,
            /^please remind me to\s+/i,
            /^can you remind me to\s+/i,
            /^set a reminder to\s+/i,
            /^set a reminder for\s+/i,
            /^i want to be reminded to\s+/i,
            /^don'?t forget to\s+/i
        ];
        var result = text;
        for (var i = 0; i < patterns.length; i++) {
            result = result.replace(patterns[i], '');
        }
        return result.trim();
    }

    // ======================================
    // Parse Repeat pattern from text
    // ======================================

    function parseRepeat(text) {
        var lower = text.toLowerCase();

        if (/\b(every\s+day|daily|each\s+day)\b/i.test(lower)) {
            return { repeat: 'daily', cleaned: text.replace(/\b(every\s+day|daily|each\s+day)\b/gi, '').trim() };
        }
        if (/\b(every\s+week|weekly|each\s+week)\b/i.test(lower)) {
            return { repeat: 'weekly', cleaned: text.replace(/\b(every\s+week|weekly|each\s+week)\b/gi, '').trim() };
        }
        if (/\b(every\s+month|monthly|each\s+month)\b/i.test(lower)) {
            return { repeat: 'monthly', cleaned: text.replace(/\b(every\s+month|monthly|each\s+month)\b/gi, '').trim() };
        }
        if (/\b(every\s+year|yearly|annually|each\s+year)\b/i.test(lower)) {
            return { repeat: 'yearly', cleaned: text.replace(/\b(every\s+year|yearly|annually|each\s+year)\b/gi, '').trim() };
        }

        return { repeat: 'none', cleaned: text };
    }

    // ======================================
    // Auto-detect Category
    // ======================================

    function detectCategory(text) {
        var lower = text.toLowerCase();
        for (var i = 0; i < CATEGORY_RULES.length; i++) {
            var rule = CATEGORY_RULES[i];
            for (var j = 0; j < rule.keywords.length; j++) {
                if (lower.indexOf(rule.keywords[j]) !== -1) {
                    return rule.category;
                }
            }
        }
        return null;
    }

    // ======================================
    // Parse Month + Day
    // ======================================

    function parseMonthDay(text) {
        var now = new Date();
        var year = now.getFullYear();

        // Pattern 1: "Month Day" e.g. "December 2nd"
        var p1 = text.match(
            /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
        );
        if (p1) {
            var monthName = p1[1].toLowerCase();
            var day = parseInt(p1[2], 10);
            var monthIdx = MONTHS[monthName];
            if (monthIdx !== undefined && day >= 1 && day <= 31) {
                var target = new Date(year, monthIdx, day);
                if (target < now) target = new Date(year + 1, monthIdx, day);
                return { date: formatDateISO(target), remaining: text.replace(p1[0], ' ').trim() };
            }
        }

        // Pattern 2: "Day Month" e.g. "2nd December"
        var p2 = text.match(
            /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\b/i
        );
        if (p2) {
            var day2 = parseInt(p2[1], 10);
            var monthIdx2 = MONTHS[p2[2].toLowerCase()];
            if (monthIdx2 !== undefined && day2 >= 1 && day2 <= 31) {
                var target2 = new Date(year, monthIdx2, day2);
                if (target2 < now) target2 = new Date(year + 1, monthIdx2, day2);
                return { date: formatDateISO(target2), remaining: text.replace(p2[0], ' ').trim() };
            }
        }

        return null;
    }

    // ======================================
    // Main: Parse and fill form
    // ======================================

    function parseAndFillForm(text) {
        var cleaned = removeFillerPhrases(text);

        // 1. Extract repeat pattern
        var repeatResult = parseRepeat(cleaned);
        var repeatValue = repeatResult.repeat;
        cleaned = repeatResult.cleaned;

        // 2. Parse date and time
        var parsed = parseDateAndTime(cleaned);

        // Fill Task Name
        var taskInput = document.getElementById('taskName');
        if (taskInput) taskInput.value = parsed.taskName;

        // Fill Date
        if (parsed.date) {
            var dateInput = document.getElementById('taskDate');
            if (dateInput) dateInput.value = parsed.date;
        }

        // Fill Time
        if (parsed.time) {
            var timeInput = document.getElementById('taskTime');
            if (timeInput) timeInput.value = parsed.time;
        }

        // Fill Repeat
        var repeatSelect = document.getElementById('repeatOption');
        if (repeatSelect && repeatValue !== 'none') {
            repeatSelect.value = repeatValue;
        }

        // Auto-detect Category
        var detectedCategory = detectCategory(text);
        if (detectedCategory) {
            var categoryInput = document.getElementById('category');
            if (categoryInput) categoryInput.value = detectedCategory;
        }

        // Open form for review
        var modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay && !modalOverlay.classList.contains('active')) {
            modalOverlay.classList.add('active');
        }
    }

    // ======================================
    // Parse Date + Time from cleaned text
    // ======================================

    function parseDateAndTime(text) {
        var result = { taskName: text, date: null, time: null };
        var now = new Date();

        // --- Parse Date ---

        if (/day after tomorrow/i.test(text)) {
            var dat = new Date(now);
            dat.setDate(dat.getDate() + 2);
            result.date = formatDateISO(dat);
            text = text.replace(/day after tomorrow/gi, '').trim();
        }
        else if (/\btomorrow\b/i.test(text)) {
            var tmr = new Date(now);
            tmr.setDate(tmr.getDate() + 1);
            result.date = formatDateISO(tmr);
            text = text.replace(/\btomorrow\b/gi, '').trim();
        }
        else if (/\btoday\b/i.test(text)) {
            result.date = formatDateISO(now);
            text = text.replace(/\btoday\b/gi, '').trim();
        }
        else {
            var dayMatch = text.match(/\b(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
            if (dayMatch) {
                var dayName = dayMatch[1].toLowerCase();
                var daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                var targetDay = daysOfWeek.indexOf(dayName);
                var currentDay = now.getDay();
                var diff = targetDay - currentDay;
                if (diff <= 0) diff += 7;
                var targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() + diff);
                result.date = formatDateISO(targetDate);
                text = text.replace(dayMatch[0], '').trim();
            }
        }

        // Month + Day
        if (!result.date) {
            var monthDayResult = parseMonthDay(text);
            if (monthDayResult) {
                result.date = monthDayResult.date;
                text = monthDayResult.remaining;
            }
        }

        // --- Parse Time ---
        var timeResult = parseTime(text);
        if (timeResult.time) {
            result.time = timeResult.time;
            text = timeResult.remaining;
        }

        // --- Clean up ---
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/\s+(at|on|in|for|by|,)$/i, '');
        text = text.replace(/^(at|on|in|for|by|,)\s+/i, '');
        text = text.replace(/,\s*$/, '');

        if (text.length > 0) {
            result.taskName = text;
        } else {
            result.taskName = removeFillerPhrases(text) || text;
        }

        return result;
    }

    // ======================================
    // Time Parsing
    // ======================================

    function parseTime(text) {
        var time = null;
        var remaining = text;

        // Pattern 1: HH:MM
        var m1 = text.match(
            /\b(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:in\s+the\s+)?(morning|afternoon|evening|night)?\b/i
        );
        if (m1) {
            var hour = parseInt(m1[1], 10);
            var minute = parseInt(m1[2], 10);
            var ampm = m1[3] ? m1[3].toLowerCase().replace(/\./g, '') : null;
            var tod = m1[4] ? m1[4].toLowerCase() : null;
            if (tod === 'morning') ampm = 'am';
            else if (tod === 'afternoon') ampm = 'pm';
            else if (tod === 'evening' || tod === 'night') ampm = 'pm';
            if (ampm === 'pm' && hour >= 1 && hour <= 11) hour += 12;
            else if (ampm === 'am' && hour === 12) hour = 0;
            else if (!ampm && !tod && hour >= 1 && hour <= 6) hour += 12;
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                time = padZero(hour) + ':' + padZero(minute);
                remaining = text.replace(m1[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 2: "7pm", "7 pm"
        var m2 = text.match(/\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/i);
        if (m2) {
            var hour2 = parseInt(m2[1], 10);
            var ampm2 = m2[2].toLowerCase().replace(/\./g, '');
            if (ampm2 === 'pm' && hour2 >= 1 && hour2 <= 11) hour2 += 12;
            else if (ampm2 === 'am' && hour2 === 12) hour2 = 0;
            if (hour2 >= 0 && hour2 <= 23) {
                time = padZero(hour2) + ':00';
                remaining = text.replace(m2[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 3: "7 in the evening"
        var m3 = text.match(/\b(\d{1,2})\s+in\s+the\s+(morning|afternoon|evening|night)\b/i);
        if (m3) {
            var hour3 = parseInt(m3[1], 10);
            var tod3 = m3[2].toLowerCase();
            if (tod3 === 'morning') { if (hour3 === 12) hour3 = 0; }
            else if (tod3 === 'afternoon') { if (hour3 >= 1 && hour3 <= 11) hour3 += 12; }
            else if (tod3 === 'evening' || tod3 === 'night') { if (hour3 >= 1 && hour3 <= 11) hour3 += 12; }
            if (hour3 >= 0 && hour3 <= 23) {
                time = padZero(hour3) + ':00';
                remaining = text.replace(m3[0], ' ').trim();
                return { time: time, remaining: remaining };
            }
        }

        // Pattern 4: noon
        if (/\bnoon\b/i.test(text)) {
            return { time: '12:00', remaining: text.replace(/\bnoon\b/gi, ' ').trim() };
        }

        // Pattern 5: midnight
        if (/\bmidnight\b/i.test(text)) {
            return { time: '00:00', remaining: text.replace(/\bmidnight\b/gi, ' ').trim() };
        }

        return { time: null, remaining: text };
    }

    function padZero(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function formatDateISO(date) {
        var y = date.getFullYear();
        var m = padZero(date.getMonth() + 1);
        var d = padZero(date.getDate());
        return y + '-' + m + '-' + d;
    }

})();
