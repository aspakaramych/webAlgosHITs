document.getElementById("theme-changer-button").addEventListener("click", changeTheme)
const themeLink = document.getElementById("theme-link");
const themeImg = document.getElementById("theme-changer-button-icon");

function applyTheme(theme) {
    if(theme === "dark") {
        themeImg.src = "../images/brightnessNight.png"
        themeLink.setAttribute("href", "../common_styles_dark.css");
    } else {
        themeImg.src = "../images/brightnessDay.png"
        themeLink.setAttribute("href", "../common_styles_light.css");
    }
}

function changeTheme() {
    console.log(1);
    const currTheme = themeLink.getAttribute("href").includes("dark") ? "dark" : "light";
    const newTheme = currTheme === "dark" ? "light" : "dark";

    applyTheme(newTheme);

    localStorage.setItem("theme", newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
});