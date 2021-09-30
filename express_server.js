const express = require('express');
const app = express();
const PORT = 8080; //default port 8080

const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['Pizza for breakfast, lunch and dinner']
}));

const {randomStringGen, getUserByEmail, shortURLLookup, urlsForUser, urlAccess } = require('./helpers');

const request =  require('request');

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
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

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});

app.get('/', (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

// get to display urlDatabase as JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// get to display urls that user owns
app.get('/urls', (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!userID) {
    const templateVars = { user, };
    return res.render("urls_index_loggedOut", templateVars);
  }
  // call urlsForUser() to get urls that user owns
  const urlToDisplay = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user,
    urls: urlToDisplay
  };
  res.render('urls_index', templateVars);
});

// get to create new url
app.get('/urls/new', (req, res) =>{
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }
  const user = users[userID];
  const templateVars = { user };
  res.render('urls_new', templateVars);
});

// post request to add new Url's
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }
  const randomString = randomStringGen();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID
  };
  res.redirect(`/urls/${randomString}`);
});

// get to display individual shortURL page
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const userID = req.session.user_id;
  // verify that shortURL is valid
  if (!shortURLLookup(shortURL, urlDatabase)) {
    return res.status(400).send("Invalid short URL");
  }
  // verify that shortURL is owned by current userID
  if (!urlAccess(shortURL,userID , urlDatabase)) {
    return res.status(403).send('Invalid Access');
  }
  const user = users[userID];
  const templateVars = {
    user,
    shortURL,
    longURL
  };
  res.render("urls_show", templateVars);
});


// post request to delete Url's
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  //verify that current user owns url before delete
  if (!urlAccess(shortURL, userID, urlDatabase)) {
    return res.status(403).send("you do not have permission to delete this URL");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// post to update longURL
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  //verify that current user owns url before edit
  if (!urlAccess(shortURL, userID, urlDatabase)) {
    return res.status(403).send("you do not have permission to edit this URL");
  } else {
    urlDatabase[shortURL]["longURL"] = req.body.newURL;
    res.redirect("/urls");
  }
});

// post to create new shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// redirect to longURL from shortURL link
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL];
  // verify that shortURL is in urlDatabase before redirect
  if (!shortURLLookup(shortURL, urlDatabase)) {
    return res.status(404).send("Invalid short URL");
  }
  // verify that url is valid before redirect, if not send to error page
  request(`${longURL["longURL"]}`, (error, response, body) => {
    if (error) {
      return res.status(404).send("Invalid URL");
    } else if (response.statusCode !== 200) {
      return res.status(404).send("Invalid URL");
    }
    res.redirect(longURL["longURL"]);
  });
});

// get login page
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = { user };
  if (userID) {
    return res.redirect("/urls");
  }
  return res.render("login_page", templateVars);
});

// post to login
app.post("/login", (req, res) => {
  const userEmail = req.body["email"];
  const submittedPassword = req.body["password"];
  const loginUser = getUserByEmail(userEmail, users);
  // verify if user exists and checks if passwords match
  if (!loginUser) {
    return res.status(403).send("Invalid email");
  }
  if (bcrypt.compareSync(submittedPassword, loginUser["password"])) {
    req.session.user_id = loginUser["id"];
  } else {
    return res.status(403).send("Invalid password");
  }
  res.redirect('/urls');
});

// post to logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// get register page
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = { user };
  if (userID) {
    return res.redirect("/urls");
  }
  res.render('register_page', templateVars);
});

// post to register new user
app.post("/register", (req, res) => {
  const id = randomStringGen();
  const email = req.body["email"];
  const password = req.body["password"];
  const hashedPassword = bcrypt.hashSync(password, 10);
  //verify if email/password boxes are empty
  if (req.body["email"] === '' || req.body["password"] === '') {
    return res.status(400).send("Empty email or password field");
  }
  //verify that email is not already stored in db
  if (getUserByEmail(req.body["email"], users)) {
    return res.status(400).send("Email already registered");
  }
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  req.session.user_id = id;
  res.redirect('/urls');
});
