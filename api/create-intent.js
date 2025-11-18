import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { email, items } = req.body;

  if (!email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing email or items' });
  }

  try {
    const amount = await calculateAmount(items, stripe);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email,
      automatic_payment_methods: { enabled: true }
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Create intent error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function calculateAmount(items, stripe) {
  let total = 0;

  for (const item of items) {
    const price = await stripe.prices.retrieve(item.price);
    const qty = item.quantity || 1;
    total += price.unit_amount * qty;
  }

  return total;
}