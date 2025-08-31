import prisma from '../config/prismaClient.js';

export const createExam = async (req, res) => {
  try {
    const exam = await prisma.exam.create({
      data: { 
        ...req.body, 
        createdBy: req.user.id // This should now be a string (User.id)
      }
    });
    res.json({ id: exam.id, message: 'Exam created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionText, options, correct, marks, difficulty, explanation } = req.body;
    
    // Convert examId to integer
    const examIdInt = parseInt(examId);
    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    
    const question = await prisma.question.create({
      data: { 
        examId: examIdInt, 
        questionText, 
        options, 
        correct, 
        marks, 
        difficulty, 
        explanation 
      }
    });
    res.json({ id: question.id, message: 'Question added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await prisma.exam.findMany();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const examIdInt = parseInt(examId);
    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    
    const exam = await prisma.exam.findUnique({
      where: { id: examIdInt },
      include: { questions: true }
    });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAvailableExams = async (req, res) => {
  try {
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gte: now }
      }
    });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const examIdInt = parseInt(examId);
    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    
    const exam = await prisma.exam.findUnique({
      where: { id: examIdInt },
      include: { questions: true }
    });
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    const sanitizedQuestions = exam.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks
    }));
    res.json({ id: exam.id, title: exam.title, duration: exam.duration, questions: sanitizedQuestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    const examIdInt = parseInt(examId);
    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    
    let score = 0;

    const questions = await prisma.question.findMany({ where: { examId: examIdInt } });

    answers.forEach(ans => {
      const q = questions.find(q => q.id === ans.questionId);
      if (q) {
        const correctSet = JSON.stringify(q.correct.sort());
        const selectedSet = JSON.stringify(ans.selected.sort());
        if (correctSet === selectedSet) {
          score += q.marks;
        } else if (q.exam?.negativeMarking) {
          score -= q.exam.negativeMarking; // optional negative marking
        }
      }
    });

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: examIdInt,
        studentId: req.user.id,
        payload: { answers },
        score,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      }
    });

    res.json({ score: attempt.score, timeTaken: (new Date() - attempt.startedAt) / 1000, status: 'SUBMITTED' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const examIdInt = parseInt(examId);
    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    
    const attempt = await prisma.examAttempt.findFirst({
      where: { examId: examIdInt, studentId: req.user.id },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    });
    if (!attempt) return res.status(404).json({ error: 'Result not found' });

    const answers = attempt.payload.answers.map(r => ({
      questionId: r.questionId,
      selected: r.selected,
      correct: attempt.exam.questions.find(q => q.id === r.questionId)?.correct,
      marksAwarded: r.marksAwarded,
      explanation: attempt.exam.questions.find(q => q.id === r.questionId)?.explanation
    }));

    res.json({
      examId,
      studentId: req.user.id,
      score: attempt.score,
      totalMarks: attempt.exam.questions.reduce((acc, q) => acc + q.marks, 0),
      answers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { examId } = req.params;
    const examIdInt = parseInt(examId);
    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }
    
    const attempts = await prisma.examAttempt.findMany({
      where: { examId: examIdInt },
      include: { student: true },
      orderBy: { score: 'desc' }
    });

    const leaderboard = attempts.map((a, i) => ({
      studentId: a.studentId,
      name: a.student.name,
      score: a.score,
      rank: i + 1
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
