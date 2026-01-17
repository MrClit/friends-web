import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

function parseQuery(search: string) {
  const params = new URLSearchParams(search);
  return {
    token: params.get('token'),
    id: params.get('id'),
    email: params.get('email'),
    name: params.get('name'),
    avatar: params.get('avatar'),
    role: params.get('role'),
  };
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  useEffect(() => {
    const { token, id, email, name, avatar, role } = parseQuery(location.search);

    if (token && id && email && role) {
      // Cast types to match User interface
      setAuth({
        id: id ?? '',
        email: email ?? '',
        name: name ?? undefined,
        avatar: avatar ?? undefined,
        role: role as 'admin' | 'user',
      }, token);
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <span className="text-lg">Procesando autenticación...</span>
    </div>
  );
}
