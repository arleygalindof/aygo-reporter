import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, CheckCircle, XCircle } from "lucide-react";

/**
 * Validates password against security requirements.
 * Returns array of failed requirement messages (empty if all pass).
 * @param password - Password string to validate
 * @returns Array of error messages for failed requirements
 * @requirements
 * - Minimum 10 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 symbol (!@#$%^&*...)
 * @example
 * validatePassword("Weak") // Returns 5 errors
 * validatePassword("ValidPass1!") // Returns empty array
 */
const validatePassword = (password: string) => {
  const errors = [];
  if (password.length < 10) errors.push("Debe tener al menos 10 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("Debe contener al menos una mayúscula");
  if (!/[a-z]/.test(password)) errors.push("Debe contener al menos una minúscula");
  if (!/[0-9]/.test(password)) errors.push("Debe contener al menos un número");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Debe contener al menos un símbolo");
  return errors;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const passwordErrors = isRegistering && password ? validatePassword(password) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate password on registration
    if (isRegistering && passwordErrors.length > 0) {
      setError("La contraseña no cumple con los requisitos de seguridad");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const body = isRegistering
        ? { email, password, name }
        : { email, password };

      const response = await fetch(`http://localhost:2081${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Response status:", response.status);
        console.log("Error data:", errorData);
        throw new Error(errorData.error || errorData.message || `Error en autenticación (status: ${response.status})`);
      }

      const data = await response.json();

      // Guardar token tanto para login como para registro
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        // Redirigir al dashboard
        navigate("/");
      } else {
        throw new Error("No se recibió el token de autenticación");
      }
    } catch (err: any) {
      setError(err.message || "Error en autenticación 2");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-center text-sm mb-8">
          {isRegistering ? "Crea tu cuenta" : "Inicia sesión"}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                <User className="inline mr-2" size={16} />
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                required={isRegistering}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              <Mail className="inline mr-2" size={16} />
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              <Lock className="inline mr-2" size={16} />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {isRegistering && password && passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((err, idx) => (
                  <p key={idx} className="text-xs text-red-600 flex items-center gap-1">
                    <XCircle size={12} />
                    {err}
                  </p>
                ))}
              </div>
            )}
            {isRegistering && password && passwordErrors.length === 0 && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} />
                La contraseña cumple todos los requisitos
              </p>
            )}
          </div>

          {isRegistering && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Requisitos de contraseña:
              </p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• Mínimo 10 caracteres</li>
                <li>• Al menos una mayúscula</li>
                <li>• Al menos una minúscula</li>
                <li>• Al menos un número</li>
                <li>• Al menos un símbolo</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (isRegistering && passwordErrors.length > 0)}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {isLoading ? "Cargando..." : isRegistering ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm text-center">
            {isRegistering ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
                setPassword("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isRegistering ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
