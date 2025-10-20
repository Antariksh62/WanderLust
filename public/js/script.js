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
})()