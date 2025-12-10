import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, BarChart2, Upload, LogOut, Camera, Key } from "lucide-react";
import CategoryMenu from "../components/CategoryMenu";
import { useState } from "react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(
    localStorage.getItem("profileImage")
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
    navigate("/login");
  };

  /**
   * Handles profile photo file upload.
   * Converts selected image file to base64 data URL and stores in localStorage.
   * @param e - React change event from file input element
   * @returns void
   * @effect Reads file as DataURL
   * @effect Updates profileImage state
   * @effect Persists base64 string to localStorage.profileImage
   * @side-effect Clears file input after upload
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem("profileImage", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract user data from localStorage
  const userData = localStorage.getItem("user");
  let userName = "Usuario";
  let userEmail = user || "";
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      userName = parsed.name || parsed.email?.split("@")[0] || "Usuario";
      userEmail = parsed.email || user || "";
    } catch (e) {
      userName = user?.split("@")[0] || "Usuario";
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">

      {/* ✅ SIDEBAR FIJO */}
      <aside className="w-64 bg-[#0f2a44] text-white flex flex-col">

        {/* Usuario */}
        <div className="flex flex-col items-center py-6 border-b border-white/20">
          <div className="relative group">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white text-[#0f2a44] flex items-center justify-center text-3xl font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <label 
              htmlFor="profile-upload" 
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              <Camera size={24} className="text-white" />
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-sm font-semibold">{userName}</p>
          <p className="text-xs text-white/70">{userEmail}</p>
        </div>

        {/* Menú */}
        <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
          <MenuItem
            icon={<Home size={20} />}
            label="Inicio"
            onClick={() => navigate("/dashboard")}
          />

          <MenuItem
            icon={<BarChart2 size={20} />}
            label="Estadísticas"
            onClick={() => navigate("/dashboard/estadisticas")}
          />

          <MenuItem
            icon={<Upload size={20} />}
            label="Cargar CSV"
            onClick={() => navigate("/dashboard/upload")}
          />

          <MenuItem
            icon={<Key size={20} />}
            label="Cambiar Contraseña"
            onClick={() => navigate("/change-password")}
          />

          {/* Divider */}
          <div className="border-t border-white/20 my-4"></div>

          {/* Dynamic Categories */}
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 px-4">
              Mis Reportes
            </p>
            <CategoryMenu />
          </div>
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>

      </aside>

      
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>

    </div>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 rounded hover:bg-white/10 transition"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
