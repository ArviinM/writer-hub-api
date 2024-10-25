import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './database/database';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import companiesRouter from './routes/companies';
import articlesRouter from './routes/articles';
import errorHandler from './middleware/errorHandler';

const app: Application = express();
const port = 3001;

db.on('connection', () => {
    console.log('someone connected!');
});

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/companies', companiesRouter);
app.use('/articles', articlesRouter);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
