import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const validatePassword = (password: string) => {
  const errors = [];
  if (password.length < 10) errors.push("Debe tener al menos 10 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("Debe contener al menos una mayúscula");
  if (!/[a-z]/.test(password)) errors.push("Debe contener al menos una minúscula");
  if (!/[0-9]/.test(password)) errors.push("Debe contener al menos un número");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Debe contener al menos un símbolo");
  return errors;
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (passwordErrors.length > 0) {
      setError("La nueva contraseña no cumple con los requisitos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const userData = localStorage.getItem("user");
      const userId = userData ? JSON.parse(userData).userId : null;

      if (!userId) {
        setError("No se pudo identificar al usuario");
        return;
      }

      const response = await fetch("http://localhost:2081/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cambiar la contraseña");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Volver al dashboard</span>
        </button>

        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Cambiar Contraseña</h1>
        <p className="text-gray-600 text-sm text-center mb-6">
          Actualiza tu contraseña de forma segura
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-800">
              Contraseña actualizada exitosamente. Redirigiendo...
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {newPassword && passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((err, idx) => (
                  <p key={idx} className="text-xs text-red-600 flex items-center gap-1">
                    <XCircle size={12} />
                    {err}
                  </p>
                ))}
              </div>
            )}
            {newPassword && passwordErrors.length === 0 && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} />
                La contraseña cumple todos los requisitos
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <XCircle size={12} />
                Las contraseñas no coinciden
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={12} />
                Las contraseñas coinciden
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passwordErrors.length > 0 || !passwordsMatch}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            {loading ? "Cambiando..." : "Cambiar Contraseña"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Requisitos de contraseña:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Mínimo 10 caracteres</li>
            <li>• Al menos una letra mayúscula</li>
            <li>• Al menos una letra minúscula</li>
            <li>• Al menos un número</li>
            <li>• Al menos un símbolo (!@#$%^&*...)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
