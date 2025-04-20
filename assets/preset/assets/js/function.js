document.addEventListener("DOMContentLoaded", function () {
    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page");
    const mainContent = document.querySelector(".main-content");

    navItems.forEach(item => {
        item.addEventListener("click", function () {
            const targetPage = this.getAttribute("data-target");

            // Hide all pages
            pages.forEach(page => {
                page.style.display = "none";
            });

            // Show the selected page
            const selectedPage = document.getElementById(targetPage);
            if (selectedPage) {
                selectedPage.style.display = "block";
            }

            // Remove 'active' class from all nav items
            navItems.forEach(nav => nav.classList.remove("active"));

            // Add 'active' class to the clicked item
            this.classList.add("active");

            // Hide main-content if profile or settings is selected
            if (targetPage === "profile-page" || targetPage === "settings-page") {
                mainContent.style.display = "none";
            } else {
                mainContent.style.display = "block";
            }
        });
    });
});
