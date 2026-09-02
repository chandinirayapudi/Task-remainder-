const searchInput = document.getElementById("searchReminder");
const categoryFilter = document.getElementById("categoryFilter");

const priorityFilter =
document.getElementById("priorityFilter");

function filterReminders(){

    const keyword = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const priority = priorityFilter.value;

    const cards = document.querySelectorAll(".reminder-card");

    cards.forEach(function(card){

        const text = card.innerText.toLowerCase();
        const cardCategory = card.dataset.category;
        const cardPriority = card.dataset.priority;

        const matchSearch = text.includes(keyword);

        const matchCategory =
        category === "All" ||
        cardCategory === category;

        const matchPriority =
        priority === "All" ||
        cardPriority === priority;

        if(matchSearch && matchCategory && matchPriority){

            card.style.display = "flex";

        }

        else{

            card.style.display = "none";

        }

    });

}

searchInput.addEventListener("input",filterReminders);

categoryFilter.addEventListener("change",filterReminders);

priorityFilter.addEventListener("change",filterReminders);