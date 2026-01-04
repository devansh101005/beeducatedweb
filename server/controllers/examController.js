import prisma from '../config/prismaClient.js';
export const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      classLevel,
      duration,
      startTime,
      endTime,
      totalMarks,
      negativeMarking,
      randomizeQuestions,
      randomizeOptions
    } = req.body;

    const data = {
      title,
      description,
      subject,
      classLevel,
      duration: duration != null ? Number(duration) : undefined,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      totalMarks: totalMarks != null ? Number(totalMarks) : undefined,
      negativeMarking: negativeMarking != null ? parseFloat(negativeMarking) : undefined,
      randomizeQuestions: Boolean(randomizeQuestions),
      randomizeOptions: Boolean(randomizeOptions),
      createdBy: req.user.id
    };

    if (Number.isNaN(data.duration)) return res.status(400).json({ error: 'duration must be a number' });
    if (Number.isNaN(data.totalMarks)) return res.status(400).json({ error: 'totalMarks must be a number' });
    if (Number.isNaN(data.negativeMarking)) return res.status(400).json({ error: 'negativeMarking must be a number' });

    const exam = await prisma.exam.create({ data });
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
    // if(createExam.classLevel==StudentPortal.gradeLevel){

    // }
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

// export const submitExam = async (req, res) => {
//   try {

//     console.log('=== SUBMIT EXAM STARTED ===');
//     console.log('Request params:', req.params);
//     console.log('Request body:', req.body);
//     console.log('User:', req.user);


//     const { examId } = req.params;
//     const { answers } = req.body;

//     console.log('Exam ID:', examId);
//     console.log('Answers received:', answers);


//     //const {answers,startedAt:startedAtISO}=req.body;
//     const examIdInt = parseInt(examId);
//     console.log('Parsed exam ID:', examIdInt);

//     if (isNaN(examIdInt)) {
//       return res.status(400).json({ error: 'Invalid exam ID' });
//     }
    
//     let score = 0;

//     console.log('Fetching questions...');

//     const questions = await prisma.question.findMany({ where: { examId: examIdInt } });


//   console.log('Questions found:', questions.length);
//     console.log('Questions:', questions);


//     answers.forEach(ans => {
//       const q = questions.find(q => q.id === ans.questionId);
//       if (q) {
//         const correctSet = JSON.stringify(q.correct.sort());
//         const selectedSet = JSON.stringify(ans.selected.sort());
//         if (correctSet === selectedSet) {
//           score += q.marks;
//         } else if (q.exam?.negativeMarking) {
//           score -= q.exam.negativeMarking; // optional negative marking
//         }
//       }
//     });

//     const attempt = await prisma.examAttempt.create({
//       data: {
//         examId: examIdInt,
//         studentId: req.user.id,
//         payload: { answers },
//         score,
//         submittedAt: new Date(),
//         status: 'SUBMITTED'
//       }
//     });

//     console.log('Exam attempt created:', attempt);


//     const response={ score: attempt.score, 
//       timeTaken: (new Date() - attempt.startedAt) / 1000,
//        status: 'SUBMITTED'
//        }

//        console.log('Sending response:', response);
//        res.json(response);
      
//   } catch (err) {
//     console.error('=== ERROR IN SUBMIT EXAM ===');
//     console.error("Attempted to use studentId:", req.user ? req.user.id : "N/A");
//     console.error('Error message:', err.message);
//     console.error('Error stack:', err.stack);
//     console.error("Error stack:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

export const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    const examIdInt = parseInt(examId);

    if (isNaN(examIdInt)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    let score = 0;

    const questions = await prisma.question.findMany({
      where: { examId: examIdInt }
    });

    answers.forEach(ans => {
      const q = questions.find(q => q.id === ans.questionId);
      if (!q) return;

      const correctAnswer = Array.isArray(q.correct) ? q.correct.join(',') : q.correct;
      const studentAnswer = ans.selectedOption;

      if (correctAnswer === studentAnswer) {
        score += q.marks;
      } else if (q.negativeMarking) {
        score -= q.negativeMarking;
      }
    });

    await prisma.examAttempt.create({
      data: {
        examId: examIdInt,
        studentId: req.user.id,
        payload: { answers },
        score,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      }
    });

    res.json({ score, status: "SUBMITTED" });

  } catch (err) {
    console.error('ERROR SUBMITTING EXAM:', err);
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
