// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'
  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      form.classList.add('was-validated')
    }, false)
  })
})()



// DARK MODE LOGIC, I swear this one is a litlle tricky, took time to figure out
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("darkModeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const filters = document.getElementsByClassName("filter-link"); 
  const htmlElement = document.documentElement;
  const navbar = document.querySelector(".navbar");

  // Helper function to change color
  const changeFilterColor = (color) => {
     for (let filter of filters) {
      filter.style.color = color;
    }
  };

  const setNavbarDark = () => {
    if (navbar) {
      navbar.classList.remove("navbar-light", "bg-light");
      navbar.classList.add("navbar-dark", "bg-dark");
    }
  };

  const setNavbarLight = () => {
    if (navbar) {
      navbar.classList.remove("navbar-dark", "bg-dark");
      navbar.classList.add("navbar-light", "bg-light");
    }
  };

  // Check Local Storage on Page Load
  if (localStorage.getItem("theme") === "dark") {
    htmlElement.setAttribute("data-bs-theme", "dark");
    if (themeIcon) {
        themeIcon.classList.remove("fa-regular");
        themeIcon.classList.add("fa-solid");
    }
    setNavbarDark();
    changeFilterColor("white"); 
  } 
    else {
    htmlElement.setAttribute("data-bs-theme", "light"); // Ensure light is set if not dark
    setNavbarLight();
     changeFilterColor("black");
  }

  // Handle Button Click
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currtheme = htmlElement.getAttribute("data-bs-theme");

      if (currtheme === "dark") {
         htmlElement.setAttribute("data-bs-theme", "light");
        
        if (themeIcon) {
            themeIcon.classList.remove("fa-solid");
            themeIcon.classList.add("fa-regular");
        }

         changeFilterColor("black"); 
        
        setNavbarLight();
        localStorage.setItem("theme", "light");

      } else {
         htmlElement.setAttribute("data-bs-theme", "dark");
        
        if (themeIcon) {
            themeIcon.classList.remove("fa-regular");
            themeIcon.classList.add("fa-solid");
        }

         changeFilterColor("white");
        
        setNavbarDark();
        localStorage.setItem("theme", "dark");
      }
    });
  }
});