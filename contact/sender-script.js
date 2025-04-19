document.getElementById("send").addEventListener("click", function() {
    const emailText = document.getElementById("email-text").value;

    const data = {
        text: emailText
    };
    console.log(data);
    fetch("/contact/contact_us", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => console.log(result))
    .catch(error => console.error('Error:', error));
});

