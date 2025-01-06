const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv=require('dotenv')
const connectToDB=require('./Config/db')
dotenv.config();

const userRoutes = require('./Routes/userRoute');
const adminRoute =require('./Routes/adminRoute')


const app = express();

//cors
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:5000'   // Backend server
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectToDB()

//router middleware
app.use('/user', userRoutes);
app.use('/admin',adminRoute)


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

