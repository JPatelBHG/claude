const express = require('express');
const { db } = require('../db/init');

const router = express.Router();

// Get all sections
router.get('/sections', (req, res) => {
  db.all(
    'SELECT * FROM rfp_sections ORDER BY section_num',
    (err, sections) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get question counts and answered counts for each section
      Promise.all(
        sections.map(section => {
          return new Promise((resolve, reject) => {
            db.get(
              `SELECT COUNT(*) as total_questions,
                      SUM(CASE WHEN ra.id IS NOT NULL THEN 1 ELSE 0 END) as answered_questions
               FROM rfp_questions rq
               LEFT JOIN rfp_answers ra ON rq.id = ra.question_id AND ra.user_id = ?
               WHERE rq.section_id = ?`,
              [req.userId, section.id],
              (err, counts) => {
                if (err) reject(err);
                else resolve({
                  ...section,
                  total_questions: counts.total_questions,
                  answered_questions: counts.answered_questions || 0
                });
              }
            );
          });
        })
      )
        .then(sectionsWithCounts => res.json(sectionsWithCounts))
        .catch(err => res.status(500).json({ error: err.message }));
    }
  );
});

// Get questions for a specific section
router.get('/sections/:sectionId/questions', (req, res) => {
  const sectionId = req.params.sectionId;

  db.all(
    `SELECT rq.*,
            ra.id as answer_id, ra.answer_text, ra.updated_at
     FROM rfp_questions rq
     LEFT JOIN rfp_answers ra ON rq.id = ra.question_id AND ra.user_id = ?
     WHERE rq.section_id = ?
     ORDER BY CAST(SUBSTR(rq.question_num, INSTR(rq.question_num, '.') + 1) AS INTEGER)`,
    [req.userId, sectionId],
    (err, questions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(questions);
    }
  );
});

// Get all user answers
router.get('/answers', (req, res) => {
  db.all(
    `SELECT ra.*, rq.section_id, rq.question_num
     FROM rfp_answers ra
     JOIN rfp_questions rq ON ra.question_id = rq.id
     WHERE ra.user_id = ?
     ORDER BY rq.section_id, CAST(SUBSTR(rq.question_num, INSTR(rq.question_num, '.') + 1) AS INTEGER)`,
    [req.userId],
    (err, answers) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(answers);
    }
  );
});

// Get progress summary
router.get('/progress', (req, res) => {
  db.get(
    `SELECT COUNT(DISTINCT rq.id) as total_questions,
            COUNT(DISTINCT ra.id) as answered_questions
     FROM rfp_questions rq
     LEFT JOIN rfp_answers ra ON rq.id = ra.question_id AND ra.user_id = ?`,
    [req.userId],
    (err, progress) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const percentage = progress.total_questions > 0
        ? Math.round((progress.answered_questions / progress.total_questions) * 100)
        : 0;

      res.json({
        ...progress,
        percentage,
        unanswered_questions: progress.total_questions - progress.answered_questions
      });
    }
  );
});

// Save or update answer
router.post('/answers', (req, res) => {
  const { question_id, answer_text } = req.body;

  if (!question_id) {
    return res.status(400).json({ error: 'question_id is required' });
  }

  // Check if answer exists
  db.get(
    'SELECT id FROM rfp_answers WHERE user_id = ? AND question_id = ?',
    [req.userId, question_id],
    (err, answer) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (answer) {
        // Update existing answer
        db.run(
          'UPDATE rfp_answers SET answer_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [answer_text, answer.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({ id: answer.id, question_id, answer_text, updated_at: new Date() });
          }
        );
      } else {
        // Create new answer
        db.run(
          'INSERT INTO rfp_answers (user_id, question_id, answer_text) VALUES (?, ?, ?)',
          [req.userId, question_id, answer_text],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
              id: this.lastID,
              question_id,
              answer_text,
              updated_at: new Date()
            });
          }
        );
      }
    }
  );
});

module.exports = router;
