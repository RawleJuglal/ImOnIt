import './node_modules/normalize.css/normalize.css'
import './style.css'
import fire from '/src/assets/icons/fire.svg'

import { initializeApp } from 'firebase/app'
import {    getAuth, 
            createUserWithEmailAndPassword, 
            signInWithPopup, 
            GoogleAuthProvider, 
            onAuthStateChanged,
            signOut,
            signInWithEmailAndPassword,
            sendPasswordResetEmail,
            sendEmailVerification,
            updateProfile
} from 'firebase/auth'

/* == Firebase Setup == */
const firebaseConfig = {
    apiKey: "AIzaSyBEiqHhHs0u5auiqPFwuTBMZuZ45pIAo5Q",
    authDomain: "moody-82080.firebaseapp.com",
    projectId: "moody-82080",
    storageBucket: "moody-82080.appspot.com",
    messagingSenderId: "661576090290",
    appId: "1:661576090290:web:aa800ef1879ac83b93bfab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* == UI - Elements == */
const viewLoggedOut = document.getElementById('logged-out-view');
const viewLoggedIn = document.getElementById('logged-in-view');

const googleBtnEl = document.getElementById('google-btn');
const signOutBtnEl = document.getElementById('sign-out-btn');
const loginBtnEl = document.getElementById('submit-btn');
const passwordResetLinkEl = document.getElementById('password-reset');
const createUserLinkEl = document.getElementById('create-account');
const updateUserProfileBtnEl = document.getElementById('update-profile-btn');

const emailInputEl = document.getElementById('login-email');
const passwordInputEl = document.getElementById('login-password');

const userProfilePictureEl = document.getElementById('user-profile-picture');
const userProfileGreetingEl = document.getElementById('user-greeting');

const displayUpdateEl = document.getElementById('display-update');
const displayNameInputEl = document.getElementById('display-name-input');
const photoUrlInputEl = document.getElementById('photo-url-input');

/* == UI - Event Listeners == */
googleBtnEl.addEventListener('click', authSignInWithGoogle);

loginBtnEl.addEventListener('click', authSignInWithEmail);

passwordResetLinkEl.addEventListener('click', (event)=> authResetPassword(event));
createUserLinkEl.addEventListener('click', (event) => authCreateNewUser(event));

updateUserProfileBtnEl.addEventListener('click', authUpdateProfile)

signOutBtnEl.addEventListener('click', authSignOut);

/* === Main Code === */
onAuthStateChanged(auth, (user) => {
    if(user) {
        console.log(`AuthStateChanged VV`)
        console.log(user)
        showLoggedInView()
        showProfilePhoto(userProfilePictureEl, user);
        showProfileGreeting(userProfileGreetingEl, user);
        if(!user.photoURL){
            showView(displayUpdateEl);
        } else {
            hideView(displayUpdateEl);
        }
    } else {
        showLoggedOutView()
    }
});

/* === Functions === */

/* = Functions - Firebase - Authentication = */
function authSignInWithGoogle(){
    signInWithPopup(auth, provider)
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;

            const user = result.user;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.error(`Error: ${errorCode} - ${errorMessage}`);
            console.log(`Additional Error Info: ${email} - ${credential}`);
        })
}

function authSignInWithEmail(){
    const email = emailInputEl.value;
    const password = passwordInputEl.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            clearAuthFields();
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error(`${errorCode} - ${errorMessage}`);
        })
}

function gatherEmailForReset(){
    let email = emailInputEl.value;
    if(!email){
        email = prompt('Please enter an email to send link to.')
    }

    return email;
}

function authResetPassword(e){
    e.preventDefault()
    const email = gatherEmailForReset()
    sendPasswordResetEmail(auth, email)
        .then(()=>{
            alert('Password reset has been sent')
        })
        .catch((error) =>{
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error(`Error: ${errorCode} - ${errorMessage}`)
        })
}

function gatherNewAccountData(){
    let email = emailInputEl.value;
    let password = passwordInputEl.value;
    let accountData = [email, password]
    if(!email || !password){
        const userInput = prompt('Write email & password seperated by a comma');   
        accountData = userInput.split(',')
    }

    return accountData;
}

function authCreateNewUser(e){
    e.preventDefault();
    const accountData = gatherNewAccountData()
    const email = accountData[0];
    const password = accountData[1];

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            sendEmailVerification(auth.currentUser)
                .then(()=>{
                    clearAuthFields()
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            console.error(`Error: ${errorCode} - ${errorMessage}`);
        })
}
 
function authUpdateProfile(){
    console.log('entered auth')
    const newDisplayName = displayNameInputEl.value;
    const newPhotoURL = photoUrlInputEl.value;
    const user = auth.currentUser;

    updateProfile(auth.currentUser, {
        displayName: newDisplayName, photoURL: newPhotoURL
    })
    .then(() => {
        showProfilePhoto(userProfilePictureEl, auth.currentUser)
        showProfileGreeting(userProfileGreetingEl, auth.currentUser)
        hideView(displayUpdateEl)
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.error(`Error: ${errorCode} - ${errorMessage}`);
    })
}

function authSignOut() {
    signOut(auth)
        .then(()=>{

        })
        .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.error(`${errorCode} - ${errorMessage}`)
        })
}

/* == Functions - UI Functions == */
function showLoggedOutView() {
    hideView(viewLoggedIn)
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.classList.remove('hidden');
    view.classList.add('flex');
}

function hideView(view) {
    view.classList.remove('flex');
    view.classList.add('hidden');
}

function clearInputField(field){
    field.value = '';
}

function clearAuthFields(){
    clearInputField(emailInputEl);
    clearInputField(passwordInputEl);
}

function showProfilePhoto(imgElement, user){
    const photo = user.photoURL ? user.photoURL : `/src/assets/images/default-profile-picture.jpeg`;
    imgElement.src = photo;
}

function showProfileGreeting(imgElement, user){
    const firstName = user.displayName ? user.displayName.split(' ')[0] : 'user';
    imgElement.textContent = `Hey ${firstName}, let's see what we should do today!`
}