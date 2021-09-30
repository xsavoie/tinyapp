// helper function
const randomStringGen = function() {
  return Math.random().toString(20).substr(2, 6);
};

// helper function to lookup if user exists
const getUserByEmail = function(currentEmail, users) {
  for (let user in users) {
    const currentUser = users[user];
    if (currentUser["email"] === currentEmail) {
      return currentUser;
    }
  }
  return false;
};

// helper function to make sure shortURL exists before redirect
const shortURLLookup = function(submittedURL, urlDatabase) {
  for (let shortURL in urlDatabase) {
    if (shortURL === submittedURL) {
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

// helper function to verify if user has access to edit/delete shortURL
const urlAccess = function(shortURL, currentID, urlDatabase) {
  for (let url in urlDatabase) {
    const urlToMatch = urlDatabase[url];
    if (url === shortURL && urlToMatch["userID"] === currentID) {
      return true;
    }
  }
  return false;
};

module.exports = {
  randomStringGen,
  getUserByEmail,
  shortURLLookup,
  urlsForUser,
  urlAccess
};