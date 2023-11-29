"use strict"

const firebaseConfig = {
    apiKey: "AIzaSyDbmGL_HEY3zCqrZWHsOy-jltN0GbvMsZc",
    authDomain: "battle-for-middle-earth-cards.firebaseapp.com",
    projectId: "battle-for-middle-earth-cards",
    storageBucket: "battle-for-middle-earth-cards.appspot.com",
    messagingSenderId: "589267356243",
    appId: "1:589267356243:web:816496e29586f8b5e154a6"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

//variables 
const colores = ["palevioletred", "brown", "green", "aquamarine", "darkgoldenrod", "blue", "hotpink", "rebeccapurple", "firebrick", "burlywood", "fuchsia", "palegreen", "darkorange", "royalblue", "red", "yellow", "purple"];
const posNeg = [1, -1];
const points = ["0,5 1,0 1.7,1.7", "0,5 2,0 4.2,4.2", "0,5 4,0 8.7,8.7", "0,5 4,0 8.7,8.7", "0,5 4,0 7.6,7.6", "0,5 4,0 7.6,7.6", "0,5 4,0 8.7,8.7", "0,5 2,0 4.0,4.0", "0,5 2,0 4.0,4.0", "0,5 2,0 4.2,4.2", "0,5 2,0 4.2,4.2", "0,5 1,0 2.4,2.4", "0,5 3,0 5.5,5.5", "0,5 4,0 7.1,7.1", "0,5 3,0 5.0,5.0", "0,5 3,0 5.0,5.0", "0,5 4,0 6.3,6.3", "0,5 4,0 6.3,6.3", "0,5 4,0 7.0,7.0", "0,5 3,0 5.0,5.0"];
const figura = ["circle", "rect", "polygon"]

//funciones inicio y cerrado de sesión
const createUser = (user) => {
  db.collection("users")
    .add(user)
    .then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
      let documentRef = db.collection("users").doc(docRef.id);
      documentRef.update({
        id: docRef.id
      })
    })
    .catch((error) => console.error("Error adding document: ", error));
}

const signInUser = (email, password) => {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      let user = userCredential.user;
      console.log(`se ha logeado ${user.email} ID:${user.uid}`)
      console.log("USER", user);
    })
    .catch((error) => {
      let errorCode = error.code;
      let errorMessage = error.message;
      console.log(errorCode)
      console.log(errorMessage)
      Swal.fire({
        icon: 'error',
        text: errorMessage,
      })
    });
}

const signUpUser = (email, password, username) => {
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      let user = userCredential.user;
      console.log(`se ha registrado ${user.email} ID:${user.uid}`)
      createUser({
        id: "",
        email: user.email,
        user: username,
        charactersOwned: [],
        victories: 0,
        defeats: 0,
        avatar: "",
        coins: 0,
        level: {total: 0,
                moria: 0, amonHen: 0,
                wargs: 0, helmsDeep: 0,
                osgiliath: 0, minasTirith: 0,
                blackGate: 0}
      })
      signInUser(email, password);
    })
};

const signOut = () => {
  let user = firebase.auth().currentUser;
  firebase.auth().signOut().then(() => {
    console.log("Sale del sistema: " + user.email);
    location.reload();
  }).catch((error) => {
    console.log("hubo un error: " + error);
  });
};

async function validarFormularioRegister(username, email, password) {
  let alert = "";
  if (!/^[A-Za-z0-9\-_#@]{2,30}$/.test(username)) {
    alert += "The username must be alfanumerical between 2 and 30 characters and can contain(-,_,@,#) <br>"
  }
  if (!/^[\w\.-]+@[\w\.-]+\.\w{2,}$/.test(email)) {
    alert += "Introduce a valid email <br>"
  }
  if (!/^[A-Za-z0-9\-_#@]{6,30}$/.test(password)) {
    alert += "The password must be alfanumerical between 6 and 30 characters and can contain(-,_,@,#) <br>"
  }
  const users = db.collection('users');
  await users.where('email', '==', email).get()
    .then((querySnapshot) => { 
      if (!querySnapshot.empty) {
        alert += "That email is already taken <br>"
      }});
  await users.where('user', '==', username).get()
    .then((querySnapshot) => { 
      if (!querySnapshot.empty) {
        alert += "That username is already taken";
      }});
  
  if (alert.length > 0) {
    Swal.fire({
      icon: 'error',
      html: alert,
    })
  } else {
    signUpUser(email, password, username);
    document.getElementById("formRegister").reset();
  }
}

async function validarFormularioLogin(email, password) {
  let alert = "";
  if (!/^[\w\.-]+@[\w\.-]+\.\w{2,}$/.test(email)) {
    alert += "Introduce a valid email <br>"
  }
  if (!/^[A-Za-z0-9\-_#@]{6,30}$/.test(password)) {
    alert += "The password must be alfanumerical between 6 and 30 characters and can contain(-,_,@,#) <br>"
  }
  const users = db.collection('users');
  await users.where('email', '==', email).get()
    .then((querySnapshot) => { 
      if (querySnapshot.empty) {
        alert += "That email is not registered, please Register before Login"
      }});
  if (alert.length > 0) {
    Swal.fire({
      icon: 'error',
      html: alert,
    })
  } else {
    signInUser(email, password);
    document.getElementById("formlogin").reset();
  }
}

//funciones para la batalla
//función devuelve que personajes no tienes de un set
function availableFromSet(array) {
  let personajesDisponibles = [];
  if (array[0].name) {
    for (let i = 0; i < array.length; i++) {
      personajesDisponibles.push([array[i].name, i]);
    }
    return personajesDisponibles;
  } else {
    array.forEach(element => {
      for (let i = 0; i < personajesNoObtenidos.length; i++) {
        if (personajesNoObtenidos[i].name == element) {
          personajesDisponibles.push([element, i]);
          break;
        }
      }
    });
    return personajesDisponibles;
  }
}

//función elige uno aleatorio de set, lo devuelve y lo elimina de set
async function getRandomFromSet(array) {
  let arrayActualizado = await array;
  let i = Math.round(Math.random()*(arrayActualizado.length - 1));
  let personajeElegido = arrayActualizado[i];
  return personajeElegido;
}

//función cargar ataques
function cargarAtaques(batalla) {
  let contenedor = document.getElementById(`attackContainer${batalla}`);
  contenedor.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    if (heroesGlobal[i].actualARecharge == 0 && heroesGlobal[i].actualHealth > 0) {
      contenedor.innerHTML += heroesGlobal[i].attackButton;
    }
  }
}

function cargarSM(batalla) {
  let contenedor = document.getElementById(`SMContainer${batalla}`);
  contenedor.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    if (heroesGlobal[i].actualSRecharge == 0 && heroesGlobal[i].actualHealth > 0) {
      contenedor.innerHTML += heroesGlobal[i].sMoveButton;
    }
  }
}

//función actualizar botones
function actualizarBotones(attack, SM, batalla) {
  cargarAtaques(batalla);
  cargarSM(batalla);
  let contenedor = document.getElementById(`attackContainer${batalla}`);
  let contenedor1 = document.getElementById(`SMContainer${batalla}`);
  let ataquesActivos = true;
  let SMovesActivos = true;
  if (contenedor.innerHTML == "") ataquesActivos = false;
  if (contenedor1.innerHTML == "") SMovesActivos = false;
  if (attacksRemaining > 0 && ataquesActivos) {
    attack.disabled = false;
  } else {
    attack.disabled = true;
  }
  if (SMRemaining > 0 && SMovesActivos) {
    SM.disabled = false;
  } else {
    SM.disabled = true;
  }
}

//sacar un valor aleatorio de las variables
function valorAleatorio(array) {
  let i = Math.round(Math.random()*(array.length-1))
  return array[i];
}

function comprobarDerrota() {
  let comprobador = true;
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].actualHealth != 0) {
      comprobador = false;
      break;
    }
  }
  if (comprobador) {
    defeat(0);
  }
  return comprobador;
}

//función derrota
function defeat(numero) {
  battleOnGoing = 0;
  datosUsuarioActual.defeats += 1;
  const documentRef = db.collection("users").doc(datosUsuarioActual.id);
  documentRef.update({
    defeats: datosUsuarioActual.defeats
  });
  for (let i = 0; i < heroesGlobal.length; i++) {
    heroesGlobal[i].actualARecharge = 0;
    heroesGlobal[i].actualSRecharge = 0;
    heroesGlobal[i].actualHealth = heroesGlobal[i].maxHealth;
  }
  for (let i = 0; i < enemiesGlobal.length; i++) {
    enemiesGlobal[i].actualARecharge = 0;
    enemiesGlobal[i].actualSRecharge = 0;
    enemiesGlobal[i].actualHealth = enemiesGlobal[i].maxHealth;
  }
  battleOnGoing = 0
  document.getElementById(`newCards${battle}Container`).innerHTML = "";
  document.getElementById(`newCards${battle}Container`).classList.remove("hide");
  document.getElementById(`newCards${battle}Container`).innerHTML = `
                <p class="defeat">Defeat!</p>`;
  if (numero == 1) {
    setTimeout(function () {document.getElementById(`${scenario}`).innerHTML = "";
                            document.getElementById(`${scenario}`).classList.add("hide");
                            if (music == true) {
                              audio.play();
                            }
                          }, 1000);
  } else {
    setTimeout(function () {document.getElementById(`${scenario}`).innerHTML = "";
                            document.getElementById(`${scenario}`).classList.add("hide");
                            homeContent.classList.remove("hide");
                            battleContent.classList.add("hide");
                            shopContent.classList.add("hide");
                            myCardsContent.classList.add("hide");
                            document.getElementById("home").classList.add("outlined");
                            document.getElementById("battle").classList.remove("outlined");
                            document.getElementById("shop").classList.remove("outlined");
                            document.getElementById("myCards").classList.remove("outlined");
                            audio.src = "./assets/music/home.mp3";
                            cargarHome();
                            if (music == true) {
                              audio.play();
                            }
                          }, 1000);
  }
  
}

function comprobarVictoria() {
  let comprobador = true;
  for (let i = 0; i < enemiesGlobal.length; i++) {
    if (enemiesGlobal[i].actualHealth != 0) {
      comprobador = false;
      break;
    }
  }
  if (comprobador) {
    victoria();
  }
  return comprobador;
}

function victoria() {
  //pintar el confeti en el DOM
  let section = document.createElement("section");
  section.id = "confeti";
  document.getElementById(`${scenario}`).appendChild(section);
  let temp = "";
  for (let i = 0; i < 200; i++) {
    let figuraAleatoria = valorAleatorio(figura);
    if (figuraAleatoria == "circle") {
        temp += `<svg height="5" width="5" style="--speed: ${(Math.random()*4)+1}; --spread-distance: ${(Math.random()*50)*valorAleatorio(posNeg)}vw">
                        <circle cx="2.5" cy="2.5" r="2.5" fill=${valorAleatorio(colores)}></circle>
                </svg>`;
    } else if (figuraAleatoria == "rect") {
        let dimensiones = (Math.random()*8) + 2;
        temp += `<svg height="5" width="5" style="--speed: ${(Math.random()*4)+1}; --spread-distance: ${(Math.random()*50)*valorAleatorio(posNeg)}vw">
                    <rect x="0" y="0" width="${dimensiones}" height="${dimensiones}" fill=${valorAleatorio(colores)}></rect>
                </svg>`;
    } else {
        temp += `<svg height="5" width="5" style="--speed: ${(Math.random()*4)+1}; --spread-distance: ${(Math.random()*50)*valorAleatorio(posNeg)}vw">
                    <polygon points=${valorAleatorio(points)} fill=${valorAleatorio(colores)}></polygon>
                </svg>`;
    }
    section.innerHTML = temp;
  }
  datosUsuarioActual.victories += 1;
  battleOnGoing = 0;
  document.getElementById(`newCards${battle}Container`).innerHTML = "";
  document.getElementById(`newCards${battle}Container`).classList.remove("hide");
  document.getElementById(`newCards${battle}Container`).innerHTML = `<p class="victory">Victory!</p>`;
  for (let i = 0; i < heroesGlobal.length; i++) {
    heroesGlobal[i].actualARecharge = 0;
    heroesGlobal[i].actualSRecharge = 0;
    heroesGlobal[i].sMove = 0;
    heroesGlobal[i].actualHealth = heroesGlobal[i].maxHealth;
  }
  for (let i = 0; i < enemiesGlobal.length; i++) {
    enemiesGlobal[i].actualARecharge = 0;
    enemiesGlobal[i].actualSRecharge = 0;
    enemiesGlobal[i].sMove = 0;
    enemiesGlobal[i].actualHealth = enemiesGlobal[i].maxHealth;
  }
  let datos;
  if (battle == "Moria1") {
    datos = {scenario: "moria", level: 1, xp: 200, coins: 150, cards: [goldMoria, silverMoria, bronzeMoria]}
  } else if (battle == "Moria2") {
    datos = {scenario: "moria", level: 2, xp: 210, coins: 160, cards: [goldMoria, silverMoria, bronzeMoria]}
  } else if (battle == "Moria3") {
    datos = {scenario: "moria", level: 3, xp: 250, coins: 200, cards: [goldMoria, silverMoria, bronzeMoria]}
  } else if (battle == "Moria4") {
    datos = {scenario: "moria", level: 4, xp: 230, coins: 180, cards: [goldMoria, silverMoria, bronzeMoria]}
  } else if (battle == "Moria5") {
    datos = {scenario: "moria", level: 5, xp: 240, coins: 190, cards: [goldMoria, silverMoria, bronzeMoria]}
  } else if (battle == "Moria6") {
    datos = {scenario: "moria", level: 6, xp: 280, coins: 230, cards: [goldMoria, silverMoria, bronzeMoria]}
  } else if (battle == "AmonHen1") {
    datos = {scenario: "amonHen", level: 1, xp: 250, coins: 190, cards: [goldTotal, silverAmonHen, bronzeAmonHen]}
  } else if (battle == "AmonHen2") {
    datos = {scenario: "amonHen", level: 2, xp: 270, coins: 210, cards: [goldTotal, silverAmonHen, bronzeAmonHen]}
  } else if (battle == "AmonHen3") {
    datos = {scenario: "amonHen", level: 3, xp: 290, coins: 230, cards: [goldTotal, silverAmonHen, bronzeAmonHen]}
  } else if (battle == "AmonHen4") {
    datos = {scenario: "amonHen", level: 4, xp: 340, coins: 280, cards: [goldTotal, silverAmonHen, bronzeAmonHen]}
  } else if (battle == "Wargs1") {
    datos = {scenario: "wargs", level: 1, xp: 280, coins: 250, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "Wargs2") {
    datos = {scenario: "wargs", level: 2, xp: 310, coins: 280, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "Wargs3") {
    datos = {scenario: "wargs", level: 3, xp: 360, coins: 340, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep1") {
    datos = {scenario: "helmsDeep", level: 1, xp: 360, coins: 360, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep2") {
    datos = {scenario: "helmsDeep", level: 2, xp: 390, coins: 390, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep3") {
    datos = {scenario: "helmsDeep", level: 3, xp: 410, coins: 410, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep4") {
    datos = {scenario: "helmsDeep", level: 4, xp: 440, coins: 440, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep5") {
    datos = {scenario: "helmsDeep", level: 5, xp: 470, coins: 470, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep6") {
    datos = {scenario: "helmsDeep", level: 6, xp: 500, coins: 500, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep7") {
    datos = {scenario: "helmsDeep", level: 7, xp: 530, coins: 530, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "HelmsDeep8") {
    datos = {scenario: "helmsDeep", level: 8, xp: 600, coins: 600, cards: [goldTotal, silverRohan, bronzeRohan]}
  } else if (battle == "Osgiliath1") {
    datos = {scenario: "osgiliath", level: 1, xp: 520, coins: 500, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "Osgiliath2") {
    datos = {scenario: "osgiliath", level: 2, xp: 560, coins: 540, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "Osgiliath3") {
    datos = {scenario: "osgiliath", level: 3, xp: 640, coins: 620, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith1") {
    datos = {scenario: "minasTirith", level: 1, xp: 590, coins: 570, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith2") {
    datos = {scenario: "minasTirith", level: 2, xp: 640, coins: 620, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith3") {
    datos = {scenario: "minasTirith", level: 3, xp: 690, coins: 670, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith4") {
    datos = {scenario: "minasTirith", level: 4, xp: 740, coins: 720, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith5") {
    datos = {scenario: "minasTirith", level: 5, xp: 790, coins: 770, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith6") {
    datos = {scenario: "minasTirith", level: 6, xp: 840, coins: 820, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith7") {
    datos = {scenario: "minasTirith", level: 7, xp: 890, coins: 870, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "MinasTirith8") {
    datos = {scenario: "minasTirith", level: 8, xp: 980, coins: 960, cards: [goldTotal, silverGondor, bronzeGondor]}
  } else if (battle == "BlackGate1") {
    datos = {scenario: "blackGate", level: 1, xp: 870, coins: 850, cards: [goldBlackGate, silverBlackGate, bronzeBlackGate]}
  } else if (battle == "BlackGate2") {
    datos = {scenario: "blackGate", level: 2, xp: 930, coins: 910, cards: [goldBlackGate, silverBlackGate, bronzeBlackGate]}
  } else if (battle == "BlackGate3") {
    datos = {scenario: "blackGate", level: 3, xp: 990, coins: 970, cards: [goldBlackGate, silverBlackGate, bronzeBlackGate]}
  } else if (battle == "BlackGate4") {
    datos = {scenario: "blackGate", level: 4, xp: 1050, coins: 1030, cards: [goldBlackGate, silverBlackGate, bronzeBlackGate]}
  } else if (battle == "BlackGate5") {
    datos = {scenario: "blackGate", level: 5, xp: 1250, coins: 1250, cards: [personajesNoObtenidos, personajesNoObtenidos, personajesNoObtenidos]}
  }
  setTimeout(() => {
    for (let i = 0; i < heroesGlobal.length; i++) {
      heroesGlobal[i].xp += datos.xp;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<p class="Xp">+${datos.xp}Xp</p>`;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      for (let j = 0; j < datosUsuarioActual.charactersOwned.length; j++) {
        if (datosUsuarioActual.charactersOwned[j].name == heroesGlobal[i].name) {
          datosUsuarioActual.charactersOwned[j].xp = heroesGlobal[i].xp;
          break;
        }
      }
      for (let j = 0; j < personajesObtenidos.length; j++) {
        if (heroesGlobal[i].name == personajesObtenidos[j].name) {
          actualizarCartas(personajesObtenidos[j], heroesGlobal[i].xp);
          break;
        }
      }
    }
    setTimeout(async function() {
      document.getElementById(`enemies${battle}`).classList.add("hide");
      document.getElementById(`heroes${battle}`).classList.add("hide");
      document.getElementById(`controls${battle}`).classList.add("hide");
      document.getElementById(`newCards${battle}Container`).innerHTML = `<section class="reward">
                                                                            <span>+${datos.coins}</span>
                                                                            <img src="./assets/monedas.png" alt="coins">
                                                                        </section>`;
      datosUsuarioActual.coins += datos.coins;
      let nuevoPersonaje = [];
      if (datosUsuarioActual.level.moria == 5 && datos.scenario == "moria" && datos.level == 6) {
        for (let i = 0; i < personajesNoObtenidos.length; i++) {
          if (personajesNoObtenidos[i].name == "Boromir") {
            nuevoPersonaje = ["Boromir", i];
            break;
          }
        }
      } else if (datosUsuarioActual.level.amonHen == 3 && datos.scenario == "amonHen" && datos.level == 4) {
        for (let i = 0; i < personajesNoObtenidos.length; i++) {
          if (personajesNoObtenidos[i].name == "Galadriel") {
            nuevoPersonaje = ["Galadriel", i];
            break;
          }
        }
      } else if (datosUsuarioActual.level.wargs == 2 && datos.scenario == "wargs" && datos.level == 3) {
        for (let i = 0; i < personajesNoObtenidos.length; i++) {
          if (personajesNoObtenidos[i].name == "Eowyn") {
            nuevoPersonaje = ["Eowyn", i];
            break;
          }
        }
      } else if (datosUsuarioActual.level.helmsDeep == 7 && datos.scenario == "helmsDeep" && datos.level == 8) {
        for (let i = 0; i < personajesNoObtenidos.length; i++) {
          if (personajesNoObtenidos[i].name == "Theoden") {
            nuevoPersonaje = ["Theoden", i];
            break;
          }
        }
      } else if (datosUsuarioActual.level.osgiliath == 2 && datos.scenario == "osgiliath" && datos.level == 3) {
        for (let i = 0; i < personajesNoObtenidos.length; i++) {
          if (personajesNoObtenidos[i].name == "Faramir") {
            nuevoPersonaje = ["Faramir", i];
            break;
          }
        }
      }  if (datosUsuarioActual.level.minasTirith == 7 && datos.scenario == "minasTirith" && datos.level == 8) {
        for (let i = 0; i < personajesNoObtenidos.length; i++) {
          if (personajesNoObtenidos[i].name == "kingDead") {
            nuevoPersonaje = ["kingDead", i];
            break;
          }
        }
      } else {
        let numAl = Math.random()*100;
        if (numAl >= 95) {
          let availableGold = availableFromSet(datos.cards[0]);
          if (availableGold.length == 0) {
            nuevoPersonaje = [];
          } else {
            nuevoPersonaje = await getRandomFromSet(availableGold);
          }
        } else if (numAl >= 75) {
          let availableSilver = availableFromSet(datos.cards[1]);
          if (availableSilver.length == 0) {
            nuevoPersonaje = [];
          } else {
            nuevoPersonaje = await getRandomFromSet(availableSilver);
          }
        } else {
          let availableBronze = availableFromSet(datos.cards[2]);
          if (availableBronze.length == 0) {
            nuevoPersonaje = [];
          } else {
            nuevoPersonaje = await getRandomFromSet(availableBronze);
          }
        }
      }
      if (datosUsuarioActual.level[datos.scenario] == datos.level-1) {
        datosUsuarioActual.level[datos.scenario] = datos.level;
        if (battle == "Moria6") {
          datosUsuarioActual.level.total = 1;
        } else if (battle == "AmonHen4") {
          datosUsuarioActual.level.total = 2;
        } else if (battle == "Wargs3") {
          datosUsuarioActual.level.total = 3;
        } else if (battle == "HelmsDeep8") {
          datosUsuarioActual.level.total = 4;
        } else if (battle == "Osgiliath3") {
          datosUsuarioActual.level.total = 5;
        }  else if (battle == "MinasTirith8") {
          datosUsuarioActual.level.total = 6;
        } else if (battle == "BlackGate5") {
          datosUsuarioActual.level.total = 7;
        }
      }
      console.log(nuevoPersonaje);
      if (nuevoPersonaje.length > 0) {
        setTimeout(() => {
          document.getElementById(`newCards${battle}Container`).innerHTML = `<section class="newCards" id="newCards${battle}">
              <section class="newCard">
                <section class="secretCard secretCard${battle}"><img src="./assets/secretCard.png" alt="secretCard"></section>
                <section id="newCard1${battle}" class="hide newCardImg">${personajesNoObtenidos[nuevoPersonaje[1]].image}</section>
              </section>
            </section>`;
            let personajeNuevo = {
              name: nuevoPersonaje[0],
              xp: 0
            }
            datosUsuarioActual.charactersOwned.push(personajeNuevo);
            personajesObtenidos.push(personajesNoObtenidos[nuevoPersonaje[1]]);
            personajesNoObtenidos.splice(nuevoPersonaje[1], 1);
            setTimeout(() => {
              let secretCard = document.querySelector(`.secretCard${battle} img`);
              secretCard.classList.add("hide");
              document.getElementById(`newCard1${battle}`).classList.add("appear");
              document.getElementById(`newCard1${battle}`).classList.remove("hide");
              setTimeout(function() {
                secretCard = document.querySelector(`.secretCard${battle}`);
                secretCard.innerHTML += `<img src="./assets/effects/new_Card.gif" alt="effect">`;
                document.getElementById(`${scenario}`).innerHTML = "";
                document.getElementById(`${scenario}`).classList.add("hide");
                homeContent.classList.remove("hide");
                battleContent.classList.add("hide");
                shopContent.classList.add("hide");
                myCardsContent.classList.add("hide");
                document.getElementById("home").classList.add("outlined");
                document.getElementById("battle").classList.remove("outlined");
                document.getElementById("shop").classList.remove("outlined");
                document.getElementById("myCards").classList.remove("outlined");
                audio.src = "./assets/music/home.mp3";
                cargarHome();
                const documentRef = db.collection("users").doc(datosUsuarioActual.id);
                documentRef.update({
                  victories: datosUsuarioActual.victories,
                  level: datosUsuarioActual.level,
                  charactersOwned: datosUsuarioActual.charactersOwned,
                  coins: datosUsuarioActual.coins
                });
                if (music == true) {
                  audio.play();
                }
              }, 2000);
            }, 2000);
        }, 2000);
      } else {
        setTimeout(() => {
          document.getElementById(`${scenario}`).innerHTML = "";
          document.getElementById(`${scenario}`).classList.add("hide");
          homeContent.classList.remove("hide");
          battleContent.classList.add("hide");
          shopContent.classList.add("hide");
          myCardsContent.classList.add("hide");
          document.getElementById("home").classList.add("outlined");
          document.getElementById("battle").classList.remove("outlined");
          document.getElementById("shop").classList.remove("outlined");
          document.getElementById("myCards").classList.remove("outlined");
          audio.src = "./assets/music/home.mp3";
          cargarHome();
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            victories: datosUsuarioActual.victories,
            level: datosUsuarioActual.level,
            charactersOwned: datosUsuarioActual.charactersOwned,
            coins: datosUsuarioActual.coins
          });
          if (music == true) {
            audio.play();
          }
        }, 2000);
      }
    }, 2000);
  }, 1000); 
}

//funciones ataque y SM
function attackbufs(attackactive) {
  if (SMoveActualHeroes.hasOwnProperty("Aranarth")) {
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Aranarth") {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualHeroes.hasOwnProperty("Beregond")) {
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Beregond") {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualHeroes.hasOwnProperty("Holdbald")) {
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Holdbald") {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualHeroes.hasOwnProperty("Merry")) {
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Merry") {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualHeroes.hasOwnProperty("Theoden")) {
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Theoden") {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
        break;
      }}};
}

function attackbufsenemies(attackactive) {
  if (SMoveActualEnemies.hasOwnProperty("Goblin3")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Goblin3") {
        attackactive[0] *= (1 + enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("urukHai1")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "urukHai1") {
        attackactive[0] *= (1 + enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("WargRider2")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "WargRider2") {
        attackactive[0] *= (1 + enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("urukHai5")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "urukHai5") {
        attackactive[0] *= (1 + enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("Captain")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "Captain") {
        attackactive[0] *= (enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("orcMordor4")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "orcMordor4") {
        attackactive[0] *= (enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("orcMordor6")) {
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (heroesGlobal[i].name == "orcMordor6") {
        attackactive[0] *= (1 + enemiesGlobal[i].specialMoveActualAmount);
        break;
      }}};
  if (SMoveActualEnemies.hasOwnProperty("Murgash")) {
    attackactive[0] *= 3;
  }
}

async function attackHeroes(i) {
  let ataqueActual = attackactive;
  if (enemiesGlobal[i-1].name == "Sauron") {
    ataqueActual[0] *= 0.75;
  }
  if (SMoveActualEnemies.hasOwnProperty("armoredTroll") && enemiesGlobal[i-1].name == "armoredTroll") {
    armoredTroll += ataqueActual[0];
  }
  if (enemiesGlobal[i-1].name == "witchKing" && heroesGlobal[attackactive[1]].race == "Human" && heroesGlobal[attackactive[1]].gender == "Male") {
    attackactive[0] *= 0.7;
  }
  if (SMoveActualEnemies.hasOwnProperty("Goblin2") && enemiesGlobal[i-1].name == "Goblin2") {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<p class="dodge">Dodge</p>`;
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = 3;
    }
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
      let attack = document.getElementById("attackfunction");
      let SM = document.getElementById("SMfunction");
      actualizarBotones(attack, SM, battle);
      document.getElementById(`controls${battle}`).classList.remove("hide");
      document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
      eventosBatalla(battle);
    }, 1000);
  } else if (SMoveActualEnemies.hasOwnProperty("archerGoblin") || SMoveActualEnemies.hasOwnProperty("archer") || SMoveActualEnemies.hasOwnProperty("orcMordor5") || SMoveActualEnemies.hasOwnProperty("archerMordor2")) {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<p class="dodge">Dodge</p>`;
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = 3;
    }
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
      let attack = document.getElementById("attackfunction");
      let SM = document.getElementById("SMfunction");
      actualizarBotones(attack, SM, battle);
      document.getElementById(`controls${battle}`).classList.remove("hide");
      document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
      eventosBatalla(battle);
    }, 1000);
  } else if ((SMoveActualEnemies.hasOwnProperty("urukHai3") && enemiesGlobal[i-1].name == "urukHai3") || (SMoveActualEnemies.hasOwnProperty("orcMordor2") && enemiesGlobal[i-1].name == "orcMordor2") || (SMoveActualEnemies.hasOwnProperty("Mauhur") && enemiesGlobal[i-1].name == "Mauhur")) {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = i;
    }
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
      let attack = document.getElementById("attackfunction");
      let SM = document.getElementById("SMfunction");
      actualizarBotones(attack, SM, battle);
      document.getElementById(`controls${battle}`).classList.remove("hide");
      document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
      eventosBatalla(battle);
    }, 1000);
  } else if ((SMoveActualEnemies.hasOwnProperty("urukHai4") && enemiesGlobal[i-1].name == "urukHai4") || (SMoveActualEnemies.hasOwnProperty("urukHai6") && enemiesGlobal[i].name == "urukHai6") || (SMoveActualEnemies.hasOwnProperty("orcMordor3")) || (SMoveActualEnemies.hasOwnProperty("orcMordor7") && enemiesGlobal[i-1].name == "orcMordor7") || ((SMoveActualEnemies.hasOwnProperty("mumakil") && enemiesGlobal[i-1].name == "mumakil"))) {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = i;
    }
    ataqueActual[0] = ataqueActual[0]*0.6;
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML += `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
    enemiesGlobal[i-1].actualHealth -= ataqueActual[0];
    if (enemiesGlobal[i-1].actualHealth < 0) {
      enemiesGlobal[i-1].actualHealth = 0;
      document.getElementById(`enemy${i}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
    }
    document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
    if (!comprobarVictoria()) {
      setTimeout(() => {
        document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 1000);}
  } else if ((SMoveActualEnemies.hasOwnProperty("Haradrim2"))) {
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = i;
    }
    document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
    attackactive[0] = attackactive[0]*0.3;
    if (Gandalf == 1) {
      Gandalf = 0;
      if (enemiesGlobal[i].actualARecharge == 0) {
        enemiesGlobal[i].actualARecharge += 2;
      } else {
        enemiesGlobal[i].actualARecharge += 1;
      }
      if (enemiesGlobal[i].actualSRecharge == 0) {
        enemiesGlobal[i].actualSRecharge += 2;
      } else {
        enemiesGlobal[i].actualSRecharge += 1;
      }
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
    }
    document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
    enemiesGlobal[i].actualHealth -= attackactive[0];
    if (enemiesGlobal[i].actualHealth < 0) {
      enemiesGlobal[i].actualHealth = 0;
      document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
    }
    document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
    if (!comprobarVictoria()) {
      setTimeout(() => {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }, 1000);} 
    } else if (SMoveActualEnemies.hasOwnProperty("urukHai9") ) {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
    ataqueActual[0] = ataqueActual[0]*0.5;
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML += `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
    enemiesGlobal[i-1].actualHealth -= ataqueActual[0];
    if (enemiesGlobal[i-1].actualHealth < 0) {
      enemiesGlobal[i-1].actualHealth = 0;
      document.getElementById(`enemy${i}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
    }
    document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
    if (!comprobarVictoria()) {
      setTimeout(() => {
        document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 1000);}
  } else if (SMoveActualEnemies.hasOwnProperty("Warg2")) {
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = i;
    }
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML += `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
    enemiesGlobal[i-1].actualHealth -= ataqueActual[0];
    if (enemiesGlobal[i-1].actualHealth < 0) {
      enemiesGlobal[i-1].actualHealth = 0;
      document.getElementById(`enemy${i}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
    }
    document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
    if (!comprobarVictoria()) {
      setTimeout(() => {
        let devolucion;
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].name == "Warg2") {
            devolucion = enemiesGlobal[k].specialMoveAmount;
            break;
          }
        }
        document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
        ataqueActual[0] *= devolucion;
        document.getElementById(`specialEfectsHero${ataqueActual[1]+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        heroesGlobal[ataqueActual[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[ataqueActual[1]].actualHealth < 0) {
          heroesGlobal[ataqueActual[1]].actualHealth = 0;
          document.getElementById(`hero${ataqueActual[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[ataqueActual[1]].name}`).style.width = (heroesGlobal[ataqueActual[1]].actualHealth/heroesGlobal[ataqueActual[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${ataqueActual[1]+1}`).innerHTML = "";
            let attack = document.getElementById("attackfunction");
            let SM = document.getElementById("SMfunction");
            actualizarBotones(attack, SM, battle);
            document.getElementById(`controls${battle}`).classList.remove("hide");
            document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
            eventosBatalla(battle);
          }, 1000);
        }
      }, 1000);
    }
  } else if ((SMoveActualEnemies.hasOwnProperty("Guritz") && Guritz[1] == attackactive[1])) {
    document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
    document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML += `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
    if (heroesGlobal[attackactive[1]].actualHealth < 0) {
      heroesGlobal[attackactive[1]].actualHealth = 0;
      document.getElementById(`hero${attackactive[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
    }
    document.getElementById(`health${heroesGlobal[attackactive[1]].name}`).style.width = (heroesGlobal[attackactive[1]].actualHealth/heroesGlobal[attackactive[1]].maxHealth)*100 + "%";
    if (!comprobarDerrota()) {
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = "";
      }, 1000);
    }
  } else {
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && Damrod == 1) {
      Damrod = 0;
      DamrodAttack = i;
    }
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<p class="damageTaken">-${await ataqueActual[0]}pH</p>`;
    enemiesGlobal[i-1].actualHealth -= await ataqueActual[0];
    if (enemiesGlobal[i-1].actualHealth < 0) {
      enemiesGlobal[i-1].actualHealth = 0;
      document.getElementById(`enemy${i}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
      if (enemiesGlobal[i-1].name == "Troll") {
        document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
        for (let j = 1; j < enemiesGlobal.length; j++) {
          if (enemiesGlobal[j].actualHealth == 0) {
                  let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                  for (let k = 0; k < defeated.length; k++) {
                    defeated[k].remove();
                  }
                }
          enemiesGlobal[j].actualHealth += 40;
          document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
          document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
          setTimeout(() => {
            document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
          }, 1000);
        }
      }
    }
    document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
    if (enemiesGlobal[i-1].name == "Berserker3" && enemiesGlobal[i-1].actualHealth == 0) {
      for (let j = 1; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
        enemiesGlobal[j].actualHealth -= 60;
        if (enemiesGlobal[j].actualHealth < 0) {
          enemiesGlobal[j].actualHealth = 0;
          document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
      }
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
        heroesGlobal[j].actualHealth -= 60;
        if (heroesGlobal[j].actualHealth < 0) {
          heroesGlobal[j].actualHealth = 0;
          document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
      }
      if (!comprobarDerrota()) {
        if (!comprobarVictoria()) {
          for (let j = 0; j < heroesGlobal.length; j++) {
            document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
            document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
          }
        }
      }
    } else if (!comprobarVictoria()) {
      setTimeout(function() {
        for (let i = 1; i <= enemiesGlobal.length; i++) {
          document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
        };
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 1000);
    }
  }
}

async function attackArador() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Arador") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackAragorn() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Aragorn") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      if (heroesGlobal[i].specialMove == 1) {
        attackactive[0] *= heroesGlobal[i].specialMoveActualAmount;
        heroesGlobal[i].specialMove = 0;
      }
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackAranarth() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Aranarth") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackBeregond() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Beregond") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackBoromir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackCiryannil() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Ciryannil") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      if (heroesGlobal[i].specialMove == 1) {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
        heroesGlobal[i].specialMove = 0;
      }
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackDamrod() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Damrod") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackDernwine() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Dernwine") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackDuinhir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Duinhir") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      if (heroesGlobal[i].sMove == 1) {
        heroesGlobal[i].sMove = 0;
        attackactive[0] *= heroesGlobal[i].specialMoveActualAmount;
      }
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackElladan() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Elladan") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      if (SMoveActualHeroes.hasOwnProperty("Elladan")) {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
      };
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackElrohir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Elrohir") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackEomer() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Eomer") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackEowyn() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Eowyn") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      if (heroesGlobal[i].specialMove == 1) {
        attackactive[0] *= heroesGlobal[i].specialMoveActualAmount;
        heroesGlobal[i].specialMove = 0;
      }
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackEothain() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Eothain") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackFaramir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Faramir") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackFolcred() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Folcred") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackGaladriel() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Galadriel") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackGamling() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gamling") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackGandalf() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gandalf") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      Gandalf = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackGimli() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gimli") {
      attackactive = [0.25*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
  document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
  setTimeout(() => {
    document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
  }, 1000);
  attacksRemaining -= 1;
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    attackHeroes(i);
  }
}

async function attackGuthred() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Guthred") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackGwaihir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gwaihir") {
      attackactive = [0.45*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
  document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
  setTimeout(() => {
    document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
  }, 1000);
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    attackHeroes(i);
  }
}

async function attackHaldir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Haldir") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackHama() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Hama") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackHerubeam() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Herubeam") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackHoldbald() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Holdbald") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackkingDead() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "kingDead") {
      attackactive = [(0.5+heroesGlobal[i].attackActualAmount*kingDead)*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      kingDead += 1;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackLegolas() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Legolas") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackMaradir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Maradir") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      if (SMoveActualHeroes.hasOwnProperty("Maradir")) {
        attackactive[0] *= (1 + heroesGlobal[i].specialMoveActualAmount);
      };
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackMendener() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Mendener") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackMerry() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Merry") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackMinarorn() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Minarorn") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackOhtar() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Ohtar") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackPippin() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Pippin") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackprinceImrahil() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "princeImrahil") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackTheoden() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Theoden") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function attackTreebeard() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Treebeard") {
      attackactive = [0.25*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
  document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
  setTimeout(() => {
    document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
  }, 1000);
  attacksRemaining -= 1;
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    attackHeroes(i);
  }
}

async function attackUndome() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Undome") {
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualARecharge = heroesGlobal[i].attackRecharge;
      ataqueactivo = 1;
      document.getElementById(`attackContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function sMoveArador() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Arador") {
      SMoveActualHeroes.Arador = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveAragorn() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Aragorn") {
      heroesGlobal[i].specialMove = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveAranarth() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Aranarth") {
      SMoveActualHeroes.Aranarth = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveBeregond() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Beregond") {
      SMoveActualHeroes.Beregond = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveBoromir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
      SMoveActualHeroes.Boromir = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 1; j <= 3; j++) {
        document.getElementById(`specialEfectsHero${j}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 1; j <= 3; j++) {
          document.getElementById(`specialEfectsHero${j}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveCiryannil() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Ciryannil") {
      heroesGlobal[i].specialMove = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveDamrod() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Damrod") {
      SMoveActualHeroes.Damrod = 2;
      Damrod = 1;
      attackactive = [0.5*heroesGlobal[i].attack, i];
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      break;
    }
  }
  setTimeout(() => {
    document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
    document.getElementById(`selection${battle}`).classList.remove("hide");
  }, 750)
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
}

async function sMoveDernwine() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Dernwine") {
      SMoveActualHeroes.Dernwine = 2;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveDuinhir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Duinhir") {
      heroesGlobal[i].sMove = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveElladan() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Elladan") {
      SMoveActualHeroes.Elladan = 2;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveElrohir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Elrohir") {
      SMoveActualHeroes.Elrohir = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveEomer() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Eomer") {
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`; 
        if (enemiesGlobal[j].actualARecharge == 0) {
          enemiesGlobal[j].actualARecharge += 2;
        } else {
          enemiesGlobal[j].actualARecharge += 1;
        }
        if (enemiesGlobal[j].actualSRecharge == 0) {
          enemiesGlobal[j].actualSRecharge += 2;
        } else {
          enemiesGlobal[j].actualSRecharge += 1;
        }
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveEothain() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Eothain") {
      SMoveActualHeroes.Eothain = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveEowyn() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Eowyn") {
      heroesGlobal[i].specialMove = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveFaramir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Faramir") {
      Faramir = 1;
      attackactive = [heroesGlobal[i].specialMoveActualAmount, i];
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      document.getElementById(`selection${battle}`).classList.remove("hide");
      break;
    }
  }
}

async function sMoveFolcred() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Folcred") {
      SMoveActualHeroes.Folcred = 2;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveGaladriel() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Galadriel") {
      attackactive = [heroesGlobal[i].specialMoveActualAmount, i];
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        if (heroesGlobal[j].actualHealth == 0) {
          let defeated = document.querySelectorAll(`#hero${j+1} .damageTaken`);
          for (let k = 0; k < defeated.length; k++) {
            defeated[k].remove();
          }
        }
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="heal">+${attackactive[0]}pH</p>`;
        heroesGlobal[j].actualHealth += attackactive[0];
        if (heroesGlobal[j].actualHealth > heroesGlobal[j].maxHealth) {
          heroesGlobal[j].actualHealth = heroesGlobal[j].maxHealth;
        }
        document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 1000)
      break;
    }
  }
}

async function sMoveGamling() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gamling") {
      attacksRemaining += 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveGandalf() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gandalf") {
      SMoveActualHeroes.Gandalf = heroesGlobal[i].specialMoveRounds;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 1; j <= 3; j++) {
        document.getElementById(`specialEfectsHero${j}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 1; j <= 3; j++) {
          document.getElementById(`specialEfectsHero${j}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveGimli() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gimli") {
      SMoveActualHeroes.Gimli = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 1; j <= 3; j++) {
        document.getElementById(`specialEfectsHero${j}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 1; j <= 3; j++) {
          document.getElementById(`specialEfectsHero${j}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveGuthred() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Guthred") {
      SMoveActualHeroes.Guthred = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 1; j <= 3; j++) {
        document.getElementById(`specialEfectsHero${j}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 1; j <= 3; j++) {
          document.getElementById(`specialEfectsHero${j}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveGwaihir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Gwaihir") {
      Gwaihir = 2;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 1; j <= 3; j++) {
        document.getElementById(`specialEfectsHero${j}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 1; j <= 3; j++) {
          document.getElementById(`specialEfectsHero${j}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveHaldir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Haldir") {
      SMoveActualHeroes.Haldir = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < enemiesGlobal.length; j++) {
          document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveHama() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Hama") {
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`; 
        if (enemiesGlobal[j].actualARecharge == 0) {
          enemiesGlobal[j].actualARecharge += 2;
        } else {
          enemiesGlobal[j].actualARecharge += 1;
        }
        if (enemiesGlobal[j].actualSRecharge == 0) {
          enemiesGlobal[j].actualSRecharge += 2;
        } else {
          enemiesGlobal[j].actualSRecharge += 1;
        }
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveHerubeam() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Herubeam") {
      SMoveActualHeroes.Herubeam = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveHoldbald() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Holdbald") {
      SMoveActualHeroes.Holdbald = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      }
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMovekingDead() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "kingDead") {
      SMoveActualHeroes.kingDead = heroesGlobal[i].specialMoveRounds;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveLegolas() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Legolas") {
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      attackactive = [heroesGlobal[i].specialMoveActualAmount*heroesGlobal[i].attack, i];
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
  document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
  setTimeout(() => {
    document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
  }, 1000);
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    attackHeroes(i);
  }
}

async function sMoveMaradir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Maradir") {
      SMoveActualHeroes.Maradir = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveMendener() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Mendener") {
      SMoveActualHeroes.Mendener = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveMerry() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Merry") {
      SMoveActualHeroes.Merry = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`; 
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveMinarorn() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Minarorn") {
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      attackactive = [heroesGlobal[i].specialMoveAmount*heroesGlobal[i].attack, i];
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
  document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
  setTimeout(() => {
    document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
  }, 1000);
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    attackHeroes(i);
  }
}

async function sMoveOhtar() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Ohtar") {
      SMoveActualHeroes.Ohtar = 1;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`; 
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = ""; 
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMovePippin() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Pippin") {
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`; 
        if (enemiesGlobal[j].actualARecharge == 0) {
          enemiesGlobal[j].actualARecharge += 2;
        } else {
          enemiesGlobal[j].actualARecharge += 1;
        }
        if (enemiesGlobal[j].actualSRecharge == 0) {
          enemiesGlobal[j].actualSRecharge += 2;
        } else {
          enemiesGlobal[j].actualSRecharge += 1;
        }
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveprinceImrahil() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "princeImrahil") {
      attacksRemaining += 2;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`; 
        if (heroesGlobal[j].actualARecharge > 0) {
          heroesGlobal[j].actualARecharge -= 1;
        }
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = ""; 
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveTheoden() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Theoden") {
      SMoveActualHeroes.Theoden = heroesGlobal[i].specialMoveRounds;
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      }
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      setTimeout(() => {
        for (let j = 0; j < heroesGlobal.length; j++) {
          document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
        }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 750)
      break;
    }
  }
}

async function sMoveTreebeard() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Treebeard") {
      attackactive = [heroesGlobal[i].specialMoveActualAmount, i];
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<p class="heal">+${attackactive[0]}pH</p>`;
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      heroesGlobal[i].actualHealth += attackactive[0];
      if (heroesGlobal[i].actualHealth > heroesGlobal[i].maxHealth) {
        heroesGlobal[i].actualHealth = heroesGlobal[i].maxHealth;
      }
      setTimeout(() => {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
        document.getElementById(`health${heroesGlobal[i].name}`).style.width = (heroesGlobal[i].actualHealth/heroesGlobal[i].maxHealth)*100 + "%";
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        document.getElementById(`controls${battle}`).classList.remove("hide");
        document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
        eventosBatalla(battle);
      }, 1000)
      break;
    }
  }
}

async function sMoveUndome() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Undome") {
      heroesGlobal[i].actualSRecharge = heroesGlobal[i].specialMoveRecharge;
      SMRemaining -= 1;
      attackactive = [heroesGlobal[i].specialMoveAmount*heroesGlobal[i].attack, i];
      document.getElementById(`SMContainer${battle}`).classList.add("hide");
      break;
    }
  }
  attackbufs(attackactive);
  attackactive = [Math.round(await attackactive[0]), attackactive[1]];
  document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
  setTimeout(() => {
    document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
  }, 1000);
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    attackHeroes(i);
  }
}

function attackEnemy(index) {
  let ataqueActual = attackactive;
  return new Promise((resolve) => {
    async function ataque() {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
      }, 750);
      let enemigosVivos = [];
      for (let i = 0; i < heroesGlobal.length; i++) {
        if (heroesGlobal[i].actualHealth > 0) {
          enemigosVivos.push([heroesGlobal[i].name, i]);
        }
      }
      let enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(ataqueActual);
      ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          if (enemiesGlobal[enemigoConfusion[1]].name == "Sauron") {
            ataqueActual[0] *= 0.75;
          }
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            if (enemiesGlobal[enemigoConfusion[1]].name == "Troll") {
              document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
              for (let j = 1; j < enemiesGlobal.length; j++) {
                if (enemiesGlobal[j].actualHealth == 0) {
                  let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                  for (let k = 0; k < defeated.length; k++) {
                    defeated[k].remove();
                  }
                }
                enemiesGlobal[j].actualHealth += 40;
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                }, 1000);
              }
            }
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (enemiesGlobal[enemigoConfusion[1]].name == "Berserker3" && enemiesGlobal[enemigoConfusion[1]].actualHealth == 0) {
            for (let j = 1; j < enemiesGlobal.length; j++) {
              document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              enemiesGlobal[j].actualHealth -= 60;
              if (enemiesGlobal[j].actualHealth < 0) {
                enemiesGlobal[j].actualHealth = 0;
                document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
            }
            for (let j = 0; j < heroesGlobal.length; j++) {
              document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              heroesGlobal[j].actualHealth -= 60;
              if (heroesGlobal[j].actualHealth < 0) {
                heroesGlobal[j].actualHealth = 0;
                document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
            }
            if (!comprobarDerrota()) {
              if (!comprobarVictoria()) {
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                }
              }
            }
          } else if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                    if (enemiesGlobal[index].name == "Troll") {
                      document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                      for (let j = 1; j < enemiesGlobal.length; j++) {
                        if (enemiesGlobal[j].actualHealth == 0) {
                          let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                          for (let k = 0; k < defeated.length; k++) {
                            defeated[k].remove();
                          }
                        }
                        enemiesGlobal[j].actualHealth += 40;
                        document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                        setTimeout(() => {
                          document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                        }, 1000);
                      }
                    }
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
              }};
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                if (enemiesGlobal[index].name == "Troll") {
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  for (let j = 1; j < enemiesGlobal.length; j++) {
                    if (enemiesGlobal[j].actualHealth == 0) {
                      let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                      for (let k = 0; k < defeated.length; k++) {
                        defeated[k].remove();
                      }
                    }
                    enemiesGlobal[j].actualHealth += 40;
                    document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                    setTimeout(() => {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    }, 1000);
                  }
                }
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  if (enemiesGlobal[index].name == "Troll") {
                    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                    for (let j = 1; j < enemiesGlobal.length; j++) {
                      if (enemiesGlobal[j].actualHealth == 0) {
                        let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                        for (let k = 0; k < defeated.length; k++) {
                          defeated[k].remove();
                        }
                      }
                      enemiesGlobal[j].actualHealth += 40;
                      document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                      setTimeout(() => {
                        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      }, 1000);
                    }
                  }
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              if (enemiesGlobal[index].name == "Troll") {
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  if (enemiesGlobal[j].actualHealth == 0) {
                    let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                    for (let k = 0; k < defeated.length; k++) {
                      defeated[k].remove();
                    }
                  }
                  enemiesGlobal[j].actualHealth += 40;
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  }, 1000);
                }
              }
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }   
    }
    ataque()
  });
}

async function attackWatcher(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGoblin1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    if (SMoveActualEnemies.hasOwnProperty("Goblin1")) {
      attackactive[0] *= (1 + enemiesGlobal[index].specialMoveAmount);
    }
    resolve(attackEnemy(index))
  });
}

async function attackGoblin2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGoblin3(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackcaveTroll(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackLeaderGoblin(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackarcherGoblin(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackBalrog(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    if (SMoveActualEnemies.hasOwnProperty("Balrog")) {
      attackactive[0] *= enemiesGlobal[index].specialMoveAmount;
    }
    resolve(attackEnemy(index))
  });
}

async function attackNazgul(index) {
  return new Promise((resolve) => {
    attackactive = [0.75*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    if (SMoveActualEnemies.hasOwnProperty("urukHai2")) {
      attackactive[0] *= (1 + enemiesGlobal[index].specialMoveAmount);
    }
    resolve(attackEnemy(index))
  });
}

async function attackurukHai3(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai4(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackUgluk(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackLurtz(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackWargRider1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    if (SMoveActualEnemies.hasOwnProperty("WargRider1")) {
      attackactive[0] *= (1 + enemiesGlobal[index].specialMoveAmount);
    }
    resolve(attackEnemy(index))
  });
}

async function attackWargRider2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackWarg1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackWarg2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackWargLeader(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let enemigosVivos = [];
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].actualHealth > 0) {
        enemigosVivos.push([heroesGlobal[i].name, i]);
      }
    }
    let enemigoElegido;
    async function ataque() {
      enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(attackactive);
      attackactive = [Math.round(await attackactive[0]), attackactive[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= attackactive[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }
    }
    ataque();
  });
}

async function attackarcher(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackcrossbow(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackBerserker1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai5(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai6(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai7(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    if (SMoveActualEnemies.hasOwnProperty("urukHai7")) {
      attackactive[0] *= (1 + enemiesGlobal[index].specialMoveAmount);
    }
    resolve(attackEnemy(index))
  });
}

async function attackBerserker3(index) {
  return new Promise((resolve) => {
    attackactive = [0.6*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai8(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackurukHai9(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackspearman(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackCaptain(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackBatteringRam(index) {
  return new Promise((resolve) => {
    attackactive = [100, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackBerserker2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackMog(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGrima(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackSaruman(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let enemigosVivos = [];
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].actualHealth > 0) {
        enemigosVivos.push([heroesGlobal[i].name, i]);
      }
    }
    let enemigoElegido;
    async function ataque() {
      enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(attackactive);
      attackactive = [Math.round(await attackactive[0]), attackactive[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= attackactive[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        if (heroesGlobal[enemigoElegido[1]].actualSRecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualSRecharge += 1;
        }
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }
    }
    ataque();
  });
}

async function attackarcherMordor1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    if (enemiesGlobal[index].specialMove == 1) {
      enemiesGlobal[index].specialMove = 0;
      attackactive[0] *= (1+ enemiesGlobal[index].specialMoveActualAmount);
    }
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor3(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor4(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor5(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackarcherMordor2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackTroll(index) {
  return new Promise((resolve) => {
    attackactive = [0.75*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor6(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor7(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor8(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGrond(index) {
  return new Promise((resolve) => {
    attackactive = [0.75*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackarmoredTroll(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack + armoredTroll, index];
    armoredTroll = 0;
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor11(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor9(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    if (enemiesGlobal[index].sMove == 1) {
      enemiesGlobal[index].sMove = 0;
      attackactive[0] *= 2.5;
    }
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackorcMordor10(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackmumakil(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    if (SMoveActualHeroes.hasOwnProperty("mumakil")) {
      attackactive[0] *= 1.6;
    }
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackMahud(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackarcherHaradrim(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGuritz(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGothmog(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackwitchKing(index) {
  return new Promise((resolve) => {
    attackactive = [0.70*enemiesGlobal[index].attack, index];
    if (enemiesGlobal[index].sMove == 1) {
      enemiesGlobal[index].sMove = 0;
      attackactive[0] *= 3.5;
    }
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackMurgash(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackMauhur(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackHaradrim1(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackHaradrim2(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackShagrat(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    if (enemiesGlobal[index].sMove == 1) {
      enemiesGlobal[index].sMove = 0;
      attackactive[0] *= 4;
    }
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackSnaga(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackRadbug(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackGorbag(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackOlogHai(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackMouthOfSauron(index) {
  return new Promise((resolve) => {
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    resolve(attackEnemy(index))
  });
}

async function attackSauron(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let ataqueActual = attackactive;
    for (let i = 0; i < heroesGlobal.length; i++) {
      let enemigoElegido = [0, i];
      async function ataque() {
        attackbufsenemies(ataqueActual);
        ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
        if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
          let enemiesAlive = [];
          for (let k = 0; k < enemiesGlobal.length; k++) {
            if (enemiesGlobal[k].actualHealth > 0) {
              enemiesAlive.push([enemiesGlobal[k].name, k]);
            }
          }
          let enemigoConfusion;
          async function confusion() {
            enemigoConfusion = await getRandomFromSet(enemiesAlive);
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
            document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
            if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
              enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
              document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
          confusion();
        } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Gandalf") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }} 
          if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
            let devolverAtaque = 0;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                for (let i = 0; i < heroesGlobal.length; i++) {
                  if (heroesGlobal[i].name == "Gimli") {
                    devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                    Math.round(devolverAtaque);
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                    enemiesGlobal[index].actualHealth -= devolverAtaque;
                    if (enemiesGlobal[index].actualHealth < 0) {
                      enemiesGlobal[index].actualHealth = 0;
                      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                    }
                    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                    break;
                  }};
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            } else {
              resolve(false);
            }
          } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
            let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
            Math.round(devolverAtaque);
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Guthred") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
              heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
              if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
                heroesGlobal[enemigoElegido[1]].actualHealth = 0;
                document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
          } else {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }   
      }
    ataque()
    }
  });
}

async function sMoveWatcher(index) {
  return new Promise((resolve) => {
    attackactive = [enemiesGlobal[index].specialMoveActualAmount, index];
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="heal">+${attackactive[0]}pH</p>`;
    enemiesGlobal[index].actualHealth += attackactive[0];
    if (enemiesGlobal[index].actualHealth > enemiesGlobal[index].maxHealth) {
      enemiesGlobal[index].actualHealth = enemiesGlobal[index].maxHealth;
    }
    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 1000);
  });
}

async function sMoveGoblin1(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Goblin1 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveGoblin2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Goblin2 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveGoblin3(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Goblin3 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMovecaveTroll(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [enemiesGlobal[index].specialMoveActualAmount, index];
    resolve(attackEnemy(index))
  });
}

async function sMoveLeaderGoblin(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < heroesGlobal.length; j++) {
      if (heroesGlobal[j].actualARecharge == 0) {
        heroesGlobal[j].actualARecharge += 2;
      } else {
        heroesGlobal[j].actualARecharge += 1;
      }
      if (heroesGlobal[j].actualSRecharge == 0) {
        heroesGlobal[j].actualSRecharge += 2;
      } else {
        heroesGlobal[j].actualSRecharge += 1;
      }
    }
    for (let j = 0; j < heroesGlobal.length; j++) {
      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
    }
    setTimeout(() => {
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMovearcherGoblin(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.archerGoblin = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveBalrog(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Balrog = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveNazgul(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < heroesGlobal.length; j++) {
      if (heroesGlobal[j].actualARecharge == 0) {
        heroesGlobal[j].actualARecharge += 3;
      } else {
        heroesGlobal[j].actualARecharge += 2;
      }
      if (heroesGlobal[j].actualSRecharge == 0) {
        heroesGlobal[j].actualSRecharge += 3;
      } else {
        heroesGlobal[j].actualSRecharge += 2;
      }
    }
    for (let j = 0; j < heroesGlobal.length; j++) {
      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
    }
    setTimeout(() => {
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveurukHai1(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai1 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveurukHai2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai2 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveurukHai3(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai3 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveurukHai4(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai4 = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveUgluk(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [enemiesGlobal[index].specialMoveActualAmount, index];
    for (let j = 0; j < enemiesGlobal.length; j++) {
      if (enemiesGlobal[j].actualHealth == 0) {
        let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
        for (let k = 0; k < defeated.length; k++) {
          defeated[k].remove();
        }
      }
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+${attackactive[0]}pH</p>`;
      enemiesGlobal[j].actualHealth += attackactive[0];
      if (enemiesGlobal[j].actualHealth > enemiesGlobal[j].maxHealth) {
        enemiesGlobal[j].actualHealth = enemiesGlobal[j].maxHealth;
      }
      document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveLurtz(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
    }, 750);
    attackactive = [1.5*enemiesGlobal[index].attack, index];
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${enemiesGlobal[index].specialMoveActualAmount}pH</p>`;
    enemiesGlobal[index].actualHealth -= enemiesGlobal[index].specialMoveActualAmount;
    if (enemiesGlobal[index].actualHealth <= 0) {
      enemiesGlobal[index].actualHealth = 0;
      document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
      if (!comprobarVictoria()) {
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else {
        resolve(false);
      }
    } else {
      setTimeout(() => {
        document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
        document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
        resolve(attackEnemy(index))
      }, 1000);
    }
  })
}

async function sMoveWargRider1(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.WargRider1 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveWargRider2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.WargRider2 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveWarg1(index) {
  return new Promise((resolve) => {
    enemiesAttaks = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveWarg2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Warg2 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveWargLeader(index) {
  console.log("1er control");
  return new Promise((resolve) => {
    async function sMove() {
      enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
      document.getElementById(`enemy${index+1}`).style.animation = "enemyAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`enemy${index+1}`).style.animation = "";
      }, 1000);
      let enemigosVivos = [];
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].actualHealth > 0) {
              enemigosVivos.push([heroesGlobal[i].name, i]);
            }
          }
      let enemigoElegido = await getRandomFromSet(enemigosVivos);
      document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-40pH</p>`;
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="heal">+40pH</p>`;
      heroesGlobal[enemigoElegido[1]].actualHealth -= 40;
      enemiesGlobal[index].actualHealth += 40;
      if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
        heroesGlobal[enemigoElegido[1]].actualHealth = 0;
        document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
      }
      if (enemiesGlobal[index].actualHealth > enemiesGlobal[index].maxHealth) {
        enemiesGlobal[index].actualHealth = enemiesGlobal[index].maxHealth;
      }
      document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
      document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
      if (!comprobarDerrota()) {
        setTimeout(function() {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
          resolve(true);
        }, 2000);
      } else {
        resolve(false);
      }
    }
    sMove();
  });
}

async function sMovearcher(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.archer = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMovecrossbow(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [enemiesGlobal[index].specialMoveAmount*enemiesGlobal[index].attack, index];
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let ataqueActual = attackactive;
    for (let i = 0; i < heroesGlobal.length; i++) {
      let enemigoElegido = [0, i];
      async function ataque() {
        attackbufsenemies(ataqueActual);
        ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
        if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
          let enemiesAlive = [];
          for (let k = 0; k < enemiesGlobal.length; k++) {
            if (enemiesGlobal[k].actualHealth > 0) {
              enemiesAlive.push([enemiesGlobal[k].name, k]);
            }
          }
          let enemigoConfusion;
          async function confusion() {
            enemigoConfusion = await getRandomFromSet(enemiesAlive);
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
            document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
            if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
              enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
              document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
          confusion();
        } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Gandalf") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }} 
            
          if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
            let devolverAtaque = 0;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                for (let i = 0; i < heroesGlobal.length; i++) {
                  if (heroesGlobal[i].name == "Gimli") {
                    devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                    Math.round(devolverAtaque);
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                    enemiesGlobal[index].actualHealth -= devolverAtaque;
                    if (enemiesGlobal[index].actualHealth < 0) {
                      enemiesGlobal[index].actualHealth = 0;
                      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                    }
                    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                    break;
                  }};
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            } else {
              resolve(false);
            }
          } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
            let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
            Math.round(devolverAtaque);
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Guthred") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
              heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
              if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
                heroesGlobal[enemigoElegido[1]].actualHealth = 0;
                document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
          } else {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }   
      }
    ataque()
    }
  });
}

async function sMoveurukHai5(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai5 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveBerserker1(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
    }, 750);
    attackactive = [1.25*enemiesGlobal[index].attack, index];
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${enemiesGlobal[index].specialMoveActualAmount}pH</p>`;
    enemiesGlobal[index].actualHealth -= enemiesGlobal[index].specialMoveActualAmount;
    if (enemiesGlobal[index].actualHealth <= 0) {
      enemiesGlobal[index].actualHealth = 0;
      document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
      if (!comprobarVictoria()) {
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else {
        resolve(false);
      }
    } else {
      setTimeout(() => {
        document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
        document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
        resolve(attackEnemy(index))
      }, 1000);
    }
  })
}

async function sMoveurukHai6(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai6 = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveurukHai7(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai7 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveurukHai8(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai8 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    let ataqueActual = attackactive;
    async function ataque() {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
      }, 750);
      let enemigosVivos = [];
      for (let i = 0; i < heroesGlobal.length; i++) {
        if (heroesGlobal[i].actualHealth > 0) {
          enemigosVivos.push([heroesGlobal[i].name, i]);
        }
      }
      let enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(ataqueActual);
      ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (enemiesGlobal[enemigoConfusion[1]].name == "Berserker3" && enemiesGlobal[enemigoConfusion[1]].actualHealth == 0) {
            for (let j = 1; j < enemiesGlobal.length; j++) {
              document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              enemiesGlobal[j].actualHealth -= 60;
              if (enemiesGlobal[j].actualHealth < 0) {
                enemiesGlobal[j].actualHealth = 0;
                document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
            }
            for (let j = 0; j < heroesGlobal.length; j++) {
              document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              heroesGlobal[j].actualHealth -= 60;
              if (heroesGlobal[j].actualHealth < 0) {
                heroesGlobal[j].actualHealth = 0;
                document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
            }
            if (!comprobarDerrota()) {
              if (!comprobarVictoria()) {
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                }
              }
            }
          } else if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        delayedDamage = [enemigoElegido[1], enemiesGlobal[index].specialMoveActualAmount*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
              }};
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
        delayedDamage = [enemigoElegido[1], enemiesGlobal[index].specialMoveActualAmount*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        delayedDamage = [enemigoElegido[1], enemiesGlobal[index].specialMoveActualAmount*enemiesGlobal[index].attack];
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        delayedDamage = [enemigoElegido[1], enemiesGlobal[index].specialMoveActualAmount*enemiesGlobal[index].attack];
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        delayedDamage = [enemigoElegido[1], enemiesGlobal[index].specialMoveActualAmount*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        delayedDamage = [enemigoElegido[1], enemiesGlobal[index].specialMoveActualAmount*enemiesGlobal[index].attack];
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }   
    }
    ataque()
  });
}

async function sMoveurukHai9(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.urukHai9 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < heroesGlobal.length; i++) {
      document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
    }
    setTimeout(() => {
      for (let i = 0; i < heroesGlobal.length; i++) {
        document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMovespearman(index) {
  return new Promise((resolve) => {
    attackactive = [30, index];
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let enemigosVivos = [];
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].actualHealth > 0) {
        enemigosVivos.push([heroesGlobal[i].name, i]);
      }
    }
    let enemigoElegido;
    async function ataque() {
      enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(attackactive);
      attackactive = [Math.round(await attackactive[0]), attackactive[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= attackactive[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }
    }
    ataque();
  });
}

async function sMoveCaptain(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Captain = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveBerserker2(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
    }, 750);
    attackactive = [1.25*enemiesGlobal[index].attack, index];
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${enemiesGlobal[index].specialMoveActualAmount}pH</p>`;
    enemiesGlobal[index].actualHealth -= enemiesGlobal[index].specialMoveActualAmount;
    if (enemiesGlobal[index].actualHealth <= 0) {
      enemiesGlobal[index].actualHealth = 0;
      document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
      if (!comprobarVictoria()) {
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else {
        resolve(false);
      }
    } else {
      setTimeout(() => {
        document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
        document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
        resolve(attackEnemy(index))
      }, 1000);
    }
  })
}

async function sMoveMog(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      if (enemiesGlobal[i].actualARecharge > 0) {
        enemiesGlobal[i].actualARecharge -= 1;
      }
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      attackactive = [0.5*enemiesGlobal[index].attack, index];
      enemiesGlobal[index].actualARecharge = enemiesGlobal[index].attackRecharge;
      resolve(attackEnemy(index))
    }, 750)
  });
}

async function sMoveGrima(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Grima = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    let ataqueActual = attackactive;
    async function ataque() {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
      }, 750);
      let enemigosVivos = [];
      for (let i = 0; i < heroesGlobal.length; i++) {
        if (heroesGlobal[i].actualHealth > 0) {
          enemigosVivos.push([heroesGlobal[i].name, i]);
        }
      }
      let enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(ataqueActual);
      ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (enemiesGlobal[enemigoConfusion[1]].name == "Berserker3" && enemiesGlobal[enemigoConfusion[1]].actualHealth == 0) {
            for (let j = 1; j < enemiesGlobal.length; j++) {
              document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              enemiesGlobal[j].actualHealth -= 60;
              if (enemiesGlobal[j].actualHealth < 0) {
                enemiesGlobal[j].actualHealth = 0;
                document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
            }
            for (let j = 0; j < heroesGlobal.length; j++) {
              document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              heroesGlobal[j].actualHealth -= 60;
              if (heroesGlobal[j].actualHealth < 0) {
                heroesGlobal[j].actualHealth = 0;
                document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
            }
            if (!comprobarDerrota()) {
              if (!comprobarVictoria()) {
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                }
              }
            }
          } else if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
              }};
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }   
    }
    ataque()
  });
}

async function sMoveSaruman(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let ataqueActual = attackactive;
    for (let i = 0; i < heroesGlobal.length; i++) {
      let enemigoElegido = [0, i];
      async function ataque() {
        attackbufsenemies(ataqueActual);
        ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
        if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
          let enemiesAlive = [];
          for (let k = 0; k < enemiesGlobal.length; k++) {
            if (enemiesGlobal[k].actualHealth > 0) {
              enemiesAlive.push([enemiesGlobal[k].name, k]);
            }
          }
          let enemigoConfusion;
          async function confusion() {
            enemigoConfusion = await getRandomFromSet(enemiesAlive);
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
            document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
            if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
              enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
              document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
          confusion();
        } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Gandalf") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }} 
          if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
            let devolverAtaque = 0;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                for (let i = 0; i < heroesGlobal.length; i++) {
                  if (heroesGlobal[i].name == "Gimli") {
                    devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                    Math.round(devolverAtaque);
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                    enemiesGlobal[index].actualHealth -= devolverAtaque;
                    if (enemiesGlobal[index].actualHealth < 0) {
                      enemiesGlobal[index].actualHealth = 0;
                      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                    }
                    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                    break;
                  }};
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            } else {
              resolve(false);
            }
          } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
            let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
            Math.round(devolverAtaque);
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Guthred") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
              heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
              if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
                heroesGlobal[enemigoElegido[1]].actualHealth = 0;
                document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
          } else {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }   
      }
    ataque()
    }
  });
}

async function sMovearcherMordor1(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [enemiesGlobal[index].specialMoveAmount*enemiesGlobal[index].attack, index];
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let ataqueActual = attackactive;
    for (let i = 0; i < heroesGlobal.length; i++) {
      let enemigoElegido = [0, i];
      async function ataque() {
        attackbufsenemies(ataqueActual);
        ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
        if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
          let enemiesAlive = [];
          for (let k = 0; k < enemiesGlobal.length; k++) {
            if (enemiesGlobal[k].actualHealth > 0) {
              enemiesAlive.push([enemiesGlobal[k].name, k]);
            }
          }
          let enemigoConfusion;
          async function confusion() {
            enemigoConfusion = await getRandomFromSet(enemiesAlive);
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
            document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
            if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
              enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
              document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              if (enemiesGlobal[enemigoConfusion[1]].name == "Troll") {
                document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  if (enemiesGlobal[j].actualHealth == 0) {
                    let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                    for (let k = 0; k < defeated.length; k++) {
                      defeated[k].remove();
                    }
                  }
                  enemiesGlobal[j].actualHealth += 40;
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  }, 1000);
                }
              }
            }
            document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
          confusion();
        } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Gandalf") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }} 
          if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
            let devolverAtaque = 0;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                for (let i = 0; i < heroesGlobal.length; i++) {
                  if (heroesGlobal[i].name == "Gimli") {
                    devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                    Math.round(devolverAtaque);
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                    enemiesGlobal[index].actualHealth -= devolverAtaque;
                    if (enemiesGlobal[index].actualHealth < 0) {
                      enemiesGlobal[index].actualHealth = 0;
                      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                    }
                    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                    break;
                  }};
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            } else {
              resolve(false);
            }
          } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
            let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
            Math.round(devolverAtaque);
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Guthred") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
              heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
              if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
                heroesGlobal[enemigoElegido[1]].actualHealth = 0;
                document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
          } else {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }   
      }
    ataque()
    }
  });
}

async function sMoveorcMordor1(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].specialMove = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.orcMordor2 = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor3(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.orcMordor3 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor4(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.orcMordor4 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor5(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.orcMordor5 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMovearcherMordor2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.archerMordor2 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor6(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.orcMordor6 = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < enemiesGlobal.length; j++) {
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor7(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.orcMordor7 = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor8(index) {
  return new Promise((resolve) => {
    enemiesAttaks = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMovearmoredTroll(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.armoredTroll = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor11(index) {
  return new Promise((resolve) => {
    attackactive = [45, index];
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let enemigosVivos = [];
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].actualHealth > 0) {
        enemigosVivos.push([heroesGlobal[i].name, i]);
      }
    }
    let enemigoElegido;
    async function ataque() {
      enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(attackactive);
      attackactive = [Math.round(await attackactive[0]), attackactive[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= attackactive[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }
    }
    ataque();
  });
}

async function sMoveorcMordor9(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].sMove = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMordor10(index) {
  return new Promise((resolve) => {
    enemiesAttaks = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveorcMahud(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.mumakil = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy$1`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy1`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMovearcherHaradrim(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [0.4*enemiesGlobal[index].attack, index];
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let ataqueActual = attackactive;
    for (let i = 0; i < heroesGlobal.length; i++) {
      let enemigoElegido = [0, i];
      async function ataque() {
        attackbufsenemies(ataqueActual);
        ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
        if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
          let enemiesAlive = [];
          for (let k = 0; k < enemiesGlobal.length; k++) {
            if (enemiesGlobal[k].actualHealth > 0) {
              enemiesAlive.push([enemiesGlobal[k].name, k]);
            }
          }
          let enemigoConfusion;
          async function confusion() {
            enemigoConfusion = await getRandomFromSet(enemiesAlive);
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
            document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
            if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
              enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
              document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              if (enemiesGlobal[enemigoConfusion[1]].name == "Troll") {
                document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  if (enemiesGlobal[j].actualHealth == 0) {
                    let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                    for (let k = 0; k < defeated.length; k++) {
                      defeated[k].remove();
                    }
                  }
                  enemiesGlobal[j].actualHealth += 40;
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  }, 1000);
                }
              }
            }
            document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
          confusion();
        } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Gandalf") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }} 
          if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
            let devolverAtaque = 0;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                for (let i = 0; i < heroesGlobal.length; i++) {
                  if (heroesGlobal[i].name == "Gimli") {
                    devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                    Math.round(devolverAtaque);
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                    enemiesGlobal[index].actualHealth -= devolverAtaque;
                    if (enemiesGlobal[index].actualHealth < 0) {
                      enemiesGlobal[index].actualHealth = 0;
                      document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                    }
                    document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                    break;
                  }};
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            } else {
              resolve(false);
            }
          } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
            let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
            Math.round(devolverAtaque);
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                if (!comprobarVictoria()) {
                  setTimeout(() => {
                    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                    resolve(true);
                  }, 1000);
                } else {
                  resolve(false);
                }
              }, 1000);
            }
          } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Guthred") {
                ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
                break;
              }}
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
              heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
              if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
                heroesGlobal[enemigoElegido[1]].actualHealth = 0;
                document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
          } else {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }   
      }
    ataque()
    }
  });
}

async function sMoveGuritz(index) {
  return new Promise(async (resolve) => {
    SMoveActualEnemies.Guritz = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750);
    let enemiesAlive = [];
    for (let k = 0; k < heroesGlobal.length; k++) {
      if (heroesGlobal[k].actualHealth > 0) {
        enemiesAlive.push([heroesGlobal[k].name, k]);
      }
    }
    Guritz = await getRandomFromSet(enemiesAlive);
  });
}

async function sMoveGothmog(index) {
  return new Promise((resolve) => {
    enemiesAttaks = 3;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMovewitchKing(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].sMove = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveMurgash(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Murgash = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveMauhur(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Mauhur = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveHaradrim1(index) {
  return new Promise((resolve) => {
    attackactive = [51, index];
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
    setTimeout(() => {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
    }, 1000);
    let enemigosVivos = [];
    for (let i = 0; i < heroesGlobal.length; i++) {
      if (heroesGlobal[i].actualHealth > 0) {
        enemigosVivos.push([heroesGlobal[i].name, i]);
      }
    }
    let enemigoElegido;
    async function ataque() {
      enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(attackactive);
      attackactive = [Math.round(await attackactive[0]), attackactive[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= attackactive[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
                }};
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * attackactive[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * attackactive[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            attackactive[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        if (heroesGlobal[enemigoElegido[1]].actualARecharge == 0) {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 2;
        } else {
          heroesGlobal[enemigoElegido[1]].actualARecharge += 1;
        }
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= attackactive[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }
    }
    ataque();
  });
}

async function sMoveHaradrim2(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Haradrim2 = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveShagrat(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].sMove = 1;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    setTimeout(() => {
      document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
      resolve(true);
    }, 750)
  });
}

async function sMoveSnaga(index) {
  return new Promise((resolve) => {
    SMoveActualEnemies.Snaga = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [0.5*enemiesGlobal[index].attack, index];
    let ataqueActual = attackactive;
    async function ataque() {
      document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "enemyAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`enemy${attackactive[1]+1}`).style.animation = "";
      }, 750);
      let enemigosVivos = [];
      for (let i = 0; i < heroesGlobal.length; i++) {
        if (heroesGlobal[i].actualHealth > 0) {
          enemigosVivos.push([heroesGlobal[i].name, i]);
        }
      }
      let enemigoElegido = await getRandomFromSet(enemigosVivos);
      attackbufsenemies(ataqueActual);
      ataqueActual = [Math.round(await ataqueActual[0]), ataqueActual[1]];
      if (Gwaihir == 1) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gwaihir") {
            if (Math.random() >= heroesGlobal[i].specialMoveActualAmount) {
              esquivaGwaihir = true;
            } else {
              esquivaGwaihir = false;
            }
            break;
          }
        }
      }
      if ((SMoveActualHeroes.hasOwnProperty("Arador") && heroesGlobal[enemigoElegido[1]].name == "Arador") || (SMoveActualHeroes.hasOwnProperty("Herubeam") && heroesGlobal[enemigoElegido[1]].name == "Herubeam") || (SMoveActualHeroes.hasOwnProperty("Mendener") && heroesGlobal[enemigoElegido[1]].name == "Mendener") || Gwaihir == 2 || esquivaGwaihir) {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Haldir")) {
        let enemiesAlive = [];
        for (let k = 0; k < enemiesGlobal.length; k++) {
          if (enemiesGlobal[k].actualHealth > 0) {
            enemiesAlive.push([enemiesGlobal[k].name, k]);
          }
        }
        let enemigoConfusion;
        async function confusion() {
          enemigoConfusion = await getRandomFromSet(enemiesAlive);
          document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
          document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          enemiesGlobal[enemigoConfusion[1]].actualHealth -= ataqueActual[0];
          if (enemiesGlobal[enemigoConfusion[1]].actualHealth < 0) {
            enemiesGlobal[enemigoConfusion[1]].actualHealth = 0;
            document.getElementById(`enemy${enemigoConfusion[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[enemigoConfusion[1]].name}`).style.width = (enemiesGlobal[enemigoConfusion[1]].actualHealth/enemiesGlobal[enemigoConfusion[1]].maxHealth)*100 + "%";
          if (enemiesGlobal[enemigoConfusion[1]].name == "Berserker3" && enemiesGlobal[enemigoConfusion[1]].actualHealth == 0) {
            for (let j = 1; j < enemiesGlobal.length; j++) {
              document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              enemiesGlobal[j].actualHealth -= 60;
              if (enemiesGlobal[j].actualHealth < 0) {
                enemiesGlobal[j].actualHealth = 0;
                document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
            }
            for (let j = 0; j < heroesGlobal.length; j++) {
              document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
              heroesGlobal[j].actualHealth -= 60;
              if (heroesGlobal[j].actualHealth < 0) {
                heroesGlobal[j].actualHealth = 0;
                document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
            }
            if (!comprobarDerrota()) {
              if (!comprobarVictoria()) {
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                }
              }
            }
          } else if (!comprobarVictoria()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsEnemy${enemigoConfusion[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
        confusion();
      } else if (SMoveActualHeroes.hasOwnProperty("kingDead") && heroesGlobal[enemigoElegido[1]].name == "kingDead") {
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
          resolve(true);
        }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gandalf")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Gandalf") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }} 
        if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar")) {
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
          let devolverAtaque = 0;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              for (let i = 0; i < heroesGlobal.length; i++) {
                if (heroesGlobal[i].name == "Gimli") {
                  devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                  Math.round(devolverAtaque);
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                  enemiesGlobal[index].actualHealth -= devolverAtaque;
                  if (enemiesGlobal[index].actualHealth < 0) {
                    enemiesGlobal[index].actualHealth = 0;
                    document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                  break;
              }};
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          } else {
            resolve(false);
          }
        } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
          let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
          Math.round(devolverAtaque);
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
              enemiesGlobal[index].actualHealth -= devolverAtaque;
              if (enemiesGlobal[index].actualHealth < 0) {
                enemiesGlobal[index].actualHealth = 0;
                document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
              }
              document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
              if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
                for (let j = 1; j < enemiesGlobal.length; j++) {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  enemiesGlobal[j].actualHealth -= 60;
                  if (enemiesGlobal[j].actualHealth < 0) {
                    enemiesGlobal[j].actualHealth = 0;
                    document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                }
                for (let j = 0; j < heroesGlobal.length; j++) {
                  document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                  heroesGlobal[j].actualHealth -= 60;
                  if (heroesGlobal[j].actualHealth < 0) {
                    heroesGlobal[j].actualHealth = 0;
                    document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                  }
                  document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
                }
                if (!comprobarDerrota()) {
                  if (!comprobarVictoria()) {
                    for (let j = 0; j < heroesGlobal.length; j++) {
                      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                    }
                  }
                }
              } else if (!comprobarVictoria()) {
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                  resolve(true);
                }, 1000);
              } else {
                resolve(false);
              }
            }, 1000);
          }
        } else if (SMoveActualHeroes.hasOwnProperty("Guthred")){
          for (let i = 0; i < heroesGlobal.length; i++) {
            if (heroesGlobal[i].name == "Guthred") {
              ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
              break;
            }}
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
            heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
            if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
              heroesGlobal[enemigoElegido[1]].actualHealth = 0;
              document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
        } else {
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          if (!comprobarDerrota()) {
            setTimeout(() => {
              document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
              resolve(true);
            }, 1000);
          } else {
            resolve(false);
          }
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Boromir") || (SMoveActualHeroes.hasOwnProperty("Dernwine") && heroesGlobal[enemigoElegido[1]].name == "Dernwine") || SMoveActualHeroes.hasOwnProperty("Ohtar"))  {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Boromir" ||  heroesGlobal[i].name == "Dernwine" || heroesGlobal[i].name == "Ohtar") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else if (SMoveActualHeroes.hasOwnProperty("Gimli")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        let devolverAtaque = 0;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].name == "Gimli") {
                devolverAtaque = heroesGlobal[i].specialMoveActualAmount * ataqueActual[0];
                Math.round(devolverAtaque);
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
                enemiesGlobal[index].actualHealth -= devolverAtaque;
                if (enemiesGlobal[index].actualHealth < 0) {
                  enemiesGlobal[index].actualHealth = 0;
                  document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
                break;
              }};
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        } else {
          resolve(false);
        }
      } else if ((SMoveActualHeroes.hasOwnProperty("Elrohir") && heroesGlobal[enemigoElegido[1]].name == "Elrohir") || (SMoveActualHeroes.hasOwnProperty("Eothain") && heroesGlobal[enemigoElegido[1]].name == "Eothain") || (SMoveActualHeroes.hasOwnProperty("Folcred") && heroesGlobal[enemigoElegido[1]].name == "Folcred")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        let devolverAtaque = heroesGlobal[enemigoElegido[1]].specialMoveActualAmount * ataqueActual[0];
        Math.round(devolverAtaque);
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = `<p class="damageTaken">-${devolverAtaque}pH</p>`;
            enemiesGlobal[index].actualHealth -= devolverAtaque;
            if (enemiesGlobal[index].actualHealth < 0) {
              enemiesGlobal[index].actualHealth = 0;
              document.getElementById(`enemy${index+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[index].name}`).style.width = (enemiesGlobal[index].actualHealth/enemiesGlobal[index].maxHealth)*100 + "%";
            if (enemiesGlobal[index].name == "Berserker3" && enemiesGlobal[index].actualHealth == 0) {
              for (let j = 1; j < enemiesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                enemiesGlobal[j].actualHealth -= 60;
                if (enemiesGlobal[j].actualHealth < 0) {
                  enemiesGlobal[j].actualHealth = 0;
                  document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              }
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
                heroesGlobal[j].actualHealth -= 60;
                if (heroesGlobal[j].actualHealth < 0) {
                  heroesGlobal[j].actualHealth = 0;
                  document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
                }
                document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
              }
              if (!comprobarDerrota()) {
                if (!comprobarVictoria()) {
                  for (let j = 0; j < heroesGlobal.length; j++) {
                    document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                    document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
                  }
                }
              }
            } else if (!comprobarVictoria()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${index+1}`).innerHTML = "";
                resolve(true);
              }, 1000);
            } else {
              resolve(false);
            }
          }, 1000);
        }
      } else if (SMoveActualHeroes.hasOwnProperty("Guthred")) {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].name == "Guthred") {
            ataqueActual[0] *= (1 - heroesGlobal[i].specialMoveActualAmount);
            break;
          }}
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
          document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML += `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
          heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
          if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
            heroesGlobal[enemigoElegido[1]].actualHealth = 0;
            document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
      } else {
        delayedDamage = [enemigoElegido[1], 0.45*enemiesGlobal[index].attack];
        document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = `<p class="damageTaken">-${ataqueActual[0]}pH</p>`;
        heroesGlobal[enemigoElegido[1]].actualHealth -= ataqueActual[0];
        if (heroesGlobal[enemigoElegido[1]].actualHealth < 0) {
          heroesGlobal[enemigoElegido[1]].actualHealth = 0;
          document.getElementById(`hero${enemigoElegido[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[enemigoElegido[1]].name}`).style.width = (heroesGlobal[enemigoElegido[1]].actualHealth/heroesGlobal[enemigoElegido[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${enemigoElegido[1]+1}`).innerHTML = "";
            resolve(true);
          }, 1000);
        } else {
          resolve(false);
        }
      }   
    }
    ataque()
  });
}

async function sMoveRadbug(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < heroesGlobal.length; j++) {
      if (heroesGlobal[j].actualARecharge == 0) {
        heroesGlobal[j].actualARecharge += 2;
      } else {
        heroesGlobal[j].actualARecharge += 1;
      }
      if (heroesGlobal[j].actualSRecharge == 0) {
        heroesGlobal[j].actualSRecharge += 2;
      } else {
        heroesGlobal[j].actualSRecharge += 1;
      }
    }
    for (let j = 0; j < heroesGlobal.length; j++) {
      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
    }
    setTimeout(() => {
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveGorbag(index) {
  return new Promise((resolve) => {
    enemiesAttaks = 2;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveOlogHai(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let j = 0; j < heroesGlobal.length; j++) {
      if (heroesGlobal[j].actualARecharge == 0) {
        heroesGlobal[j].actualARecharge += 2;
      } else {
        heroesGlobal[j].actualARecharge += 1;
      }
      if (heroesGlobal[j].actualSRecharge == 0) {
        heroesGlobal[j].actualSRecharge += 2;
      } else {
        heroesGlobal[j].actualSRecharge += 1;
      }
      heroesGlobal[j].sMove = 0;
      document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
    }
    SMoveActualHeroes = {};
    Damrod = 0;
    kingDead = 0;
    Gwaihir = 0;
    setTimeout(() => {
      for (let j = 0; j < heroesGlobal.length; j++) {
        document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveMouthOfSauron(index) {
  return new Promise((resolve) => {
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    attackactive = [80, index];
    for (let j = 0; j < enemiesGlobal.length; j++) {
      if (enemiesGlobal[j].actualHealth == 0) {
        let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
        for (let k = 0; k < defeated.length; k++) {
          defeated[k].remove();
        }
      }
      document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+${attackactive[0]}pH</p>`;
      enemiesGlobal[j].actualHealth += attackactive[0];
      if (enemiesGlobal[j].actualHealth > enemiesGlobal[j].maxHealth) {
        enemiesGlobal[j].actualHealth = enemiesGlobal[j].maxHealth;
      }
      document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
    }
    setTimeout(() => {
      for (let j = 0; j < enemiesGlobal.length; j++) {
        document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}

async function sMoveSauron(index) {
  return new Promise((resolve) => {
    enemiesAttaks = 3;
    enemiesGlobal[index].actualSRecharge = enemiesGlobal[index].specialMoveRecharge;
    for (let i = 0; i < enemiesGlobal.length; i++) {
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="upgrade" class="effects">`;
      if (enemiesGlobal[i].actualARecharge > 0) {
        enemiesGlobal[i].actualARecharge -= 1;
      }
    }
    setTimeout(() => {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
      }
      resolve(true);
    }, 750)
  });
}





//eventos battalla
function eventosBatalla(battle) {
  document.getElementById("attackfunction").addEventListener("click", function() {
    document.getElementById(`AttackSMContainer${battle}`).classList.add("hide");
    document.getElementById(`attackContainer${battle}`).classList.remove("hide");
  });
  document.getElementById("SMfunction").addEventListener("click", function() {
    document.getElementById(`AttackSMContainer${battle}`).classList.add("hide");
    document.getElementById(`SMContainer${battle}`).classList.remove("hide");
  });
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].actualARecharge == 0 && heroesGlobal[i].actualHealth > 0) {
      document.getElementById(`attack${heroesGlobal[i].name}`).addEventListener("click", function() {
        window[`attack${heroesGlobal[i].name}`]();
        document.getElementById(`attackContainer${battle}`).classList.add("hide");
      });
    }
    if (heroesGlobal[i].actualSRecharge == 0 && heroesGlobal[i].actualHealth > 0) {
      document.getElementById(`sMove${heroesGlobal[i].name}`).addEventListener("click", function() {
        window[`sMove${heroesGlobal[i].name}`]();
        document.getElementById(`SMContainer${battle}`).classList.add("hide");
      });
    }
  }
  for (let i = 0; i < enemiesGlobal.length; i++) {
    document.getElementById(`enemy${i+1}`).addEventListener("click", function() {
    if (ataqueactivo == 1 && enemiesGlobal[i].actualHealth > 0) {
      ataqueactivo = 0;
      document.getElementById(`selection${battle}`).classList.add("hide");
      document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
      }, 1000);
      if (enemiesGlobal[i].name == "Sauron") {
        attackactive[0] = attackactive[0] * 0.75;
      }
      if (SMoveActualEnemies.hasOwnProperty("armoredTroll") && enemiesGlobal[i].name == "armoredTroll") {
        armoredTroll += attackactive[0];
      }
      if (enemiesGlobal[i].name == "witchKing" && heroesGlobal[attackactive[1]].race == "Human" && heroesGlobal[attackactive[1]].gender == "Male") {
        attackactive[0] *= 0.7;
      }
      if (SMoveActualEnemies.hasOwnProperty("Goblin2") && enemiesGlobal[i].name == "Goblin2") {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        if (Gandalf == 1) {
          Gandalf = 0;
        }
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
        }, 1000);
      } else if (SMoveActualEnemies.hasOwnProperty("archerGoblin") || SMoveActualEnemies.hasOwnProperty("archer") || SMoveActualEnemies.hasOwnProperty("orcMordor5") || SMoveActualEnemies.hasOwnProperty("archerMordor2")) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="dodge">Dodge</p>`;
        if (Gandalf == 1) {
          Gandalf = 0;
        }
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
        }, 1000);
      } else if ((SMoveActualEnemies.hasOwnProperty("urukHai3") && enemiesGlobal[i].name == "urukHai3") || (SMoveActualEnemies.hasOwnProperty("orcMordor2") && enemiesGlobal[i].name == "orcMordor2") || (SMoveActualEnemies.hasOwnProperty("Mauhur") && enemiesGlobal[i].name == "Mauhur")) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        if (Gandalf == 1) {
          Gandalf = 0;
          if (enemiesGlobal[i].actualARecharge == 0) {
            enemiesGlobal[i].actualARecharge += 2;
          } else {
            enemiesGlobal[i].actualARecharge += 1;
          }
          if (enemiesGlobal[i].actualSRecharge == 0) {
            enemiesGlobal[i].actualSRecharge += 2;
          } else {
            enemiesGlobal[i].actualSRecharge += 1;
          }
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
        }
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
        }, 1000);
      } else if ((SMoveActualEnemies.hasOwnProperty("urukHai4") && enemiesGlobal[i].name == "urukHai4") || (SMoveActualEnemies.hasOwnProperty("urukHai6") && enemiesGlobal[i].name == "urukHai6") || (SMoveActualEnemies.hasOwnProperty("orcMordor3")) || (SMoveActualEnemies.hasOwnProperty("orcMordor7") && enemiesGlobal[i].name == "orcMordor7") || ((SMoveActualEnemies.hasOwnProperty("mumakil") && enemiesGlobal[i].name == "mumakil"))) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        attackactive[0] = attackactive[0]*0.6;
        if (Gandalf == 1) {
          Gandalf = 0;
          if (enemiesGlobal[i].actualARecharge == 0) {
            enemiesGlobal[i].actualARecharge += 2;
          } else {
            enemiesGlobal[i].actualARecharge += 1;
          }
          if (enemiesGlobal[i].actualSRecharge == 0) {
            enemiesGlobal[i].actualSRecharge += 2;
          } else {
            enemiesGlobal[i].actualSRecharge += 1;
          }
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
        }
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        enemiesGlobal[i].actualHealth -= attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
          document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        if (!comprobarVictoria()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
          }, 1000);}
      } else if ((SMoveActualEnemies.hasOwnProperty("Haradrim2"))) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        attackactive[0] = attackactive[0]*0.3;
        if (Gandalf == 1) {
          Gandalf = 0;
          if (enemiesGlobal[i].actualARecharge == 0) {
            enemiesGlobal[i].actualARecharge += 2;
          } else {
            enemiesGlobal[i].actualARecharge += 1;
          }
          if (enemiesGlobal[i].actualSRecharge == 0) {
            enemiesGlobal[i].actualSRecharge += 2;
          } else {
            enemiesGlobal[i].actualSRecharge += 1;
          }
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
        }
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        enemiesGlobal[i].actualHealth -= attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
          document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        if (!comprobarVictoria()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
          }, 1000);} 
        } else if (SMoveActualEnemies.hasOwnProperty("urukHai9")) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/shield.png" alt="upgrade" class="effects">`;
        attackactive[0] = attackactive[0]*0.5;
        if (Gandalf == 1) {
          Gandalf = 0;
          if (enemiesGlobal[i].actualARecharge == 0) {
            enemiesGlobal[i].actualARecharge += 2;
          } else {
            enemiesGlobal[i].actualARecharge += 1;
          }
          if (enemiesGlobal[i].actualSRecharge == 0) {
            enemiesGlobal[i].actualSRecharge += 2;
          } else {
            enemiesGlobal[i].actualSRecharge += 1;
          }
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
        }
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        enemiesGlobal[i].actualHealth -= attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
          document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        if (!comprobarVictoria()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
          }, 1000);}
      } else if (SMoveActualEnemies.hasOwnProperty("Warg2")) {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/reflect.png" alt="upgrade" class="effects">`;
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        if (Gandalf == 1) {
          Gandalf = 0;
          if (enemiesGlobal[i].actualARecharge == 0) {
            enemiesGlobal[i].actualARecharge += 2;
          } else {
            enemiesGlobal[i].actualARecharge += 1;
          }
          if (enemiesGlobal[i].actualSRecharge == 0) {
            enemiesGlobal[i].actualSRecharge += 2;
          } else {
            enemiesGlobal[i].actualSRecharge += 1;
          }
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
        }
        enemiesGlobal[i].actualHealth -= attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
          document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        if (!comprobarVictoria()) {
          setTimeout(() => {
            let devolucion;
            for (let k = 0; k < enemiesGlobal.length; k++) {
              if (enemiesGlobal[k].name == "Warg2") {
                devolucion = enemiesGlobal[k].specialMoveAmount;
                break;
              }
            }
            document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
            attackactive[0] *= devolucion;
            document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML += `<p class="damageTaken">-${attackactive[0]}pH</p>`;
            heroesGlobal[attackactive[1]].actualHealth -= attackactive[0];
            if (heroesGlobal[attackactive[1]].actualHealth < 0) {
              heroesGlobal[attackactive[1]].actualHealth = 0;
              document.getElementById(`hero${attackactive[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[attackactive[1]].name}`).style.width = (heroesGlobal[attackactive[1]].actualHealth/heroesGlobal[attackactive[1]].maxHealth)*100 + "%";
            if (!comprobarDerrota()) {
              setTimeout(() => {
                document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = "";
              }, 1000);
            }
          }, 1000);
        }
      } else if ((SMoveActualEnemies.hasOwnProperty("Guritz") && Guritz[1] == attackactive[1])) {
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML += `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
        if (heroesGlobal[attackactive[1]].actualHealth < 0) {
          heroesGlobal[attackactive[1]].actualHealth = 0;
          document.getElementById(`hero${attackactive[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[attackactive[1]].name}`).style.width = (heroesGlobal[attackactive[1]].actualHealth/heroesGlobal[attackactive[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = "";
          }, 1000);
        }
      } else {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        enemiesGlobal[i].actualHealth -= attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
          document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          if (enemiesGlobal[i].name == "Troll") {
            document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
            for (let j = 1; j < enemiesGlobal.length; j++) {
              if (enemiesGlobal[j].actualHealth == 0) {
                let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                for (let k = 0; k < defeated.length; k++) {
                  defeated[k].remove();
                }
              }
              enemiesGlobal[j].actualHealth += 40;
              document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
              }, 1000);
            }
          }
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        if (enemiesGlobal[i].name == "Berserker3" && enemiesGlobal[i].actualHealth == 0) {
          for (let j = 1; j < enemiesGlobal.length; j++) {
            document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
            enemiesGlobal[j].actualHealth -= 60;
            if (enemiesGlobal[j].actualHealth < 0) {
              enemiesGlobal[j].actualHealth = 0;
              document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
          }
          for (let j = 0; j < heroesGlobal.length; j++) {
            document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
            heroesGlobal[j].actualHealth -= 60;
            if (heroesGlobal[j].actualHealth < 0) {
              heroesGlobal[j].actualHealth = 0;
              document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
          }
          if (!comprobarDerrota()) {
            if (!comprobarVictoria()) {
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
              }
            }
          }
        }
        if (Gandalf == 1) {
          Gandalf = 0;
          if (enemiesGlobal[i].actualARecharge == 0) {
            enemiesGlobal[i].actualARecharge += 2;
          } else {
            enemiesGlobal[i].actualARecharge += 1;
          }
          if (enemiesGlobal[i].actualSRecharge == 0) {
            enemiesGlobal[i].actualSRecharge += 2;
          } else {
            enemiesGlobal[i].actualSRecharge += 1;
          }
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML += `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
          setTimeout(() => {
            document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
          }, 750);
        } 
        if (!comprobarVictoria()) {
          setTimeout(function() {
            document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
            attacksRemaining -= 1;
            let attack = document.getElementById("attackfunction");
            let SM = document.getElementById("SMfunction");
            actualizarBotones(attack, SM, battle);
            document.getElementById(`controls${battle}`).classList.remove("hide");
            document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
            eventosBatalla(battle);
          }, 2000);
        }
      }
    } else if (Faramir == 1 && enemiesGlobal[i].actualHealth > 0) {
      document.getElementById(`selection${battle}`).classList.add("hide");
      document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
      }, 1000);
      if ((SMoveActualEnemies.hasOwnProperty("Guritz") && Guritz[1] == attackactive[1])) {
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML += `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
        if (heroesGlobal[attackactive[1]].actualHealth < 0) {
          heroesGlobal[attackactive[1]].actualHealth = 0;
          document.getElementById(`hero${attackactive[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[attackactive[1]].name}`).style.width = (heroesGlobal[attackactive[1]].actualHealth/heroesGlobal[attackactive[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = "";
          }, 1000);
        }
      } else {
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        if (enemiesGlobal[i].name == "Sauron") {
          attackactive[0] = attackactive[0] * 0.75;
        }
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = `<p class="heal">+${attackactive[0]}pH</p>`;
        enemiesGlobal[i].actualHealth -= attackactive[0];
        heroesGlobal[attackactive[1]].actualHealth += attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
          document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          if (enemiesGlobal[i].name == "Troll") {
            document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
            for (let j = 1; j < enemiesGlobal.length; j++) {
              if (enemiesGlobal[j].actualHealth == 0) {
                    let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                    for (let k = 0; k < defeated.length; k++) {
                      defeated[k].remove();
                    }
                  }
              enemiesGlobal[j].actualHealth += 40;
              document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
              document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
              setTimeout(() => {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
              }, 1000);
            }
          }
        }
        if (heroesGlobal[attackactive[1]].actualHealth > heroesGlobal[attackactive[1]].maxHealth) {
          heroesGlobal[attackactive[1]].actualHealth = heroesGlobal[attackactive[1]].maxHealth;
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        document.getElementById(`health${heroesGlobal[attackactive[1]].name}`).style.width = (heroesGlobal[attackactive[1]].actualHealth/heroesGlobal[attackactive[1]].maxHealth)*100 + "%";
        if (enemiesGlobal[i].name == "Berserker3" && enemiesGlobal[i].actualHealth == 0) {
          for (let j = 1; j < enemiesGlobal.length; j++) {
            document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
            enemiesGlobal[j].actualHealth -= 60;
            if (enemiesGlobal[j].actualHealth < 0) {
              enemiesGlobal[j].actualHealth = 0;
              document.getElementById(`enemy${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
          }
          for (let j = 0; j < heroesGlobal.length; j++) {
            document.getElementById(`specialEfectsHero${j+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
            heroesGlobal[j].actualHealth -= 60;
            if (heroesGlobal[j].actualHealth < 0) {
              heroesGlobal[j].actualHealth = 0;
              document.getElementById(`hero${j+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            }
            document.getElementById(`health${heroesGlobal[j].name}`).style.width = (heroesGlobal[j].actualHealth/heroesGlobal[j].maxHealth)*100 + "%";
          }
          if (!comprobarDerrota()) {
            if (!comprobarVictoria()) {
              for (let j = 0; j < heroesGlobal.length; j++) {
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                document.getElementById(`specialEfectsHero${j+1}`).innerHTML = "";
              }
            }
          }
        } else if (!comprobarVictoria()) {
          setTimeout(function() {
            for (let j = 1; j <= enemiesGlobal.length; j++) {
              document.getElementById(`specialEfectsEnemy${j}`).innerHTML = "";
            }
            document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = "";
            let attack = document.getElementById("attackfunction");
            let SM = document.getElementById("SMfunction");
            actualizarBotones(attack, SM, battle);
            document.getElementById(`controls${battle}`).classList.remove("hide");
            document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
            eventosBatalla(battle);
          }, 2000);
        }
      }
    } else if (Damrod == 1 && enemiesGlobal[i].actualHealth > 0) {
      document.getElementById(`selection${battle}`).classList.add("hide");
      document.getElementById(`hero${attackactive[1]+1}`).style.animation = "heroAttack 1s ease-in-out";
      setTimeout(() => {
        document.getElementById(`hero${attackactive[1]+1}`).style.animation = "";
      }, 1000);
      if ((SMoveActualEnemies.hasOwnProperty("Guritz") && Guritz[1] == attackactive[1])) {
        DamrodAttack = 3;
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML += `<img src="./assets/effects/confusion.png" alt="upgrade" class="effects">`;
        if (heroesGlobal[attackactive[1]].actualHealth < 0) {
          heroesGlobal[attackactive[1]].actualHealth = 0;
          document.getElementById(`hero${attackactive[1]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${heroesGlobal[attackactive[1]].name}`).style.width = (heroesGlobal[attackactive[1]].actualHealth/heroesGlobal[attackactive[1]].maxHealth)*100 + "%";
        if (!comprobarDerrota()) {
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${attackactive[1]+1}`).innerHTML = "";
          }, 1000);
        }
      } else {
        attackHeroes(i+1);
      }
    }});
  }
}


//funciones battalla
async function battleMoria1() {
  battleOnGoing = 1;
  kingDead = 0;
  esquivaGwaihir = false;
  DamrodAttack = 3;
  battle = "Moria1";
  scenario = "gateMoria";
  audio.src = "./assets/music/Moria1.mp3";
  if (music == true) {
    audio.play();
  }
  attacksRemaining = 1;
  SMRemaining = 1;
  attackactive = 0;
  SMoveActualHeroes = {};
  SMoveActualEnemies = {};
  document.getElementById("mapMoria").classList.add("hide");
  document.getElementById(`${scenario}`).classList.remove("hide");
  document.getElementById(`${scenario}`).innerHTML = `
  <section class="enemies hide" id="enemies${battle}">
    <section class="enemy" id="enemy2">
      <section id="specialEfectsEnemy2"></section>
      <section id="info2enemy" class="infoEnemies hide"></section>
    </section>
    <section class="enemy" id="enemy1">
        <section id="specialEfectsEnemy1"></section>
        <section id="info1enemy" class="infoEnemies hide"></section>
    </section>
    <section class="enemy" id="enemy3">
      <section id="specialEfectsEnemy3"></section>
      <section id="info3enemy" class="infoEnemies hide"></section>
    </section>
  </section>
  <section class="heroes hide" id="heroes${battle}">
    <section class="hero" id="hero1">
        <section id="specialEfectsHero1"></section>
        <section id="info1${battle}" class="infoCharacters hide"></section>
    </section>
    <section class="hero" id="hero2">
        <section id="specialEfectsHero2"></section>
        <section id="info2${battle}" class="infoCharacters hide"></section>
    </section>
    <section class="hero" id="hero3">
        <section id="specialEfectsHero3"></section>
        <section id="info3${battle}" class="infoCharacters hide"></section>
    </section>
  </section>
  <section id="newCards${battle}Container">
    <section class="newCards" id="newCards${battle}"></section>
  </section>
  <section class="controls hide" id="controls${battle}">
    <section class="AttackSMContainer" id="AttackSMContainer${battle}">
        <section class="AttackSM" id="AttackSM${battle}">
            <button class="attackfunction button" id="attackfunction">Attack</button>
            <button class="SMfunction button" id="SMfunction">Special Move</button>
        </section>
    </section>
    <section class="attackContainer hide" id="attackContainer${battle}"></section>
    <section class="SMContainer hide" id="SMContainer${battle}"></section>
    <section class="selection hide" id="selection${battle}">
        <h2>Select which enemy to attack</h2>
    </section>
    <section class="nextRound" id="nextRound${battle}">
        <button class="nextRoundButton button" id="nextRoundButton">Next Round</button>
    </section>
  </section>
  <section class="hide charactersChoose" id="charactersChoose${battle}">
    <form id="characterSelection${battle}">
        <h2>Select the cards you want to use this battle</h2>
        <section>
            <label for="character1">Character 1:</label>
            <select name="character1" id="character1" class="characterSelection"></select>
            <label for="character2">Character 2:</label>
            <select name="character2" id="character2" class="characterSelection"></select>
            <label for="character3">Character 3:</label>
            <select name="character3" id="character3" class="characterSelection"></select>
        </section>
        <button type="submit" class="blue button">Submit</button>
    </form>  
  </section>`;
  if (personajesObtenidos.length == 0) {
    heroesGlobal = [];
    let availableBronze = availableFromSet(bronzeMoria);
    let personaje1 = await getRandomFromSet(availableBronze);
    personajesObtenidos.push(personajesNoObtenidos[personaje1[1]]);
    heroesGlobal.push(personajesNoObtenidos[personaje1[1]]);
    personajesNoObtenidos.splice(personaje1[1], 1);
    let nuevoPersonaje1 = {
      name: heroesGlobal[0].name,
      xp: 0
    }
    datosUsuarioActual.charactersOwned.push(nuevoPersonaje1);
    let availableGold = availableFromSet(goldMoria);
    let personaje2 = await getRandomFromSet(availableGold);
    personajesObtenidos.push(personajesNoObtenidos[personaje2[1]]);
    heroesGlobal.push(personajesNoObtenidos[personaje2[1]]);
    personajesNoObtenidos.splice(personaje2[1], 1);
    let nuevoPersonaje2 = {
      name: heroesGlobal[1].name,
      xp: 0
    }
    datosUsuarioActual.charactersOwned.push(nuevoPersonaje2);
    availableBronze = availableFromSet(bronzeMoria);
    let personaje3 = await getRandomFromSet(availableBronze);
    personajesObtenidos.push(personajesNoObtenidos[personaje3[1]]);
    heroesGlobal.push(personajesNoObtenidos[personaje3[1]]);
    personajesNoObtenidos.splice(personaje3[1], 1);
    let nuevoPersonaje3 = {
      name: heroesGlobal[2].name,
      xp: 0
    }
    datosUsuarioActual.charactersOwned.push(nuevoPersonaje3);
    const documentRef = db.collection("users").doc(datosUsuarioActual.id);
    documentRef.update({
      charactersOwned: datosUsuarioActual.charactersOwned
    });
    document.getElementById(`newCards${battle}`).innerHTML = `
      <section class="newCard">
          <section class="secretCard secretCard${battle}"><img src="./assets/secretCard.png" alt="secretCard"></section>
          <section id="newCard1${battle}" class="hide newCardImg">${heroesGlobal[0].image}</section>
      </section>
      <section class="newCard">
          <section class="secretCard secretCard${battle}"><img src="./assets/secretCard.png" alt="secretCard"></section>
          <section id="newCard2${battle}" class="hide newCardImg">${heroesGlobal[1].image}</section>
      </section>
      <section class="newCard">
          <section class="secretCard secretCard${battle}"><img src="./assets/secretCard.png" alt="secretCard"></section>
          <section id="newCard3${battle}" class="hide newCardImg">${heroesGlobal[2].image}</section>
      </section>`;
    enemiesGlobal = [];
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].name == "Watcher") {
        enemiesGlobal.push(enemies[i]);
        break;
      }
    }
    actualizarEnemigo(enemiesGlobal[0], 2, "silver");
    setTimeout(function() {
      let secretCard = document.querySelectorAll(`.secretCard${battle} img`);
      for (let i = 1; i <= 3; i++) {
        secretCard[i-1].classList.add("hide");
        document.getElementById(`newCard${i}${battle}`).classList.add("appear");
        document.getElementById(`newCard${i}${battle}`).classList.remove("hide");
      }
      setTimeout(function() {
        secretCard = document.querySelectorAll(`.secretCard${battle}`);
        for (let i = 1; i <= 3; i++) {
          secretCard[i-1].innerHTML += `<img src="./assets/effects/new_Card.gif" alt="effect">`;
        }
        setTimeout(function() {
          document.getElementById(`newCards${battle}Container`).classList.add("hide");
          document.getElementById(`heroes${battle}`).classList.remove("hide");
          document.getElementById(`enemies${battle}`).classList.remove("hide");
          //pintar los personajes
          pintarEnemigos(enemiesGlobal, battle);
          for (let i = 1; i <= enemiesGlobal.length; i++) {
            document.getElementById(`enemy${i}`).style.animation = "enemiesEnter 2s ease-in-out";
          }
          for (let i = 1; i <= heroesGlobal.length; i++) {
            document.getElementById(`hero${i}`).style.animation = "heroesEnter 2s ease-in-out";
          }
          for (let i = 1; i <= 3; i++) {
            document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].image;
            document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].healthBar;
            document.getElementById(`info${i}${battle}`).innerHTML = `
              <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
              <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
            document.getElementById(`hero${i}`).addEventListener("mouseover", function() {
              document.getElementById(`info${i}${battle}`).classList.remove("hide");
            })
            document.getElementById(`hero${i}`).addEventListener("mouseout", function() {
              document.getElementById(`info${i}${battle}`).classList.add("hide");
            })
            }
            let attack = document.getElementById("attackfunction");
            let SM = document.getElementById("SMfunction");
            actualizarBotones(attack, SM, battle);
            eventosBatalla(battle);
            setTimeout(() => {
              document.getElementById(`controls${battle}`).classList.remove("hide");
            }, 2000);
          }, 1000);
        }, 2000);
      }, 2000);
  } else if (personajesObtenidos.length == 3) {
    heroesGlobal = [];
    enemiesGlobal = [];
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].name == "Watcher") {
        enemiesGlobal.push(enemies[i]);
        break;
      }
    }
    actualizarEnemigo(enemiesGlobal[0], 2, "silver");
    document.getElementById(`heroes${battle}`).classList.remove("hide");
    document.getElementById(`enemies${battle}`).classList.remove("hide");
    heroesGlobal.push(...personajesObtenidos);
    //pintar personajes
    pintarEnemigos(enemiesGlobal, battle);
    for (let i = 1; i <= enemiesGlobal.length; i++) {
      document.getElementById(`enemy${i}`).style.animation = "enemiesEnter 2s ease-in-out";
    }
    for (let i = 1; i <= heroesGlobal.length; i++) {
      document.getElementById(`hero${i}`).style.animation = "heroesEnter 2s ease-in-out";
    }
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].image;
      document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].healthBar;
      document.getElementById(`info${i}${battle}`).innerHTML = `
        <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
        <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
      document.getElementById(`hero${i}`).addEventListener("mouseover", function() {
        document.getElementById(`info${i}${battle}`).classList.remove("hide");
      })
      document.getElementById(`hero${i}`).addEventListener("mouseout", function() {
        document.getElementById(`info${i}${battle}`).classList.add("hide");
      })
      }
      let attack = document.getElementById("attackfunction");
      let SM = document.getElementById("SMfunction");
      actualizarBotones(attack, SM, battle);
      eventosBatalla(battle);
      setTimeout(() => {
        document.getElementById(`controls${battle}`).classList.remove("hide");
      }, 2000);
  } else {
    heroesGlobal = [];
    document.getElementById(`charactersChoose${battle}`).classList.remove("hide");
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`character${i}`).innerHTML = "";
      for (let j = 0; j < personajesObtenidos.length; j++) {
        document.getElementById(`character${i}`).innerHTML += `<option value="${personajesObtenidos[j].name}">${personajesObtenidos[j].name}</option>`;
      }
    }
    document.getElementById(`characterSelection${battle}`).addEventListener("submit", function(event) {
      event.preventDefault();
      let character1 = event.target.character1.value;
      let character2 = event.target.character2.value;
      let character3 = event.target.character3.value;
      if (character1 == character2 || character1 == character3 || character2 == character3) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You cant use the same character twice!'
        })
      } else {
        document.getElementById(`charactersChoose${battle}`).classList.add("hide");
        for (let i = 0; i < personajesObtenidos.length; i++) {
          if (personajesObtenidos[i].name == character1) {
            heroesGlobal.push(personajesObtenidos[i]);
          }
          if (personajesObtenidos[i].name == character2) {
            heroesGlobal.push(personajesObtenidos[i]);
          }
          if (personajesObtenidos[i].name == character3) {
            heroesGlobal.push(personajesObtenidos[i]);
          }
        }
        enemiesGlobal = [];
        for (let i = 0; i < enemies.length; i++) {
          if (enemies[i].name == "Watcher") {
            enemiesGlobal.push(enemies[i]);
            break;
          }
        };
        actualizarEnemigo(enemiesGlobal[0], 2, "silver");
        document.getElementById(`heroes${battle}`).classList.remove("hide");
        document.getElementById(`enemies${battle}`).classList.remove("hide");
        pintarEnemigos(enemiesGlobal, battle);
        for (let i = 1; i <= enemiesGlobal.length; i++) {
          document.getElementById(`enemy${i}`).style.animation = "enemiesEnter 2s ease-in-out";
        }
        for (let i = 1; i <= heroesGlobal.length; i++) {
          document.getElementById(`hero${i}`).style.animation = "heroesEnter 2s ease-in-out";
        }
        for (let i = 1; i <= 3; i++) {
          document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].image;
          document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].healthBar;
          document.getElementById(`info${i}${battle}`).innerHTML = `
            <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
            <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
          document.getElementById(`hero${i}`).addEventListener("mouseover", function() {
            document.getElementById(`info${i}${battle}`).classList.remove("hide");
          })
          document.getElementById(`hero${i}`).addEventListener("mouseout", function() {
            document.getElementById(`info${i}${battle}`).classList.add("hide");
          })
        }
          let attack = document.getElementById("attackfunction");
          let SM = document.getElementById("SMfunction");
          actualizarBotones(attack, SM, battle);
          eventosBatalla(battle);
          setTimeout(() => {
            document.getElementById(`controls${battle}`).classList.remove("hide");
          }, 2000);
      }
    });
  }
  document.getElementById(`attackContainer${battle}`).classList.add("hide");
  document.getElementById(`SMContainer${battle}`).classList.add("hide");
  document.getElementById(`selection${battle}`).classList.add("hide");
  document.getElementById(`nextRound${battle}`).addEventListener("click", async function() {
    if (!comprobarVictoria()) {
      comprobarDerrota()
    }
    document.getElementById(`AttackSMContainer${battle}`).classList.add("hide");
    document.getElementById(`attackContainer${battle}`).classList.add("hide");
    document.getElementById(`SMContainer${battle}`).classList.add("hide");
    document.getElementById(`selection${battle}`).classList.add("hide");
    document.getElementById(`nextRound${battle}`).classList.add("hide");
    ataqueactivo = 0; 
    Gandalf = 0;
    Faramir = 0;
    Damrod = 0;
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && DamrodAttack < 3) {
      for (let j = 0; j < heroesGlobal.length; j++) {
        if (heroesGlobal[j].name = "Damrod") {
          ataqueactivo = [heroesGlobal[j].attack*heroesGlobal[j].specialMoveActualAmount, i]
        }
        if (enemiesGlobal[DamrodAttack].name == "Sauron") {
          ataqueactivo[0] = ataqueactivo[0]*0.75;
        }
        document.getElementById(`specialEfectsEnemy${DamrodAttack+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        enemiesGlobal[DamrodAttack].actualHealth -= attackactive[0];
        if (enemiesGlobal[DamrodAttack].actualHealth < 0) {
          enemiesGlobal[DamrodAttack].actualHealth = 0;
          document.getElementById(`enemy${DamrodAttack+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
        }
        document.getElementById(`health${enemiesGlobal[DamrodAttack].name}`).style.width = (enemiesGlobal[DamrodAttack].actualHealth/enemiesGlobal[DamrodAttack].maxHealth)*100 + "%";
      }
      if (!comprobarVictoria()) {
        setTimeout(function() {
          for (let j = 1; j <= enemiesGlobal.length; j++) {
            document.getElementById(`specialEfectsEnemy${j}`).innerHTML = "";
          }
        })
      }
    }
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (enemiesGlobal[i].actualARecharge > 0) {
        enemiesGlobal[i].actualARecharge -= 1;
      }
      if (enemiesGlobal[i].actualSRecharge > 0) {
        enemiesGlobal[i].actualSRecharge -= 1;
      }
    }
    for (const propiedad in SMoveActualEnemies) {
      if (Object.hasOwnProperty.call(SMoveActualEnemies, propiedad)) {
        if (SMoveActualEnemies[propiedad] === 1) {
          delete SMoveActualEnemies[propiedad]; 
        } else if (SMoveActualEnemies[propiedad] > 1) {
          SMoveActualEnemies[propiedad]--;
        }
      }
    }
    let enemySMove = [];
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (enemiesGlobal[i].actualSRecharge == 0 && enemiesGlobal[i].actualHealth > 0) {
        enemySMove.push([enemiesGlobal[i].name, i])
      }
    }
    let sMoveActual = "";
    let continuar = "";
    if (enemySMove.length > 0) {
      sMoveActual = await getRandomFromSet(enemySMove);
      continuar = await window[`sMove${sMoveActual[0]}`](sMoveActual[1]);
    }
    
    if (continuar || enemySMove.length == 0) {
      let enemyAttack = [];
      for (let i = 0; i < enemiesAttaks; i++) {
        for (let j = 0; j < enemiesGlobal.length; j++) {
          if (enemiesGlobal[i].actualARecharge == 0  && enemiesGlobal[i].actualHealth > 0) {
            enemyAttack.push([enemiesGlobal[i].name, i])
          }
        }
        let attackActual = "";
        if (enemyAttack.length > 0) {
          attackActual = await getRandomFromSet(enemyAttack);
          continuar = await window[`attack${attackActual[0]}`](attackActual[1]);
        } 
      }
      enemiesAttaks = 1;
      if (continuar || enemyAttack.length == 0) {
        for (let i = 0; i < heroesGlobal.length; i++) {
          if (heroesGlobal[i].actualARecharge > 0) {
            heroesGlobal[i].actualARecharge -= 1;
          }
          if (heroesGlobal[i].actualSRecharge > 0) {
            heroesGlobal[i].actualSRecharge -= 1;
          }
        }
        for (const propiedad in SMoveActualHeroes) {
          if (Object.hasOwnProperty.call(SMoveActualHeroes, propiedad)) {
            if (SMoveActualHeroes[propiedad] === 1) {
              delete SMoveActualHeroes[propiedad]; 
            } else if (SMoveActualHeroes[propiedad] > 1) {
              SMoveActualHeroes[propiedad]--;
            }
          }
        }
        Gwaihir -= 1;
        document.getElementById(`newCards${battle}`).innerHTML = `<p class="turn">Your turn</p>`;
        document.getElementById(`newCards${battle}Container`).classList.remove("hide");
        setTimeout(() => {
          document.getElementById(`newCards${battle}`).innerHTML = "";
          attacksRemaining = 1;
          SMRemaining = 1;
          let attack = document.getElementById("attackfunction");
          let SM = document.getElementById("SMfunction");
          actualizarBotones(attack, SM, battle);
          document.getElementById(`controls${battle}`).classList.remove("hide");
          document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
          document.getElementById(`nextRound${battle}`).classList.remove("hide");
          eventosBatalla(battle);
        }, 1000);
      }
    }
  });
}

async function battleFunction(battle, battleEnemies) {
  battleOnGoing = 1;
  kingDead = 0;
  esquivaGwaihir = false;
  DamrodAttack = 3;
  armoredTroll = 0;
  audio.src = `./assets/music/${battle}.mp3`;
  if (music == true) {
    audio.play();
  }
  attacksRemaining = 1;
  SMRemaining = 1;
  attackactive = 0;
  delayedDamage = 0;
  SMoveActualHeroes = {};
  SMoveActualEnemies = {};
  let mapScenario = battle.slice(0, battle.length-1);
  document.getElementById(`map${mapScenario}`).classList.add("hide");
  document.getElementById(`${scenario}`).classList.remove("hide");
  document.getElementById(`${scenario}`).innerHTML = `
  <section class="enemies hide" id="enemies${battle}">
    <section class="enemy" id="enemy2">
      <section id="specialEfectsEnemy2"></section>
      <section id="info2enemy" class="infoEnemies hide"></section>
    </section>
    <section class="enemy" id="enemy1">
        <section id="specialEfectsEnemy1"></section>
        <section id="info1enemy" class="infoEnemies hide"></section>
    </section>
    <section class="enemy" id="enemy3">
      <section id="specialEfectsEnemy3"></section>
      <section id="info3enemy" class="infoEnemies hide"></section>
    </section>
  </section>
  <section class="heroes hide" id="heroes${battle}">
    <section class="hero" id="hero1">
        <section id="specialEfectsHero1"></section>
        <section id="info1${battle}" class="infoCharacters hide"></section>
    </section>
    <section class="hero" id="hero2">
        <section id="specialEfectsHero2"></section>
        <section id="info2${battle}" class="infoCharacters hide"></section>
    </section>
    <section class="hero" id="hero3">
        <section id="specialEfectsHero3"></section>
        <section id="info3${battle}" class="infoCharacters hide"></section>
    </section>
  </section>
  <section id="newCards${battle}Container">
    <section class="newCards" id="newCards${battle}"></section>
  </section>
  <section class="controls hide" id="controls${battle}">
    <section class="AttackSMContainer" id="AttackSMContainer${battle}">
        <section class="AttackSM" id="AttackSM${battle}">
            <button class="attackfunction button" id="attackfunction">Attack</button>
            <button class="SMfunction button" id="SMfunction">Special Move</button>
        </section>
    </section>
    <section class="attackContainer hide" id="attackContainer${battle}"></section>
    <section class="SMContainer hide" id="SMContainer${battle}"></section>
    <section class="selection hide" id="selection${battle}">
        <h2>Select which enemy to attack</h2>
    </section>
    <section class="nextRound" id="nextRound${battle}">
        <button class="nextRoundButton button" id="nextRoundButton">Next Round</button>
    </section>
  </section>
  <section class="hide charactersChoose" id="charactersChoose${battle}">
    <form id="characterSelection${battle}">
        <h2>Select the cards you want to use this battle</h2>
        <section>
            <label for="character1">Character 1:</label>
            <select name="character1" id="character1" class="characterSelection"></select>
            <label for="character2">Character 2:</label>
            <select name="character2" id="character2" class="characterSelection"></select>
            <label for="character3">Character 3:</label>
            <select name="character3" id="character3" class="characterSelection"></select>
        </section>
        <button type="submit" class="blue button">Submit</button>
    </form>  
  </section>`;
  heroesGlobal = [];
  document.getElementById(`charactersChoose${battle}`).classList.remove("hide");
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`character${i}`).innerHTML = "";
    for (let j = 0; j < personajesObtenidos.length; j++) {
      document.getElementById(`character${i}`).innerHTML += `<option value="${personajesObtenidos[j].name}">${personajesObtenidos[j].name}</option>`;
    }
  }
  document.getElementById(`characterSelection${battle}`).addEventListener("submit", function(event) {
    event.preventDefault();
    let character1 = event.target.character1.value;
    let character2 = event.target.character2.value;
    let character3 = event.target.character3.value;
    if (character1 == character2 || character1 == character3 || character2 == character3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You cant use the same character twice!'
      })
    } else {
      if (battle == "MinasTirith5") {
        audio.src = `./assets/music/${battle}bis.mp3`;
        if (music == true) {
          audio.play();
        }
      }
      document.getElementById(`charactersChoose${battle}`).classList.add("hide");
      for (let i = 0; i < personajesObtenidos.length; i++) {
        if (personajesObtenidos[i].name == character1) {
          heroesGlobal.push(personajesObtenidos[i]);
        }
        if (personajesObtenidos[i].name == character2) {
          heroesGlobal.push(personajesObtenidos[i]);
        }
        if (personajesObtenidos[i].name == character3) {
          heroesGlobal.push(personajesObtenidos[i]);
        }
      }
      enemiesGlobal = [];
      for (let i = 0; i < battleEnemies.length; i++) {
        for (let j = 0; j < enemies.length; j++) {
          if (enemies[j].name == battleEnemies[i].name) {
            enemiesGlobal.push(enemies[j]);
            actualizarEnemigo(enemiesGlobal[i], battleEnemies[i].level, battleEnemies[i].rank);
          }
        }
      }
      document.getElementById(`heroes${battle}`).classList.remove("hide");
      document.getElementById(`enemies${battle}`).classList.remove("hide");
      pintarEnemigos(enemiesGlobal);
      for (let i = 1; i <= enemiesGlobal.length; i++) {
        document.getElementById(`enemy${i}`).style.animation = "enemiesEnter 2s ease-in-out";
      }
      for (let i = 1; i <= heroesGlobal.length; i++) {
        document.getElementById(`hero${i}`).style.animation = "heroesEnter 2s ease-in-out";
      }
      for (let i = 1; i <= 3; i++) {
        document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].image;
        document.getElementById(`hero${i}`).innerHTML += heroesGlobal[i-1].healthBar;
        document.getElementById(`info${i}${battle}`).innerHTML = `
          <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
          <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
        document.getElementById(`hero${i}`).addEventListener("mouseover", function() {
          document.getElementById(`info${i}${battle}`).classList.remove("hide");
        })
        document.getElementById(`hero${i}`).addEventListener("mouseout", function() {
          document.getElementById(`info${i}${battle}`).classList.add("hide");
        })
      }
        let attack = document.getElementById("attackfunction");
        let SM = document.getElementById("SMfunction");
        actualizarBotones(attack, SM, battle);
        eventosBatalla(battle);
        setTimeout(() => {
          document.getElementById(`controls${battle}`).classList.remove("hide");
        }, 2000);
    }
  });
  document.getElementById(`attackContainer${battle}`).classList.add("hide");
  document.getElementById(`SMContainer${battle}`).classList.add("hide");
  document.getElementById(`selection${battle}`).classList.add("hide");
  document.getElementById(`nextRound${battle}`).addEventListener("click", async function() {
    if (!comprobarVictoria()) {
      comprobarDerrota()
    }
    document.getElementById(`AttackSMContainer${battle}`).classList.add("hide");
    document.getElementById(`attackContainer${battle}`).classList.add("hide");
    document.getElementById(`SMContainer${battle}`).classList.add("hide");
    document.getElementById(`selection${battle}`).classList.add("hide");
    document.getElementById(`nextRound${battle}`).classList.add("hide");
    if (battle == "HelmsDeep3") {
      enemiesGlobal[0].actualSRecharge = 5;
    } else if (battle == "HelmsDeep5") {
      enemiesGlobal[0].actualSRecharge = 5;
    } else if (battle == "MinasTirith1") {
      enemiesGlobal[0].actualSRecharge = 5;
    } else if (battle == "MinasTirith3") {
      enemiesGlobal[0].actualSRecharge = 5;
    } else if (battle == "MinasTirith6") {
      enemiesGlobal[0].actualSRecharge = 5;
    }
    ataqueactivo = 0; 
    Gandalf = 0;
    Faramir = 0;
    Damrod = 0;
    if (SMoveActualHeroes.hasOwnProperty("Damrod") && DamrodAttack < 3) {
      for (let j = 0; j < heroesGlobal.length; j++) {
        if (heroesGlobal[j].name = "Damrod") {
          ataqueactivo = [heroesGlobal[j].attack*heroesGlobal[j].specialMoveActualAmount, i];
          if (enemiesGlobal[DamrodAttack].name == "Sauron") {
            ataqueactivo[0] = ataqueactivo[0]*0.75;
          }
          document.getElementById(`specialEfectsEnemy${DamrodAttack+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
          enemiesGlobal[DamrodAttack].actualHealth -= attackactive[0];
          if (enemiesGlobal[DamrodAttack].actualHealth < 0) {
            enemiesGlobal[DamrodAttack].actualHealth = 0;
            document.getElementById(`enemy${DamrodAttack+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
            if (enemiesGlobal[DamrodAttack].name == "Troll") {
              document.getElementById(`health${enemiesGlobal[DamrodAttack].name}`).style.width = (enemiesGlobal[DamrodAttack].actualHealth/enemiesGlobal[DamrodAttack].maxHealth)*100 + "%";
              for (let j = 1; j < enemiesGlobal.length; j++) {
                if (enemiesGlobal[j].actualHealth == 0) {
                  let defeated = document.querySelectorAll(`#enemy${j+1} .damageTaken`);
                  for (let k = 0; k < defeated.length; k++) {
                    defeated[k].remove();
                  }
                }
                enemiesGlobal[j].actualHealth += 40;
                document.getElementById(`health${enemiesGlobal[j].name}`).style.width = (enemiesGlobal[j].actualHealth/enemiesGlobal[j].maxHealth)*100 + "%";
                document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = `<p class="heal">+40pH</p>`;
                setTimeout(() => {
                  document.getElementById(`specialEfectsEnemy${j+1}`).innerHTML = "";
                }, 1000);
              }
            }
          }
          document.getElementById(`health${enemiesGlobal[DamrodAttack].name}`).style.width = (enemiesGlobal[DamrodAttack].actualHealth/enemiesGlobal[DamrodAttack].maxHealth)*100 + "%";
          break;
        }
      }
      if (enemiesGlobal[DamrodAttack].name == "Berserker3" && enemiesGlobal[DamrodAttack].actualHealth == 0) {
        for (let i = 1; i < enemiesGlobal.length; i++) {
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
          enemiesGlobal[i].actualHealth -= 60;
          if (enemiesGlobal[i].actualHealth < 0) {
            enemiesGlobal[i].actualHealth = 0;
            document.getElementById(`enemy${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        }
        for (let i = 0; i < heroesGlobal.length; i++) {
          document.getElementById(`specialEfectsHero${i+1}`).innerHTML = `<p class="damageTaken">-60pH</p>`;
          heroesGlobal[i].actualHealth -= 60;
          if (heroesGlobal[i].actualHealth < 0) {
            heroesGlobal[i].actualHealth = 0;
            document.getElementById(`hero${i+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[i].name}`).style.width = (heroesGlobal[i].actualHealth/heroesGlobal[i].maxHealth)*100 + "%";
        }
        if (!comprobarDerrota()) {
          if (!comprobarVictoria()) {
            for (let i = 0; i < heroesGlobal.length; i++) {
              document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
              document.getElementById(`specialEfectsHero${i+1}`).innerHTML = "";
            }
          }
        }
      } else {
        if (!comprobarVictoria()) {
          setTimeout(function() {
            for (let j = 1; j <= enemiesGlobal.length; j++) {
              document.getElementById(`specialEfectsEnemy${j}`).innerHTML = "";
            }
          })
        }
      }
    }
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (enemiesGlobal[i].actualARecharge > 0) {
        enemiesGlobal[i].actualARecharge -= 1;
      }
      if (enemiesGlobal[i].actualSRecharge > 0) {
        enemiesGlobal[i].actualSRecharge -= 1;
      }
    }
    for (const propiedad in SMoveActualEnemies) {
      if (Object.hasOwnProperty.call(SMoveActualEnemies, propiedad)) {
        if (SMoveActualEnemies[propiedad] === 1) {
          delete SMoveActualEnemies[propiedad]; 
        } else if (SMoveActualEnemies[propiedad] > 1) {
          SMoveActualEnemies[propiedad]--;
        }
      }
    }
    if (battle == "BlackGate4") {
      for (let i = 0; i < enemiesGlobal.length; i++) {
        enemiesGlobal[i].actualARecharge = 0;
        enemiesGlobal[i].actualSRecharge = 0;
      }
    }
    let enemySMove = [];
    for (let i = 0; i < enemiesGlobal.length; i++) {
      if (enemiesGlobal[i].actualSRecharge == 0 && enemiesGlobal[i].actualHealth > 0) {
        enemySMove.push([enemiesGlobal[i].name, i])
      }
    }
    let sMoveActual = "";
    let continuar = "";
    if (enemySMove.length > 0) {
      sMoveActual = await getRandomFromSet(enemySMove);
      continuar = await window[`sMove${sMoveActual[0]}`](sMoveActual[1]);
    }
    
    if (continuar || enemySMove.length == 0) {
      let enemyAttack = [];
      for (let i = 0; i < enemiesAttaks; i++) {
        enemyAttack = [];
        for (let j = 0; j < enemiesGlobal.length; j++) {
          if (enemiesGlobal[j].actualARecharge == 0  && enemiesGlobal[j].actualHealth > 0) {
            enemyAttack.push([enemiesGlobal[j].name, j])
          }
        }
        let attackActual = "";
        if (enemyAttack.length > 0) {
          attackActual = await getRandomFromSet(enemyAttack);
          continuar = await window[`attack${attackActual[0]}`](attackActual[1]);
        } 
      }
      enemiesAttaks = 1;
      if (continuar || enemyAttack.length == 0) {
        if ((SMoveActualEnemies.hasOwnProperty("urukHai8")) || (SMoveActualEnemies.hasOwnProperty("Grima") || (SMoveActualEnemies.hasOwnProperty("Snaga"))) && delayedDamage != 0) {
          document.getElementById(`specialEfectsHero${delayedDamage[0]+1}`).innerHTML = `<p class="damageTaken">-${delayedDamage[1]}pH</p>`;
          heroesGlobal[delayedDamage[0]].actualHealth -= delayedDamage[1];
          if (heroesGlobal[delayedDamage[0]].actualHealth < 0) {
            heroesGlobal[delayedDamage[0]].actualHealth = 0;
            document.getElementById(`hero${delayedDamage[0]+1}`).innerHTML += `<p class="damageTaken">Defeated</p>`;
          }
          document.getElementById(`health${heroesGlobal[delayedDamage[0]].name}`).style.width = (heroesGlobal[delayedDamage[0]].actualHealth/heroesGlobal[delayedDamage[0]].maxHealth)*100 + "%";
          setTimeout(() => {
            document.getElementById(`specialEfectsHero${delayedDamage[0]+1}`).innerHTML = "";
          }, 1000);
        }
        if (!comprobarDerrota()) {
          setTimeout(() => {
            for (let i = 0; i < heroesGlobal.length; i++) {
              if (heroesGlobal[i].actualARecharge > 0) {
                heroesGlobal[i].actualARecharge -= 1;
              }
              if (heroesGlobal[i].actualSRecharge > 0) {
                heroesGlobal[i].actualSRecharge -= 1;
              }
            }
            for (const propiedad in SMoveActualHeroes) {
              if (Object.hasOwnProperty.call(SMoveActualHeroes, propiedad)) {
                if (SMoveActualHeroes[propiedad] === 1) {
                  delete SMoveActualHeroes[propiedad]; 
                } else if (SMoveActualHeroes[propiedad] > 1) {
                  SMoveActualHeroes[propiedad]--;
                }
              }
            }
            Gwaihir -= 1;
            document.getElementById(`newCards${battle}`).innerHTML = `<p class="turn">Your turn</p>`;
            document.getElementById(`newCards${battle}Container`).classList.remove("hide");
            setTimeout(() => {
              document.getElementById(`newCards${battle}`).innerHTML = "";
              attacksRemaining = 1;
              SMRemaining = 1;
              let attack = document.getElementById("attackfunction");
              let SM = document.getElementById("SMfunction");
              actualizarBotones(attack, SM, battle);
              document.getElementById(`controls${battle}`).classList.remove("hide");
              document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
              document.getElementById(`nextRound${battle}`).classList.remove("hide");
              eventosBatalla(battle);
            }, 1000);
          }, 1000);
        } 
      }  
    }
  });
}


//funciones de inicio y modificación de las cartas
function dataAPI() {
  return fetch("https://the-one-api.dev/v2/character", {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer _jnVYZhtsCB-sMwUa7lY`
      }
  })
  .then(response => response.json())
  .then(res => res.docs)
}

//función iniciar personajes
function iniciarPersonajes() {
  for (let i = 0; i < personajes.length; i++) {
    let personaje = {name: personajes[i], specialMoveActualAmount: "",
      id: personajes[i], gender: "", height: "", race: "", attack: "", level: 0,
      realm: "", card: cardRank[i], baseAttack: "", maxHealth: "", buy: "", sMoveButton: `<p id="sMove${personajes[i]}" class="sMove">${personajes[i]}</p>`,
      actualHealth: "", attackRecharge: 2, specialMoveRecharge: 3, specialMoveRounds: 1, 
      actualARecharge: 0, actualSRecharge: 0, xp: 0, attackButton: `<p id="attack${personajes[i]}" class="attack">${personajes[i]}</p>`,
      attackDescription: "", specialMoveDescription: "", 
      specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                                <div id="health${personajes[i]}" class="health"></div>
                                              </div>`};
    personajesNoObtenidos.push(personaje);
  };
  for (let i = 0; i < personajesNoObtenidos.length; i++) {
    switch (personajesNoObtenidos[i].name) {
      case "Arador":
        personajesNoObtenidos[i].height = "1.80 m";
        personajesNoObtenidos[i].realm = "Arnor";
        personajesNoObtenidos[i].baseAttack = 35;
        personajesNoObtenidos[i].attackDescription = "He wields his sword at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = "If he is attacked during this round, he dodges the attack";
        break;
      case "Aragorn":
        personajesNoObtenidos[i].id += " II";
        personajesNoObtenidos[i].baseAttack = 57;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].specialMoveAmount = 3;
        personajesNoObtenidos[i].specialMoveActualAmount = 3;
        personajesNoObtenidos[i].attackDescription = "He wields his sword at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He shouts "Elendil!" increasing the damage of his next attack x${personajesNoObtenidos[i].specialMoveActualAmount}`;
        break;
      case "Aranarth":
        personajesNoObtenidos[i].height = "1.86 m";
        personajesNoObtenidos[i].realm = "Arnor";
        personajesNoObtenidos[i].baseAttack = 37;
        personajesNoObtenidos[i].specialMoveAmount = 0.3;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.3;
        personajesNoObtenidos[i].attackDescription = "He wields his sword at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He encourages his companions so the attack in this round deals ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% more damage`;
        break;
      case "Beregond":
        personajesNoObtenidos[i].height = "1.78 m";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].baseAttack = 45;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].attackDescription = "He wields his spear against the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He encourages his companions so the attack in this round deals ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% more damage`;
        break;
      case "Boromir":
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].height = "1.93 m 6'4”";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].baseAttack = 58;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].attackDescription = "He wields his sword against the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He uses his shield to protect his companions from the next attack reducing its dammage by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}%`;
        break;
      case "Ciryannil":
        personajesNoObtenidos[i].height = "1.77 m";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].race = "Human";
        personajesNoObtenidos[i].gender = "Male";
        personajesNoObtenidos[i].baseAttack = 36;
        personajesNoObtenidos[i].specialMoveAmount = 0.3;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.3;
        personajesNoObtenidos[i].attackDescription = "He shoots an arrow at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He sharpens his aim and gains a critical damage increase of ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% for his next attack`;
        break;
      case "Damrod":
        personajesNoObtenidos[i].height = "1.85 m";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].baseAttack = 38;
        personajesNoObtenidos[i].specialMoveAmount = 0.3;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.3;
        personajesNoObtenidos[i].specialMoveRounds = 2;
        personajesNoObtenidos[i].attackDescription = "He shoots an arrow at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He shoots a pierced arrow at the enemy that deals bleed with ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% additional damage for two rounds`;
        break;
      case "Dernwine":
        personajesNoObtenidos[i].height = "1.76 m";
        personajesNoObtenidos[i].realm = "Rohan";
        personajesNoObtenidos[i].race = "Human";
        personajesNoObtenidos[i].gender = "Male";
        personajesNoObtenidos[i].baseAttack = 38;
        personajesNoObtenidos[i].specialMoveAmount = 0.4;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.4;
        personajesNoObtenidos[i].specialMoveRounds = 2;
        personajesNoObtenidos[i].attackDescription = "He attacks the enemy with his axe";
        personajesNoObtenidos[i].specialMoveDescription = `He increases his defense by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% for two rounds`;
        break;
      case "Duinhir":
        personajesNoObtenidos[i].height = "1.85 m";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].baseAttack = 35;
        personajesNoObtenidos[i].specialMoveAmount = 2;
        personajesNoObtenidos[i].specialMoveActualAmount = 2;
        personajesNoObtenidos[i].attackDescription = "He wields his sword at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He increases the damage of his next attack x2`;
        break;
      case "Elladan":
        personajesNoObtenidos[i].height = "1.89 m";
        personajesNoObtenidos[i].realm = "Rivendel";
        personajesNoObtenidos[i].baseAttack = 41;
        personajesNoObtenidos[i].attackRecharge = 1;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].specialMoveRounds = 2;
        personajesNoObtenidos[i].attackDescription = "He charges and wields his sword at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He shouts a war cry increasing his damage by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% for two rounds`;
        break;
      case "Elrohir":
        personajesNoObtenidos[i].height = "1.91 m";
        personajesNoObtenidos[i].realm = "Rivendel";
        personajesNoObtenidos[i].baseAttack = 40;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].attackDescription = "He creates a whirlpool with his swords when attacking";
        personajesNoObtenidos[i].specialMoveDescription = `If he is attacked this round he returns ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% of the damage`;
        break;
      case "Eomer":
        personajesNoObtenidos[i].id = "Éomer";
        personajesNoObtenidos[i].race = "Human";
        personajesNoObtenidos[i].height = `1.98 m 6'6"`;
        personajesNoObtenidos[i].baseAttack = 48;
        personajesNoObtenidos[i].attackDescription = "He attacks throwing his spear";
        personajesNoObtenidos[i].specialMoveDescription = `He attacks at dawn with a cavalry charge and blinds enemies for one turn, preventing them from attacking`;
        
        break;
      case "Eothain":
        personajesNoObtenidos[i].id = "Éothain";
        personajesNoObtenidos[i].race = "Human";
        personajesNoObtenidos[i].height = `1.76 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].baseAttack = 37;
        personajesNoObtenidos[i].specialMoveAmount = 0.3;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.3;
        personajesNoObtenidos[i].attackDescription = "He rides over the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He reflects ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% of the damage he recives this round to the enemy`;
        break;
      case "Eowyn":
        personajesNoObtenidos[i].race = "Human";
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].id = "Éowyn";
        personajesNoObtenidos[i].height = `1.65 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].baseAttack = 54;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].specialMoveAmount = 2.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 2.5;
        personajesNoObtenidos[i].attackDescription = "She wields her sword at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `She charges a fatal blow and her next attack deals damage x${personajesNoObtenidos[i].specialMoveActualAmount}`;
        break;
      case "Faramir":
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].height = "1.93 m (6'4”)";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].baseAttack = 47;
        personajesNoObtenidos[i].specialMoveAmount = 10;
        personajesNoObtenidos[i].specialMoveActualAmount = 10;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He shoots an arrow at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He drains ${personajesNoObtenidos[i].specialMoveActualAmount}ph of the enemy and heals himself that amount`;
        break;
      case "Folcred":
        personajesNoObtenidos[i].height = "1.74 m";
        personajesNoObtenidos[i].realm = "Rohan";
        personajesNoObtenidos[i].baseAttack = 36;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].specialMoveRounds = 2;
        personajesNoObtenidos[i].attackDescription = "He blocks with his shield and then attacks with his sword";
        personajesNoObtenidos[i].specialMoveDescription = `He reflects ${personajesNoObtenidos[i].specialMoveActualAmount*100}% of the damage he recives for two rounds`;
        break;
      case "Galadriel":
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].height = "1.93 m (6'4”)";
        personajesNoObtenidos[i].baseAttack = 51;
        personajesNoObtenidos[i].specialMoveAmount = 10;
        personajesNoObtenidos[i].specialMoveActualAmount = 10;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "She uses her ring of power to harm the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `She uses her ring of power to heal all alies ${personajesNoObtenidos[i].specialMoveActualAmount}ph of Health`;
        break;
      case "Gamling":
        personajesNoObtenidos[i].height = `1.82 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].baseAttack = 38;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He attacks with fury";
        personajesNoObtenidos[i].specialMoveDescription = `He encourages his companions and adds an extra attack this round`;
        break;
      case "Gandalf":
        personajesNoObtenidos[i].height = `1.80 m`;
        personajesNoObtenidos[i].realm = `Valinor`;
        personajesNoObtenidos[i].baseAttack = 57;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].specialMoveAmount = 0.75;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.75;
        personajesNoObtenidos[i].attackDescription = "He attacks with a beam of light from his staff, blinding his enemy for one round";
        personajesNoObtenidos[i].specialMoveDescription = `He protects his companions with a magic shield that stops ${personajesNoObtenidos[i].specialMoveActualAmount *100}% of the damage for 1 round`;
        break;
      case "Gimli":
        personajesNoObtenidos[i].height = `1.37 m`;
        personajesNoObtenidos[i].realm = `Erebor`;
        personajesNoObtenidos[i].baseAttack = 54;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].attackDescription = "He attacks with a circular blow with his battle axe and damages all three of his enemies";
        personajesNoObtenidos[i].specialMoveDescription = `He encourages his companions making them counterattack with ${personajesNoObtenidos[i].specialMoveActualAmount *100}% of the damage they have recived for 1 round`;
        break;
      case "Guthred":
        personajesNoObtenidos[i].height = `1.75 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Human`;
        personajesNoObtenidos[i].baseAttack = 33;
        personajesNoObtenidos[i].specialMoveAmount = 0.3;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.3;
        personajesNoObtenidos[i].attackDescription = "He attacks riding his horse";
        personajesNoObtenidos[i].specialMoveDescription = `With a battle cry he scares the enemy and reduces de damage of the next attack by ${personajesNoObtenidos[i].specialMoveActualAmount *100}%`;
        break;
      case "Gwaihir":
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].height = `6 m`;
        personajesNoObtenidos[i].realm = `Valinor`;
        personajesNoObtenidos[i].baseAttack = 55;
        personajesNoObtenidos[i].specialMoveAmount = 0.1;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.1;
        personajesNoObtenidos[i].attackRecharge = 3;
        personajesNoObtenidos[i].attackDescription = "He attacks all enemies at once";
        personajesNoObtenidos[i].specialMoveDescription = `He takes his companions on his back dodging this rounds attack and having an ${personajesNoObtenidos[i].specialMoveActualAmount *100}% chance of dodging next round's attack`;
        break;
      case "Haldir":
        personajesNoObtenidos[i].id = "Haldir (Lorien)";
        personajesNoObtenidos[i].height = `1.85 m`;
        personajesNoObtenidos[i].realm = `Lothlorien`;
        personajesNoObtenidos[i].baseAttack = 46;
        personajesNoObtenidos[i].attackDescription = "He attacks with his bow";
        personajesNoObtenidos[i].specialMoveDescription = `He dances around the enemy in battle confusing him and making him hit another enemy this round`;
        break;
      case "Hama":
        personajesNoObtenidos[i].id = "Háma";
        personajesNoObtenidos[i].height = `1.74 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].baseAttack = 44;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He wields his weapon at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He sounds the Hornburg scaring the enemy and preventing him from attacking for one round`;
        break;
      case "Herubeam":
        personajesNoObtenidos[i].height = `1.82 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Human`;
        personajesNoObtenidos[i].baseAttack = 36;
        personajesNoObtenidos[i].attackDescription = "He attacks riding his horse";
        personajesNoObtenidos[i].specialMoveDescription = `If he is attacked this round he dodges the attack`;
        break;
      case "Holdbald":
        personajesNoObtenidos[i].height = `1.76 m`;
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Human`;
        personajesNoObtenidos[i].baseAttack = 33;
        personajesNoObtenidos[i].specialMoveAmount = 0.3;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.3;
        personajesNoObtenidos[i].attackDescription = "He trows his axe at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He encourages his companions so the attack in this round deals ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% more damage`;
        break;
      case "kingDead":
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].height = `1.86 m`;
        personajesNoObtenidos[i].realm = `Gondor`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Human`;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].baseAttack = 58;
        personajesNoObtenidos[i].specialMoveAmount = 0.1;
        personajesNoObtenidos[i].attackActualAmount = 0.1;
        personajesNoObtenidos[i].specialMoveActualAmount = 1;
        personajesNoObtenidos[i].attackDescription = `Each time he attacks he increases his attack by ${personajesNoObtenidos[i].attackActualAmount * 100}%`;
        personajesNoObtenidos[i].specialMoveDescription = `He becomes invulnerable for one round`;
        break;
      case "Legolas":
        personajesNoObtenidos[i].height = `1.83 m`;
        personajesNoObtenidos[i].realm = `Mirkwood`;
        personajesNoObtenidos[i].baseAttack = 58;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].specialMoveAmount = 0.25;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.25;
        personajesNoObtenidos[i].attackDescription = "He shoots an arrow with precision at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He shoots three arrows at the same time hitting all three enemies and dealing a damage of ${personajesNoObtenidos[i].specialMoveActualAmount * 100}%`;
        break;
      case "Maradir":
        personajesNoObtenidos[i].height = `1.85 m`;
        personajesNoObtenidos[i].realm = `Gondor`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Human`;
        personajesNoObtenidos[i].baseAttack = 36;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].attackDescription = "He uses his spear at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He increases his damage by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% for this round`;
        break;
      case "Mendener":
        personajesNoObtenidos[i].height = `1.86 m`;
        personajesNoObtenidos[i].realm = `Lothlorien`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Elf`;
        personajesNoObtenidos[i].baseAttack = 32;
        personajesNoObtenidos[i].attackDescription = "He uses a combined move of shield and sword to attack the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `If he is attacked this round he dodges the attack`;
        break;
      case "Merry":
        personajesNoObtenidos[i].id = "Meriadoc";
        personajesNoObtenidos[i].realm = `Hobbiton`;
        personajesNoObtenidos[i].baseAttack = 43;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].specialMoveRounds = 2;
        personajesNoObtenidos[i].attackDescription = "He attacks with his enchanted sword";
        personajesNoObtenidos[i].specialMoveDescription = `He attacks with his enchanted sword breaking his enemy's guard and reducing his defense for two rounds by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}%`;
        break;
      case "Minarorn":
        personajesNoObtenidos[i].height = `1.80 m`;
        personajesNoObtenidos[i].realm = `Ithilien`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Human`;
        personajesNoObtenidos[i].baseAttack = 35;
        personajesNoObtenidos[i].specialMoveAmount = 0.1;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.1;
        personajesNoObtenidos[i].attackDescription = "He shoots an arrow with his bow";
        personajesNoObtenidos[i].specialMoveDescription = `He orders an archer attack hitting all enemies an dealing ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% damage`;
        break;
      case "Ohtar":
        personajesNoObtenidos[i].height = "1.83 m";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].baseAttack = 37;
        personajesNoObtenidos[i].specialMoveAmount = 0.4;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.4;
        personajesNoObtenidos[i].attackDescription = "He blocks with his shield and then attacks with his sword";
        personajesNoObtenidos[i].specialMoveDescription = `He covers with his shield his companions reducing the damage by ${personajesNoObtenidos[i].specialMoveActualAmount*100}% for one round`;
        break;
      case "Pippin":
        personajesNoObtenidos[i].id = "Peregrin";
        personajesNoObtenidos[i].realm = `Hobbiton`;
        personajesNoObtenidos[i].baseAttack = 45;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He attacks with his enchanted sword";
        personajesNoObtenidos[i].specialMoveDescription = `He throws rocks at the heads of his enemies stuning then for one round`;
        break;
      case "princeImrahil":
        personajesNoObtenidos[i].height = "1.87 m";
        personajesNoObtenidos[i].realm = "Gondor";
        personajesNoObtenidos[i].id = "Imrahil";
        personajesNoObtenidos[i].baseAttack = 47;
        personajesNoObtenidos[i].specialMoveAmount = 0;
        personajesNoObtenidos[i].specialMoveActualAmount = 0;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He attacks while dodging the icoming attack";
        personajesNoObtenidos[i].specialMoveDescription = `He increases the number of attacks this round by two and reduces the attack recharge by 1 round`;
        break;
      case "Theoden":
        personajesNoObtenidos[i].buy = "disabled";
        personajesNoObtenidos[i].height = "1.75 m";
        personajesNoObtenidos[i].id = "Théoden";
        personajesNoObtenidos[i].realm = `Rohan`;
        personajesNoObtenidos[i].baseAttack = 56;
        personajesNoObtenidos[i].specialMoveAmount = 0.5;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.5;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He rides with his horse over the enemies";
        personajesNoObtenidos[i].specialMoveDescription = `He inspires his companions increasing their damage by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% for 1 round`;
        break;
      case "Treebeard":
        personajesNoObtenidos[i].height = "4.67 m (15'4)";
        personajesNoObtenidos[i].realm = `Fangorn`;
        personajesNoObtenidos[i].baseAttack = 48;
        personajesNoObtenidos[i].specialMoveAmount = 30;
        personajesNoObtenidos[i].specialMoveActualAmount = 30;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He stomps all his enemies";
        personajesNoObtenidos[i].specialMoveDescription = `He heals himself ${personajesNoObtenidos[i].specialMoveActualAmount}ph of Health`;
        break;
      case "Undome":
        personajesNoObtenidos[i].height = `1.84 m`;
        personajesNoObtenidos[i].realm = `Lothlorien`;
        personajesNoObtenidos[i].gender = `Male`;
        personajesNoObtenidos[i].race = `Elf`;
        personajesNoObtenidos[i].baseAttack = 36;
        personajesNoObtenidos[i].specialMoveAmount = 0.1;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.1;
        personajesNoObtenidos[i].attackDescription = "He shoots an arrow at the enemy";
        personajesNoObtenidos[i].specialMoveDescription = `He orders an archer attack hitting all enemies an dealing ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% damage`;
        break;
    }
  }
  let characters = dataAPI();
  characters.then(data => {
    for (let i = 0; i < personajesNoObtenidos.length; i++) {
      let datos = data.filter(el => el.name.includes(`${personajesNoObtenidos[i].id}`));
      if (datos == undefined) {
        continue;
      } else {
        if (personajesNoObtenidos[i].gender == "") {
          personajesNoObtenidos[i].gender = datos[0].gender;
        }
        if (personajesNoObtenidos[i].race == "") {
          personajesNoObtenidos[i].race = datos[0].race;
        }
        if (personajesNoObtenidos[i].height == "") {
          personajesNoObtenidos[i].height = datos[0].height;
        }
        if (personajesNoObtenidos[i].realm == "") {
          personajesNoObtenidos[i].realm = datos[0].realm;
        }
      }
    }
  });
}

//función iniciar enemigos
function iniciarEnemigos() {
  let watcher = {name: "Watcher", specialMoveActualAmount: 30, card: "", specialMoveAmount: 30, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 1, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthWatcher" class="health"></div>
                                          </div>` }
  enemies.push(watcher);
  let Goblin1 = {name: "Goblin1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGoblin1" class="health"></div>
                                          </div>` }
  enemies.push(Goblin1);
  let Goblin2 = {name: "Goblin2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGoblin2" class="health"></div>
                                          </div>` }
  enemies.push(Goblin2);
  let Goblin3 = {name: "Goblin3", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGoblin3" class="health"></div>
                                          </div>` }
  enemies.push(Goblin3);
  let caveTroll = {name: "caveTroll", specialMoveActualAmount: 0, card: "", specialMoveAmount: 50, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthcaveTroll" class="health"></div>
                                          </div>` }
  enemies.push(caveTroll);
  let LeaderGoblin = {name: "LeaderGoblin", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthLeaderGoblin" class="health"></div>
                                          </div>` }
  enemies.push(LeaderGoblin);
  let archerGoblin = {name: "archerGoblin", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healtharcherGoblin" class="health"></div>
                                          </div>` }
  enemies.push(archerGoblin);
  let Balrog = {name: "Balrog", specialMoveActualAmount: 0, card: "", specialMoveAmount: 2, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 1, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthBalrog" class="health"></div>
                                          </div>` }
  enemies.push(Balrog);
  let Nazgul = {name: "Nazgul", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 1, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthNazgul" class="health"></div>
                                          </div>` }
  enemies.push(Nazgul);
  let urukHai1 = {name: "urukHai1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai1" class="health"></div>
                                          </div>` }
  enemies.push(urukHai1);
  let urukHai2 = {name: "urukHai2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai2" class="health"></div>
                                          </div>` }
  enemies.push(urukHai2);
  let urukHai3 = {name: "urukHai3", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai3" class="health"></div>
                                          </div>` }
  enemies.push(urukHai3);
  let urukHai4 = {name: "urukHai4", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai4" class="health"></div>
                                          </div>` }
  enemies.push(urukHai4);
  let Ugluk = {name: "Ugluk", specialMoveActualAmount: 0, card: "", specialMoveAmount: 10, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthUgluk" class="health"></div>
                                          </div>` }
  enemies.push(Ugluk);
  let Lurtz = {name: "Lurtz", specialMoveActualAmount: 0, card: "", specialMoveAmount: 30, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthLurtz" class="health"></div>
                                          </div>` }
  enemies.push(Lurtz);
  let WargRider1 = {name: "WargRider1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthWargRider1" class="health"></div>
                                          </div>` }
  enemies.push(WargRider1);
  let WargRider2 = {name: "WargRider2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.4, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthWargRider2" class="health"></div>
                                          </div>` }
  enemies.push(WargRider2);
  let Warg1 = {name: "Warg1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthWarg1" class="health"></div>
                                          </div>` }
  enemies.push(Warg1);
  let Warg2 = {name: "Warg2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthWarg2" class="health"></div>
                                          </div>` }
  enemies.push(Warg2);
  let WargLeader = {name: "WargLeader", specialMoveActualAmount: 0, card: "", specialMoveAmount: 40, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthWargLeader" class="health"></div>
                                          </div>` }
  enemies.push(WargLeader);
  let archer = {name: "archer", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healtharcher" class="health"></div>
                                          </div>` }
  enemies.push(archer);
  let crossbow = {name: "crossbow", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthcrossbow" class="health"></div>
                                          </div>` }
  enemies.push(crossbow);
  let urukHai5 = {name: "urukHai5", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai5" class="health"></div>
                                          </div>` }
  enemies.push(urukHai5);
  let Berserker1 = {name: "Berserker1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 30, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthBerserker1" class="health"></div>
                                          </div>` }
  enemies.push(Berserker1);
  let urukHai6 = {name: "urukHai6", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai6" class="health"></div>
                                          </div>` }
  enemies.push(urukHai6);
  let urukHai7 = {name: "urukHai7", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai7" class="health"></div>
                                          </div>` }
  enemies.push(urukHai7);
  let Berserker3 = {name: "Berserker3", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 5, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthBerserker3" class="health"></div>
                                          </div>` }
  enemies.push(Berserker3);
  let urukHai8 = {name: "urukHai8", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.2, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai8" class="health"></div>
                                          </div>` }
  enemies.push(urukHai8);
  let urukHai9 = {name: "urukHai9", specialMoveActualAmount: 0.5, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthurukHai9" class="health"></div>
                                          </div>` }
  enemies.push(urukHai9);
  let spearman = {name: "spearman", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthspearman" class="health"></div>
                                          </div>` }
  enemies.push(spearman);
  let Captain = {name: "Captain", specialMoveActualAmount: 0, card: "", specialMoveAmount: 1.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthCaptain" class="health"></div>
                                          </div>` }
  enemies.push(Captain);
  let BatteringRam = {name: "BatteringRam", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 3, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 5, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthBatteringRam" class="health"></div>
                                          </div>` }
  enemies.push(BatteringRam);
  let Berserker2 = {name: "Berserker2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 30, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthBerserker2" class="health"></div>
                                          </div>` }
  enemies.push(Berserker2);
  let Mog = {name: "Mog", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthMog" class="health"></div>
                                          </div>` }
  enemies.push(Mog);
  let Grima = {name: "Grima", specialMoveActualAmount: 0.45, card: "", specialMoveAmount: 0.45, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGrima" class="health"></div>
                                          </div>` }
  enemies.push(Grima);
  let Saruman = {name: "Saruman", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthSaruman" class="health"></div>
                                          </div>` }
  enemies.push(Saruman);
  let archerMordor1 = {name: "archerMordor1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healtharcherMordor1" class="health"></div>
                                          </div>` }
  enemies.push(archerMordor1);
  let orcMordor1 = {name: "orcMordor1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.75, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor1" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor1);
  let orcMordor2 = {name: "orcMordor2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor2" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor2);
  let orcMordor3 = {name: "orcMordor3", specialMoveActualAmount: 0.6, card: "", specialMoveAmount: 0.6, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor3" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor3);
  let orcMordor4 = {name: "orcMordor4", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor4" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor4);
  let orcMordor5 = {name: "orcMordor5", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor5" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor5);
  let archerMordor2 = {name: "archerMordor2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healtharcherMordor2" class="health"></div>
                                          </div>` }
  enemies.push(archerMordor2);
  let Troll = {name: "Troll", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthTroll" class="health"></div>
                                          </div>` }
  enemies.push(Troll);
  let orcMordor6 = {name: "orcMordor6", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0.3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor6" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor6);
  let orcMordor7 = {name: "orcMordor7", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor7" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor7);
  let orcMordor8 = {name: "orcMordor8", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor8" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor8);
  let Grond = {name: "Grond", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGrond" class="health"></div>
                                          </div>` }
  enemies.push(Grond);
  let armoredTroll = {name: "armoredTroll", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healtharmoredTroll" class="health"></div>
                                          </div>` }
  enemies.push(armoredTroll);
  let orcMordor11 = {name: "orcMordor11", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor11" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor11);
  let orcMordor9 = {name: "orcMordor9", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor9" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor9);
  let orcMordor10 = {name: "orcMordor10", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthorcMordor10" class="health"></div>
                                          </div>` }
  enemies.push(orcMordor10);
  let mumakil = {name: "mumakil", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthmumakil" class="health"></div>
                                          </div>` }
  enemies.push(mumakil);
  let Mahud = {name: "Mahud", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthMahud" class="health"></div>
                                          </div>` }
  enemies.push(Mahud);
  let archerHaradrim = {name: "archerHaradrim", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healtharcherHaradrim" class="health"></div>
                                          </div>` }
  enemies.push(archerHaradrim);
  let Guritz = {name: "Guritz", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGuritz" class="health"></div>
                                          </div>` }
  enemies.push(Guritz);
  let Gothmog = {name: "Gothmog", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 1, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGothmog" class="health"></div>
                                          </div>` }
  enemies.push(Gothmog);
  let witchKing = {name: "witchKing", specialMoveActualAmount: 3.5, card: "", specialMoveAmount: 3.5, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthwitchKing" class="health"></div>
                                          </div>` }
  enemies.push(witchKing);
  let Murgash = {name: "Murgash", specialMoveActualAmount: 3, card: "", specialMoveAmount: 3, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthMurgash" class="health"></div>
                                          </div>` }
  enemies.push(Murgash);
  let Mauhur = {name: "Mauhur", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthMauhur" class="health"></div>
                                          </div>` }
  enemies.push(Mauhur);
  let Haradrim1 = {name: "Haradrim1", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthHaradrim1" class="health"></div>
                                          </div>` }
  enemies.push(Haradrim1);
  let Haradrim2 = {name: "Haradrim2", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthHaradrim2" class="health"></div>
                                          </div>` }
  enemies.push(Haradrim2);
  let Shagrat = {name: "Shagrat", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthShagrat" class="health"></div>
                                          </div>` }
  enemies.push(Shagrat);
  let Snaga = {name: "Snaga", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 2, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthSnaga" class="health"></div>
                                          </div>` }
  enemies.push(Snaga);
  let Radbug = {name: "Radbug", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthRadbug" class="health"></div>
                                          </div>` }
  enemies.push(Radbug);
  let Gorbag = {name: "Gorbag", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthGorbag" class="health"></div>
                                          </div>` }
  enemies.push(Gorbag);
  let OlogHai = {name: "OlogHai", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthOlogHai" class="health"></div>
                                          </div>` }
  enemies.push(OlogHai);
  let MouthOfSauron = {name: "MouthOfSauron", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 4, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthMouthOfSauron" class="health"></div>
                                          </div>` }
  enemies.push(MouthOfSauron);
  let Sauron = {name: "Sauron", specialMoveActualAmount: 0, card: "", specialMoveAmount: 0, attackDescription: "", 
  attack: "", level: "", maxHealth: "", actualHealth: "", attackRecharge: 2, specialMoveDescription: "",
  specialMoveRecharge: 3, specialMoveRounds: 1, actualARecharge: 0, actualSRecharge: 0, 
  specialMove: 0, image: "", healthBar: `<div class="healthbar">
                                            <div id="healthSauron" class="health"></div>
                                          </div>` }
  enemies.push(Sauron);
}

//function actualizar Enemigo para la batalla
async function actualizarEnemigo(carta, level, rank) {
  let cartaActual = await carta;
  if (rank == "gold") {
    let baseAttack = Math.round(Math.random()*10) + 50;
    cartaActual.attack = baseAttack + 5*level;
    cartaActual.maxHealth = 100 + 10*level;
    cartaActual.actualHealth = cartaActual.maxHealth;
  } else if (rank == "silver") {
    let baseAttack = Math.round(Math.random()*10) + 40;
    cartaActual.attack = baseAttack + 4*level;
    cartaActual.maxHealth = 75 + 7.5*level;
    cartaActual.actualHealth = cartaActual.maxHealth;
  } else {
    let baseAttack = Math.round(Math.random()*10) + 30;
    cartaActual.attack = baseAttack + 3*level;
    cartaActual.maxHealth = 50 + 5*level;
    cartaActual.actualHealth = cartaActual.maxHealth;
  };
  cartaActual.level = level;
  cartaActual.image = `<figure class="displayCard">
                  <img src="./assets/${rank}.png" alt="${cartaActual.name}" class="markCard">
                  <img src="./assets/enemies/${cartaActual.name}.png" alt="${cartaActual.name}" class="cardImage">
                  <img src="./assets/${level}.png" alt="" class="cardLevel">`;
                  
  if (level > 0) {
    switch (cartaActual.name) {
      case "Watcher":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*2;
        cartaActual.attackDescription = "He hits you with his tentacle";
        cartaActual.specialMoveDescription = `He heals himself ${cartaActual.specialMoveActualAmount}pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">${cartaActual.name}</p>
                                </figure>`;
        break;
      case "Goblin1":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.attackDescription = "He wields his sword at you";
        cartaActual.specialMoveDescription = `He increases his attack this round by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">Goblin</p>
                                </figure>`;
        break;
      case "Goblin2":
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `If he is attacked this round he dodges the attack`;
        cartaActual.image += `<p class="${rank} nameDisplay">Goblin</p>
                                </figure>`;
        break;
      case "Goblin3":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.attackDescription = "He throws his spear at you";
        cartaActual.specialMoveDescription = `He increases his companions attack this round by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">Goblin</p>
                                </figure>`;
        break;
      case "caveTroll":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*1;
        cartaActual.attackDescription = "He hits you with his chain";
        cartaActual.specialMoveDescription = `He stabs you with his spear dealing a critical damage of ${cartaActual.specialMoveActualAmount}pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">${cartaActual.name}</p>
                                </figure>`;
        break;
      case "LeaderGoblin":
        cartaActual.attackDescription = "He attacks you jumping from above";
        cartaActual.specialMoveDescription = `With a war cry he freezes you and you cannot attack the next turn`;
        cartaActual.image += `<p class="${rank} nameDisplay">${cartaActual.name}</p>
                                </figure>`;
        break;
      case "archerGoblin":
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He alerts his companions of your next attack, so they dodge it`;
        cartaActual.image += `<p class="${rank} nameDisplay">archer</p>
                                </figure>`;
        break;
      case "Balrog":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        cartaActual.attackDescription = "He burns you with his fire whip";
        cartaActual.specialMoveDescription = `He increases his damage x${cartaActual.specialMoveActualAmount} for 2 rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">${cartaActual.name}</p>
                                </figure>`;
        break;
      case "Nazgul":
        cartaActual.attackDescription = "He attacks you with his wraith";
        cartaActual.specialMoveDescription = `He screams paralizing you for 2 rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">${cartaActual.name}</p>
                                </figure>`;
        break;
      case "urukHai1":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.attackDescription = "He trows an attack";
        cartaActual.specialMoveDescription = `He increases the damage of all alies by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for 1 round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "urukHai2":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.attackDescription = "He attacks with fury";
        cartaActual.specialMoveDescription = `He drinks a potion and increases his damage by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for 1 round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "urukHai3":
        cartaActual.attackDescription = "He races at you and hits you with his sword";
        cartaActual.specialMoveDescription = `If he is attacked this round he blocks the damage`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "urukHai4":
        cartaActual.attackDescription = "He attacks you from behind";
        cartaActual.specialMoveDescription = `He puts on heavier armor and reduces his damage by 40% for 2 rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "Ugluk":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*5;
        cartaActual.attackDescription = "He wields his sword at you";
        cartaActual.specialMoveDescription = `He heals all allies ${cartaActual.specialMoveActualAmount}pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Ugluk</p>
                                </figure>`;
        break;
      case "Lurtz":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount - level*2;
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He stabs himself and becomes enraged, he attacks you and deals x3 damage`;
        cartaActual.image += `<p class="${rank} nameDisplay">Lurtz</p>
                                </figure>`;
        break;
      case "WargRider1":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.attackDescription = "He wields his sword at you";
        cartaActual.specialMoveDescription = `He increases his attack this round by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">Warg Rider</p>
                                </figure>`;
        break;
      case "WargRider2":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.attackDescription = "He attacks you while passing by";
        cartaActual.specialMoveDescription = `He increases all enemies attack this round by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">Warg Rider</p>
                                </figure>`;
        break;
      case "Warg1":
        cartaActual.attackDescription = "He jumps at you and bits you";
        cartaActual.specialMoveDescription = `He increases all enemies speed this round adding an additional attack`;
        cartaActual.image += `<p class="${rank} nameDisplay">Warg</p>
                                </figure>`;
        break;
      case "Warg2":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.attackDescription = "He sticks his claws into you";
        cartaActual.specialMoveDescription = `He increases all enemies speed making them counterattack with ${Math.round(cartaActual.specialMoveActualAmount*100)}% damage`;
        cartaActual.image += `<p class="${rank} nameDisplay">Warg</p>
                                </figure>`;
        break;
      case "WargLeader":
        cartaActual.attackDescription = "He throws you of your mount and paralizes you for one turn";
        cartaActual.specialMoveDescription = `He attacks you dealing 40pH damage and he recovers that amount of health. This attack cannot be blocked`;
        cartaActual.image += `<p class="${rank} nameDisplay">Warg Leader</p>
                                </figure>`;
        break;
      case "archer":
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He alerts his companions of your next attack, so they dodge it`;
        cartaActual.image += `<p class="${rank} nameDisplay">archer</p>
                                </figure>`;
        break;
      case "crossbow":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He orders an attack dealing ${Math.round(cartaActual.specialMoveActualAmount*100)}% damage`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "urukHai5":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.attackDescription = "He attacks you with his sword";
        cartaActual.specialMoveDescription = `He increases the damage of his companions by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for one round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "Berserker1":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount - level*2;
        cartaActual.attackDescription = "He attacks you with a circular blow";
        cartaActual.specialMoveDescription = `He goes into a frenzy and increases his damage x2.5 but loses ${cartaActual.specialMoveActualAmount}pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Berserker</p>
                                </figure>`;
        break;
      case "urukHai6":
        cartaActual.attackDescription = "He attacks you from behind";
        cartaActual.specialMoveDescription = `He puts on heavier armor and reduces his damage by 40% for 2 rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "urukHai7":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.attackDescription = "He attacks with fury";
        cartaActual.specialMoveDescription = `He drinks a potion and increases his damage by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for 1 round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "Berserker3":
        cartaActual.attackDescription = "He jumps at you and attacks you";
        cartaActual.specialMoveDescription = `If he dies he explodes the bomb and damages all cards 60pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Berserker</p>
                                </figure>`;
        break;
      case "urukHai8":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.attackDescription = "He attacks jumping with a vertical blow";
        cartaActual.specialMoveDescription = `He damages you with his rusty sword causing an extra ${Math.round(cartaActual.specialMoveActualAmount*100)}% damage at the end of this round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "urukHai9":
        cartaActual.attackDescription = "He attacks you with a circular blow";
        cartaActual.specialMoveDescription = `He reduces all damage of all enemies by ${cartaActual.specialMoveActualAmount*100}% for one round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Uruk Hai</p>
                                </figure>`;
        break;
      case "spearman":
        cartaActual.attackDescription = "He attacks you with his spear";
        cartaActual.specialMoveDescription = `He wounds you preventing you from attacking the next round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Spearman</p>
                                </figure>`;
        break;
      case "Captain":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.06;
        cartaActual.attackDescription = "He attacks you fiercely";
        cartaActual.specialMoveDescription = `He encourages his companions increasing their attack this round x${cartaActual.specialMoveActualAmount}`;
        cartaActual.image += `<p class="${rank} nameDisplay">Captain</p>
                                </figure>`;
        break;
      case "BatteringRam":
        cartaActual.actualHealth += 75;
        cartaActual.maxHealth += 75;
        cartaActual.attackDescription = "They charge and deliver an inmense blow";
        cartaActual.specialMoveDescription = `Has an extra 75pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Battering Ram</p>
                                </figure>`;
        break;
      case "Berserker2":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount - level*2;
        cartaActual.attackDescription = "He attacks you with a circular blow";
        cartaActual.specialMoveDescription = `He goes into a frenzy and increases his damage x2.5 but loses ${cartaActual.specialMoveActualAmount}pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Berserker</p>
                                </figure>`;
        break;
      case "Mog":
        cartaActual.attackDescription = "He comands his troops to attack";
        cartaActual.specialMoveDescription = `He attacks and reduces the recharging attack time by one round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Mog</p>
                                </figure>`;
        break;
      case "Grima":
        cartaActual.attackDescription = "He attacks you from behind";
        cartaActual.specialMoveDescription = `He attacks you with a poisoned dagger that deals damage at the end of the round for two rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">Grima</p>
                                </figure>`;
        break;
      case "Saruman":
        cartaActual.attackDescription = "He attacks you with a magic spell and stuns you for one turn";
        cartaActual.specialMoveDescription = `He throws a ball of fire at each hero`;
        cartaActual.image += `<p class="${rank} nameDisplay">Saruman</p>
                                </figure>`;
        break;
      case "archerMordor1":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He orders an attack shooting arrows at all enemies and dealing ${cartaActual.specialMoveActualAmount*100}% damage`;
        cartaActual.image += `<p class="${rank} nameDisplay">archer</p>
                                </figure>`;
        break;
      case "orcMordor1":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.attackDescription = "He jumps at you and attacks you";
        cartaActual.specialMoveDescription = `He increases the damage of his next attack by ${cartaActual.specialMoveActualAmount*100}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor2":
        cartaActual.attackDescription = "He races at you and hits you with his maze";
        cartaActual.specialMoveDescription = `If he is attacked in the following two rounds he blocks the damage`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor3":
        cartaActual.attackDescription = "He attacks you brutally";
        cartaActual.specialMoveDescription = `He uses a shield to protect his companions reducing the damage this round by ${cartaActual.specialMoveActualAmount*100}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor4":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.attackDescription = "He wields his sword at you";
        cartaActual.specialMoveDescription = `He increases their morale increasing the damage by ${cartaActual.specialMoveActualAmount*100}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor5":
        cartaActual.attackDescription = "He sneakily attacks you from behind";
        cartaActual.specialMoveDescription = `He screams alerting his companions and making them dodge the attack this round`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "archerMordor2":
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He alerts his companions of your next attack, so they dodge it`;
        cartaActual.image += `<p class="${rank} nameDisplay">archer</p>
                                </figure>`;
        break;
      case "Troll":
        cartaActual.attackDescription = "He hits you with all his strength dealing masive damage";
        cartaActual.specialMoveDescription = `When he dies he adds 40pH to the life of his companions`;
        cartaActual.image += `<p class="${rank} nameDisplay">Troll</p>
                                </figure>`;
        break;
      case "orcMordor6":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.attackDescription = "He throws his spear at you";
        cartaActual.specialMoveDescription = `He increases his companions attack this round by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor7":
        cartaActual.attackDescription = "He attacks you from behind";
        cartaActual.specialMoveDescription = `He puts on heavier armor and reduces his damage by 40% for 2 rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor8":
        cartaActual.attackDescription = "He jumps at you and stabs you";
        cartaActual.specialMoveDescription = `He increases all enemies speed this round adding an additional attack`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "Grond":
        cartaActual.maxHealth += 100;
        cartaActual.actualHealth += 100;
        cartaActual.attackDescription = "He delivers an inmense blow";
        cartaActual.specialMoveDescription = `He has an aditional 100pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Grond</p>
                                </figure>`;
        break;
      case "armoredTroll":
        cartaActual.attackDescription = "He delivers a charged blow";
        cartaActual.specialMoveDescription = `He acumulates the damage he recives for two rounds and adds it to his next attack`;
        cartaActual.image += `<p class="${rank} nameDisplay">armored Troll</p>
                                </figure>`;
        break;
      case "orcMordor11":
        cartaActual.attackDescription = "He attacks you with his spear";
        cartaActual.specialMoveDescription = `He wounds you preventing that character from attacking the next round`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor9":
        cartaActual.attackDescription = "He attacks you with his sword";
        cartaActual.specialMoveDescription = `He increases the damage of his next attack x2.5`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "orcMordor10":
        cartaActual.attackDescription = "He jumps at you, attacks and then retreats";
        cartaActual.specialMoveDescription = `He increases all enemies speed this round adding an additional attack`;
        cartaActual.image += `<p class="${rank} nameDisplay">orc</p>
                                </figure>`;
        break;
      case "mumakil":
        cartaActual.maxHealth += 100;
        cartaActual.actualHealth += 100;
        cartaActual.attackDescription = "He hits you doing masive damage";
        cartaActual.specialMoveDescription = `He has an extra 100pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Mumakil</p>
                                </figure>`;
        break;
      case "Mahud":
        cartaActual.attackDescription = "He throws a spear at you";
        cartaActual.specialMoveDescription = `He increases the attack and defense of the mumakil by 60% for one round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Mahud</p>
                                </figure>`;
        break;
      case "archerHaradrim":
        cartaActual.attackDescription = "He shoots an arrow at you";
        cartaActual.specialMoveDescription = `He orders an attack dealing 40% damage to all enemies`;
        cartaActual.image += `<p class="${rank} nameDisplay">archer</p>
                                </figure>`;
        break;
      case "Guritz":
        cartaActual.attackDescription = "He attacks you fiercelly";
        cartaActual.specialMoveDescription = `He confuses one enemy so that if he attacks this turn he inflicts the damage to himself`;
        cartaActual.image += `<p class="${rank} nameDisplay">Guritz</p>
                                </figure>`;
        break;
      case "Gothmog":
        cartaActual.attackDescription = "He orders some orcs to attack";
        cartaActual.specialMoveDescription = `He increases the number of attacks to 3`;
        cartaActual.image += `<p class="${rank} nameDisplay">Gothmog</p>
                                </figure>`;
        break;
      case "witchKing":
        cartaActual.attackDescription = "He delivers an inmense blow with his maze";
        cartaActual.specialMoveDescription = `He reduces the damage he recieves of male humans by 30% and increases the damage of his next blow x3.5`;
        cartaActual.image += `<p class="${rank} nameDisplay">The Witch King</p>
                                </figure>`;
        break;
      case "Murgash":
        cartaActual.attackDescription = "He commands an attack";
        cartaActual.specialMoveDescription = `He increases all enemies damage x3 this round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Murgash</p>
                                </figure>`;
        break;
      case "Mauhur":
        cartaActual.attackDescription = "He attacks fiercelly";
        cartaActual.specialMoveDescription = `He blocks all incoming damage to himself for two rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">Mauhur</p>
                                </figure>`;
        break;
      case "Haradrim1":
        cartaActual.attackDescription = "He attacks you with his spear";
        cartaActual.specialMoveDescription = `He wounds you preventing you from attacking the next round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Haradrim</p>
                                </figure>`;
        break;
      case "Haradrim2":
        cartaActual.attackDescription = "He cuts you with his spear";
        cartaActual.specialMoveDescription = `He reduces all incoming damage by 70% for all enemies for two rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">Haradrim</p>
                                </figure>`;
        break;
      case "Shagrat":
        cartaActual.attackDescription = "He jumps and lands a vertical blow with his sword";
        cartaActual.specialMoveDescription = `He increases the damage of his next attack x4`;
        cartaActual.image += `<p class="${rank} nameDisplay">Shagrat</p>
                                </figure>`;
        break;
      case "Snaga":
        cartaActual.attackDescription = "He launches a suprise attack from behind";
        cartaActual.specialMoveDescription = `He attacks you with a poisoned dagger that deals damage at the end of the round for two rounds`;
        cartaActual.image += `<p class="${rank} nameDisplay">Snaga</p>
                                </figure>`;
        break;
      case "Radbug":
        cartaActual.attackDescription = "He attacks you wielding his sword";
        cartaActual.specialMoveDescription = `He throws rocks at all enemies stunning them for one round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Radbug</p>
                                </figure>`;
        break;
      case "Gorbag":
        cartaActual.attackDescription = "He jumps, attacks you and retreats";
        cartaActual.specialMoveDescription = `He prevents all enemies from being stunned and adds an extra attack`;
        cartaActual.image += `<p class="${rank} nameDisplay">Radbug</p>
                                </figure>`;
        break;
      case "OlogHai":
        cartaActual.attackDescription = "He stomps you and cuts you with his sword";
        cartaActual.specialMoveDescription = `He removes all buffs of the enemy and screams, paralizing you with fear for one round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Olog Hai</p>
                                </figure>`;
        break;
      case "MouthOfSauron":
        cartaActual.attackDescription = "He wields his sword at you";
        cartaActual.specialMoveDescription = `He heals all allies 80pH`;
        cartaActual.image += `<p class="${rank} nameDisplay">Mouth of Sauron</p>
                                </figure>`;
        break;
      case "Sauron":
        cartaActual.maxHealth += 50;
        cartaActual.actualHealth += 50;
        cartaActual.attack = 130;
        cartaActual.attackDescription = "He hits all of his enemies with his magical maze and sends them flying";
        cartaActual.specialMoveDescription = `He reduces all incoming damage to himself by 25%, increases the number of attacks this round by two and reduces the attack recharge by 1 round`;
        cartaActual.image += `<p class="${rank} nameDisplay">Sauron</p>
                                </figure>`;
        break;
    }
  }
}

//function pintar enemigos
async function pintarEnemigos(enemigos) {
  let enemigosActualizados = await enemigos;
  for (let i = 1; i <= enemigosActualizados.length; i++) {
    document.getElementById(`enemy${i}`).innerHTML += enemigosActualizados[i-1].image;
    document.getElementById(`enemy${i}`).innerHTML += enemigosActualizados[i-1].healthBar;
    document.getElementById(`info${i}enemy`).innerHTML = `
      <p><b>Attack:</b> ${enemigosActualizados[i-1].attackDescription}</p>
      <p><b>Special Move:</b> ${enemigosActualizados[i-1].specialMoveDescription}</p>`;
    document.getElementById(`enemy${i}`).addEventListener("mouseover", function() {
      document.getElementById(`info${i}enemy`).classList.remove("hide");
    });
    document.getElementById(`enemy${i}`).addEventListener("mouseout", function() {
      document.getElementById(`info${i}enemy`).classList.add("hide");
    });
  }
}

//función actualizar cartas
async function actualizarCartas(carta, xp) {
  let cartaActual = await carta;
  let level;
  if (cartaActual.card == "gold") {
    level = Math.floor(xp/750);
    if (level > 10) level = 10;
    cartaActual.attack = cartaActual.baseAttack + 5*level;
    cartaActual.maxHealth = 100 + 10*level;
    cartaActual.actualHealth = cartaActual.maxHealth;
  } else if (cartaActual.card == "silver") {
    level = Math.floor(xp/500);
    if (level > 10) level = 10;
    cartaActual.attack = cartaActual.baseAttack + 4*level;
    cartaActual.maxHealth = 75 + 7.5*level;
    cartaActual.actualHealth = cartaActual.maxHealth;
  } else {
    level = Math.floor(xp/250);
    if (level > 10) level = 10;
    cartaActual.attack = cartaActual.baseAttack + 3*level;
    cartaActual.maxHealth = 50 + 5*level;
    cartaActual.actualHealth = cartaActual.maxHealth;
  };
  cartaActual.level = level;
  cartaActual.xp = xp;
  cartaActual.image = `<figure class="displayCard">
                  <img src="./assets/heros/${cartaActual.name}.png" alt="${cartaActual.name}" class="cardImage">
                  <img src="./assets/${level}.png" alt="" class="cardLevel">
                  <p class="${cartaActual.card} nameDisplay">${cartaActual.name}</p>
                </figure>`;
  if (cartaActual.name == "kingDead") {
    cartaActual.image = `<figure class="displayCard">
                  <img src="./assets/heros/${cartaActual.name}.png" alt="${cartaActual.name}" class="cardImage">
                  <img src="./assets/${level}.png" alt="" class="cardLevel">
                  <p class="${cartaActual.card} nameDisplay">King of the Dead</p>
                </figure>`;
  }
  if (cartaActual.name == "princeImrahil") {
    cartaActual.image = `<figure class="displayCard">
                  <img src="./assets/heros/${cartaActual.name}.png" alt="${cartaActual.name}" class="cardImage">
                  <img src="./assets/${level}.png" alt="" class="cardLevel">
                  <p class="${cartaActual.card} nameDisplay">Prince Imrahil</p>
                </figure>`;
  }
  if (level > 0) {
    switch (cartaActual.name) {
      case "Gandalf":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.025;
        if (level > 4) {
          cartaActual.specialMoveRounds = 2;
        }
        cartaActual.specialMoveDescription = `He protects his companions with a magic shield that stops ${Math.round(cartaActual.specialMoveActualAmount*100)}% of the damage for ${cartaActual.specialMoveRounds} rounds`;
        break;
      case "Theoden":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        if (level > 4) {
          cartaActual.specialMoveRounds = 2;
        }
        cartaActual.specialMoveDescription = `He inspires his companions increasing their damage by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for ${cartaActual.specialMoveRounds} rounds`;
        break;
      case "Aragorn":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        cartaActual.specialMoveDescription = `He shouts "Elendil!" increasing the damage of his next attack x${cartaActual.specialMoveActualAmount}`;
        break;
      case "Aranarth":
      case "Holdbald":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.specialMoveDescription = `He encourages his companions so the attack in this round deals ${Math.round(cartaActual.specialMoveActualAmount*100)}% more damage`;
        break;
      case "kingDead":
        cartaActual.attackActualAmount = cartaActual.specialMoveAmount + level*0.01;
        if (level > 4) {
          cartaActual.specialMoveRounds = 2;
        }
        cartaActual.attackDescription = `Each time he attacks he increases his attack by ${cartaActual.attackActualAmount * 100}%`;
        cartaActual.specialMoveDescription = `He becomes invulnerable for ${cartaActual.specialMoveRounds} rounds`;
        break;
      case "Beregond":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He encourages his companions so the attack in this round deals ${Math.round(cartaActual.specialMoveActualAmount*100)}% more damage`;
        break;
      case "Boromir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He uses his shield to protect his companions from the next attack reducing its dammage by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        break;
      case "Ciryannil":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He sharpens his aim and gains a critical damage increase of ${Math.round(cartaActual.specialMoveActualAmount*100)}% for his next attack`;
        break;
      case "Damrod":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He shoots a pierced arrow at the enemy that deals bleed with ${Math.round(cartaActual.specialMoveActualAmount*100)}% additional damage for two rounds`;
        break;
      case "Dernwine":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        personajesNoObtenidos[i].specialMoveDescription = `He increases his defense by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for two rounds`;
        break;
      case "Duinhir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        personajesNoObtenidos[i].specialMoveDescription = `He increases the damage of his next attack x${Math.round(cartaActual.specialMoveActualAmount)}`;
        break;
      case "Elladan":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He shouts a war cry increasing his damage by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for two rounds`;
        break;
      case "Elrohir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `If he is attacked this round he returns ${Math.round(cartaActual.specialMoveActualAmount*100)}% of the damage`;
        break;
      case "Eothain":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.04;
        cartaActual.specialMoveDescription = `He reflects ${Math.round(cartaActual.specialMoveActualAmount*100)}% of the damage he recives this round to the enemy`;
        break;
      case "Eowyn":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        cartaActual.specialMoveDescription = `She charges a fatal blow and her next attack deals damage x${cartaActual.specialMoveActualAmount}`;
        break;
      case "Faramir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*5;
        cartaActual.specialMoveDescription = `He drains ${cartaActual.specialMoveActualAmount}ph of the enemy and heals himself that amount`;
        break;
      case "Folcred":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        personajesNoObtenidos[i].specialMoveDescription = `He reflects ${Math.round(cartaActual.specialMoveActualAmount*100)}% of the damage he recives for two rounds`;
        break;
      case "Galadriel":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*5;
        cartaActual.specialMoveDescription = `She uses her ring of power to heal all alies ${cartaActual.specialMoveActualAmount}ph of Health`;
        break;
      case "Gimli":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.06;
        cartaActual.specialMoveDescription = `He encourages his companions making them counterattack with ${Math.round(cartaActual.specialMoveActualAmount*100)}% of the damage they have recived for 1 round`;
        break;
      case "Guthred":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.specialMoveDescription = `With a battle cry he scares the enemy and reduces de damage of the next attack by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        break;
      case "Gwaihir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.04;
        cartaActual.specialMoveDescription = `He takes his companions on his back dodging this rounds attack and having an ${cartaActual.specialMoveActualAmount *100}% chance of dodging next round's attack`;
        break;
      case "Legolas":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He shoots three arrows at the same time hitting all three enemies and dealing a damage of ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        break;
      case "Maradir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He increases his damage by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for this round`;
        break;
      case "Ohtar":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        personajesNoObtenidos[i].specialMoveDescription = `He covers with his shield his companions reducing the damage by ${Math.round(cartaActual.specialMoveActualAmount*100)}% for one round`;
        break;
      case "Merry":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He attacks with his enchanted sword breaking his enemy's guard and reducing his defense for two rounds by ${Math.round(cartaActual.specialMoveActualAmount*100)}%`;
        break;
      case "Minarorn":
      case "Undome":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.specialMoveDescription = `He orders an archer attack hitting all enemies an dealing ${Math.round(cartaActual.specialMoveActualAmount*100)}% damage`;
        break;
      case "Treebeard":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*3;
        cartaActual.specialMoveDescription = `He heals himself ${cartaActual.specialMoveActualAmount}ph of Health`;
        break;
    }
  }
}

//función manejo de inicio cerrado de sesión
async function loginLogout(user) {
  if (user) {
    setTimeout(async function() {
      let emailUser = user.email;
      let querySnapshot = await db.collection('users').get()
        querySnapshot.forEach(doc => {
          if (doc.data().email == emailUser) {
            datosUsuarioActual = doc.data();
            datosUsuarioActual.charactersOwned.forEach(element => {
              for (let i = 0; i < personajesNoObtenidos.length; i++) {
                if (personajesNoObtenidos[i].name == element.name) {
                  actualizarCartas(personajesNoObtenidos[i], element.xp);
                  personajesObtenidos.push(personajesNoObtenidos[i]);
                  personajesNoObtenidos.splice(i, 1);
                  break;
                }
              };
            });
            personajesNoObtenidos.forEach(element => {
              actualizarCartas(element, 0);
            });
          }
        });
      login.classList.add("hide");
      menu.classList.remove("hide");
      document.getElementById("home").classList.add("outlined");
      cargarHome();
      Swal.fire({
        title: 'Do you want to play music?',
        showDenyButton: true,
        confirmButtonText: 'Yes',
        denyButtonText: 'No',
      }).then((result) => {
        if (result.isConfirmed) {
          music = true;
          audio.play();
        }});
    }, 1000)
  } else {
    login.classList.remove("hide");
    menu.classList.add("hide");
    homeContent.classList.remove("hide");
    battleContent.classList.add("hide");
    shopContent.classList.add("hide");
    myCardsContent.classList.add("hide");
  }
}


//funciones de cargado de los diferentes elementos de la página
function cargarHome() {
  if (datosUsuarioActual.victories == 0 && datosUsuarioActual.defeats == 0) {
    document.getElementById("statistics").innerHTML = `<h2>Statistics:</h2>
                                                        <h3 class="text">You dont have statistics yet</h3>`; 
  } else {
    document.getElementById("statistics").innerHTML = `<h2>Statistics:</h2>
                                                      <div id="graficaContainer">
                                                        <canvas id="grafica"></canvas>
                                                      </div>`;
    const grafica = document.getElementById('grafica');

    new Chart(grafica, {
      type: 'bar',
      data: {
        labels: ["Victories", "Defeats"],
        datasets: [{
          label: 'Battles',
          data: [datosUsuarioActual.victories, datosUsuarioActual.defeats],
          backgroundColor: 'rgba(0, 0, 255, 0.553)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  if (datosUsuarioActual.avatar != "") {
    document.querySelector("#avatar p").classList.add("hide");
    document.querySelector("#avatar img").src = `./assets/heros/${datosUsuarioActual.avatar}.png`;
  }
  document.getElementById("username1").innerHTML = datosUsuarioActual.user;
  document.getElementById("totalLevel").innerHTML = datosUsuarioActual.level.total;
  document.getElementById("cardsOwned").innerHTML = datosUsuarioActual.charactersOwned.length;
  document.getElementById("avatarSelector").innerHTML = "";
  datosUsuarioActual.charactersOwned.forEach(element => {
    document.getElementById("avatarSelector").innerHTML += `<option value="${element.name}">${element.name}</option>`;
  });
}

function cargardetalleShopContainer(carta) {
  document.getElementById("buy").remove();
  document.getElementById("infoShop").innerHTML += `<button id="buy" class="buttonGold button">Buy</button>`;
  document.getElementById("imgDetalle").innerHTML = carta.image;
  document.getElementById("generalShop").innerHTML = `<h3>${carta.name}</h3>
                                                    <p><b>Race: </b>${carta.race}</p>
                                                    <p><b>Gender: </b>${carta.gender}</p>
                                                    <p><b>Realm: </b>${carta.realm}</p>
                                                    <p><b>Height: </b>${carta.height}</p>`;
  document.getElementById("statisticsShop").innerHTML = `<h3>${carta.name}</h3>
                                                    <p><b>Attack: </b>${carta.attack}</p>
                                                    <p><b>Health: </b>${carta.maxHealth}</p>
                                                    <p><b>Attack recharge: </b>${carta.attackRecharge}</p>
                                                    <p><b>Special move recharge: </b>${carta.specialMoveRecharge}</p>
                                                    <p><b>Attack: </b>${carta.attackDescription}</p>
                                                    <p><b>Special move: </b>${carta.specialMoveDescription}</p>`;
  if (carta.name == "kingDead") {
    document.getElementById("generalShop").innerHTML = `<h3>King of the Dead</h3>
                                                    <p><b>Race: </b>${carta.race}</p>
                                                    <p><b>Gender: </b>${carta.gender}</p>
                                                    <p><b>Realm: </b>${carta.realm}</p>
                                                    <p><b>Height: </b>${carta.height}</p>`;
    document.getElementById("statisticsShop").innerHTML = `<h3>King of the Dead</h3>
                                                    <p><b>Attack: </b>${carta.attack}</p>
                                                    <p><b>Health: </b>${carta.maxHealth}</p>
                                                    <p><b>Attack recharge: </b>${carta.attackRecharge}</p>
                                                    <p><b>Special move recharge: </b>${carta.specialMoveRecharge}</p>
                                                    <p><b>Attack: </b>${carta.attackDescription}</p>
                                                    <p><b>Special move: </b>${carta.specialMoveDescription}</p>`;
  }
  if (carta.buy == "disabled") {
    document.getElementById("buy").disabled = true;
  } else {
    document.getElementById("buy").disabled = false;
  }
  document.getElementById("buy").addEventListener("click", function() {
    if (carta.card == "gold") {
      Swal.fire({
        title: 'Do you want to buy for 1000 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
          if (datosUsuarioActual.coins >= 1000) {
            datosUsuarioActual.coins -= 1000;
            let newCharacter = {
              name: carta.name,
              xp: 0
            };
            datosUsuarioActual.charactersOwned.push(newCharacter);
            personajesObtenidos.push(carta);
            const documentRef = db.collection("users").doc(datosUsuarioActual.id);
            documentRef.update({
              coins: datosUsuarioActual.coins,
              charactersOwned: datosUsuarioActual.charactersOwned
            });
            for (let i = 0; i < personajesNoObtenidos.length; i++) {
              if (personajesNoObtenidos[i].name == carta.name) {
                personajesNoObtenidos.splice(i, 1);
                break;
              }
            }
            document.getElementById("detalleShopContainer").classList.add("hide");
            document.getElementById("shopContainer").classList.remove("hide");
            cargarShop();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'You dont have 1000 coins',
            })
          }
      }});
    } else if (carta.card == "silver") {
      Swal.fire({
        title: 'Do you want to buy for 500 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
          if (datosUsuarioActual.coins >= 500) {
            datosUsuarioActual.coins -= 500;
            let newCharacter = {
              name: carta.name,
              xp: 0
            };
            datosUsuarioActual.charactersOwned.push(newCharacter);
            personajesObtenidos.push(carta);
            const documentRef = db.collection("users").doc(datosUsuarioActual.id);
            documentRef.update({
              coins: datosUsuarioActual.coins,
              charactersOwned: datosUsuarioActual.charactersOwned
            });
            for (let i = 0; i < personajesNoObtenidos.length; i++) {
              if (personajesNoObtenidos[i].name == carta.name) {
                personajesNoObtenidos.splice(i, 1);
                break;
              }
            }
            document.getElementById("detalleShopContainer").classList.add("hide");
            document.getElementById("shopContainer").classList.remove("hide");
            cargarShop();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'You dont have 500 coins',
            })
          }
      }});
    } else {
      Swal.fire({
        title: 'Do you want to buy for 250 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
          if (datosUsuarioActual.coins >= 250) {
            datosUsuarioActual.coins -= 250;
            let newCharacter = {
              name: carta.name,
              xp: 0
            };
            datosUsuarioActual.charactersOwned.push(newCharacter);
            personajesObtenidos.push(carta);
            const documentRef = db.collection("users").doc(datosUsuarioActual.id);
            documentRef.update({
              coins: datosUsuarioActual.coins,
              charactersOwned: datosUsuarioActual.charactersOwned
            });
            for (let i = 0; i < personajesNoObtenidos.length; i++) {
              if (personajesNoObtenidos[i].name == carta.name) {
                personajesNoObtenidos.splice(i, 1);
                break;
              }
            }
            document.getElementById("detalleShopContainer").classList.add("hide");
            document.getElementById("shopContainer").classList.remove("hide");
            cargarShop();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'You dont have 250 coins',
            })
          }
      }});
    }
  });
  document.getElementById("buttonsDetalleShop").innerHTML = `
    <button id="gInfo" class="blue button">General Info</button>
    <button id="statisticsButton" class="blue button">Statistics</button>`;
  let gInfo = document.getElementById("gInfo");
  gInfo.addEventListener("click", function() {
    document.getElementById("generalShop").classList.remove("hide");
    document.getElementById("statisticsShop").classList.add("hide");
    document.getElementById("gInfo").disabled = true;
    document.getElementById("statisticsButton").disabled = false;
  });
  let statisticsButton = document.getElementById("statisticsButton");
  statisticsButton.addEventListener("click", function() {
    document.getElementById("generalShop").classList.add("hide");
    document.getElementById("statisticsShop").classList.remove("hide");
    document.getElementById("gInfo").disabled = false;
    document.getElementById("statisticsButton").disabled = true;
  });
  let generalShop = document.getElementById("generalShop");
  let statisticsShop = document.getElementById("statisticsShop");
  if (generalShop.classList.contains("hide")) {
    gInfo.disabled = false;
  } else {
    gInfo.disabled = true;
  }
  if (statisticsShop.classList.contains("hide")) {
    statisticsButton.disabled = false;
  } else {
    statisticsButton.disabled = true;
  }
}

function cargarShop() {
  let cardsShop = document.getElementById("cardsShop");
  if (personajesNoObtenidos.length === 0) {
    cardsShop.innerHTML = `<h2 style="text-align: center;">Looks like you already have all the cards!</h2>`;
  } else {
    cardsShop.innerHTML = "";
    personajesNoObtenidos.forEach(element => {
      cardsShop.innerHTML += `<section id="shop${element.name}" class="shopCard"></section>`;
      document.getElementById(`shop${element.name}`).innerHTML = element.image;
    });
    personajesNoObtenidos.forEach(element => {
      document.getElementById(`shop${element.name}`).addEventListener("click", function() {
        document.getElementById("shopContainer").classList.add("hide");
        document.getElementById("detalleShopContainer").classList.remove("hide");
        cargardetalleShopContainer(element);
      });
    });
  }
  document.getElementById("amountShop").innerHTML = datosUsuarioActual.coins;
}

async function recargarDetalleMyCards(carta) {
  await actualizarCartas(carta, carta.xp);
  cargardetalleMyCardsContainer(carta);
}

function cargardetalleMyCardsContainer(carta) {
  document.getElementById("upgrade").remove();
  document.getElementById("infoMyCards").innerHTML += `<button id="upgrade" class="buttonGold button">Upgrade</button>`;
  document.getElementById("imgDetalleMyCards").innerHTML = carta.image;
  document.getElementById("generalMyCards").innerHTML = `<h3>${carta.name}</h3>
                                                    <p><b>Race: </b>${carta.race}</p>
                                                    <p><b>Gender: </b>${carta.gender}</p>
                                                    <p><b>Realm: </b>${carta.realm}</p>
                                                    <p><b>Height: </b>${carta.height}</p>`;
  document.getElementById("statisticsMyCards").innerHTML = `<h3>${carta.name}</h3>
                                                    <p><b>Attack: </b>${carta.attack}</p>
                                                    <p><b>Health: </b>${carta.maxHealth}</p>
                                                    <p><b>Attack recharge: </b>${carta.attackRecharge}</p>
                                                    <p><b>Special move recharge: </b>${carta.specialMoveRecharge}</p>
                                                    <p><b>Attack: </b>${carta.attackDescription}</p>
                                                    <p><b>Special move: </b>${carta.specialMoveDescription}</p>`;
  if (carta.name == "kingDead") {
    document.getElementById("generalMyCards").innerHTML = `<h3>King of the Dead</h3>
                                                    <p><b>Race: </b>${carta.race}</p>
                                                    <p><b>Gender: </b>${carta.gender}</p>
                                                    <p><b>Realm: </b>${carta.realm}</p>
                                                    <p><b>Height: </b>${carta.height}</p>`;
    document.getElementById("statisticsMyCards").innerHTML = `<h3>King of the Dead</h3>
                                                    <p><b>Attack: </b>${carta.attack}</p>
                                                    <p><b>Health: </b>${carta.maxHealth}</p>
                                                    <p><b>Attack recharge: </b>${carta.attackRecharge}</p>
                                                    <p><b>Special move recharge: </b>${carta.specialMoveRecharge}</p>
                                                    <p><b>Attack: </b>${carta.attackDescription}</p>
                                                    <p><b>Special move: </b>${carta.specialMoveDescription}</p>`;
  }
  if (carta.level == 10) {
    document.getElementById("upgrade").disabled = true;
  } else {
    document.getElementById("upgrade").disabled = false;
  }
  document.getElementById("upgrade").addEventListener("click", function() {
    if (carta.card == "gold") {
      Swal.fire({
        title: 'Do you want to upgrade for 600 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
          if (datosUsuarioActual.coins >= 600) {
            datosUsuarioActual.coins -= 600;
            carta.xp += 750;
            for (let i = 0; i < datosUsuarioActual.charactersOwned.length; i++) {
              if (datosUsuarioActual.charactersOwned[i].name == carta.name) {
                datosUsuarioActual.charactersOwned[i].xp = carta.xp;
                break;
              }
            }
            const documentRef = db.collection("users").doc(datosUsuarioActual.id);
            documentRef.update({
              coins: datosUsuarioActual.coins,
              charactersOwned: datosUsuarioActual.charactersOwned
            });
            document.getElementById("amountMyCards").innerHTML = datosUsuarioActual.coins;
            recargarDetalleMyCards(carta);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'You dont have 600 coins',
            })
          }
      }});
    } else if (carta.card == "silver") {
      Swal.fire({
        title: 'Do you want to upgrade for 300 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
          if (datosUsuarioActual.coins >= 300) {
            datosUsuarioActual.coins -= 300;
            carta.xp += 500;
            for (let i = 0; i < datosUsuarioActual.charactersOwned.length; i++) {
              if (datosUsuarioActual.charactersOwned[i].name == carta.name) {
                datosUsuarioActual.charactersOwned[i].xp = carta.xp;
                break;
              }
            }
            const documentRef = db.collection("users").doc(datosUsuarioActual.id);
            documentRef.update({
              coins: datosUsuarioActual.coins,
              charactersOwned: datosUsuarioActual.charactersOwned
            });
            document.getElementById("amountMyCards").innerHTML = datosUsuarioActual.coins;
            recargarDetalleMyCards(carta);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'You dont have 300 coins',
            })
          }
      }});
    } else {
      Swal.fire({
        title: 'Do you want to upgrade for 150 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
          if (datosUsuarioActual.coins >= 150) {
            datosUsuarioActual.coins -= 150;
            carta.xp += 250;
            for (let i = 0; i < datosUsuarioActual.charactersOwned.length; i++) {
              if (datosUsuarioActual.charactersOwned[i].name == carta.name) {
                datosUsuarioActual.charactersOwned[i].xp = carta.xp;
                break;
              }
            } 
            const documentRef = db.collection("users").doc(datosUsuarioActual.id);
            documentRef.update({
              coins: datosUsuarioActual.coins,
              charactersOwned: datosUsuarioActual.charactersOwned
            });
            document.getElementById("amountMyCards").innerHTML = datosUsuarioActual.coins;
            recargarDetalleMyCards(carta);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'You dont have 150 coins',
            })
          }
      }});
    }
  });
  document.getElementById("buttonsDetalleMyCards").innerHTML = `
    <button id="infoDetalle" class="blue button">General Info</button>
    <button id="statsDetalle" class="blue button">Statistics</button>`;
  let infoDetalle = document.getElementById("infoDetalle");
  infoDetalle.addEventListener("click", function() {
    document.getElementById("generalMyCards").classList.remove("hide");
    document.getElementById("statisticsMyCards").classList.add("hide");
    document.getElementById("infoDetalle").disabled = true;
    document.getElementById("statsDetalle").disabled = false;
  });
  let statsDetalle = document.getElementById("statsDetalle");
  statsDetalle.addEventListener("click", function() {
    document.getElementById("generalMyCards").classList.add("hide");
    document.getElementById("statisticsMyCards").classList.remove("hide");
    document.getElementById("infoDetalle").disabled = false;
    document.getElementById("statsDetalle").disabled = true;
  });
  let generalMyCards = document.getElementById("generalMyCards");
  let statisticsMyCards = document.getElementById("statisticsMyCards");
  if (generalMyCards.classList.contains("hide")) {
    infoDetalle.disabled = false;
  } else {
    infoDetalle.disabled = true;
  }
  if (statisticsMyCards.classList.contains("hide")) {
    statsDetalle.disabled = false;
  } else {
    statsDetalle.disabled = true;
  }
}

function cargarMyCards() {
  let cardsMyCards = document.getElementById("cardsMyCards");
  if (personajesObtenidos.length === 0) {
    cardsMyCards.innerHTML = `<h2 style="text-align: center;">You dont have cards yet!</h2>`;
  } else {
    cardsMyCards.innerHTML = "";
    personajesObtenidos.forEach(element => {
      cardsMyCards.innerHTML += `<section id="myCards${element.name}" class="myCard"></section>`;
      document.getElementById(`myCards${element.name}`).innerHTML = element.image;
    });
    personajesObtenidos.forEach(element => {
      document.getElementById(`myCards${element.name}`).addEventListener("click", function() {
        document.getElementById("myCardsContainer").classList.add("hide");
        document.getElementById("detalleMyCardsContainer").classList.remove("hide");
        cargardetalleMyCardsContainer(element);
      });
    });
  }
  document.getElementById("amountMyCards").innerHTML = datosUsuarioActual.coins;
  document.getElementById("characters").innerHTML = "";
  personajesObtenidos.forEach(element => {
    document.getElementById("characters").innerHTML += `
      <option value="${element.name}"></option>`;
  });
}

function cargarMoria() {
  if (mapMoria) {
    mapMoria.remove();
  }
  mapMoria = L.map('mapaMoria', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-400, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/moriaMap.jpg', [
    [0, 0], 
    [-400, 300] 
  ]).addTo(mapMoria);
  
  mapMoria.fitBounds([
    [0, 0], 
    [-400, 300] 
  ]);

  mapMoria.setView([-60, 25], 2.5);

  const moria1Icon = L.icon({
    iconUrl: './assets/scenaries/moria.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const moria1Marker = L.marker([-60, 25], { icon: moria1Icon }).bindPopup("1: The Gate", { offset: [0, -10] }).addTo(mapMoria);
  moria1Marker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      battleMoria1();
    }});
  });
  moria1Marker.on('mouseover', function () {
    moria1Marker.openPopup();
  });

  const balinsTombIcon = L.icon({
    iconUrl: './assets/scenaries/balinsTomb.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const balinsTombMarker = L.marker([-66, 92], { icon: balinsTombIcon }).bindPopup("2: Balin's Tomb", { offset: [0, -10] }).addTo(mapMoria);
  balinsTombMarker.on('click', function() {
    if (datosUsuarioActual.level.moria < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 40 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 40) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 40 coins',
          })
        } else {
          datosUsuarioActual.coins -= 40;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Moria2";
          scenario = "balinsTomb";
          battleFunction(battle, [{name: "Goblin1",level: 3,rank: "bronze"},
                                  {name: "Goblin2",level: 3,rank: "bronze"},
                                  {name: "Goblin3",level: 3,rank: "bronze"}]);
        }
      }});
    }
  });
  balinsTombMarker.on('mouseover', function () {
    balinsTombMarker.openPopup();
  });

  const caveTrollMarker = L.marker([-68, 88], { icon: balinsTombIcon }).bindPopup("3: The cave Troll", { offset: [0, -10] }).addTo(mapMoria);
  caveTrollMarker.on('click', function() {
    if (datosUsuarioActual.level.moria < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 45 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 45) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 45 coins',
          })
        } else {
          datosUsuarioActual.coins -= 45;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Moria3";
          scenario = "caveTroll";
          battleFunction(battle, [{name: "caveTroll",level: 7,rank: "silver"},
                                  {name: "Goblin2",level: 4,rank: "bronze"},
                                  {name: "Goblin3",level: 4,rank: "bronze"}]);
        }
      }});
    }
  });
  caveTrollMarker.on('mouseover', function () {
    caveTrollMarker.openPopup();
  });

  const hallIcon = L.icon({
    iconUrl: './assets/scenaries/hallMoria.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const hallMarker = L.marker([-62, 120], { icon: hallIcon }).bindPopup("4: The great Hall", { offset: [0, -10] }).addTo(mapMoria);
  hallMarker.on('click', function() {
    if (datosUsuarioActual.level.moria < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 50 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 50) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 50 coins',
          })
        } else {
          datosUsuarioActual.coins -= 50;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Moria4";
          scenario = "Hall";
          battleFunction(battle, [{name: "LeaderGoblin",level: 4,rank: "silver"},
                                  {name: "Goblin1",level: 1,rank: "silver"},
                                  {name: "Goblin2",level: 1,rank: "silver"}]);
        }
      }});
    }
  });
  hallMarker.on('mouseover', function () {
    hallMarker.openPopup();
  });

  const stairsIcon = L.icon({
    iconUrl: './assets/scenaries/stairs.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const stairsMarker = L.marker([-70, 180], { icon: stairsIcon }).bindPopup("5: The Stairs", { offset: [0, -10] }).addTo(mapMoria);
  stairsMarker.on('click', function() {
    if (datosUsuarioActual.level.moria < 4) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 55 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 55) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 55 coins',
          })
        } else {
          datosUsuarioActual.coins -= 55;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Moria5";
          scenario = "stairs";
          battleFunction(battle, [{name: "archerGoblin",level: 4,rank: "silver"},
                                  {name: "Goblin1",level: 3,rank: "silver"},
                                  {name: "Goblin3",level: 3,rank: "silver"}]);
        }
      }});
    }
  });
  stairsMarker.on('mouseover', function () {
    stairsMarker.openPopup();
  });

  const bridgeIcon = L.icon({
    iconUrl: './assets/scenaries/bridge.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const bridgeMarker = L.marker([-71, 262], { icon: bridgeIcon }).bindPopup("6: The Bridge of Khazad Dum", { offset: [0, -10] }).addTo(mapMoria);
  bridgeMarker.on('click', function() {
    if (datosUsuarioActual.level.moria < 5) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 60 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 60) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 60 coins',
          })
        } else {
          datosUsuarioActual.coins -= 60;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Moria6";
          scenario = "Balrog";
          battleFunction(battle, [{name: "Balrog",level: 5,rank: "gold"},
                                  {name: "archerGoblin",level: 7,rank: "bronze"},
                                  {name: "Goblin2",level: 7,rank: "bronze"}]);
        }
      }});
    }
  });
  bridgeMarker.on('mouseover', function () {
    bridgeMarker.openPopup();
  });

  mapMoria.on('zoomend', function () {
    const currentZoom = mapMoria.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.5));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    moria1Icon.options.iconSize = newSize;
    moria1Icon.options.iconAnchor = newAnchor;
    balinsTombIcon.options.iconSize = newSize;
    balinsTombIcon.options.iconAnchor = newAnchor;
    hallIcon.options.iconSize = newSize;
    hallIcon.options.iconAnchor = newAnchor;
    stairsIcon.options.iconSize = newSize;
    stairsIcon.options.iconAnchor = newAnchor;
    bridgeIcon.options.iconSize = newSize;
    bridgeIcon.options.iconAnchor = newAnchor;

    moria1Marker.setIcon(moria1Icon);
    balinsTombMarker.setIcon(balinsTombIcon);
    caveTrollMarker.setIcon(balinsTombIcon);
    hallMarker.setIcon(hallIcon);
    stairsMarker.setIcon(stairsIcon);
    bridgeMarker.setIcon(bridgeIcon);
  });
}

function cargarAmonHen() {
  if (mapAmonHen) {
    mapAmonHen.remove();
  }
  mapAmonHen = L.map('mapaAmonHen', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-1000, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/amonHenMap.png', [
    [0, 0], 
    [-1000, 300] 
  ]).addTo(mapAmonHen);
  
  mapAmonHen.fitBounds([
    [0, 0], 
    [-1000, 300] 
  ]);

  mapAmonHen.setView([-40, 170], 2.5);

  const nazgulIcon = L.icon({
    iconUrl: './assets/scenaries/Nazgul.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const nazgulMarker = L.marker([-40, 170], { icon: nazgulIcon }).bindPopup("1: The Nazgul", { offset: [0, -10] }).addTo(mapAmonHen);
  nazgulMarker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle for 100 coins?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      if (datosUsuarioActual.coins < 100) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You dont have 100 coins',
        })
      } else {
        datosUsuarioActual.coins -= 100;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          coins: datosUsuarioActual.coins
        });
        battle = "AmonHen1";
        scenario = "Nazgul";
        battleFunction(battle, [{name: "Nazgul",level: 5,rank: "gold"}]);
      }
    }});
  });
  nazgulMarker.on('mouseover', function () {
    nazgulMarker.openPopup();
  });

  const urukHaiIcon = L.icon({
    iconUrl: './assets/scenaries/urukHai.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const urukHaiMarker = L.marker([-58, 145], { icon: urukHaiIcon }).bindPopup("2: The Uruk-Hai", { offset: [0, -10] }).addTo(mapAmonHen);
  urukHaiMarker.on('click', function() {
    if (datosUsuarioActual.level.amonHen < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 110 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 110) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 110 coins',
          })
        } else {
          datosUsuarioActual.coins -= 110;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "AmonHen2";
          scenario = "uruk-Hai";
          battleFunction(battle, [{name: "urukHai1",level: 7,rank: "bronze"},
                                  {name: "urukHai2",level: 7,rank: "bronze"},
                                  {name: "urukHai3",level: 7,rank: "bronze"}]);
        }
      }});
    }
  });
  urukHaiMarker.on('mouseover', function () {
    urukHaiMarker.openPopup();
  });

  const amonHenIcon = L.icon({
    iconUrl: './assets/scenaries/amonHen.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });

  const amonHenMarker = L.marker([-64, 149], { icon: amonHenIcon }).bindPopup("3: Amon Hen", { offset: [0, -10] }).addTo(mapAmonHen);
  amonHenMarker.on('click', function() {
    if (datosUsuarioActual.level.amonHen < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 120 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 120) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 120 coins',
          })
        } else {
          datosUsuarioActual.coins -= 120;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "AmonHen3";
          scenario = "AmonHen";
          battleFunction(battle, [{name: "Ugluk",level: 5,rank: "silver"},
                                  {name: "urukHai1",level: 7,rank: "bronze"},
                                  {name: "urukHai4",level: 7,rank: "bronze"}]);
        }
      }});
    }
  });
  amonHenMarker.on('mouseover', function () {
    amonHenMarker.openPopup();
  });

  const LurtzIcon = L.icon({
    iconUrl: './assets/scenaries/Lurtz.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const LurtzMarker = L.marker([-69, 156], { icon: LurtzIcon }).bindPopup("4: Lurtz", { offset: [0, -10] }).addTo(mapAmonHen);
  LurtzMarker.on('click', function() {
    if (datosUsuarioActual.level.amonHen < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 130 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 130) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 130 coins',
          })
        } else {
          datosUsuarioActual.coins -= 130;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "AmonHen4";
          scenario = "Lurtz";
          battleFunction(battle, [{name: "Lurtz",level: 5,rank: "gold"},
                                  {name: "Ugluk",level: 4,rank: "silver"},
                                  {name: "urukHai4",level: 7,rank: "bronze"}]);
        }
      }});
    }
  });
  LurtzMarker.on('mouseover', function () {
    LurtzMarker.openPopup();
  });

  mapAmonHen.on('zoomend', function () {
    const currentZoom = mapAmonHen.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.5));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    nazgulIcon.options.iconSize = newSize;
    nazgulIcon.options.iconAnchor = newAnchor;
    urukHaiIcon.options.iconSize = newSize;
    urukHaiIcon.options.iconAnchor = newAnchor;
    amonHenIcon.options.iconSize = newSize;
    amonHenIcon.options.iconAnchor = newAnchor;
    LurtzIcon.options.iconSize = newSize;
    LurtzIcon.options.iconAnchor = newAnchor;

    nazgulMarker.setIcon(nazgulIcon);
    urukHaiMarker.setIcon(urukHaiIcon);
    amonHenMarker.setIcon(amonHenIcon);
    LurtzMarker.setIcon(LurtzIcon);
  })
}

function cargarWargs() {
  if (mapWargs) {
    mapWargs.remove();
  }
  mapWargs = L.map('mapaWargs', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-400, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/Rohan_map.jpg', [
    [0, 0], 
    [-400, 300] 
  ]).addTo(mapWargs);
  
  mapWargs.fitBounds([
    [0, 0], 
    [-400, 300] 
  ]);

  mapWargs.setView([-77, 105], 2.5);

  const wargRidersIcon = L.icon({
    iconUrl: './assets/scenaries/wargRiders.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const wargRidersMarker = L.marker([-77, 105], { icon: wargRidersIcon }).bindPopup("1: The Ambush", { offset: [0, -10] }).addTo(mapWargs);
  wargRidersMarker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle for 160 coins?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      if (datosUsuarioActual.coins < 160) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You dont have 160 coins',
        })
      } else {
        datosUsuarioActual.coins -= 160;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          coins: datosUsuarioActual.coins
        });
        battle = "Wargs1";
        scenario = "ambush";
        battleFunction(battle, [{name: "WargRider2",level: 4,rank: "silver"},
                                  {name: "WargRider1",level: 10,rank: "bronze"},
                                  {name: "Warg1",level: 10,rank: "bronze"}]);
      }
    }});
  });
  wargRidersMarker.on('mouseover', function () {
    wargRidersMarker.openPopup();
  });

  const wargsIcon = L.icon({
    iconUrl: './assets/scenaries/wargs.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const wargsMarker = L.marker([-78, 91], { icon: wargsIcon }).bindPopup("2: Wargs", { offset: [0, -10] }).addTo(mapWargs);
  wargsMarker.on('click', function() {
    if (datosUsuarioActual.level.wargs < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 180 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 180) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 180 coins',
          })
        } else {
          datosUsuarioActual.coins -= 180;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Wargs2";
          scenario = "wargs1";
          battleFunction(battle, [{name: "Warg2",level: 7,rank: "silver"},
                                  {name: "Warg1",level: 4,rank: "silver"},
                                  {name: "WargRider1",level: 8,rank: "bronze"}]);
        }
      }});
    }
  });
  wargsMarker.on('mouseover', function () {
    wargsMarker.openPopup();
  });

  const wargsLeaderIcon = L.icon({
    iconUrl: './assets/scenaries/wargLeader.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });

  const wargsLeaderMarker = L.marker([-78, 79], { icon: wargsLeaderIcon }).bindPopup("3: Wargs Leader", { offset: [0, -10] }).addTo(mapWargs);
  wargsLeaderMarker.on('click', function() {
    if (datosUsuarioActual.level.wargs < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 200 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 200) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 200 coins',
          })
        } else {
          datosUsuarioActual.coins -= 200;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Wargs3";
          scenario = "wargLeader";
          battleFunction(battle, [{name: "WargLeader",level: 6,rank: "gold"},
                                  {name: "Warg2",level: 5,rank: "silver"},
                                  {name: "WargRider2",level: 5,rank: "silver"}]);
        }
      }});
    }
  });
  wargsLeaderMarker.on('mouseover', function () {
    wargsLeaderMarker.openPopup();
  });

  mapWargs.on('zoomend', function () {
    const currentZoom = mapWargs.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.5));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    wargRidersIcon.options.iconSize = newSize;
    wargRidersIcon.options.iconAnchor = newAnchor;
    wargsIcon.options.iconSize = newSize;
    wargsIcon.options.iconAnchor = newAnchor;
    wargsLeaderIcon.options.iconSize = newSize;
    wargsLeaderIcon.options.iconAnchor = newAnchor;

    wargRidersMarker.setIcon(wargRidersIcon);
    wargsMarker.setIcon(wargsIcon);
    wargsLeaderMarker.setIcon(wargsLeaderIcon);
  });
}

function cargarHelmsDeep() {
  if (mapHelmsDeep) {
    mapHelmsDeep.remove();
  }
  mapHelmsDeep = L.map('mapaHelmsDeep', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-1000, 200]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/HelmsDeepMap.jpg', [
    [0, 0], 
    [-1000, 200] 
  ]).addTo(mapHelmsDeep);
  
  mapHelmsDeep.fitBounds([
    [0, 0], 
    [-1000, 200] 
  ]);

  mapHelmsDeep.setView([-40, 80], 2.5);

  const arrivalIcon = L.icon({
    iconUrl: './assets/scenaries/arrival.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const arrivalMarker = L.marker([-40, 120], { icon: arrivalIcon }).bindPopup("1: The Arrival", { offset: [0, -10] }).addTo(mapHelmsDeep);
  arrivalMarker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle for 180 coins?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      if (datosUsuarioActual.coins < 180) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You dont have 180 coins',
        })
      } else {
        datosUsuarioActual.coins -= 180;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          coins: datosUsuarioActual.coins
        });
        battle = "HelmsDeep1";
        scenario = "arrival";
        battleFunction(battle, [{name: "urukHai5",level: 6,rank: "silver"},
                                  {name: "archer",level: 4,rank: "silver"},
                                  {name: "crossbow",level: 4,rank: "silver"}]);
      }
    }});
  });
  arrivalMarker.on('mouseover', function () {
    arrivalMarker.openPopup();
  });

  const laddersIcon = L.icon({
    iconUrl: './assets/scenaries/ladders.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const laddersMarker = L.marker([-64, 145], { icon: laddersIcon }).bindPopup("2: The ladders", { offset: [0, -10] }).addTo(mapHelmsDeep);
  laddersMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 210 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 210) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 210 coins',
          })
        } else {
          datosUsuarioActual.coins -= 210;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep2";
          scenario = "ladders";
          battleFunction(battle, [{name: "Berserker1",level: 10,rank: "silver"},
                                  {name: "urukHai6",level: 5,rank: "silver"},
                                  {name: "urukHai7",level: 5,rank: "silver"}]);
        }
      }});
    }
  });
  laddersMarker.on('mouseover', function () {
    laddersMarker.openPopup();
  });

  const bombIcon = L.icon({
    iconUrl: './assets/scenaries/Bomb.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });

  const bombMarker = L.marker([-62, 120], { icon: bombIcon }).bindPopup("3: The bomb", { offset: [0, -10] }).addTo(mapHelmsDeep);
  bombMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 240 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 240) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 240 coins',
          })
        } else {
          datosUsuarioActual.coins -= 240;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep3";
          scenario = "bomb";
          battleFunction(battle, [{name: "Berserker3",level: 10,rank: "silver"},
                                  {name: "crossbow",level: 7,rank: "silver"},
                                  {name: "urukHai8",level: 7,rank: "silver"}]);
        }
      }});
    }
  });
  bombMarker.on('mouseover', function () {
    bombMarker.openPopup();
  });

  const breachIcon = L.icon({
    iconUrl: './assets/scenaries/breach.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const breachMarker = L.marker([-68, 115], { icon: breachIcon }).bindPopup("4: The breach in the wall", { offset: [0, -10] }).addTo(mapHelmsDeep);
  breachMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 270 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 270) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 270 coins',
          })
        } else {
          datosUsuarioActual.coins -= 270;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep4";
          scenario = "breach";
          battleFunction(battle, [{name: "Captain",level: 10,rank: "silver"},
                                  {name: "urukHai9",level: 8,rank: "silver"},
                                  {name: "spearman",level: 8,rank: "silver"}]);
        }
      }});
    }
  });
  breachMarker.on('mouseover', function () {
    breachMarker.openPopup();
  });

  const batteringRamIcon = L.icon({
    iconUrl: './assets/scenaries/batteringRam.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const batteringRamMarker = L.marker([-55, 65], { icon: batteringRamIcon }).bindPopup("5: The battering Ram", { offset: [0, -10] }).addTo(mapHelmsDeep);
  batteringRamMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 4) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 300 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 300) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 300 coins',
          })
        } else {
          datosUsuarioActual.coins -= 300;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep5";
          scenario = "batteringRam";
          battleFunction(battle, [{name: "BatteringRam",level: 5,rank: "gold"},
                                  {name: "urukHai5",level: 7,rank: "silver"},
                                  {name: "urukHai6",level: 7,rank: "silver"}]);
        }
      }});
    }
  });
  batteringRamMarker.on('mouseover', function () {
    batteringRamMarker.openPopup();
  });

  const chargeIcon = L.icon({
    iconUrl: './assets/scenaries/charge.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const chargeMarker = L.marker([-67, 60], { icon: chargeIcon }).bindPopup("6: Forth Eorlingas", { offset: [0, -10] }).addTo(mapHelmsDeep);
  chargeMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 5) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 330 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 330) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 330 coins',
          })
        } else {
          datosUsuarioActual.coins -= 330;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep6";
          scenario = "charge";
          battleFunction(battle, [{name: "Captain",level: 10,rank: "silver"},
                                  {name: "Berserker2",level: 9,rank: "silver"},
                                  {name: "urukHai8",level: 8,rank: "silver"}]);
        }
      }});
    }
  });
  chargeMarker.on('mouseover', function () {
    chargeMarker.openPopup();
  });

  const reinforcementIcon = L.icon({
    iconUrl: './assets/scenaries/reinforcements.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const reinforcementMarker = L.marker([-50, 175], { icon: reinforcementIcon }).bindPopup("7: Reinforcements", { offset: [0, -10] }).addTo(mapHelmsDeep);
  reinforcementMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 360 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 360) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 330 coins',
          })
        } else {
          datosUsuarioActual.coins -= 360;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep7";
          scenario = "reinforcement";
          battleFunction(battle, [{name: "Mog",level: 6,rank: "gold"},
                                  {name: "urukHai9",level: 9,rank: "silver"},
                                  {name: "spearman",level: 9,rank: "silver"}]);
        }
      }});
    }
  });
  reinforcementMarker.on('mouseover', function () {
    reinforcementMarker.openPopup();
  });

  const isengardIcon = L.icon({
    iconUrl: './assets/scenaries/Isengard.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const isengardMarker = L.marker([-20, 40], { icon: isengardIcon }).bindPopup("8: Isengard", { offset: [0, -10] }).addTo(mapHelmsDeep);
  isengardMarker.on('click', function() {
    if (datosUsuarioActual.level.helmsDeep < 7) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 390 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 390) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 390 coins',
          })
        } else {
          datosUsuarioActual.coins -= 390;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "HelmsDeep8";
          scenario = "isengard";
          battleFunction(battle, [{name: "Saruman",level: 7,rank: "gold"},
                                  {name: "Grima",level: 5,rank: "gold"},
                                  {name: "archer",level: 7,rank: "silver"}]);
        }
      }});
    }
  });
  isengardMarker.on('mouseover', function () {
    isengardMarker.openPopup();
  });

  mapHelmsDeep.on('zoomend', function () {
    const currentZoom = mapHelmsDeep.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.5));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    arrivalIcon.options.iconSize = newSize;
    arrivalIcon.options.iconAnchor = newAnchor;
    laddersIcon.options.iconSize = newSize;
    laddersIcon.options.iconAnchor = newAnchor;
    bombIcon.options.iconSize = newSize;
    bombIcon.options.iconAnchor = newAnchor;
    breachIcon.options.iconSize = newSize;
    breachIcon.options.iconAnchor = newAnchor;
    batteringRamIcon.options.iconSize = newSize;
    batteringRamIcon.options.iconAnchor = newAnchor;
    chargeIcon.options.iconSize = newSize;
    chargeIcon.options.iconAnchor = newAnchor;
    reinforcementIcon.options.iconSize = newSize;
    reinforcementIcon.options.iconAnchor = newAnchor;
    isengardIcon.options.iconSize = newSize;
    isengardIcon.options.iconAnchor = newAnchor;

    arrivalMarker.setIcon(arrivalIcon);
    laddersMarker.setIcon(laddersIcon);
    bombMarker.setIcon(bombIcon);
    breachMarker.setIcon(breachIcon);
    batteringRamMarker.setIcon(batteringRamIcon);
    chargeMarker.setIcon(chargeIcon);
    reinforcementMarker.setIcon(reinforcementIcon);
    isengardMarker.setIcon(isengardIcon);
  });
}

function cargarOsgiliath() {
  if (mapOsgiliath) {
    mapOsgiliath.remove();
  }
  mapOsgiliath = L.map('mapaOsgiliath', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-400, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/osgiliathMap.jpg', [
    [0, 0], 
    [-400, 300] 
  ]).addTo(mapOsgiliath);
  
  mapOsgiliath.fitBounds([
    [0, 0], 
    [-400, 300] 
  ]);

  mapOsgiliath.setView([-50, 120], 2.5);

  const attackRiverIcon = L.icon({
    iconUrl: './assets/scenaries/river.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const attackRiverMarker = L.marker([-50, 120], { icon: attackRiverIcon }).bindPopup("1: Attack from the river", { offset: [0, -10] }).addTo(mapOsgiliath);
  attackRiverMarker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle for 300 coins?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      if (datosUsuarioActual.coins < 300) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You dont have 300 coins',
        })
      } else {
        datosUsuarioActual.coins -= 300;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          coins: datosUsuarioActual.coins
        });
        battle = "Osgiliath1";
        scenario = "river";
        battleFunction(battle, [{name: "orcMordor1",level: 5,rank: "gold"},
                                  {name: "orcMordor2",level: 3,rank: "gold"},
                                  {name: "archerMordor1",level: 3,rank: "gold"}]);
      }
    }});
  });
  attackRiverMarker.on('mouseover', function () {
    attackRiverMarker.openPopup();
  });

  const battleIcon = L.icon({
    iconUrl: './assets/scenaries/battleOsgiliath.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const battleMarker = L.marker([-47, 68], { icon: battleIcon }).bindPopup("2: The battle of Osgiliath", { offset: [0, -10] }).addTo(mapOsgiliath);
  battleMarker.on('click', function() {
    if (datosUsuarioActual.level.osgiliath < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 340 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 340) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 340 coins',
          })
        } else {
          datosUsuarioActual.coins -= 340;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Osgiliath2";
          scenario = "battleOsgiliath";
          battleFunction(battle, [{name: "orcMordor4",level: 6,rank: "gold"},
                                  {name: "orcMordor3",level: 4,rank: "gold"},
                                  {name: "orcMordor5",level: 4,rank: "gold"}]);
        }
      }});
    }
  });
  battleMarker.on('mouseover', function () {
    battleMarker.openPopup();
  });

  const retreatIcon = L.icon({
    iconUrl: './assets/scenaries/Nazgul.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });

  const retreatMarker = L.marker([-50, 15], { icon: retreatIcon }).bindPopup("3: Retreat", { offset: [0, -10] }).addTo(mapOsgiliath);
  retreatMarker.on('click', function() {
    if (datosUsuarioActual.level.osgiliath < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 380 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 380) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 380 coins',
          })
        } else {
          datosUsuarioActual.coins -= 380;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "Osgiliath3";
          scenario = "retreat";
          battleFunction(battle, [{name: "Nazgul",level: 10,rank: "gold"}]);
        }
      }});
    }
  });
  retreatMarker.on('mouseover', function () {
    retreatMarker.openPopup();
  });

  mapOsgiliath.on('zoomend', function () {
    const currentZoom = mapOsgiliath.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.5));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    attackRiverIcon.options.iconSize = newSize;
    attackRiverIcon.options.iconAnchor = newAnchor;
    battleIcon.options.iconSize = newSize;
    battleIcon.options.iconAnchor = newAnchor;
    retreatIcon.options.iconSize = newSize;
    retreatIcon.options.iconAnchor = newAnchor;

    attackRiverMarker.setIcon(attackRiverIcon);
    battleMarker.setIcon(battleIcon);
    retreatMarker.setIcon(retreatIcon);
  });
}

function cargarMinasTirith() {
  if (mapMinasTirith) {
    mapMinasTirith.remove();
  }
  mapMinasTirith = L.map('mapaMinasTirith', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-400, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/Minas-TirithMap.jpg', [
    [0, 0], 
    [-400, 300] 
  ]).addTo(mapMinasTirith);
  
  mapMinasTirith.fitBounds([
    [0, 0], 
    [-400, 300] 
  ]);

  mapMinasTirith.setView([-73, 195], 2.5);

  const siegueTowerIcon = L.icon({
    iconUrl: './assets/scenaries/siegueTower.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const siegueTowerMarker = L.marker([-73, 195], { icon: siegueTowerIcon }).bindPopup("1: Siegue Towers", { offset: [0, -10] }).addTo(mapMinasTirith);
  siegueTowerMarker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle for 350 coins?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      if (datosUsuarioActual.coins < 350) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You dont have 350 coins',
        })
      } else {
        datosUsuarioActual.coins -= 350;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          coins: datosUsuarioActual.coins
        });
        battle = "MinasTirith1";
        scenario = "siegueTower";
        battleFunction(battle, [{name: "Troll",level: 6,rank: "gold"},
                                  {name: "archerMordor1",level: 4,rank: "gold"},
                                  {name: "archerMordor2",level: 4,rank: "gold"}]);
      }
    }});
  });
  siegueTowerMarker.on('mouseover', function () {
    siegueTowerMarker.openPopup();
  });

  const wallsIcon = L.icon({
    iconUrl: './assets/scenaries/walls.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const wallsMarker = L.marker([-73, 155], { icon: wallsIcon }).bindPopup("2: Defending the walls", { offset: [0, -10] }).addTo(mapMinasTirith);
  wallsMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 400 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 400) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 400 coins',
          })
        } else {
          datosUsuarioActual.coins -= 400;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith2";
          scenario = "walls";
          battleFunction(battle, [{name: "orcMordor8",level: 7,rank: "gold"},
                                  {name: "orcMordor6",level: 5,rank: "gold"},
                                  {name: "orcMordor7",level: 5,rank: "gold"}]);
        }
      }});
    }
  });
  wallsMarker.on('mouseover', function () {
    wallsMarker.openPopup();
  });

  const grondIcon = L.icon({
    iconUrl: './assets/scenaries/Grond.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });

  const grondMarker = L.marker([-65, 185], { icon: grondIcon }).bindPopup("3: Grond", { offset: [0, -10] }).addTo(mapMinasTirith);
  grondMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 450 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 450) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 450 coins',
          })
        } else {
          datosUsuarioActual.coins -= 450;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith3";
          scenario = "grond";
          battleFunction(battle, [{name: "Grond",level: 10,rank: "gold"},
                                  {name: "orcMordor1",level: 5,rank: "gold"},
                                  {name: "archerMordor2",level: 5,rank: "gold"}]);
        }
      }});
    }
  });
  grondMarker.on('mouseover', function () {
    grondMarker.openPopup();
  });

  const gateIcon = L.icon({
    iconUrl: './assets/scenaries/Gate.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const gateMarker = L.marker([-65, 164], { icon: gateIcon }).bindPopup("4: Defending the gate", { offset: [0, -10] }).addTo(mapMinasTirith);
  gateMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 500 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 500) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 500 coins',
          })
        } else {
          datosUsuarioActual.coins -= 500;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith4";
          scenario = "gate";
          battleFunction(battle, [{name: "armoredTroll",level: 8,rank: "gold"},
                                  {name: "orcMordor6",level: 6,rank: "gold"},
                                  {name: "orcMordor3",level: 6,rank: "gold"}]);
        }
      }});
    }
  });
  gateMarker.on('mouseover', function () {
    gateMarker.openPopup();
  });

  const rohirrimIcon = L.icon({
    iconUrl: './assets/scenaries/rohirrim.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const rohirrimMarker = L.marker([-50, 195], { icon: rohirrimIcon }).bindPopup("5: The Rohirrim", { offset: [0, -10] }).addTo(mapMinasTirith);
  rohirrimMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 4) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 550 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 550) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 550 coins',
          })
        } else {
          datosUsuarioActual.coins -= 550;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith5";
          scenario = "rohirrim";
          battleFunction(battle, [{name: "orcMordor11",level: 7,rank: "gold"},
                                  {name: "orcMordor9",level: 7,rank: "gold"},
                                  {name: "orcMordor10",level: 7,rank: "gold"}]);
        }
      }});
    }
  });
  rohirrimMarker.on('mouseover', function () {
    rohirrimMarker.openPopup();
  });

  const mumakilIcon = L.icon({
    iconUrl: './assets/scenaries/mumakil.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const mumakilMarker = L.marker([-60, 215], { icon: mumakilIcon }).bindPopup("6: The Mumakils", { offset: [0, -10] }).addTo(mapMinasTirith);
  mumakilMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 5) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 600 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 600) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 600 coins',
          })
        } else {
          datosUsuarioActual.coins -= 600;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith6";
          scenario = "mumakil";
          battleFunction(battle, [{name: "mumakil",level: 10,rank: "gold"},
                                  {name: "Mahud",level: 7,rank: "gold"},
                                  {name: "archerHaradrim",level: 7,rank: "gold"}]);
        }
      }});
    }
  });
  mumakilMarker.on('mouseover', function () {
    mumakilMarker.openPopup();
  });

  const portIcon = L.icon({
    iconUrl: './assets/scenaries/port.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const portMarker = L.marker([-84, 155], { icon: portIcon }).bindPopup("7: Harlond Port", { offset: [0, -10] }).addTo(mapMinasTirith);
  portMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 650 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 650) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 650 coins',
          })
        } else {
          datosUsuarioActual.coins -= 650;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith7";
          scenario = "port";
          battleFunction(battle, [{name: "Guritz",level: 10,rank: "gold"},
                                  {name: "orcMordor9",level: 8,rank: "gold"},
                                  {name: "orcMordor10",level: 7,rank: "gold"}]);
        }
      }});
    }
  });
  portMarker.on('mouseover', function () {
    portMarker.openPopup();
  });

  const witchKingIcon = L.icon({
    iconUrl: './assets/scenaries/witchKing.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const witchKingMarker = L.marker([-62, 200], { icon: witchKingIcon }).bindPopup("8: The Witch King", { offset: [0, -10] }).addTo(mapMinasTirith);
  witchKingMarker.on('click', function() {
    if (datosUsuarioActual.level.minasTirith < 7) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 700 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 700) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 700 coins',
          })
        } else {
          datosUsuarioActual.coins -= 700;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "MinasTirith8";
          scenario = "witchKing";
          battleFunction(battle, [{name: "witchKing",level: 10,rank: "gold"},
                                  {name: "Gothmog",level: 9,rank: "gold"},
                                  {name: "archerHaradrim",level: 8,rank: "gold"}]);
        }
      }});
    }
  });
  witchKingMarker.on('mouseover', function () {
    witchKingMarker.openPopup();
  });

  mapMinasTirith.on('zoomend', function () {
    const currentZoom = mapMinasTirith.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.3));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    siegueTowerIcon.options.iconSize = newSize;
    siegueTowerIcon.options.iconAnchor = newAnchor;
    wallsIcon.options.iconSize = newSize;
    wallsIcon.options.iconAnchor = newAnchor;
    grondIcon.options.iconSize = newSize;
    grondIcon.options.iconAnchor = newAnchor;
    gateIcon.options.iconSize = newSize;
    gateIcon.options.iconAnchor = newAnchor;
    rohirrimIcon.options.iconSize = newSize;
    rohirrimIcon.options.iconAnchor = newAnchor;
    mumakilIcon.options.iconSize = newSize;
    mumakilIcon.options.iconAnchor = newAnchor;
    portIcon.options.iconSize = newSize;
    portIcon.options.iconAnchor = newAnchor;
    witchKingIcon.options.iconSize = newSize;
    witchKingIcon.options.iconAnchor = newAnchor;

    siegueTowerMarker.setIcon(siegueTowerIcon);
    wallsMarker.setIcon(wallsIcon);
    grondMarker.setIcon(grondIcon);
    gateMarker.setIcon(gateIcon);
    rohirrimMarker.setIcon(rohirrimIcon);
    mumakilMarker.setIcon(mumakilIcon);
    portMarker.setIcon(portIcon);
    witchKingMarker.setIcon(witchKingIcon);
  });
}

function cargarBlackGate() {
  if (mapBlackGate) {
    mapBlackGate.remove();
  }
  mapBlackGate = L.map('mapaBlackGate', {
    maxZoom: 3, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-400, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/BlackGateMap.jpg', [
    [0, 0], 
    [-400, 300] 
  ]).addTo(mapBlackGate);
  
  mapBlackGate.fitBounds([
    [0, 0], 
    [-400, 300] 
  ]);

  mapBlackGate.setView([-73, 195], 2.5);

  const surroundedIcon = L.icon({
    iconUrl: './assets/scenaries/blackGate1.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const surroundedMarker = L.marker([-70, 185], { icon: surroundedIcon }).bindPopup("1: Surrounded", { offset: [0, -10] }).addTo(mapBlackGate);
  surroundedMarker.on('click', function() {
    Swal.fire({
      title: 'Do you want to play this battle for 600 coins?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
      if (datosUsuarioActual.coins < 600) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You dont have 600 coins',
        })
      } else {
        datosUsuarioActual.coins -= 600;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          coins: datosUsuarioActual.coins
        });
        battle = "BlackGate1";
        scenario = "surrounded";
        battleFunction(battle, [{name: "Murgash",level: 9,rank: "gold"},
                                  {name: "Mauhur",level: 9,rank: "gold"},
                                  {name: "armoredTroll",level: 9,rank: "gold"}]);
      }
    }});
  });
  surroundedMarker.on('mouseover', function () {
    surroundedMarker.openPopup();
  });

  const firstWaveIcon = L.icon({
    iconUrl: './assets/scenaries/blackGate2.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const firstWaveMarker = L.marker([-69, 200], { icon: firstWaveIcon }).bindPopup("2: First Wave", { offset: [0, -10] }).addTo(mapBlackGate);
  firstWaveMarker.on('click', function() {
    if (datosUsuarioActual.level.blackGate < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 660 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 660) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 660 coins',
          })
        } else {
          datosUsuarioActual.coins -= 660;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "BlackGate2";
          scenario = "firstWave";
          battleFunction(battle, [{name: "Haradrim1",level: 9,rank: "gold"},
                                  {name: "Haradrim2",level: 9,rank: "gold"},
                                  {name: "archerHaradrim",level: 9,rank: "gold"}]);
        }
      }});
    }
  });
  firstWaveMarker.on('mouseover', function () {
    firstWaveMarker.openPopup();
  });

  const secondWaveIcon = L.icon({
    iconUrl: './assets/scenaries/blackGate3.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });

  const secondWaveMarker = L.marker([-73, 194], { icon: secondWaveIcon }).bindPopup("3: Second Wave", { offset: [0, -10] }).addTo(mapBlackGate);
  secondWaveMarker.on('click', function() {
    if (datosUsuarioActual.level.blackGate < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 720 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 720) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 720 coins',
          })
        } else {
          datosUsuarioActual.coins -= 720;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "BlackGate3";
          scenario = "secondWave";
          battleFunction(battle, [{name: "Shagrat",level: 10,rank: "gold"},
                                  {name: "Snaga",level: 9,rank: "gold"},
                                  {name: "archerMordor2",level: 9,rank: "gold"}]);
        }
      }});
    }
  });
  secondWaveMarker.on('mouseover', function () {
    secondWaveMarker.openPopup();
  });

  const thirdWaveIcon = L.icon({
    iconUrl: './assets/scenaries/blackGate4.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const thirdWaveMarker = L.marker([-77, 200], { icon: thirdWaveIcon }).bindPopup("4: Third Wave", { offset: [0, -10] }).addTo(mapBlackGate);
  thirdWaveMarker.on('click', function() {
    if (datosUsuarioActual.level.blackGate < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 780 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 780) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 780 coins',
          })
        } else {
          datosUsuarioActual.coins -= 780;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "BlackGate4";
          scenario = "thirdWave";
          battleFunction(battle, [{name: "Gorbag",level: 10,rank: "gold"},
                                  {name: "Radbug",level: 10,rank: "gold"},
                                  {name: "orcMordor11",level: 10,rank: "gold"}]);
        }
      }});
    }
  });
  thirdWaveMarker.on('mouseover', function () {
    thirdWaveMarker.openPopup();
  });

  const SauronIcon = L.icon({
    iconUrl: './assets/scenaries/blackGate5.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const SauronMarker = L.marker([-80, 206], { icon: SauronIcon }).bindPopup("5: Sauron", { offset: [0, -10] }).addTo(mapBlackGate);
  SauronMarker.on('click', function() {
    if (datosUsuarioActual.level.blackGate < 4) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        title: 'Do you want to play this battle for 850 coins?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
      }).then((result) => {
      if (result.isConfirmed) {
        if (datosUsuarioActual.coins < 850) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'You dont have 850 coins',
          })
        } else {
          datosUsuarioActual.coins -= 850;
          const documentRef = db.collection("users").doc(datosUsuarioActual.id);
          documentRef.update({
            coins: datosUsuarioActual.coins
          });
          battle = "BlackGate5";
          scenario = "Sauron";
          battleFunction(battle, [{name: "Sauron",level: 10,rank: "gold"},
                                  {name: "MouthOfSauron",level: 10,rank: "gold"},
                                  {name: "OlogHai",level: 10,rank: "gold"}]);
        }
      }});
    }
  });
  SauronMarker.on('mouseover', function () {
    SauronMarker.openPopup();
  });

  mapBlackGate.on('zoomend', function () {
    const currentZoom = mapBlackGate.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.3));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    surroundedIcon.options.iconSize = newSize;
    surroundedIcon.options.iconAnchor = newAnchor;
    firstWaveIcon.options.iconSize = newSize;
    firstWaveIcon.options.iconAnchor = newAnchor;
    secondWaveIcon.options.iconSize = newSize;
    secondWaveIcon.options.iconAnchor = newAnchor;
    thirdWaveIcon.options.iconSize = newSize;
    thirdWaveIcon.options.iconAnchor = newAnchor;
    SauronIcon.options.iconSize = newSize;
    SauronIcon.options.iconAnchor = newAnchor;

    surroundedMarker.setIcon(surroundedIcon);
    firstWaveMarker.setIcon(firstWaveIcon);
    secondWaveMarker.setIcon(secondWaveIcon);
    thirdWaveMarker.setIcon(thirdWaveIcon);
    SauronMarker.setIcon(SauronIcon);
  });
}

function cargarBattle() {
  document.getElementById("battleHomeContainer").classList.remove("hide");
  if (map) {
    map.remove();
  }
  map = L.map('map', {
    maxZoom: 4, 
    minZoom: 2,
    maxBounds: [
      [0, 0], 
      [-300, 400]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/map.jpg', [
    [0, 0], 
    [-300, 400] 
  ]).addTo(map);
  
  map.fitBounds([
    [0, 0], 
    [-300, 400] 
  ]);

  map.setView([-60, 200], 3);

  const moriaIcon = L.icon({
    iconUrl: './assets/scenaries/moria.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const moriaMarker = L.marker([-55, 190], { icon: moriaIcon }).bindPopup("Moria", { offset: [0, -10] }).addTo(map);
  moriaMarker.on('click', function() {
    document.getElementById("battleHomeContainer").classList.add("hide");
    document.getElementById("moria").classList.remove("hide");
    document.getElementById("mapMoria").classList.remove("hide");
    cargarMoria();
  });
  moriaMarker.on('mouseover', function () {
    moriaMarker.openPopup();
  });

  const amonHenIcon = L.icon({
    iconUrl: './assets/scenaries/amonHen.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const amonHenMarker = L.marker([-72, 232], { icon: amonHenIcon }).bindPopup("Amon Hen", { offset: [0, -10] }).addTo(map);
  amonHenMarker.on('click', function() {
    if (datosUsuarioActual.level.total < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this level yet',
      })
    } else {
      document.getElementById("battleHomeContainer").classList.add("hide");
      document.getElementById("amonHen").classList.remove("hide");
      document.getElementById("mapAmonHen").classList.remove("hide");
      cargarAmonHen();
    }
  });
  amonHenMarker.on('mouseover', function () {
    amonHenMarker.openPopup();
  });

  const wargsIcon = L.icon({
    iconUrl: './assets/scenaries/wargs.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const wargsMarker = L.marker([-74, 200], { icon: wargsIcon }).bindPopup("Wargs", { offset: [0, -10] }).addTo(map);
  wargsMarker.on('click', function() {
    if (datosUsuarioActual.level.total < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this level yet',
      })
    } else {
      document.getElementById("battleHomeContainer").classList.add("hide");
      document.getElementById("wargs").classList.remove("hide");
      document.getElementById("mapWargs").classList.remove("hide");
      cargarWargs();
    }
  });
  wargsMarker.on('mouseover', function () {
    wargsMarker.openPopup();
  });

  const helmsDeepIcon = L.icon({
    iconUrl: './assets/scenaries/helmsDeep.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const helmsDeepMarker = L.marker([-73, 190], { icon: helmsDeepIcon }).bindPopup("Helm's Deep", { offset: [0, -10] }).addTo(map);
  helmsDeepMarker.on('click', function() {
    if (datosUsuarioActual.level.total < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this level yet',
      })
    } else {
      document.getElementById("battleHomeContainer").classList.add("hide");
      document.getElementById("helmsDeep").classList.remove("hide");
      document.getElementById("mapHelmsDeep").classList.remove("hide");
      cargarHelmsDeep();
    }
  });
  helmsDeepMarker.on('mouseover', function () {
    helmsDeepMarker.openPopup();
  });

  const osgiliathIcon = L.icon({
    iconUrl: './assets/scenaries/osgiliath.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const osgiliathMarker = L.marker([-77, 265], { icon: osgiliathIcon }).bindPopup("Osgiliath", { offset: [0, -10] }).addTo(map);
  osgiliathMarker.on('click', function() {
    if (datosUsuarioActual.level.total < 4) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this level yet',
      })
    } else {
      document.getElementById("battleHomeContainer").classList.add("hide");
      document.getElementById("osgiliath").classList.remove("hide");
      document.getElementById("mapOsgiliath").classList.remove("hide");
      cargarOsgiliath();
    }
  });
  osgiliathMarker.on('mouseover', function () {
    osgiliathMarker.openPopup();
  });

  const minasTirithIcon = L.icon({
    iconUrl: './assets/scenaries/minas-Tirith.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const minasTirithMarker = L.marker([-77, 255], { icon: minasTirithIcon }).bindPopup("Minas Tirith", { offset: [0, -10] }).addTo(map);
  minasTirithMarker.on('click', function() {
    if (datosUsuarioActual.level.total < 5) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this level yet',
      })
    } else {
      document.getElementById("battleHomeContainer").classList.add("hide");
      document.getElementById("minasTirith").classList.remove("hide");
      document.getElementById("mapMinasTirith").classList.remove("hide");
      cargarMinasTirith();
    }
  });
  minasTirithMarker.on('mouseover', function () {
    minasTirithMarker.openPopup();
  });

  const blackGateIcon = L.icon({
    iconUrl: './assets/scenaries/blackGate.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const blackGateMarker = L.marker([-72, 270], { icon: blackGateIcon }).bindPopup("The Black Gate", { offset: [0, -10] }).addTo(map);
  blackGateMarker.on('click', function() {
    if (datosUsuarioActual.level.total < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this level yet',
      })
    } else {
      document.getElementById("battleHomeContainer").classList.add("hide");
      document.getElementById("blackGate").classList.remove("hide");
      document.getElementById("mapBlackGate").classList.remove("hide");
      cargarBlackGate();
    }
  });
  blackGateMarker.on('mouseover', function () {
    blackGateMarker.openPopup();
  });

  map.on('zoomend', function () {
    const currentZoom = map.getZoom();
    const newSize = [64, 64].map(size => size / Math.pow(2, (3 - currentZoom) * 0.7));
    const newAnchor = [newSize[0]/2, newSize[1]/2];
    moriaIcon.options.iconSize = newSize;
    moriaIcon.options.iconAnchor = newAnchor;
    amonHenIcon.options.iconSize = newSize;
    amonHenIcon.options.iconAnchor = newAnchor;
    wargsIcon.options.iconSize = newSize;
    wargsIcon.options.iconAnchor = newAnchor;
    helmsDeepIcon.options.iconSize = newSize;
    helmsDeepIcon.options.iconAnchor = newAnchor;
    osgiliathIcon.options.iconSize = newSize;
    osgiliathIcon.options.iconAnchor = newAnchor;
    minasTirithIcon.options.iconSize = newSize;
    minasTirithIcon.options.iconAnchor = newAnchor;
    blackGateIcon.options.iconSize = newSize;
    blackGateIcon.options.iconAnchor = newAnchor;

    moriaMarker.setIcon(moriaIcon);
    amonHenMarker.setIcon(amonHenIcon);
    wargsMarker.setIcon(wargsIcon);
    helmsDeepMarker.setIcon(helmsDeepIcon);
    osgiliathMarker.setIcon(osgiliathIcon);
    minasTirithMarker.setIcon(minasTirithIcon);
    blackGateMarker.setIcon(blackGateIcon);
  });
}

//Inicio de la página -------------
//Inicio de tarjetas de personajes
let personajesNoObtenidos = [];
let personajesObtenidos = [];
let personajes = [
  'Arador', 'Aragorn', 'Aranarth', 'Beregond', 'Boromir', 'Ciryannil',
  'Damrod', 'Dernwine', 'Duinhir', 'Elladan', 'Elrohir', 'Eomer', 'Eothain',
  'Eowyn', 'Faramir', 'Folcred', 'Galadriel', 'Gamling', 'Gandalf', 'Gimli',
  'Guthred', 'Gwaihir', 'Haldir', 'Hama', 'Herubeam', 'Holdbald', 'kingDead', 'Legolas',
  'Maradir', 'Mendener', 'Merry', 'Minarorn', 'Ohtar', 'Pippin', 'princeImrahil',
  'Theoden', 'Treebeard', 'Undome'
];
let cardRank = ["bronze", "gold", "bronze", "silver", "gold", "bronze", 
  "bronze", "bronze", "bronze", "bronze", "bronze", "silver", "bronze", 
  "gold", "silver", "bronze", "gold", "silver", "gold", "gold", 
  "bronze", "gold", "silver", "silver", "bronze", "bronze", "gold", "gold", 
  "bronze", "bronze", "silver", "bronze", "bronze", "silver", "silver", 
  "gold", "silver", "bronze"];
let enemies = [];
iniciarPersonajes();
iniciarEnemigos();

// Recuperación de datos y actualización de las cartas y contenido
let datosUsuarioActual;
let music;
let login = document.getElementById("login");
let menu = document.getElementById("menu");
let homeContent = document.getElementById("homeContent");
let battleContent = document.getElementById("battleContent");
let shopContent = document.getElementById("shopContent");
let myCardsContent = document.getElementById("myCardsContent");
let battleOnGoing = 0;
firebase.auth().onAuthStateChanged((user) => {
  loginLogout(user);
});

//mapas
let map = null;
let mapMoria = null;
let mapAmonHen = null;
let mapWargs = null;
let mapHelmsDeep = null;
let mapOsgiliath = null;
let mapMinasTirith = null;
let mapBlackGate = null;

//datos batalla
let battle = "";
let scenario = "";
let bronzeMoria = ["Arador", "Aranarth", "Elrohir", "Elladan"];
let silverMoria = ["Merry", "Pippin"];
let goldMoria = ["Aragorn", "Legolas", "Gimli"];
let heroesGlobal = [];
let enemiesGlobal = [];
let ataqueactivo; 
let attacksRemaining = 1;
let SMRemaining = 1;
let attackactive = [];
let SMoveActualHeroes = {};
let SMoveActualEnemies = {};
let Gandalf = 0;
let Faramir = 0;
let Damrod = 0;
let kingDead = 0;
let Gwaihir = 0;
let esquivaGwaihir = false;
let armoredTroll = 0;
let Guritz = 0;
let delayedDamage = 0;
let DamrodAttack = 3;
let enemiesAttaks = 1;
let bronzeAmonHen = ["Mendener", "Undome"];
let silverAmonHen = ["Merry", "Pippin", "Haldir"];
let goldTotal = ["Aragorn", "Legolas", "Gimli", "Gandalf"];
let bronzeRohan = ["Eothain", "Guthred", "Herubeam", "Holdbald"];
let silverRohan = ["Eomer", "Gamling", "Hama", "Treebeard"];
let bronzeGondor = ["Ciryannil", "Damrod", "Maradir", "Minarorn"];
let silverGondor = ["Beregond"];
let bronzeBlackGate = ["Dernwine", "Duinhir", "Folcred", "Ohtar"];
let silverBlackGate = ["princeImrahil"];
let goldBlackGate = ["Aragorn", "Legolas", "Gimli", "Gandalf", "Gwaihir"];


//eventos
document.getElementById("register").addEventListener("click", function() {
  document.getElementById("registerBox").classList.remove("hide");
  document.getElementById("log_in").disabled = true;
});

document.getElementById("log_in").addEventListener("click", function() {
  document.getElementById("loginBox").classList.remove("hide");
  document.getElementById("log_in").disabled = true;
});

let back = document.getElementsByClassName("back");
for (let i = 0; i < back.length; i++) {
  back[i].addEventListener("click", function() {
    document.getElementById("registerBox").classList.add("hide");
    document.getElementById("log_in").disabled = false;
    document.getElementById("loginBox").classList.add("hide");
  });
}

document.getElementById("formRegister").addEventListener("submit", function (event) {
  event.preventDefault();
  let username = event.target.elements.username.value;
  let email = event.target.elements.email.value;
  let password = event.target.elements.password.value;
  validarFormularioRegister(username, email, password);
})

document.getElementById("formlogin").addEventListener("submit", function (event) {
  event.preventDefault();
  let email = event.target.elements.email2.value;
  let password = event.target.elements.password2.value;
  validarFormularioLogin(email, password);
})

let logout = document.getElementById("logout");
logout.addEventListener("click", () => {
  if (battleOnGoing == 1) {
    Swal.fire({
      title: 'Do you want to exit and logout?',
      text: "The battle will count as lost",
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
        datosUsuarioActual.defeats += 1;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          defeats: datosUsuarioActual.defeats
        });
        defeat(1);
        setTimeout(function() {
          signOut();
          Swal.fire('You signed out successfully!', '', 'success');
          audio.pause();
        }, 1000);
    } 
    })
  } else {
    Swal.fire({
      title: 'Do you want to sign out?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
        signOut();
        Swal.fire('You signed out successfully!', '', 'success');
        audio.pause();
    } 
    })
  }
});

document.getElementById("selector").addEventListener("click", function() {  
  if (datosUsuarioActual.charactersOwned.length === 0) {
    Swal.fire({
      icon: 'error',
      text: "You dont have cards yet",
    })
  } else {
    document.getElementById("selectAvatar").classList.remove("hide");
  }
});

document.getElementById("chooseAvatar").addEventListener("submit", function(event) {
  event.preventDefault();
  let avatar = event.target.avatarSelector.value;
  document.querySelector("#avatar p").classList.add("hide");
  document.querySelector("#avatar img").src = `./assets/heros/${avatar}.png`;
  datosUsuarioActual.avatar = avatar;
  const documentRef = db.collection("users").doc(datosUsuarioActual.id);
  documentRef.update({
    avatar: datosUsuarioActual.avatar
  });
  document.getElementById("selectAvatar").classList.add("hide");
})

document.getElementById("home").addEventListener("click", function() {
  if (battleOnGoing == 1) {
    Swal.fire({
      title: 'Do you want to exit?',
      text: "The battle will count as lost",
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
        defeat(1);
        setTimeout(function() {
          document.getElementById(`${scenario}`).innerHTML = "";
          document.getElementById(`${scenario}`).classList.add("hide");
          homeContent.classList.remove("hide");
          battleContent.classList.add("hide");
          shopContent.classList.add("hide");
          myCardsContent.classList.add("hide");
          document.getElementById("home").classList.add("outlined");
          document.getElementById("battle").classList.remove("outlined");
          document.getElementById("shop").classList.remove("outlined");
          document.getElementById("myCards").classList.remove("outlined");
          audio.src = "./assets/music/home.mp3";
          cargarHome();
        }, 1000);
    } 
    })
  } else {
    homeContent.classList.remove("hide");
    battleContent.classList.add("hide");
    shopContent.classList.add("hide");
    myCardsContent.classList.add("hide");
    document.getElementById("home").classList.add("outlined");
    document.getElementById("battle").classList.remove("outlined");
    document.getElementById("shop").classList.remove("outlined");
    document.getElementById("myCards").classList.remove("outlined");
    cargarHome();
  }
})

document.getElementById("battle").addEventListener("click", function() {
  if (battleOnGoing == 1) {
    
  } else {
    homeContent.classList.add("hide");
    battleContent.classList.remove("hide");
    shopContent.classList.add("hide");
    myCardsContent.classList.add("hide");
    document.getElementById("home").classList.remove("outlined");
    document.getElementById("battle").classList.add("outlined");
    document.getElementById("shop").classList.remove("outlined");
    document.getElementById("myCards").classList.remove("outlined");
    cargarBattle();
  }
})

document.getElementById("shop").addEventListener("click", function() {
  if (battleOnGoing == 1) {
    Swal.fire({
      title: 'Do you want to exit?',
      text: "The battle will count as lost",
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
        defeat(1);
        setTimeout(function() {
          document.getElementById(`${scenario}`).innerHTML = "";
          document.getElementById(`${scenario}`).classList.add("hide");
          homeContent.classList.add("hide");
          battleContent.classList.add("hide");
          shopContent.classList.remove("hide");
          myCardsContent.classList.add("hide");
          document.getElementById("home").classList.remove("outlined");
          document.getElementById("battle").classList.remove("outlined");
          document.getElementById("shop").classList.add("outlined");
          document.getElementById("myCards").classList.remove("outlined");
          audio.src = "./assets/music/home.mp3";
          cargarShop();
        }, 1000);
    } 
    })
  } else {
    homeContent.classList.add("hide");
    battleContent.classList.add("hide");
    shopContent.classList.remove("hide");
    myCardsContent.classList.add("hide");
    document.getElementById("home").classList.remove("outlined");
    document.getElementById("battle").classList.remove("outlined");
    document.getElementById("shop").classList.add("outlined");
    document.getElementById("myCards").classList.remove("outlined");
    cargarShop();
  }
})

document.getElementById("myCards").addEventListener("click", function() {
  if (battleOnGoing == 1) {
    Swal.fire({
      title: 'Do you want to exit?',
      text: "The battle will count as lost",
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
        defeat(1);
        setTimeout(function() {
          document.getElementById(`${scenario}`).innerHTML = "";
          document.getElementById(`${scenario}`).classList.add("hide");
          homeContent.classList.add("hide");
          battleContent.classList.add("hide");
          shopContent.classList.add("hide");
          myCardsContent.classList.remove("hide");
          document.getElementById("home").classList.remove("outlined");
          document.getElementById("battle").classList.remove("outlined");
          document.getElementById("shop").classList.remove("outlined");
          document.getElementById("myCards").classList.add("outlined");
          audio.src = "./assets/music/home.mp3";
          cargarMyCards();
        }, 1000);
    } 
    })
  } else {
    homeContent.classList.add("hide");
    battleContent.classList.add("hide");
    shopContent.classList.add("hide");
    myCardsContent.classList.remove("hide");
    document.getElementById("home").classList.remove("outlined");
    document.getElementById("battle").classList.remove("outlined");
    document.getElementById("shop").classList.remove("outlined");
    document.getElementById("myCards").classList.add("outlined");
    cargarMyCards();
  }
})

document.getElementById("filterSelectorShop").addEventListener("submit", function(event) {
  event.preventDefault();
  let cardsShop = document.getElementById("cardsShop");
  let gold = event.target.gold.checked;
  let silver = event.target.silver.checked;
  let bronze = event.target.bronze.checked;
  let race = event.target.race.value;
  let searchstarts = event.target.searchstarts.value.toLowerCase();
  let rank = gold || silver || bronze;
  if (!rank && race == "All" && searchstarts == "") {
    cargarShop();
    personajesNoObtenidos.forEach(element => {
      document.getElementById(`shop${element.name}`).addEventListener("click", function() {
        document.getElementById("shopContainer").classList.add("hide");
        document.getElementById("detalleShopContainer").classList.remove("hide");
        cargardetalleShopContainer(element);
      });
    });
  } else {
    let datos = personajesNoObtenidos;
    if (rank) {
      if (!gold) {
        datos = datos.filter(el => el.card != "gold");
      }
      if (!silver) {
        datos = datos.filter(el => el.card != "silver");
      }
      if (!bronze) {
        datos = datos.filter(el => el.card != "bronze");
      }
    }
    if (race != "All") {
      if (race == "Human") {
        datos = datos.filter(el => el.race == "Human");
      }
      if (race == "Elf") {
        datos = datos.filter(el => el.race == "Elf");
      }
      if (race == "Dwarf") {
        datos = datos.filter(el => el.race == "Dwarf");
      }
      if (race == "Other") {
        datos = datos.filter(el => el.race != "Human" && el.race != "Elf" && el.race != "Dwarf");
      }
    }
    if (searchstarts != "") {
      datos = datos.filter(el => el.name.toLowerCase().startsWith(searchstarts));
    }
    if (datos.length === 0) {
      cardsShop.innerHTML = "";
      cardsShop.innerHTML = `<h2 style="text-align: center;">No character fits the search</h2>`;
      document.getElementById("filterSelectorShop").reset();
    } else {
      cardsShop.innerHTML = "";
      datos.forEach(element => {
        cardsShop.innerHTML += `<section id="shop${element.name}" class="shopCard"></section>`;
        document.getElementById(`shop${element.name}`).innerHTML = element.image;
      });
      datos.forEach(element => {
        document.getElementById(`shop${element.name}`).addEventListener("click", function() {
          document.getElementById("shopContainer").classList.add("hide");
          document.getElementById("detalleShopContainer").classList.remove("hide");
          cargardetalleShopContainer(element);
        });
      });
      document.getElementById("filterSelectorShop").reset();
      
    }
  }
});

document.getElementById("xShop").addEventListener("click", function() {
  document.getElementById("shopContainer").classList.remove("hide");
  document.getElementById("detalleShopContainer").classList.add("hide");
  cargarShop();
});

document.getElementById("xMyCards").addEventListener("click", function() {
  document.getElementById("myCardsContainer").classList.remove("hide");
  document.getElementById("detalleMyCardsContainer").classList.add("hide");
  cargarMyCards();
});

document.getElementById("filterSelectorMyCards").addEventListener("submit", function(event) {
  event.preventDefault();
  let respuesta = event.target.character.value.toLowerCase();
  let cardsMyCards = document.getElementById("cardsMyCards");
  if (respuesta == "") {
    if (personajesObtenidos.length === 0) {
      cardsMyCards.innerHTML = "";
      cardsMyCards.innerHTML = `<h2 style="text-align: center;">You dont have cards yet!</h2>`;
    } else {
      cardsMyCards.innerHTML = "";
      personajesObtenidos.forEach(element => {
        cardsMyCards.innerHTML += `<section id="myCards${element.name}" class="myCard"></section>`;
        document.getElementById(`myCards${element.name}`).innerHTML = element.image;
      });
      personajesObtenidos.forEach(element => {
        document.getElementById(`myCards${element.name}`).addEventListener("click", function() {
          document.getElementById("myCardsContainer").classList.add("hide");
          document.getElementById("detalleMyCardsContainer").classList.remove("hide");
          cargardetalleMyCardsContainer(element);
        });
      });
    }
  } else {
    let dato = personajesObtenidos.filter(el => el.name.toLowerCase().startsWith(respuesta));
    cardsMyCards.innerHTML = "";
    if (dato.length === 0) {
      cardsMyCards.innerHTML = `<h2 style="text-align: center;">You dont have any card with that name</h2>`;
    } 
    dato.forEach(element => {
      cardsMyCards.innerHTML += `<section id="myCards${element.name}" class="myCard"></section>`;
      document.getElementById(`myCards${element.name}`).innerHTML = element.image;
    });
    dato.forEach(element => {
      document.getElementById(`myCards${element.name}`).addEventListener("click", function() {
        document.getElementById("myCardsContainer").classList.add("hide");
        document.getElementById("detalleMyCardsContainer").classList.remove("hide");
        cargardetalleMyCardsContainer(element);
      });
    });
  }
  document.getElementById("filterSelectorMyCards").reset();
})

let backMap = document.querySelectorAll(".backMap");
for (let i = 0; i < backMap.length; i++) {
  backMap[i].addEventListener("click", function() {
    document.getElementById("battleHomeContainer").classList.remove("hide");
    document.getElementById("moria").classList.add("hide");
    document.getElementById("amonHen").classList.add("hide");
    document.getElementById("wargs").classList.add("hide");
    document.getElementById("helmsDeep").classList.add("hide");
    document.getElementById("osgiliath").classList.add("hide");
    document.getElementById("minasTirith").classList.add("hide");
    document.getElementById("minasTirith").classList.add("hide");
    cargarBattle();
  })
}

let mute = document.getElementById("muteButton");
let audio = document.getElementById("audio");
mute.addEventListener("click", function() {
if (audio.paused) {
  audio.play();
  music = true;
} else {
  audio.pause();
  music = false;
}
});
