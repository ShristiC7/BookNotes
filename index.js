import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import env from 'dotenv';
const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
env.config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

app.get("/", async (req, res) => {
  try {
    const bookresult = await db.query("SELECT * FROM book ORDER BY id DESC");

    // Fetch book details from Open Library if not present in the database
    const booksWithCover = await Promise.all(bookresult.rows.map(async (book) => {
      // Check if the book already has a cover (via OLID or ISBN)
      let coverUrl = book.coverUrl || null;
      let description = book.description || "No description available.";

      if (!coverUrl && !book.isbn) {
        // If no cover or ISBN, fallback to Open Library API search using title and author
        const title = encodeURIComponent(book.name);
        const author = encodeURIComponent(book.author);
        
        try {
          const openLibraryResponse = await fetch(`https://openlibrary.org/search.json?title=${title}&author=${author}`);
          const data = await openLibraryResponse.json();

          if (data.docs && data.docs.length > 0) {
            const bookInfo = data.docs[0];
            coverUrl = bookInfo.cover_i ? `https://covers.openlibrary.org/b/id/${bookInfo.cover_i}-M.jpg` : null;
            description = bookInfo.first_sentence?.[0] || description;
          }
        } catch (err) {
          console.error("Error fetching book details from Open Library", err);
        }
      }

      // Return the book with updated cover and description
      return { ...book, coverUrl, description };
    }));

    res.render("home", { book: booksWithCover, summarybook: null });
  } catch (error) {
    console.log(error);
    res.send("Error fetching books!");
  }
});


app.get("/book/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM book WHERE id=$1', [bookId]);
    const book = result.rows[0];

    // Replace newlines in notes if necessary
    if (book) {
      book.notes = book.notes.replace(/\\n/g, '\n'); // Ensure line breaks are displayed
    }

    // Fallback to Open Library API if cover URL and description are not present
    if (!book.coverUrl || !book.description) {
      const title = encodeURIComponent(book.name);
      const author = encodeURIComponent(book.author);

      const openLibraryResponse = await fetch(`https://openlibrary.org/search.json?title=${title}&author=${author}`);
      const data = await openLibraryResponse.json();

      if (data.docs && data.docs.length > 0) {
        const bookInfo = data.docs[0];
        book.coverUrl = bookInfo.cover_i ? `https://covers.openlibrary.org/b/id/${bookInfo.cover_i}-M.jpg` : null;
        book.description = bookInfo.first_sentence?.[0] || "No description available.";
      }
    }

    if (!book) {
      return res.status(404).send('Book not found');
    }
    res.render("book", { book });
  } catch (error) {
    console.log(error);
    res.status(500).send('Book details not found!');
  }
});


app.post('/ai-summary', async (req, res) => {
  const title = req.body.title;

  try {
    // Fetch book details from Open Library API based on the book title
    const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`);
    const data = await response.json();

    let summarybook = null;
    if (data.docs && data.docs.length > 0) {
      const bookInfo = data.docs[0];
      const author = bookInfo.author_name?.[0] || 'Unknown';
      const olid = bookInfo.key.split('/').pop(); // Extract the OLID (last part of the key)
      const coverUrl = `https://covers.openlibrary.org/b/id/${bookInfo.cover_i}-M.jpg`;

      summarybook = {
        title: bookInfo.title,
        author: author,
        coverUrl: coverUrl,
        description: bookInfo.first_sentence?.[0] || "No description available.",
        olid: olid // Add the OLID to the summarybook object
      };
    }

    // Fetch books from your database
    const bookresult  = await db.query('SELECT * FROM book ORDER BY id DESC');
    res.render('home', { book: bookresult.rows, summarybook }); // Send summarybook to the template
  } catch (err) {
    console.error(err);
    res.render('home', { book: [], summarybook: null, error: 'Something went wrong' });
  }
});
app.get("/add",  (req,res)=>{
  res.render("add");
});
app.post("/add", async (req,res)=>{
const {name,author,description,notes,rating} = req.body;
try {
  await db.query(
    'INSERT INTO book (name,author,notes,description,rating) VALUES ($1, $2, $3, $4, $5)', [name,author,notes,description,rating]
  );
  res.redirect("/");
} catch (error) {
  console.log(error);
  res.send("Book can't be added");
}
});
app.post("/delete/:id", async(req,res)=>{
  const bookId = req.params.id;
try {
  await db.query('DELETE FROM book WHERE id = $1',[bookId]);
  res.redirect("/");
} catch (error) {
  console.error("Error deleting book:", error);
  res.status(500).send("Failed to delete the book.");
}
});
app.post("/update/:id", async (req, res) => {
  const bookId = req.params.id;
  const { name, author, description, notes, rating } = req.body;
  try {
    await db.query(
      `UPDATE book SET name = $1, author = $2, description = $3, notes = $4, rating = $5 WHERE id = $6`,
      [name, author, description, notes, rating, bookId]
    );
    res.redirect(`/book/${bookId}`);
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).send("Failed to update book.");
  }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
