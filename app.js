const path = require('path');
const express = require('express');
const morgan = require('morgan'); //Morgan is 3rd party middleware from npm which is used find information about request that is done
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const { title } = require('process');

//Start express app
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDL EWARES
// Implement CORS
app.use(cors());
// Access-Control-Alllow-Origin
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin:'https://www.natours.com'
// }))

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
// const scriptSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://js.stripe.com',
//   'https://m.stripe.network',
//   'https://*.cloudflare.com'
// ];

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org/',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.5.1/axios.min.js',
  'http://127.0.0.1:3000/api/v1/users/login',
  'https://cdnjs.cloudflare.com',
  'https://js.stripe.com/v3/',
  'https://js.stripe.com/',
  'https://m.stripe.network',
  'https://*.cloudflare.com',
];
const framesSrcUrls = ['https://js.stripe.com/'];
// const styleSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://fonts.googleapis.com/'
// ];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org/',
  'https://fonts.googleapis.com/',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
];
// const connectSrcUrls = [
//   'https://unpkg.com',
//   'https://tile.openstreetmap.org',
//   'https://*.stripe.com',
//   'https://bundle.js:*',
//   'ws://127.0.0.1:*/'
// ];
const connectSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org/',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.5.1/axios.min.js',
  'http://127.0.0.1:3000/api/v1/users/login',
  'https://cdnjs.cloudflare.com',
  'ws://localhost:56331/',
  'https://js.stripe.com/v3/',
  'https://js.stripe.com/',
  'https://*.stripe.com',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
      baseUri: ["'self'"],
      connectSrc: [
        "'self'",
        "'unsafe-inline'",
        'data:',
        'blob:',
        ...connectSrcUrls,
      ],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:', ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:', 'https://m.stripe.network'],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ["'self'", 'https://js.stripe.com', ...framesSrcUrls],
      childSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  }),
);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);
// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' })); //express.json() is middleware(called middleware because it stands between in the middle request and response) i.e. its just a function that modifies the incoming request data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization agains XSS
app.use(xss());

//Prevent parameter plloution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

//Test middleware
app.use((req, res, next) => {
  req.reuestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id?', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id?', updateTour);
// app.delete('/api/v1/tours/:id?', deleteTour);

//SINGLE ROUTER i.e. app

// app.route('/api/v1/tours').get(getAllTours).post(createTour);

// app
//   .route('/api/v1/tours/:id?')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// app.route('/api/v1/users').get(getAllUsers).post(createUser);

// app
//   .route('/api/v1/users/:id?')
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);

//MULTIPLE ROUTERS
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); //sub application created. Here tourRouter is a middleware function which in turn has its own routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// 4) START SERVER

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
