const express = require('express');
const app = express();
const PORT = 8080; //default port 8080

const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');

const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

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

// helper function
const randomStringGen = function() {
  return Math.random().toString(20).substr(2, 6);
};

// helper function to lookup if user exists
const userLookup = function(currentEmail, users) {
  for (let user in users) {
    const currentUser = users[user];
    if (currentUser["email"] === currentEmail) {
      return currentUser;
    }
  }
  return false;
};

// helper function to make sure shortURL exists before redirect
const shortURLLookup = function (submittedURL, urlDatabase) {
  for (shortURL in urlDatabase) {
    if(shortURL === submittedURL) {
      return true;
    }
  }
  return false;
};

// helper function to return url's of user
const urlsForUser = function(currentID, urlDatabase) {
  const userUrls = {};
  for (let url in urlDatabase) {
    const shortURL = urlDatabase[url];
    if (shortURL['userID'] === currentID) {
      userUrls[url] = shortURL;
    }
  }
  return userUrls;
};

// helper function to verify if user has access to edit shortURL
const urlAccess = function(shortURL, currentID, urlDatabase) {
  for (url in urlDatabase) {
    const urlToMatch = urlDatabase[url]
    if (url === shortURL && urlToMatch["userID"] === currentID) {
      return true;
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

// get to display urls that user already submitted
app.get('/urls', (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  // console.log(urlDatabase) // test log
  // call urlsForUser() to get user urls
  const urlToDisplay = urlsForUser(userID, urlDatabase)
  const templateVars = {
    user,
    urls: urlToDisplay
  };
  // console.log("templateVars:", templateVars) // test log
  res.render('urls_index', templateVars);
});


// get to create new url
app.get('/urls/new', (req, res) =>{
  const userID = req.cookies["user_id"];
  // console.log("userID: ", userID) // test log
  if (userID === undefined) { // ****************************use (!userID)
    res.redirect("/login") //how to return relevant error message? --> getting console error at this point
  }
  const user = users[userID];
  const templateVars = { user };
  res.render('urls_new', templateVars);
});

// post request to add new Url's
app.post("/urls", (req, res) => {
  console.log(req.body);  // log new url to console
  const userID = req.cookies["user_id"];
  if (userID === undefined) { // ********************************** use (!userID)
    res.redirect("/login") //how to return relevant error message?
  }
  const randomString = randomStringGen();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID
  }
  // console.log("*********", urlDatabase) // test log
  res.redirect(`/urls/${randomString}`);
});

// get to display individual shortURL page
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const userID = req.cookies["user_id"];
  // verify that shortURL is valid
  if (!shortURLLookup(shortURL, urlDatabase)) {
    res.status(401).send("Invalid short URL") //--> make actual page?
  }
  // verify that shortURL is owned by current userID
  if (!urlAccess(shortURL,userID , urlDatabase)){
    res.send('Invalid Access') //--> make actual page?
  }
  const user = users[userID];
  const templateVars = {
    user,
    shortURL,
    longURL
  };
  // console.log("$$$$$templateVars", templateVars); // test log
  res.render("urls_show", templateVars);
});


// post request to delete Url's
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  //verify that current user owns url before delete
  if (!urlAccess(shortURL, userID, urlDatabase)) {
    res.status(400).send("you do not have permission to delete this URL")
  } else {
    delete urlDatabase[shortURL];
    console.log(urlDatabase); // test log to see if Database updated
    res.redirect("/urls");
  }
});

// post to update longURL
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  //verify that current user owns url before edit
  if (!urlAccess(shortURL, userID, urlDatabase)) {
    res.status(400).send("you do not have permission to edit this URL")
  } else {
  urlDatabase[shortURL]["longURL"] = req.body.newURL;
  res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

// redirect to longURL from shortURL page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[req.params.shortURL];
  // verify that url is valid before redirect, if not send to error page
  request(`${longURL["longURL"]}`, (error, response, body) => {
    if (error) {
      res.send("Invalid URL")
    }
    if (response.statusCode !== 200) {
      res.send("Invalid URL")
    }
    res.redirect(longURL["longURL"])
  })
});

// get /login page
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const templateVars = { user };
  res.render("login_page", templateVars);
});

// post to login ********************************************************************************************************************************************************
app.post("/login", (req, res) => {
  const userEmail = req.body["email"];
  const submittedPassword = req.body["password"];
  const loginUser = userLookup(userEmail, users);
  // verify if user exists and checks if passwords match --> could be helper function
  if (bcrypt.compareSync(submittedPassword, loginUser["password"])) {
    res.cookie('user_id', loginUser["id"]);
  } else {
    res.status(403).send("Invalid email or password");
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
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const templateVars = { user };
  res.render('register_page', templateVars);
});

// post to register new user
app.post("/register", (req, res) => {
  const id = randomStringGen();
  const email = req.body["email"];
  const password = req.body["password"]
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log("hashed: ", hashedPassword) // test log
  //verify if email/password boxes are empty
  if (req.body["email"] === '' || req.body["password"] === '') {
    res.status(400).send("Empty email or password field");
  }
  //verify that email is not already stored in db
  if (userLookup(req.body["email"], users)) {
    res.status(400).send("Email already registered");
  }
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  console.log(users);
  res.cookie('user_id', id);
  res.redirect('/urls');
});
