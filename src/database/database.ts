import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('writerhub.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the Writer Hub database.');

        db.serialize(() => {
            // Create tables
            db.run(`
                CREATE TABLE IF NOT EXISTS Company (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    logo TEXT NOT NULL,
                    name TEXT NOT NULL,
                    status TEXT CHECK(status IN ('Active', 'Inactive')) NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS User (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    firstname TEXT NOT NULL,
                    lastname TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    type TEXT CHECK(type IN ('Writer', 'Editor')) NOT NULL,
                    status TEXT CHECK(status IN ('Active', 'Inactive')) NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS Article (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image TEXT NOT NULL,
                    title TEXT NOT NULL,
                    link TEXT NOT NULL,
                    date DATE NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT CHECK(status IN ('For Edit', 'Published')) NOT NULL,
                    writerId INTEGER,
                    editorId INTEGER,
                    companyId INTEGER,
                    FOREIGN KEY (writerId) REFERENCES User(id),
                    FOREIGN KEY (editorId) REFERENCES User(id),
                    FOREIGN KEY (companyId) REFERENCES Company(id)
                )
            `);

            // Check if mock users already exist
            db.get('SELECT COUNT(*) AS count FROM User', (err, row: any) => {
                if (err) {
                    console.error('Error checking for mock users:', err.message);
                } else if (row.count === 0) {
                    // Insert mock users only if the User table is empty
                    const insertEditor = db.prepare(
                        'INSERT INTO User (firstname, lastname, email, password, type, status) VALUES (?, ?, ?, ?, ?, ?)',
                    );
                    insertEditor.run('John', 'Doe', 'john.doe@example.com', 'password123', 'Editor', 'Active');
                    insertEditor.finalize();

                    const insertWriter = db.prepare(
                        'INSERT INTO User (firstname, lastname, email, password, type, status) VALUES (?, ?, ?, ?, ?, ?)',
                    );
                    insertWriter.run('Jane', 'Doe', 'jane.doe@example.com', 'password456', 'Writer', 'Active');
                    insertWriter.finalize();

                    console.log('Mock users added.');
                }
            });
        }); // End of db.serialize
    }
});

export default db;
