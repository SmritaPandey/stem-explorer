import cors from 'cors';

const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true,
};

export default cors(corsOptions);
