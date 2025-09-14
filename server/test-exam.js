import prisma from './config/prismaClient.js';

async function testExamFunctionality() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test creating an exam
    console.log('🔍 Testing exam creation...');
    const exam = await prisma.exam.create({
      data: {
        title: 'Test Math Quiz',
        description: 'A simple test quiz',
        subject: 'Mathematics',
        classLevel: 'Class 10',
        duration: 30,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        totalMarks: 100,
        createdBy: 'test-user-id' // You'll need a real user ID
      }
    });
    console.log('✅ Exam created:', exam.id);
    
    // Test creating a question
    console.log('🔍 Testing question creation...');
    const question = await prisma.question.create({
      data: {
        examId: parseInt(exam.id), // Convert to integer
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correct: [1], // Index 1 = '4'
        marks: 10,
        difficulty: 'Easy',
        explanation: 'Basic addition'
      }
    });
    console.log('✅ Question created:', question.id);
    
    // Clean up test data
    await prisma.question.delete({ where: { id: question.id } });
    await prisma.exam.delete({ where: { id: exam.id } });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExamFunctionality();
