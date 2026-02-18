import express from 'express';

const app = express();

const server = app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});

/*
const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is running on http://${process.env.HOST}:${process.env.PORT}`,
  );
});*/
