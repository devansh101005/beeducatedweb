// import express from "express";
// import { 
//   registerUser, 
//   loginUser 
// } from "../controllers/authController.js";
// import { verifyToken } from "../middleware/authMiddleware.js";
// import admin from "../firebaseAdmin.js";
// //import prisma from "../prismaClient.js";
// import jwt from "jsonwebtoken";

// const router = express.Router();

// // Email/Password Auth Routes
// router.post("/register", registerUser);
// router.post("/login", loginUser);

// // Phone OTP Auth Route
// router.post("/phone-login", async (req, res) => {
//   try {
//     const idToken = req.headers.authorization?.split(" ")[1];
//     const decoded = await admin.auth().verifyIdToken(idToken);
//     const phone = decoded.phone_number;

//     // Check if student exists, create if not
//     let student = await prisma.offlineStudent.findUnique({
//       where: { phone },
//     });

//     if (!student) {
//       student = await prisma.offlineStudent.create({
//         data: { phone }
//       });
//     }

//     const jwtToken = jwt.sign(
//       { id: student.id, role: "STUDENT" },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({ 
//       token: jwtToken, 
//       user: { 
//         id: student.id, 
//         role: "STUDENT", 
//         phone: student.phone 
//       } 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ error: "Unauthorized" });
//   }
// });

// // Protected User Info Route
// router.get("/me", verifyToken, (req, res) => {
//   // Handles both email and phone users
//   const response = {
//     id: req.user.id,
//     role: req.user.role
//   };

//   // Add email if available (email users)
//   if (req.user.email) {
//     response.email = req.user.email;
//   }
  
//   // Add phone if available (phone users)
//   if (req.user.phone) {
//     response.phone = req.user.phone;
//   }

//   res.json(response);
// });

// export default router;


import express from "express";
import { 
  registerUser, 
  loginUser 
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
<<<<<<< HEAD
import admin from "../firebaseAdmin.js";
//import prisma from "../prismaClient.js";
=======
//import admin from "../firebaseAdmin.js";
import prisma from "../config/prismaClient.js"; // Restored Prisma import
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c
import jwt from "jsonwebtoken";

const router = express.Router();
console.log("AuthRoutes is called");

// Email/Password Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Phone OTP Auth Route
router.post("/phone-login", async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split(" ")[1];
<<<<<<< HEAD
=======
    if (!idToken) throw new Error("No ID token provided");

>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;

    // Check if student exists, create if not
    let student = await prisma.offlineStudent.findUnique({
      where: { phone },
    });

    if (!student) {
      student = await prisma.offlineStudent.create({
<<<<<<< HEAD
        data: { phone }
=======
        data: { phone },
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c
      });
    }

    const jwtToken = jwt.sign(
      { id: student.id, role: "STUDENT" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token: jwtToken, 
      user: { 
        id: student.id, 
        role: "STUDENT", 
        phone: student.phone 
      } 
    });
  } catch (err) {
<<<<<<< HEAD
    console.error(err);
    res.status(401).json({ error: "Unauthorized" });
=======
    console.error("Phone login error:", err);
    res.status(401).json({ error: err.message || "Unauthorized" });
>>>>>>> 0024a302c45d6fb370ba0cdc628e2af56645f53c
  }
});

// Protected User Info Route
router.get("/me", verifyToken, (req, res) => {
  // Handles both email and phone users
  const response = {
    id: req.user.id,
    role: req.user.role
  };

  // Add email if available (email users)
  if (req.user.email) {
    response.email = req.user.email;
  }
  
  // Add phone if available (phone users)
  if (req.user.phone) {
    response.phone = req.user.phone;
  }

  res.json(response);
});

export default router;