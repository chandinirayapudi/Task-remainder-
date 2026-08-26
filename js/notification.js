// ==========================================
// TaskFlow Pro Notification System
// ==========================================

function showNotification(title, message, type){

    let container =
    document.querySelector(".toast-container");

    if(!container){

        container =
        document.createElement("div");

        container.className =
        "toast-container";

        document.body.appendChild(container);

    }

    let icon = "fa-circle-info";

    if(type === "success"){

        icon = "fa-circle-check";

    }

    else if(type === "error"){

        icon = "fa-circle-xmark";

    }

    else if(type === "warning"){

        icon = "fa-triangle-exclamation";

    }

    const toast = document.createElement("div");

    toast.className =
    `toast ${type}`;

    toast.innerHTML = `

        <i class="fa-solid ${icon}"></i>

        <div class="toast-content">

            <div class="toast-title">

                ${title}

            </div>

            <div class="toast-message">

                ${message}

            </div>

        </div>

    `;

    container.appendChild(toast);

    setTimeout(function(){

        toast.style.animation =
        "slideOut .4s forwards";

        setTimeout(function(){

            toast.remove();

        },400);

    },3000);

}
