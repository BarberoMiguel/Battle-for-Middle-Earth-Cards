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

function iniciarPersonajes() {
  for (let i = 0; i < personajes.length; i++) {
    let personaje = {name: personajes[i], specialMoveActualAmount: "",
      id: personajes[i], gender: "", height: "", race: "", attack: "", level: 0,
      realm: "", card: cardRank[i], baseAttack: "", maxHealth: "", buy: "",
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
        personajesNoObtenidos[i].attackDescription = "He wields his sword at the enemy";
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

function cargarBattle() {
  document.getElementById("battleHomeContainer").classList.remove("hide");
  const map = L.map('map', {
    maxZoom: 4, 
    minZoom: 1, 
  });
  
  L.imageOverlay('./assets/map.jpg', [
    [0, 0], 
    [768, 1024] 
  ]).addTo(map);
  
  map.fitBounds([
    [0, 0], 
    [768, 1024] 
  ]);
}

//Inicio de la página -------------
//Inicio de tarjetas de personajes
let personajesNoObtenidos = [];
let personajesObtenidos = [];
let personajes = ["Arador", "Aragorn", "Aranarth", "Beregond", "Boromir", "Ciryannil", "Damrod", "Elladan", "Elrohir", "Eomer", "Eothain", "Eowyn", "Faramir", "Galadriel", "Gamling", "Gandalf", "Gimli", "Guthred", "Haldir", "Hama", "Herubeam", "Holdbald", "Legolas", "Maradir", "Mendener", "Merry", "Minarorn", "Pippin", "Theoden", "Treebeard", "Undome"];
let cardRank = ["bronze", "gold", "bronze", "silver", "gold", "bronze", "bronze", "bronze", "bronze", "silver", "bronze", "gold", "silver", "gold", "silver", "gold", "gold", "bronze", "silver", "silver", "bronze", "bronze", "gold", "bronze", "bronze", "silver", "bronze", "silver", "gold", "silver", "bronze"];
iniciarPersonajes();

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
        datosUsuarioActual.defeats += 1;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          defeats: datosUsuarioActual.defeats
        });
        //show defeat
        setTimeout(function() {
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
    //pantalla mapa remove hide
    document.getElementById("home").classList.remove("outlined");
    document.getElementById("battle").classList.add("outlined");
    document.getElementById("shop").classList.remove("outlined");
    document.getElementById("myCards").classList.remove("outlined");
    //cargarBattle();
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
        datosUsuarioActual.defeats += 1;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          defeats: datosUsuarioActual.defeats
        });
        //show defeat
        setTimeout(function() {
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
        datosUsuarioActual.defeats += 1;
        const documentRef = db.collection("users").doc(datosUsuarioActual.id);
        documentRef.update({
          defeats: datosUsuarioActual.defeats
        });
        //show defeat
        setTimeout(function() {
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

let gInfo = document.getElementById("gInfo");
gInfo.addEventListener("click", function() {
  console.log("info");
  document.getElementById("generalShop").classList.remove("hide");
  document.getElementById("statisticsShop").classList.add("hide");
  document.getElementById("gInfo").disabled = true;
  document.getElementById("statisticsButton").disabled = false;
});

let statisticsButton = document.getElementById("statisticsButton");
statisticsButton.addEventListener("click", function() {
  console.log("statistics");
  document.getElementById("generalShop").classList.add("hide");
  document.getElementById("statisticsShop").classList.remove("hide");
  document.getElementById("gInfo").disabled = false;
  document.getElementById("statisticsButton").disabled = true;
});

document.getElementById("xMyCards").addEventListener("click", function() {
  document.getElementById("myCardsContainer").classList.remove("hide");
  document.getElementById("detalleMyCardsContainer").classList.add("hide");
  cargarMyCards();
});

let infoDetalle = document.getElementById("infoDetalle");
infoDetalle.addEventListener("click", function() {
  console.log("funciona1");
  document.getElementById("generalMyCards").classList.remove("hide");
  document.getElementById("statisticsMyCards").classList.add("hide");
  document.getElementById("infoDetalle").disabled = true;
  document.getElementById("statsDetalle").disabled = false;
});

let statsDetalle = document.getElementById("statsDetalle");
statsDetalle.addEventListener("click", function() {
  console.log("funciona2");
  document.getElementById("generalMyCards").classList.add("hide");
  document.getElementById("statisticsMyCards").classList.remove("hide");
  document.getElementById("infoDetalle").disabled = false;
  document.getElementById("statsDetalle").disabled = true;
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

let mute = document.getElementById("muteButton");
let audio = document.getElementById("audio");
mute.addEventListener("click", function() {
if (audio.paused) {
  audio.play();
} else {
  audio.pause();
}
});
