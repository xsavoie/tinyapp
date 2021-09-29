const express = require('express');
const app = express();
const PORT = 8080; //default port 8080

app.set('view engine', 'ejs');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// helper functions
const randomStringGen = function() {
  return Math.random().toString(20).substr(2, 6);
};

const userLookup = function (currentEmail, users) {
  for(let user in users) {
    const currentUser = users[user]
    if (currentUser["email"] === currentEmail){
      return currentUser;
    }
  }
  return false;
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/', (req, res) => {
  res.send('Hello!');
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  const userID = req.cookies["user_id"]
  const user = users[userID]
  const templateVars = {
    user,
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) =>{
  const userID = req.cookies["user_id"]
  const user = users[userID]
  const templateVars = { user };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const userID = req.cookies["user_id"]
  const user = users[userID]
  const templateVars = {
    user,
    shortURL,
    longURL
  };
  // console.log("$$$$$templateVars", templateVars); // test log
  res.render("urls_show", templateVars);
});

// post request to add new Url's
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const randomString = randomStringGen();
  urlDatabase[randomString] = req.body.longURL; // to extract data from form --> use req.body
  // console.log('*****DATABASE', urlDatabase) //test log
  res.redirect(`/urls/${randomString}`);
});

// post request to delete Url's
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  // console.log(urlDatabase); // test log to see if Database updated
  res.redirect("/urls");
});

// post to update longURL
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// redirect to longURL from shortURL page
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// get /login page
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"]
  const user = users[userID]
  const templateVars = { user };
  res.render("login_page", templateVars);
});

// post to login INCOMPLETE - DOES NOT PULL ALL USER DETAIL
app.post("/login", (req, res) => {
  const nameValue = req.body["email"];
  const password = req.body["password"]
  const loginUser = userLookup(nameValue, users)
  // console.log("submitted password: ", password)
  // console.log("loginUser:", loginUser)
  // console.log("user pass: ", loginUser["password"])
  // console.log("id: ", loginUser["id"])
  if (loginUser && loginUser["password"] === password) {
    res.cookie('user_id', loginUser["id"]) //issue with this - does not generate user in system

  } else {
    res.status(403).send("Invalid email or password")
  }
  res.redirect('/urls');
});

// post to logout 
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// get /register page
app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"]
  const user = users[userID]
  const templateVars = { user };
  res.render('register_page', templateVars);
});

// post to register new user
app.post("/register", (req, res) => {
  const randomString = randomStringGen();
  //verify if email/password boxes are empty
  if (req.body["email"] === '' || req.body["password"] === '') {
    res.status(400).send("Empty email or password field")
  }
  //verify that email is not already stored in db
  if (userLookup(req.body["email"], users)) {
    res.status(400).send("Email already registered")
  }
  users[randomString] = {
    id: randomString,
    email: req.body["email"],
    password: req.body["password"]
  };
  console.log(users);
  res.cookie('user_id', randomString); 
  res.redirect('/urls');
});
