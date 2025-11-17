import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function EmailVerified() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Get token from URL params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify the token
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          // Clear pending verification email from localStorage
          localStorage.removeItem('pendingVerificationEmail');
          
          // Start countdown
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                setLocation('/vault');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else {
          setStatus('error');
          if (data.alreadyVerified) {
            setMessage('Your email is already verified!');
            setTimeout(() => setLocation('/vault'), 2000);
          } else {
            setMessage(data.error || 'Verification failed');
          }
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-purple-500/20">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-4">
              <svg className="animate-spin h-16 w-16 text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verifying Email...</h1>
            <p className="text-gray-300">Please wait while we verify your email address</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
              <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-gray-300 mb-6">{message}</p>
            
            <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/50 mb-6">
              <p className="text-gray-300 mb-2">Redirecting to your vault in</p>
              <div className="text-6xl font-bold text-purple-400">{countdown}</div>
            </div>

            <button
              onClick={() => setLocation('/vault')}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              Continue to Vault
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-block p-4 bg-red-500/20 rounded-full mb-4">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-300 mb-6">{message}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => setLocation('/verify-email')}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Resend Verification Email
              </button>
              
              <button
                onClick={() => setLocation('/')}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
