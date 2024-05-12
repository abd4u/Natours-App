const mongoose = require('mongoose');
dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNHANDLER EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
//Environment variables - They are outside the scope of express

// 1) Environment variable set by express
// console.log(app.get('env')); //Output : development

// DEFINITION: Environment variables are global variables that are used to define the environment in which a node app is running

// 2) Environment variable set by nodeJS

// console.log(process.env); // PROCESS CORE MODULE

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

//Document created out of 'Tour' model
// const testTour = new Tour({
//   //testTour IS AN INSTANCE of Tour model and it has methods on it which is useful to interact with database
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR 💥:', err);
//   });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED, Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});
