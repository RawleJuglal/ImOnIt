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
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    doc, 
    updateDoc,
    deleteDoc,
} from 'firebase/firestore'

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
const db = getFirestore(app);
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

const statusEmojiEls = document.getElementsByClassName('status-emoji-btn');

const completedByEl = document.getElementById('due');
const postInputEl = document.getElementById('post-input');
const postBtnEl = document.getElementById('post-btn');

const tasksEl = document.getElementById('tasks');

const allFilterButtonEl = document.getElementById('all-filter-btn');

const filterButtonEls = document.getElementsByClassName('filter-btn')
/* == UI - Event Listeners == */
googleBtnEl.addEventListener('click', authSignInWithGoogle);

loginBtnEl.addEventListener('click', authSignInWithEmail);

passwordResetLinkEl.addEventListener('click', (event)=> authResetPassword(event));
createUserLinkEl.addEventListener('click', (event) => authCreateNewUser(event));

updateUserProfileBtnEl.addEventListener('click', authUpdateProfile)

signOutBtnEl.addEventListener('click', authSignOut);

for(let statusEmojiEl of statusEmojiEls){
    statusEmojiEl.addEventListener('click', selectStatus);
}

for(let filterButtonEl of filterButtonEls){
    filterButtonEl.addEventListener('click', selectFilter);
}

postBtnEl.addEventListener('click', postButtonPressed);

/* === State === */

let statusState = 0

/* === Global Constants === */

const collectionName = "tasks"

/* === Main Code === */
onAuthStateChanged(auth, (user) => {
    if(user) {
        showLoggedInView()
        showProfilePhoto(userProfilePictureEl, user);
        showProfileGreeting(userProfileGreetingEl, user);
        if(!user.photoURL){
            showView(displayUpdateEl);
        } else {
            hideView(displayUpdateEl);
        }
        fetchAllTasks(user)
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

/* = Functions - Firebase - Firestore = */

async function addPostToDB(dueDate, postBody, user){
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            due: dueDate,
            body: postBody,
            uid:user.uid,
            createdAt:serverTimestamp(),
            status:statusState
        })
        alert(`Document written with ${docRef.id}`);
    } catch (error) {
        console.log(`Error: ${error.code} - ${error.message}, while trying to save`)
    }
}

async function updatePostInDB(docId, newBody){
    const tasksRef = doc(db, collectionName, docId);
    await updateDoc(tasksRef, {body: newBody});
}

async function deletePostFromDB(docId){
    await deleteDoc(doc(db, collectionName, docId));
}

function fetchInRealtimeAndRenderPostsFromDB(query, user){
    onSnapshot(query, (querySnapShot) =>{
        clearAll(tasksEl)
        querySnapShot.forEach((doc) => {
            renderTask(tasksEl, doc)
        })
    })
}

function fetchTodayPosts(user){
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const endOfDay = new Date();
    endOfDay.setHours(24,59,59,999);

    const tasksRef = collection(db, collectionName)

    const q = query(tasksRef, where("uid", "==", user.uid),
                                where("createdAt", '>=', startOfDay),
                                where("createdAt", "<=", endOfDay),
                                orderBy("createdAt", 'asc'));

    fetchInRealtimeAndRenderPostsFromDB(q, user);
}

function fetchWeekPosts(user){
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0)

    if(startOfWeek.getDay() === 0){
        startOfWeek.setDate(startOfWeek.getDate()- 6)
    } else {
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    }

    const endOfDay = new Date()
    endOfDay.setHours(24,59,59,999);

    const tasksRef = collection(db, collectionName);

    const q = query(tasksRef, where("uid", "==", user.uid),
                                where("createdAt", ">=", startOfWeek),
                                where("createdAt", "<=", endOfDay),
                                orderBy("createdAt", "asc") );

    fetchInRealtimeAndRenderPostsFromDB(q, user);
}

function fetchAllTasks(user){
    const tasksRef = collection(db, collectionName);

    const q = query(tasksRef, where("uid", "==", user.uid),
                    orderBy("due", "asc"));

    fetchInRealtimeAndRenderPostsFromDB(q, user);
}


/* == Functions - UI Functions == */
function createPostHeader(postData){
    const statusColors = ['red', 'orange', 'yellow', 'white', 'blue'];
    const headerDiv = document.createElement("div");
    headerDiv.className = "header";

    const statusImage = document.createElement("img");
    statusImage.classList.add('fire', statusColors[postData.status - 1]);

    const headerDateEl = document.createElement('h3');

    headerDateEl.textContent = `Due: ${postData.due} - Created: ${displayDate(postData.createdAt)}`;

    headerDiv.appendChild(statusImage);
    headerDiv.appendChild(headerDateEl);

    return headerDiv;
}

function createPostBody(postData){
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'body';

    const bodyEl = document.createElement('p');
    bodyEl.textContent = postData.body;

    bodyDiv.appendChild(bodyEl);

    return bodyDiv;
}

function createPostUpdateButton(wholeDoc){
    const postId = wholeDoc.id;
    const postData = wholeDoc.data();

    const button = document.createElement('button');
    button.textContent = "Edit";
    button.classList.add('edit-color');
    button.addEventListener("click", ()=> {
        const newBody = prompt("Edit the post", postData.body);

        if(newBody) {
            updatePostInDB(postId, newBody);
        }
    })

    return button;
}

function createPostDeleteButton(wholeDoc){
    const postId = wholeDoc.id;
    
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.classList.add('delete-color');

    button.addEventListener('click', ()=>{
        deletePostFromDB(postId);
    });

    return button;
}

function createPostFooter(wholeDoc){
    const footerDiv = document.createElement('div');
    footerDiv.className = 'footer';

    footerDiv.appendChild(createPostUpdateButton(wholeDoc));
    footerDiv.appendChild(createPostDeleteButton(wholeDoc));

    return footerDiv;
}

function renderTask(tasksEl, wholeDoc){
    const postData = wholeDoc.data()

    const postDiv = document.createElement('div');
    postDiv.className = 'post'

    postDiv.appendChild(createPostHeader(postData));
    postDiv.appendChild(createPostBody(postData));
    postDiv.appendChild(createPostFooter(wholeDoc));

    tasksEl.appendChild(postDiv);
}


function postButtonPressed(){
    const postBody = postInputEl.value;
    const dueDate = completedByEl.value;
    const user = auth.currentUser;

    if(postBody && statusState){
        addPostToDB(dueDate, postBody, user);
        clearInputField(postInputEl);
        clearInputField(completedByEl);
        resetAllStatusElements(statusEmojiEls);
    }
}

function clearAll(element){
    element.innerHTML = '';
}

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

function displayDate(firebaseDate) {
    if (!firebaseDate) {
      return "Date processing..." 
    }
  
    const date = firebaseDate.toDate()
    
    const day = date.getDate()
    const year = date.getFullYear()
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]
  
    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes
  
    return `${day} ${month} ${year} - ${hours}:${minutes}`
  }

/* = Functions - UI Functions - Mood = */

function selectStatus(event) {
    const selectedStatusEmojiElementId = event.currentTarget.id;
 
    changeStatusStyleAfterSelection(selectedStatusEmojiElementId);

    const chosenStatusValue = returnStatusValueFromElementId(selectedStatusEmojiElementId);
    statusState = chosenStatusValue;
}

function changeStatusStyleAfterSelection(selectedStatusElement){
    for(let statusEmojiEl of statusEmojiEls){
        if(selectedStatusElement === statusEmojiEl.id){
            statusEmojiEl.classList.remove('unselected-emoji');
            statusEmojiEl.classList.add('selected-emoji');
        } else {
            statusEmojiEl.classList.remove('selected-emoji');
            statusEmojiEl.classList.add('unselected-emoji');
        }
    }
}

function resetAllStatusElements(allStatusElements){
    for(let statusEmojiEl of allStatusElements){
        statusEmojiEl.classList.remove('selected-emoji');
        statusEmojiEl.classList.remove('unselected-emoji');
    }
}

function returnStatusValueFromElementId(element){
    return Number(element.slice(7))
}

/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons){
    for(let filterButtonEl of filterButtonEls){
        filterButtonEl.classList.remove('selected-filter');
    }
}

function updateFilterButtonStyle(selectedFilterElement){
    selectedFilterElement.classList.add('selected-filter');
}

function fetchTasksFromPeriod(period, user){
    if(period == 'today'){
        fetchTodayPosts(user);
    } else if (period == 'week'){
        fetchWeekPosts(user);
    } else if (period == 'month'){
        fetchMonthPosts(user);
    } else if (period == 'all'){
        fetchAllPosts(user);
    } else {
        console.log('nothing matches');
    }
}

function selectFilter(event){
    const user = auth.currentUser;

    const selectedFilterElementId = event.target.id;

    const selectedFilterPeriod = selectedFilterElementId.split('-')[0];

    const selectedFilterElement = document.getElementById(selectedFilterElementId);

    resetAllFilterButtons(filterButtonEls);

    updateFilterButtonStyle(selectedFilterElement);

    fetchTasksFromPeriod(selectedFilterPeriod, user);
}