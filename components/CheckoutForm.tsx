import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import {
  PaymentElement,
  useStripe,
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import { FaLock, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

type CheckoutFormProps = {
  clientSecret: string | null;
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
};

type MessageType = {
  text: string;
  type: 'error' | 'info' | 'success';
};

const CheckoutForm = ({ clientSecret, email, setEmail, name, setName }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();

  const [message, setMessage] = useState<MessageType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addressComplete, setAddressComplete] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);

  // Validate form fields
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (stripe) {
      setIsStripeReady(true);
    }
  }, [stripe]);

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
              setMessage({ text: 'Payment successful!', type: 'success' });
              clearCart();
              router.push('/checkout/success');
              break;
            case 'processing':
              setMessage({ text: 'Your payment is processing.', type: 'info' });
              break;
            case 'requires_payment_method':
              setMessage({ 
                text: 'Your payment was not successful, please try again.',
                type: 'error'
              });
              break;
            default:
              setMessage({ text: 'Something went wrong.', type: 'error' });
              break;
          }
        }
      });
    }
  }, [stripe, router, clearCart]);

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
    };

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return !errors.name && !errors.email;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!stripe || !elements || !clientSecret) {
      setMessage({ 
        text: 'Payment system is not ready. Please try again.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
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
        setMessage({ 
          text: error.message || 'An error occurred with your payment',
          type: 'error'
        });
      }
    } catch (err) {
      setMessage({ 
        text: 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isStripeReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-purple-500 text-2xl mr-3" />
        <span className="text-white">Loading payment system...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" aria-label="Payment form">
      <div role="region" aria-label="Customer Information">
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
              onChange={(e) => {
                setName(e.target.value);
                setFormErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter your full name"
              required
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? 'name-error' : undefined}
              className={`w-full bg-zinc-800 border ${
                formErrors.name ? 'border-red-500' : 'border-zinc-700'
              } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            {formErrors.name && (
              <p id="name-error" className="mt-1 text-red-500 text-sm">
                {formErrors.name}
              </p>
            )}
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
              onChange={(e) => {
                setEmail(e.target.value);
                setFormErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="Enter your email"
              required
              aria-invalid={!!formErrors.email}
              aria-describedby={formErrors.email ? 'email-error' : undefined}
              className={`w-full bg-zinc-800 border ${
                formErrors.email ? 'border-red-500' : 'border-zinc-700'
              } rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            {formErrors.email && (
              <p id="email-error" className="mt-1 text-red-500 text-sm">
                {formErrors.email}
              </p>
            )}
          </div>
        </div>
      </div>

      <div role="region" aria-label="Billing Address">
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
      
      <div role="region" aria-label="Payment Method">
        <h3 className="text-white font-medium mb-4">Payment Method</h3>
        <PaymentElement />
      </div>

      {message && (
        <div 
          className={`p-4 rounded-lg flex items-start ${
            message.type === 'error' ? 'bg-red-900/50 border-red-500' :
            message.type === 'success' ? 'bg-green-900/50 border-green-500' :
            'bg-blue-900/50 border-blue-500'
          } border`}
          role="alert"
        >
          <FaExclamationCircle className={`mt-1 mr-3 ${
            message.type === 'error' ? 'text-red-500' :
            message.type === 'success' ? 'text-green-500' :
            'text-blue-500'
          }`} />
          <p className="text-white flex-1">{message.text}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isLoading || !addressComplete}
        aria-disabled={!stripe || !elements || isLoading || !addressComplete}
        className={`w-full flex items-center justify-center ${
          isLoading || !stripe || !elements || !addressComplete ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
        } text-white py-4 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 mt-8 text-lg`}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FaLock className="mr-2" aria-hidden="true" />
            <span>Complete Payment</span>
          </>
        )}
      </button>
    </form>
  );
};

export default CheckoutForm; 