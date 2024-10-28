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

            db.get('SELECT COUNT(*) AS count FROM Company', (err, row: any) => {
                if (err) {
                    console.error('Error checking for mock companies:', err.message);
                } else if (row.count === 0) {
                    const insertCompany = db.prepare('INSERT INTO Company (logo, name, status) VALUES (?, ?, ?)');
                    insertCompany.run(
                        'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Jollibee_2011_logo.svg/800px-Jollibee_2011_logo.svg.png',
                        'Jolibee',
                        'Active',
                    );
                    insertCompany.run(
                        'https://upload.wikimedia.org/wikipedia/commons/0/05/McDonald%27s_square_2020.svg',
                        'McDonalds',
                        'Active',
                    );
                    insertCompany.finalize();

                    console.log('Mock companies added.');
                }
            });

            db.get('SELECT COUNT(*) AS count FROM Article', (err, row: any) => {
                if (err) {
                    console.error('Error checking for mock articles:', err.message);
                } else if (row.count === 0) {
                    const insertArticle = db.prepare(
                        'INSERT INTO Article (image, title, link, date, content, status, writerId, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    );
                    insertArticle.run(
                        'uploads/jolibee.jpg',
                        'Jollibee: A Filipino Favorite',
                        'https://www.example.com/jollibee-article',
                        '2024-10-28',
                        '<h1>Jollibee: A Taste of Home</h1><p>Jollibee is a beloved fast-food chain in the Philippines, known for its delicious Chickenjoy fried chicken, Jolly Spaghetti, and Yumburgers.</p><h2>A Unique Flavor</h2><p>What sets Jollibee apart is its unique Filipino-inspired flavors, catering to the local palate.</p>',
                        'Published',
                        1,
                        1,
                    );
                    insertArticle.run(
                        'uploads/mcdonalds.jpeg',
                        "McDonald's: A Global Icon",
                        'https://www.example.com/mcdonalds-article',
                        '2024-10-28',
                        "<h1>McDonald's: A Worldwide Phenomenon</h1><p>McDonald's is a global fast-food giant, famous for its Big Macs, Quarter Pounders, and French Fries.</p><h2>Consistent Quality</h2><p>McDonald's is known for its consistent quality and familiar menu items, no matter where you are in the world.</p>",
                        'Published',
                        1,
                        2,
                    );
                    insertArticle.finalize();

                    console.log('Mock articles added.');
                }
            });
        });
    }
});

export default db;
