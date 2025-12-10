/**
 * API Configuration
 * Soporta API Gateway (puerto 8000) con fallback a servicios directos
 */

// Detect base URL from env or fallback to localhost
const envGateway = import.meta?.env?.VITE_API_GATEWAY_URL;
const envAuth = import.meta?.env?.VITE_API_AUTH_URL;
const envUpload = import.meta?.env?.VITE_API_UPLOAD_URL;
const envReports = import.meta?.env?.VITE_API_REPORTS_URL;

export const API_CONFIG = {
  useGateway: true,
  gateway: {
    auth: envGateway ? `${envGateway}/api/auth` : 'http://localhost:8000/api/auth',
    upload: envGateway ? `${envGateway}/api/upload` : 'http://localhost:8000/api/upload',
    reports: envGateway ? `${envGateway}/api/reports` : 'http://localhost:8000/api/reports',
  },
  direct: {
    auth: envAuth || 'http://localhost:2081/api/auth',
    upload: envUpload || 'http://localhost:2083/api/upload',
    reports: envReports || 'http://localhost:2084/api/reports',
  },
};

/**
 * Obtiene la URL base para un servicio
 * Intenta API Gateway, si falla usa conexión directa
 */
export async function getServiceUrl(service: 'auth' | 'upload' | 'reports'): Promise<string> {
  if (API_CONFIG.useGateway) {
    try {
      // Verificar si el API Gateway está disponible usando la URL configurada
      const healthUrl = API_CONFIG.gateway.auth.replace('/api/auth', '/health');
      const response = await fetch(healthUrl, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      if (response.ok) {
        return API_CONFIG.gateway[service];
      }
    } catch (error) {
      console.warn(`API Gateway no disponible, usando conexión directa para ${service}`);
    }
  }

  // Fallback a conexión directa
  return API_CONFIG.direct[service];
}

/**
 * Realiza un fetch con fallback automático
 */
export async function fetchWithFallback(
  path: string,
  service: 'auth' | 'upload' | 'reports',
  options?: RequestInit
): Promise<Response> {
  const baseUrl = await getServiceUrl(service);
  return fetch(`${baseUrl}${path}`, options);
}
