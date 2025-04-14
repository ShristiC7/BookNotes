# BookNotes
📚 My Book Notes
A personal web app for tracking books you've read, taking notes, and rating your reading experience. Built with Node.js, Express, PostgreSQL, and EJS, this project helps you stay organized with your reading while offering a beautiful and simple UI.



✨ Features
📖 Add books you've read, including:

Cover image (via Open Library Covers API)

Author, title, short description, and rating

Your personal notes

📝 View full notes for each book on its individual page

🔄 Edit or delete book entries easily

➕ Add new books through a dedicated form

🤖 Generate AI summaries of books by name (experimental feature)

🛠️ Tech Stack
Backend: Node.js, Express.js

Database: PostgreSQL

Templating: EJS

APIs: Open Library Covers API

Styling: CSS

🚀 Getting Started
1. Clone the Repo

git clone https://github.com/your-username/book-notes-app.git
cd book-notes-app
2. Install Dependencies

npm install
3. Set Up Environment Variables
Create a .env file and include your database URL and any API keys if needed:

DATABASE_URL=your_postgres_url
PORT=3000
4. Run the App

npm run dev
App will be live at http://localhost:3000

🧠 AI Summary Feature
The app includes an optional AI-powered book summary tool. Simply input a book title and receive a brief summary. (Note: This may require setting up an API key depending on the implementation.)

📂 Folder Structure
java
Copy
Edit
├── public/
├── views/
│   ├── index.ejs
│   ├── book.ejs
│   └── ...
├── routes/
├── db/
├── app.js
├── package.json
└── README.md
📌 Future Improvements
User authentication

Search and filter functionality

Tags or genres for books

Better mobile responsiveness

Save AI summaries to your notes



🙌 Acknowledgements
Open Library API

EJS Templating

PostgreSQL
