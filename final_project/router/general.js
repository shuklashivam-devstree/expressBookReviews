const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User successfully registered" });
});

// Get the book list available in the shop
public_users.get("/", function (req, res) {
  return res.status(200).json(books);
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  return res.status(200).json(book);
});

// Get book details based on author
public_users.get("/author/:author", function (req, res) {
  const author = req.params.author;
  const filtered = Object.keys(books)
    .map((isbn) => ({ isbn, ...books[isbn] }))
    .filter((b) => b.author.toLowerCase() === author.toLowerCase());

  if (filtered.length === 0) {
    return res.status(404).json({ message: "No books found for given author" });
  }

  return res.status(200).json(filtered);
});

// Get all books based on title
public_users.get("/title/:title", function (req, res) {
  const title = req.params.title;
  const filtered = Object.keys(books)
    .map((isbn) => ({ isbn, ...books[isbn] }))
    .filter((b) => b.title.toLowerCase() === title.toLowerCase());

  if (filtered.length === 0) {
    return res.status(404).json({ message: "No books found for given title" });
  }

  return res.status(200).json(filtered);
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book.reviews || {});
});

// Axios-based endpoints (using async/await and Promise callback syntax)
// 1) Get list of books available in the shop (async/await)
public_users.get("/axios/books", async function (req, res) {
  try {
    const response = await axios.get("http://localhost:5000/");
    return res.status(200).json({ source: "axios", data: response.data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to fetch book list", error: error.message });
  }
});

// 2) Get book details based on ISBN (Promise .then/.catch)
public_users.get("/axios/isbn/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  axios
    .get(`http://localhost:5000/isbn/${isbn}`)
    .then((response) => {
      return res.status(200).json({ source: "axios", data: response.data });
    })
    .catch((error) => {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ message: "Book not found" });
      }
      return res.status(500).json({
        message: "Unable to fetch book by ISBN",
        error: error.message,
      });
    });
});

// 3) Get book details based on author (async/await)
public_users.get("/axios/author/:author", async function (req, res) {
  const author = req.params.author;
  try {
    const response = await axios.get(
      `http://localhost:5000/author/${encodeURIComponent(author)}`,
    );
    return res.status(200).json({ source: "axios", data: response.data });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res
        .status(404)
        .json({ message: "No books found for given author" });
    }
    return res.status(500).json({
      message: "Unable to fetch books by author",
      error: error.message,
    });
  }
});

// 4) Get book details based on title (Promise .then/.catch)
public_users.get("/axios/title/:title", function (req, res) {
  const title = req.params.title;
  axios
    .get(`http://localhost:5000/title/${encodeURIComponent(title)}`)
    .then((response) => {
      return res.status(200).json({ source: "axios", data: response.data });
    })
    .catch((error) => {
      if (error.response && error.response.status === 404) {
        return res
          .status(404)
          .json({ message: "No books found for given title" });
      }
      return res.status(500).json({
        message: "Unable to fetch books by title",
        error: error.message,
      });
    });
});

module.exports.general = public_users;
