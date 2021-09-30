const { assert } = require('chai');

const { getUserByEmail, shortURLLookup, urlsForUser, urlAccess } = require('../helpers.js');

const testUsers = {
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

describe('getUserByEmail', function() {
  it('Should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.deepEqual(user["id"], expectedOutput);
  });
  it('Should return false with invalid email', function() {
    const user = getUserByEmail("test@test.com", testUsers);
    assert.isFalse(user);
  });
  it('Should return false with no email', function() {
    const user = getUserByEmail("", testUsers);
    assert.isFalse(user);
  });
});

describe('shortURLLookup', function() {
  it("Should return true with valid shortURL", function() {
    const shortURL = shortURLLookup("b2xVn2", urlDatabase);
    assert.isTrue(shortURL);
  });
  it("Should return false with invalid shortURL", function() {
    const shortURL = shortURLLookup("123456", urlDatabase);
    assert.isFalse(shortURL);
  });
  it("Should return false with empty shortURL", function() {
    const shortURL = shortURLLookup("", urlDatabase);
    assert.isFalse(shortURL);
  });
});

describe('urlsForUser', function() {
  it("Should return urls with valid userID", function() {
    const urls = urlsForUser("aJ48lW", urlDatabase);
    const expected = {
      b2xVn2: {
        longURL: "http://www.lighthouselabs.ca",
        userID: "aJ48lW"
      },
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
      }
    };
    assert.deepEqual(urls, expected);
  });
  it("Should return empty object with invalid userID", function() {
    const urls = urlsForUser("123456", urlDatabase);
    const expected = {};
    assert.deepEqual(urls, expected);
  });
});

describe('urlAccess', function() {
  it("Should return true if user has matching userID as shortURL", function() {
    const access = urlAccess("i3BoGr", "aJ48lW", urlDatabase);
    assert.isTrue(access);
  });
  it("Should return false if user has different userID than shortURL", function() {
    const access = urlAccess("i3BoGr", "123456", urlDatabase);
    assert.isFalse(access);
  });
  it("Should return false if invalid shortURL", function() {
    const access = urlAccess("123456", "aJ48lW", urlDatabase);
    assert.isFalse(access);
  });
});