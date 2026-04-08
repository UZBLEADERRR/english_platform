import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { carouselRouter } from './routes/carousel.js';
import { categoriesRouter } from './routes/categories.js';
import { levelsRouter } from './routes/levels.js';
import { topicsRouter } from './routes/topics.js';
import { lessonsRouter } from './routes/lessons.js';
import { moviesRouter } from './routes/movies.js';
import { comicsRouter } from './routes/comics.js';
import { tipsRouter } from './routes/tips.js';
import { appsRouter } from './routes/apps.js';
import { reelsRouter } from './routes/reels.js';
import { chatRouter } from './routes/chat.js';
import { paymentsRouter } from './routes/payments.js';
import { usersRouter } from './routes/users.js';
import { referralsRouter } from './routes/referrals.js';
import { grammarCheckerRouter } from './routes/grammarChecker.js';
import { uploadRouter } from './routes/upload.js';
import { songsRouter } from './routes/songs.js';
import { libraryRouter } from './routes/library.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/carousel', carouselRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/comics', comicsRouter);
app.use('/api/tips', tipsRouter);
app.use('/api/apps', appsRouter);
app.use('/api/reels', reelsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/grammar-checker', grammarCheckerRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/songs', songsRouter);
app.use('/api/library', libraryRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
