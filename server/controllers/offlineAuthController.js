import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

export const sendOTP = async (req, res) => {
  const { studentId } = req.body;

  const student = await prisma.offlineStudent.findUnique({ where: { id: studentId } });
  if (!student) return res.status(404).json({ error: "Student not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await twilioClient.messages.create({
      to: `+91${student.phone}`,
      from: process.env.TWILIO_PHONE,
      body: `Your BeEducated login OTP is: ${otp}`,
    });

    await prisma.offlineStudent.update({
      where: { id: studentId },
      data: { otp, otpExpiry: new Date(Date.now() + 5 * 60 * 1000) },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SMS sending failed" });
  }
};

export const verifyOTP = async (req, res) => {
  const { studentId, otp } = req.body;

  const student = await prisma.offlineStudent.findUnique({ where: { id: studentId } });

  if (!student || student.otp !== otp || new Date() > student.otpExpiry) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // Generate JWT token
  const token = jwt.sign({ id: student.id, role: "STUDENT" }, process.env.JWT_SECRET, { expiresIn: "1d" });

  // Clear OTP after successful verification
  await prisma.offlineStudent.update({
    where: { id: studentId },
    data: { otp: null, otpExpiry: null },
  });

  res.json({ token, user: { id: student.id, role: "STUDENT", name: student.name } });
};