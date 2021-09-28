const express = require('express');
const app = express();
const PORT = 8080; //default port 8080

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

function generateRandomString() {
  return Math.random().toString(20).substr(2, 6)
}

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
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) =>{
  res.render('urls_new');
})

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]
  const templateVars = { shortURL, longURL };
  // console.log("$$$$$templateVars", templateVars); // test log
  res.render("urls_show", templateVars);
});

// post request to add new Url's
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let randomString = generateRandomString()
  urlDatabase[randomString] = req.body.longURL // to extract data from form --> use req.body
  // console.log('*****DATABASE', urlDatabase) //test log
  res.redirect(`/urls/${randomString}`);
});

// post request to delete Url's
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  delete urlDatabase[shortURL]
  console.log(urlDatabase) // test log to see if Database updated
  res.redirect("/urls");
});

// post to update longURL
app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL
  urlDatabase[shortURL] = req.body.newURL
  res.redirect("/urls")
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  res.redirect(`/urls/${shortURL}`)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});