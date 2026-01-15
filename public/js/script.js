// Example starter JavaScript for disabling form submissions if there are invalid fields
//so what i did is, went to new.js, referred to form validation section in bootstarp, specified novalidate and class="needs-validation" in the form in new.js doc, made a file in public/js/script.js which is this file and the js code i took from bootstrap's form validation

(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})




document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("darkModeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const htmlElement = document.documentElement;
  const navbar = document.querySelector(".navbar");

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

  if (localStorage.getItem("theme") === "dark") {
    htmlElement.setAttribute("data-bs-theme", "dark");
    themeIcon.classList.remove("fa-regular"); 
    themeIcon.classList.add("fa-solid");
    setNavbarDark();
  } else {
    
    setNavbarLight();
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currtheme = htmlElement.getAttribute("data-bs-theme");

      if (currtheme === "dark") {
        htmlElement.setAttribute("data-bs-theme", "light");
        themeIcon.classList.remove("fa-solid");
        themeIcon.classList.add("fa-regular");
        
        setNavbarLight(); 
        
        localStorage.setItem("theme", "light"); 
      } else {

        htmlElement.setAttribute("data-bs-theme", "dark");
        themeIcon.classList.remove("fa-regular");
        themeIcon.classList.add("fa-solid");
        
        setNavbarDark(); 
        
        localStorage.setItem("theme", "dark"); 
      }
    });
  }
});