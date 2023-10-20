function data() {
    return fetch("https://the-one-api.dev/v2/character", {
        method: 'GET', 
        headers: {
          'Authorization': `Bearer _jnVYZhtsCB-sMwUa7lY`
        }
    })
    .then(response => response.json())
    .then(res => res.docs)
}

let personajes = data();
personajes.then(data => {
    let datosAragorn = data.filter(el => el.name.includes("Aragorn II"));
    console.log(datosAragorn[0]);
});


