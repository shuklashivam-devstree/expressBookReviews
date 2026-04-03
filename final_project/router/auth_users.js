const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  if (!username || typeof username !== "string" || username.trim() === "") {
    return false;
  }
  return !users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some(
    (user) => user.username === username && user.password === password,
  );
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });

  req.session.authorization = {
    accessToken,
    username,
  };

  return res
    .status(200)
    .json({ message: "User successfully logged in", token: accessToken });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const username =
    req.session &&
    req.session.authorization &&
    req.session.authorization.username;
  const isbn = req.params.isbn;
  const { review } = req.body;

  if (!username) {
    return res.status(403).json({ message: "User not authorized" });
  }
  if (!isbn || !books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }
  if (!review || typeof review !== "string") {
    return res.status(400).json({ message: "Review text is required" });
  }

  books[isbn].reviews = books[isbn].reviews || {};
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: "Review added/updated successfully",
    reviews: books[isbn].reviews,
  });
});

// delete the review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const username =
    req.session &&
    req.session.authorization &&
    req.session.authorization.username;
  const isbn = req.params.isbn;

  if (!username) {
    return res.status(403).json({ message: "User not authorized" });
  }
  if (!isbn || !books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: "Review deleted successfully",
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
