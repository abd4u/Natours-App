import axios from 'axios';
import { showAlert } from './alerts';

const stripe = require('stripe')(
  'pk_test_51PDlS0SClcQAxdLtFTgILWZdbI5S9xjtv82iPEQ1Pmh57wHdcf6bOix4yVZlLKSHZL2s8KhuEwB7JR5U78V7yfyi00P8Dm3sjh',
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkpoint session from API

    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Create checkout form + charge credit card
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
