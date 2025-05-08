import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import {
  PaymentElement,
  useStripe,
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import { FaLock, FaSpinner } from 'react-icons/fa';

type CheckoutFormProps = {
  clientSecret: string | null;
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
};

const CheckoutForm = ({ clientSecret, email, setEmail, name, setName }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addressComplete, setAddressComplete] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    // Check to see if this is a redirect back from Stripe after completion
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    // If we have a secret and there's no error, we can navigate to success
    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (paymentIntent) {
          switch (paymentIntent.status) {
            case 'succeeded':
              clearCart();
              router.push('/checkout/success');
              break;
            case 'processing':
              setMessage('Your payment is processing.');
              break;
            case 'requires_payment_method':
              setMessage('Your payment was not successful, please try again.');
              break;
            default:
              setMessage('Something went wrong.');
              break;
          }
        }
      });
    }
  }, [stripe, router, clearCart]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        receipt_email: email,
        payment_method_data: {
          billing_details: {
            name,
            email
          }
        }
      }
    });

    if (error) {
      setMessage(error.message || 'Something went wrong with your payment.');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-white font-medium mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white font-medium mb-4">Billing Address</h3>
        <AddressElement
          options={{
            mode: 'billing',
            fields: {
              phone: 'never',
            },
            validation: {
              phone: {
                required: 'never',
              },
            },
          }}
          onChange={(event) => {
            setAddressComplete(event.complete);
          }}
        />
      </div>
      
      <div>
        <h3 className="text-white font-medium mb-4">Payment Method</h3>
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name,
                email
              }
            }
          }}
        />
      </div>

      {message && (
        <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
          <p className="text-white">{message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isLoading || !addressComplete}
        className={`w-full flex items-center justify-center ${
          isLoading || !stripe || !elements || !addressComplete ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
        } text-white py-4 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 mt-8 text-lg`}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <FaLock className="mr-2" />
            Complete Payment
          </>
        )}
      </button>
    </form>
  );
};

export default CheckoutForm; 