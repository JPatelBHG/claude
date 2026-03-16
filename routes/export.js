const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { db } = require('../db/init');

const router = express.Router();

function getAnswersData(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT rs.section_num, rs.section_title,
              rq.question_num, rq.question_text, rq.priority,
              ra.answer_text, ra.updated_at
       FROM rfp_sections rs
       LEFT JOIN rfp_questions rq ON rs.id = rq.section_id
       LEFT JOIN rfp_answers ra ON rq.id = ra.question_id AND ra.user_id = ?
       ORDER BY rs.section_num, CAST(SUBSTR(rq.question_num, INSTR(rq.question_num, '.') + 1) AS INTEGER)`,
      [userId],
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }
    );
  });
}

function getUserInfo(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT email, company_name FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

function getProgress(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(DISTINCT rq.id) as total_questions,
              COUNT(DISTINCT ra.id) as answered_questions
       FROM rfp_questions rq
       LEFT JOIN rfp_answers ra ON rq.id = ra.question_id AND ra.user_id = ?`,
      [userId],
      (err, progress) => {
        if (err) reject(err);
        else {
          const percentage = progress.total_questions > 0
            ? Math.round((progress.answered_questions / progress.total_questions) * 100)
            : 0;
          resolve({ ...progress, percentage });
        }
      }
    );
  });
}

// Export as PDF
router.post('/pdf', async (req, res) => {
  try {
    const [data, user, progress] = await Promise.all([
      getAnswersData(req.userId),
      getUserInfo(req.userId),
      getProgress(req.userId)
    ]);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="RFP_Responses.pdf"');

    doc.pipe(res);

    // Title page
    doc.fontSize(24).font('Helvetica-Bold').text('RFP Response Document', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text(`Company: ${user.company_name || 'N/A'}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Completion: ${progress.percentage}% (${progress.answered_questions}/${progress.total_questions} answered)`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Group data by section
    const groupedData = {};
    data.forEach(row => {
      if (!groupedData[row.section_num]) {
        groupedData[row.section_num] = {
          title: row.section_title,
          questions: []
        };
      }
      if (row.question_num) {
        groupedData[row.section_num].questions.push(row);
      }
    });

    // Add sections
    Object.keys(groupedData).sort((a, b) => a - b).forEach(sectionNum => {
      const section = groupedData[sectionNum];

      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text(`Section ${sectionNum}: ${section.title}`);
      doc.moveDown();

      section.questions.forEach(question => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${question.question_num} [${question.priority}]`);
        doc.fontSize(10).font('Helvetica').text(question.question_text);
        doc.moveDown(0.3);

        if (question.answer_text) {
          doc.fontSize(10).font('Helvetica').fillColor('blue').text(`Answer: ${question.answer_text}`);
        } else {
          doc.fontSize(10).font('Helvetica').fillColor('red').text('NOT ANSWERED');
        }
        doc.fillColor('black');
        doc.moveDown();
      });
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export as Excel
router.post('/excel', async (req, res) => {
  try {
    const [data, user, progress] = await Promise.all([
      getAnswersData(req.userId),
      getUserInfo(req.userId),
      getProgress(req.userId)
    ]);

    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ];

    summarySheet.addRows([
      { metric: 'Company Name', value: user.company_name || 'N/A' },
      { metric: 'Email', value: user.email },
      { metric: 'Completion Percentage', value: `${progress.percentage}%` },
      { metric: 'Questions Answered', value: `${progress.answered_questions}/${progress.total_questions}` },
      { metric: 'Export Date', value: new Date().toLocaleString() }
    ]);

    // Style summary
    summarySheet.getRow(1).font = { bold: true };

    // Group data by section
    const groupedData = {};
    data.forEach(row => {
      if (!groupedData[row.section_num]) {
        groupedData[row.section_num] = {
          title: row.section_title,
          questions: []
        };
      }
      if (row.question_num) {
        groupedData[row.section_num].questions.push(row);
      }
    });

    // Add sheets for each section
    Object.keys(groupedData).sort((a, b) => a - b).forEach(sectionNum => {
      const section = groupedData[sectionNum];
      const sheetName = `Section ${sectionNum}`.substring(0, 31); // Excel sheet name limit
      const sheet = workbook.addWorksheet(sheetName);

      sheet.columns = [
        { header: 'Question #', key: 'question_num', width: 12 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Question', key: 'question_text', width: 50 },
        { header: 'Answer', key: 'answer_text', width: 60 },
        { header: 'Last Updated', key: 'updated_at', width: 20 }
      ];

      sheet.addRows(section.questions.map(q => ({
        question_num: q.question_num,
        priority: q.priority || 'MEDIUM',
        question_text: q.question_text,
        answer_text: q.answer_text || 'NOT ANSWERED',
        updated_at: q.updated_at ? new Date(q.updated_at).toLocaleDateString() : ''
      })));

      // Style header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Style priority column with colors
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const priorityCell = row.getCell('priority');
          if (priorityCell.value === 'CRITICAL') {
            priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
            priorityCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          } else if (priorityCell.value === 'HIGH') {
            priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } };
            priorityCell.font = { bold: true };
          }
        }
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="RFP_Responses.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
