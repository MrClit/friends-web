const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;

export function GoogleLoginButton() {
  const handleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <button
      type="button"
      className="px-4 py-2 bg-white border border-gray-300 rounded shadow flex items-center gap-2 hover:bg-gray-50"
      onClick={handleLogin}
      aria-label="Login with Google"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
      <span>Login con Google</span>
    </button>
  );
}
