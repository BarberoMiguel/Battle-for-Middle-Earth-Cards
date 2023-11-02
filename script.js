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
};

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
      });
      signInUser(email, password);
    })
    .catch((error) => {
      console.log("Error en el sistema" + error.message);
    });
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
  if (!/^[A-Za-z0-9\-_#@]{2,30}$/.test(password)) {
    alert += "The password must be alfanumerical between 2 and 30 characters and can contain(-,_,@,#) <br>"
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
  if (!/^[A-Za-z0-9\-_#@]{2,30}$/.test(password)) {
    alert += "The password must be alfanumerical between 2 and 30 characters and can contain(-,_,@,#) <br>"
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

//función elige uno aleatorio de set, lo devuelve y lo elimina de set
function getRandomFromSet(array) {
  let i = Math.round(Math.random()*(array.length - 1));
  let personajeElegido = array[i];
  array.splice(i, 1);
  return personajeElegido;
}

//función cargar ataques
function cargarAtaques(batalla) {
  let contenedor = document.getElementById(`attackContainer${batalla}`);
  contenedor.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    if (heroesGlobal[i].actualARecharge == 0) {
      contenedor.innerHTML += heroesGlobal[i].attackButton;
    }
  }
}

function cargarSM(batalla) {
  let contenedor = document.getElementById(`SMContainer${batalla}`);
  contenedor.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    if (heroesGlobal[i].actualSRecharge == 0) {
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

//función derrota
function defeat(numero) {
  datosUsuarioActual.defeats += 1;
  const documentRef = db.collection("users").doc(datosUsuarioActual.id);
  documentRef.update({
    defeats: datosUsuarioActual.defeats
  });
  battleOnGoing = 0
  document.getElementById(`newCards${battle}Container`).innerHTML = "";
          document.getElementById(`newCards${battle}Container`).classList.remove("hide");
          document.getElementById(`newCards${battle}Container`).innerHTML = `
            <p class="defeat">Defeat!</p>`;
  if (numero == 1) {
    setTimeout(function () {document.getElementById(`${scenario}`).innerHTML = "";
                            document.getElementById(`${scenario}`).classList.add("hide");
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
  if (battle == "Moria1") {
    
  }
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
    if (heroesGlobal[i].name == "Boromir") {
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
  document.getElementById(`hero${attackactive[1]+1}${battle}`).style.animation = "heroAttack 1s ease-in-out";
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<p class="damageTaken">-${await attackactive[0]}pH</p>`;
    enemiesGlobal[i-1].actualHealth -= await attackactive[0];
    if (enemiesGlobal[i-1].actualHealth < 0) {
      enemiesGlobal[i-1].actualHealth = 0;
    }
    document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
  }
  if (!comprobarVictoria()) {
    setTimeout(function() {
      //comprobar contrataques
//comprobar derrota
//if !Derrota hacer lo siguiente
      for (let i = 1; i <= enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
      }
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
  document.getElementById(`hero${attackactive[1]+1}${battle}`).style.animation = "heroAttack 1s ease-in-out";
  for (let i = 1; i <= enemiesGlobal.length; i++) {
    document.getElementById(`specialEfectsEnemy${i}`).innerHTML = `<p class="damageTaken">-${await attackactive[0]}pH</p>`;
    enemiesGlobal[i-1].actualHealth -= await attackactive[0];
    if (enemiesGlobal[i-1].actualHealth < 0) {
      enemiesGlobal[i-1].actualHealth = 0;
    }
    document.getElementById(`health${enemiesGlobal[i-1].name}`).style.width = (enemiesGlobal[i-1].actualHealth/enemiesGlobal[i-1].maxHealth)*100 + "%";
  }
  if (!comprobarVictoria()) {
    setTimeout(function() {
      //comprobar contrataques
//comprobar derrota
//if !Derrota hacer lo siguiente
      for (let i = 1; i <= enemiesGlobal.length; i++) {
        document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
      }
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

async function sMoveBeregond() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Beregond") {
      SMoveActualHeroes.Beregond = 1;
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

async function sMoveBoromir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Boromir") {
      SMoveActualHeroes.Boromir = 1;
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
        document.getElementById(`selection${battle}`).classList.remove("hide");
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

async function sMoveElrohir() {
  for (let i = 0; i < heroesGlobal.length; i++) {
    if (heroesGlobal[i].name == "Elrohir") {
      SMoveActualHeroes.Elrohir = 1;
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
    if (heroesGlobal[i].actualARecharge == 0) {
      document.getElementById(`attack${heroesGlobal[i].name}`).addEventListener("click", function() {
        window[`attack${heroesGlobal[i].name}`]();
        document.getElementById(`attackContainer${battle}`).classList.add("hide");
      });
    }
    if (heroesGlobal[i].actualSRecharge == 0) {
      document.getElementById(`sMove${heroesGlobal[i].name}`).addEventListener("click", function() {
        window[`sMove${heroesGlobal[i].name}`]();
        document.getElementById(`SMContainer${battle}`).classList.add("hide");
      });
    }
  }
  for (let i = 0; i < enemiesGlobal.length; i++) {
    document.getElementById(`enemy${i+1}${battle}`).addEventListener("click", function() {
    if (ataqueactivo == 1) {
      ataqueactivo = 0;
      document.getElementById(`selection${battle}`).classList.add("hide");
      document.getElementById(`hero${attackactive[1]+1}${battle}`).style.animation = "heroAttack 1s ease-in-out";
      document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
      enemiesGlobal[i].actualHealth -= attackactive[0];
      if (enemiesGlobal[i].actualHealth < 0) {
        enemiesGlobal[i].actualHealth = 0;
      }
      document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
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
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<img src="./assets/effects/level_Up.gif" alt="downgrade" class="effects downgrade">`;
        setTimeout(() => {
          document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = "";
        }, 750);
      } 
      if (!comprobarVictoria()) {
        setTimeout(function() {
          //comprobar contrataques
          //comprobar derrota
          //if !Derrota hacer lo siguiente
          for (let j = 1; j <= enemiesGlobal.length; j++) {
            document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
          }
          attacksRemaining -= 1;
          let attack = document.getElementById("attackfunction");
          let SM = document.getElementById("SMfunction");
          actualizarBotones(attack, SM, battle);
          document.getElementById(`controls${battle}`).classList.remove("hide");
          document.getElementById(`AttackSMContainer${battle}`).classList.remove("hide");
          eventosBatalla(battle);
        }, 2000);
      }
      } else if (Faramir == 1) {
        
      }else if (Damrod == 1) {
        document.getElementById(`selection${battle}`).classList.add("hide");
        document.getElementById(`hero${attackactive[1]+1}${battle}`).style.animation = "heroAttack 1s ease-in-out";
        document.getElementById(`specialEfectsEnemy${i+1}`).innerHTML = `<p class="damageTaken">-${attackactive[0]}pH</p>`;
        enemiesGlobal[i].actualHealth -= attackactive[0];
        if (enemiesGlobal[i].actualHealth < 0) {
          enemiesGlobal[i].actualHealth = 0;
        }
        document.getElementById(`health${enemiesGlobal[i].name}`).style.width = (enemiesGlobal[i].actualHealth/enemiesGlobal[i].maxHealth)*100 + "%";
        if (!comprobarVictoria()) {
          setTimeout(function() {
            //comprobar contrataques
            //comprobar derrota
            //if !Derrota hacer lo siguiente
            for (let i = 1; i <= enemiesGlobal.length; i++) {
              document.getElementById(`specialEfectsEnemy${i}`).innerHTML = "";
            }
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
    })
    
  }
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
        personajesNoObtenidos[i].specialMoveAmount = 0.4;
        personajesNoObtenidos[i].specialMoveActualAmount = 0.4;
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
      case "Pippin":
        personajesNoObtenidos[i].id = "Peregrin";
        personajesNoObtenidos[i].realm = `Hobbiton`;
        personajesNoObtenidos[i].baseAttack = 45;
        personajesNoObtenidos[i].specialMoveRecharge = 4;
        personajesNoObtenidos[i].attackDescription = "He attacks with his enchanted sword";
        personajesNoObtenidos[i].specialMoveDescription = `He throws rocks at the heads of his enemies stuning then for one round`;
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
                  <img src="./assets/${level}.png" alt="" class="cardLevel">
                  <p class="${rank} nameDisplay">${cartaActual.name}</p>
                </figure>`;
  if (level > 0) {
    switch (cartaActual.name) {
      case "Watcher":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*2;
        cartaActual.attackDescription = "He hits you with his tentacle";
        cartaActual.specialMoveDescription = `He heals himself ${cartaActual.specialMoveActualAmount}pH`;
        break;
    }
  }
}

//function pintar enemigos
async function pintarEnemigos(enemigos, batalla) {
  let enemigosActualizados = await enemigos;
  for (let i = 1; i <= enemigosActualizados.length; i++) {
    document.getElementById(`enemy${i}${batalla}`).innerHTML += enemigosActualizados[i-1].image;
    document.getElementById(`enemy${i}${batalla}`).innerHTML += enemigosActualizados[i-1].healthBar;
    document.getElementById(`info${i}enemy`).innerHTML = `
      <p><b>Attack:</b> ${enemigosActualizados[i-1].attackDescription}</p>
      <p><b>Special Move:</b> ${enemigosActualizados[i-1].specialMoveDescription}</p>`;
    document.getElementById(`enemy${i}${battle}`).addEventListener("mouseover", function() {
      document.getElementById(`info${i}enemy`).classList.remove("hide");
    });
    document.getElementById(`enemy${i}${battle}`).addEventListener("mouseout", function() {
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
  if (level > 0) {
    switch (cartaActual.name) {
      case "Gandalf":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.025;
        if (level > 4) {
          cartaActual.specialMoveRounds = 2;
        }
        cartaActual.specialMoveDescription = `He protects his companions with a magic shield that stops ${cartaActual.specialMoveActualAmount *100}% of the damage for ${cartaActual.specialMoveRounds} rounds`;
        break;
      case "Theoden":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        if (level > 4) {
          cartaActual.specialMoveRounds = 2;
        }
        cartaActual.specialMoveDescription = `He inspires his companions increasing their damage by ${cartaActual.specialMoveActualAmount * 100}% for ${cartaActual.specialMoveRounds} rounds`;
        break;
      case "Aragorn":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        cartaActual.specialMoveDescription = `He shouts "Elendil!" increasing the damage of his next attack x${cartaActual.specialMoveActualAmount}`;
        break;
      case "Aranarth":
      case "Holdbald":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.specialMoveDescription = `He encourages his companions so the attack in this round deals ${cartaActual.specialMoveActualAmount * 100}% more damage`;
        break;
      case "Beregond":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He encourages his companions so the attack in this round deals ${cartaActual.specialMoveActualAmount * 100}% more damage`;
        break;
      case "Boromir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He uses his shield to protect his companions from the next attack reducing its dammage by ${cartaActual.specialMoveActualAmount * 100}%`;
        break;
      case "Ciryannil":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He sharpens his aim and gains a critical damage increase of ${cartaActual.specialMoveActualAmount * 100}% for his next attack`;
        break;
      case "Damrod":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He shoots a pierced arrow at the enemy that deals bleed with ${cartaActual.specialMoveActualAmount * 100}% additional damage for two rounds`;
        break;
      case "Elladan":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        personajesNoObtenidos[i].specialMoveDescription = `He shouts a war cry increasing his damage by ${cartaActual.specialMoveActualAmount * 100}% for two rounds`;
        break;
      case "Elrohir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `If he is attacked this round he returns ${cartaActual.specialMoveActualAmount * 100}% of the damage`;
        break;
      case "Eothain":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.04;
        cartaActual.specialMoveDescription = `He reflects ${cartaActual.specialMoveActualAmount * 100}% of the damage he recives this round to the enemy`;
        break;
      case "Eowyn":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.1;
        cartaActual.specialMoveDescription = `She charges a fatal blow and her next attack deals damage x${cartaActual.specialMoveActualAmount}`;
        break;
      case "Faramir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*5;
        cartaActual.specialMoveDescription = `He drains ${cartaActual.specialMoveActualAmount}ph of the enemy and heals himself that amount`;
        break;
      case "Galadriel":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*5;
        cartaActual.specialMoveDescription = `She uses her ring of power to heal all alies ${cartaActual.specialMoveActualAmount}ph of Health`;
        break;
      case "Gimli":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.06;
        personajesNoObtenidos[i].specialMoveDescription = `He encourages his companions making them counterattack with ${cartaActual.specialMoveActualAmount *100}% of the damage they have recived for 1 round`;
        break;
      case "Guthred":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.specialMoveDescription = `With a battle cry he scares the enemy and reduces de damage of the next attack by ${cartaActual.specialMoveActualAmount *100}%`;
        break;
      case "Legolas":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.03;
        cartaActual.specialMoveDescription = `He shoots three arrows at the same time hitting all three enemies and dealing a damage of ${cartaActual.specialMoveActualAmount * 100}%`;
        break;
      case "Maradir":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        personajesNoObtenidos[i].specialMoveDescription = `He increases his damage by ${personajesNoObtenidos[i].specialMoveActualAmount * 100}% for this round`;
        break;
      case "Merry":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.05;
        cartaActual.specialMoveDescription = `He attacks with his enchanted sword breaking his enemy's guard and reducing his defense for two rounds by ${cartaActual.specialMoveActualAmount * 100}%`;
        break;
      case "Minarorn":
      case "Undome":
        cartaActual.specialMoveActualAmount = cartaActual.specialMoveAmount + level*0.02;
        cartaActual.specialMoveDescription = `He orders an archer attack hitting all enemies an dealing ${cartaActual.specialMoveActualAmount * 100}% damage`;
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
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
    if (result.isConfirmed) {
        audio.play();
    } 
    })
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
                                                      <div class="ct-chart ct-perfect-fourth" id="grafica"></div>`;
    var data = {
      labels: ['Victories', 'Defeats'],
      series: [
        [datosUsuarioActual.victories, datosUsuarioActual.defeats]
      ]
    };
    var maxValue = Math.max.apply(null, data.series[0]);
    var maximumValue = maxValue >= 3 ? maxValue : 3;
    var options = {
      seriesBarDistance: 15,
      axisY: {
        onlyInteger: true,
        low: 0,
        high: maximumValue
      }
    };
    new Chartist.Bar ('#grafica', data, options);
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
              text: 'You dont have 500 coins',
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

function battleMoria1() {
  battleOnGoing = 1;
  battle = "Moria1";
  scenario = "gateMoria";
  attacksRemaining = 1;
  SMRemaining = 1;
  attackactive = 0;
  SMoveActualHeroes = {};
  SMoveActualEnemies = {};
  document.getElementById("mapMoria").classList.add("hide");
  document.getElementById(`${scenario}`).classList.remove("hide");
  document.getElementById(`${scenario}`).innerHTML = `
  <section class="enemies hide" id="enemies${battle}">
    <section class="enemy" id="enemy2${battle}">
      <section id="specialEfectsEnemy2"></section>
      <section id="info2enemy" class="infoEnemies hide"></section>
    </section>
    <section class="enemy" id="enemy1${battle}">
        <section id="specialEfectsEnemy1"></section>
        <section id="info1enemy" class="infoEnemies hide"></section>
    </section>
    <section class="enemy" id="enemy3${battle}">
      <section id="specialEfectsEnemy3"></section>
      <section id="info3enemy" class="infoEnemies hide"></section>
    </section>
  </section>
  <section class="heroes hide" id="heroes${battle}">
    <section class="hero" id="hero1${battle}">
        <section id="specialEfectsHero1"></section>
        <section id="info1${battle}" class="infoCharacters hide"></section>
    </section>
    <section class="hero" id="hero2${battle}">
        <section id="specialEfectsHero2"></section>
        <section id="info2${battle}" class="infoCharacters hide"></section>
    </section>
    <section class="hero" id="hero3${battle}">
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
    let personaje1 = getRandomFromSet(availableBronze);
    personajesObtenidos.push(personajesNoObtenidos[personaje1[1]]);
    heroesGlobal.push(personajesNoObtenidos[personaje1[1]]);
    personajesNoObtenidos.splice(personaje1[1], 1);
    let nuevoPersonaje1 = {
      name: heroesGlobal[0].name,
      xp: 0
    }
    datosUsuarioActual.charactersOwned.push(nuevoPersonaje1);
    let availableGold = availableFromSet(goldMoria);
    let personaje2 = getRandomFromSet(availableGold);
    personajesObtenidos.push(personajesNoObtenidos[personaje2[1]]);
    heroesGlobal.push(personajesNoObtenidos[personaje2[1]]);
    personajesNoObtenidos.splice(personaje2[1], 1);
    let nuevoPersonaje2 = {
      name: heroesGlobal[1].name,
      xp: 0
    }
    datosUsuarioActual.charactersOwned.push(nuevoPersonaje2);
    availableBronze = availableFromSet(bronzeMoria);
    let personaje3 = getRandomFromSet(availableBronze);
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
            document.getElementById(`enemy${i}${battle}`).style.animation = "enemiesEnter 2s ease-in-out";
          }
          document.getElementById(`heroes${battle}`).style.animation = "heroesEnter 2s ease-in-out";
          for (let i = 1; i <= 3; i++) {
            document.getElementById(`hero${i}${battle}`).innerHTML += heroesGlobal[i-1].image;
            document.getElementById(`hero${i}${battle}`).innerHTML += heroesGlobal[i-1].healthBar;
            document.getElementById(`info${i}${battle}`).innerHTML = `
              <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
              <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
            document.getElementById(`hero${i}${battle}`).addEventListener("mouseover", function() {
              document.getElementById(`info${i}${battle}`).classList.remove("hide");
            })
            document.getElementById(`hero${i}${battle}`).addEventListener("mouseout", function() {
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
      document.getElementById(`enemy${i}${battle}`).style.animation = "enemiesEnter 2s ease-in-out";
    }
    document.getElementById(`heroes${battle}`).style.animation = "heroesEnter 2s ease-in-out";
    for (let i = 1; i <= 3; i++) {
      document.getElementById(`hero${i}${battle}`).innerHTML += heroesGlobal[i-1].image;
      document.getElementById(`hero${i}${battle}`).innerHTML += heroesGlobal[i-1].healthBar;
      document.getElementById(`info${i}${battle}`).innerHTML = `
        <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
        <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
      document.getElementById(`hero${i}${battle}`).addEventListener("mouseover", function() {
        document.getElementById(`info${i}${battle}`).classList.remove("hide");
      })
      document.getElementById(`hero${i}${battle}`).addEventListener("mouseout", function() {
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
          document.getElementById(`enemy${i}${battle}`).style.animation = "enemiesEnter 2s ease-in-out";
        }
        document.getElementById(`heroes${battle}`).style.animation = "heroesEnter 2s ease-in-out";
        for (let i = 1; i <= 3; i++) {
          document.getElementById(`hero${i}${battle}`).innerHTML += heroesGlobal[i-1].image;
          document.getElementById(`hero${i}${battle}`).innerHTML += heroesGlobal[i-1].healthBar;
          document.getElementById(`info${i}${battle}`).innerHTML = `
            <p><b>Attack:</b> ${heroesGlobal[i-1].attackDescription}</p>
            <p><b>Special Move:</b> ${heroesGlobal[i-1].specialMoveDescription}</p>`;
          document.getElementById(`hero${i}${battle}`).addEventListener("mouseover", function() {
            document.getElementById(`info${i}${battle}`).classList.remove("hide");
          })
          document.getElementById(`hero${i}${battle}`).addEventListener("mouseout", function() {
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
  
}

function cargarMoria() {
  const map = L.map('mapaMoria', {
    maxZoom: 3, 
    minZoom: 1,
    maxBounds: [
      [0, 0], 
      [-400, 300]  
    ],
    maxBoundsViscosity: 1.0 
  });
  
  L.imageOverlay('./assets/scenaries/moriaMap.jpg', [
    [0, 0], 
    [-400, 300] 
  ]).addTo(map);
  
  map.fitBounds([
    [0, 0], 
    [-400, 300] 
  ]);

  map.setView([-60, 25], 2.5);

  const moria1Icon = L.icon({
    iconUrl: './assets/scenaries/moria.png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
  });
  const moria1Marker = L.marker([-60, 25], { icon: moria1Icon }).bindPopup("1: The Gate", { offset: [0, -10] }).addTo(map);
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
  const balinsTombMarker = L.marker([-66, 92], { icon: balinsTombIcon }).bindPopup("2: Balin's Tomb", { offset: [0, -10] }).addTo(map);
  balinsTombMarker.on('click', function() {
    if (datosUsuarioActual.level.moria < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You havent unlocked this battle yet',
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Sorry!',
        text: 'This battle isnt available yet!',
        text: 'Come back later to play!'
      })
      // Swal.fire({
      //   title: 'Do you want to play this battle for 40 coins?',
      //   showCancelButton: true,
      //   confirmButtonText: 'Yes',
      // }).then((result) => {
      // if (result.isConfirmed) {
      //   if (datosUsuarioActual.coins < 40) {
      //     Swal.fire({
      //       icon: 'error',
      //       title: 'Oops...',
      //       text: 'You dont have 40 coins',
      //     })
      //   } else {
      //     datosUsuarioActual.coins -= 40;
      //     const documentRef = db.collection("users").doc(datosUsuarioActual.id);
      //     documentRef.update({
      //       coins: datosUsuarioActual.coins
      //     });
      //     battleMoria2();
      //   }
      // }});
    }
  });
  balinsTombMarker.on('mouseover', function () {
    balinsTombMarker.openPopup();
  });

  const caveTrollMarker = L.marker([-68, 88], { icon: balinsTombIcon }).bindPopup("3: The cave Troll", { offset: [0, -10] }).addTo(map);
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
          battleMoria3();
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
  const hallMarker = L.marker([-62, 120], { icon: hallIcon }).bindPopup("4: The great Hall", { offset: [0, -10] }).addTo(map);
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
          battleMoria4();
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
  const stairsMarker = L.marker([-70, 180], { icon: stairsIcon }).bindPopup("5: The Stairs", { offset: [0, -10] }).addTo(map);
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
          battleMoria5();
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
  const bridgeMarker = L.marker([-71, 262], { icon: bridgeIcon }).bindPopup("6: The Bridge of Khazad Dum", { offset: [0, -10] }).addTo(map);
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
          battleMoria6();
        }
      }});
    }
  });
  bridgeMarker.on('mouseover', function () {
    bridgeMarker.openPopup();
  });

  map.on('zoomend', function () {
    const currentZoom = map.getZoom();
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

function cargarBattle() {
  document.getElementById("battleHomeContainer").classList.remove("hide");
  const map = L.map('map', {
    maxZoom: 4, 
    minZoom: 1,
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
    document.getElementById("gateMoria").classList.add("hide");
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
let personajes = ["Arador", "Aragorn", "Aranarth", "Beregond", "Boromir", "Ciryannil", "Damrod", "Elladan", "Elrohir", "Eomer", "Eothain", "Eowyn", "Faramir", "Galadriel", "Gamling", "Gandalf", "Gimli", "Guthred", "Haldir", "Hama", "Herubeam", "Holdbald", "Legolas", "Maradir", "Mendener", "Merry", "Minarorn", "Pippin", "Theoden", "Treebeard", "Undome"];
let cardRank = ["bronze", "gold", "bronze", "silver", "gold", "bronze", "bronze", "bronze", "bronze", "silver", "bronze", "gold", "silver", "gold", "silver", "gold", "gold", "bronze", "silver", "silver", "bronze", "bronze", "gold", "bronze", "bronze", "silver", "bronze", "silver", "gold", "silver", "bronze"];
let enemies = [];
iniciarPersonajes();
iniciarEnemigos();

// Recuperación de datos y actualización de las cartas y contenido
let datosUsuarioActual;
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
        //show defeat
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
  cardsMyCards = document.getElementById("cardsMyCards");
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
    dato = personajesObtenidos.filter(el => el.name.toLowerCase().startsWith(respuesta));
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
  })
}

let mute = document.getElementById("muteButton");
let audio = document.getElementById("audio");
mute.addEventListener("click", function() {
if (audio.paused) {
  audio.play();
} else {
  audio.pause();
}
});
