// // server/config/s3.js
// import AWS from 'aws-sdk';
// import dotenv from 'dotenv';

// dotenv.config();

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// export default s3;


// import { S3Client } from '@aws-sdk/client-s3';

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// export default s3Client;
// import { S3Client } from '@aws-sdk/client-s3';

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION, // must match bucket region
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     // If using temporary credentials, also ensure AWS_SESSION_TOKEN is set in env
//     //sessionToken: process.env.AWS_SESSION_TOKEN
//   }
// });

// export default s3Client;

// server/config/s3.js
import { S3Client } from '@aws-sdk/client-s3';
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});
export default s3Client;