// import { S3Client } from '@aws-sdk/client-s3';

// const s3 = new S3Client({
//   region: 'ap-south-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// export default s3;

import { S3Client } from '@aws-sdk/client-s3';

const s3Config = {
  region: process.env.AWS_REGION || 'ap-south-1', // Fallback to ap-south-1 if env var not set
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  // Recommended additional configuration:
  maxAttempts: 3, // Retry up to 3 times
  retryMode: 'standard' // Uses standard retry strategy
};

const s3 = new S3Client(s3Config);

export default s3;