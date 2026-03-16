const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'rfp.db');

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

function initializeDatabase() {
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        company_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS rfp_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_num INTEGER UNIQUE NOT NULL,
        section_title TEXT NOT NULL,
        description TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS rfp_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        question_num TEXT NOT NULL,
        question_text TEXT NOT NULL,
        priority TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES rfp_sections(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS rfp_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        answer_text TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (question_id) REFERENCES rfp_questions(id),
        UNIQUE(user_id, question_id)
      )
    `);

    // Seed RFP sections if not exists
    db.get('SELECT COUNT(*) as count FROM rfp_sections', (err, row) => {
      if (row.count === 0) {
        const sections = [
          { section_num: 1, title: 'Company & Vendor Overview', desc: 'Assess vendor stability, experience, and strategic direction' },
          { section_num: 2, title: 'Security & Compliance', desc: 'Assess risk mitigation capabilities and regulatory compliance' },
          { section_num: 3, title: 'Implementation & Support', desc: 'Assess implementation approach, timeline, and ongoing support model' },
          { section_num: 4, title: 'Platform Features', desc: 'Assess functional capabilities aligned with SelectQuote requirements' },
          { section_num: 5, title: 'Pricing & Commercial Terms', desc: 'Understand total cost of ownership and contract terms' }
        ];

        sections.forEach(section => {
          db.run(
            'INSERT INTO rfp_sections (section_num, section_title, description) VALUES (?, ?, ?)',
            [section.section_num, section.title, section.desc]
          );
        });

        // Seed RFP questions
        seedRFPQuestions();
      }
    });
  });
}

function seedRFPQuestions() {
  const rfpData = require('./rfp_data.json');

  rfpData.forEach(section => {
    db.get(
      'SELECT id FROM rfp_sections WHERE section_num = ?',
      [section.section_num],
      (err, sectionRow) => {
        if (sectionRow) {
          section.questions.forEach(question => {
            db.run(
              'INSERT INTO rfp_questions (section_id, question_num, question_text, priority) VALUES (?, ?, ?, ?)',
              [sectionRow.id, question.num, question.text, question.priority],
              (err) => {
                if (err) console.error('Error seeding question:', err);
              }
            );
          });
        }
      }
    );
  });
}

function getDatabase() {
  return db;
}

module.exports = {
  db,
  initializeDatabase,
  getDatabase
};
