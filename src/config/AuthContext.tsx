import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

export function isDummyAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === "kader@puskesmas-pauh.id" || normalized === "bidan@puskesmas-pauh.id" || normalized === "demo";
}

export function isKaderMail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().includes("kader");
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: "Kader" | "Bidan" | null;
  setRole: (role: "Kader" | "Bidan" | null) => void;
  isDemo: boolean;
  setIsDemo: (isDemo: boolean) => void;
  mockUser: string | null;
  setMockUser: (user: string | null) => void;
  fullName: string | null;
  setFullName: (name: string | null, customUserId?: string) => void;
  posyanduName: string | null;
  setPosyanduName: (name: string | null, customUserId?: string) => void;
  puskesmasName: string | null;
  setPuskesmasName: (name: string | null, customUserId?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<"Kader" | "Bidan" | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [mockUser, setMockUserState] = useState<string | null>(null);
  const [fullName, setFullNameState] = useState<string | null>(null);
  const [posyanduName, setPosyanduNameState] = useState<string | null>(null);
  const [puskesmasName, setPuskesmasNameState] = useState<string | null>(null);

  // Load and apply properties when authentication state is determined
  useEffect(() => {
    const userId = isDemo ? (mockUser || "demo") : (user?.email || null);
    if (userId) {
      const savedFullName = localStorage.getItem("gizi_user_fullname_" + userId);
      if (savedFullName) {
        setFullNameState(savedFullName);
      } else {
        if (isDummyAccount(userId)) {
          const globalFullName = localStorage.getItem("gizi_user_fullname");
          setFullNameState(globalFullName || (isKaderMail(userId) ? "Hanifah Larama" : "dr. Sari Wulandari"));
        } else {
          setFullNameState(null);
        }
      }

      const savedPosyandu = localStorage.getItem("gizi_kader_posyandu_" + userId);
      if (savedPosyandu) {
        setPosyanduNameState(savedPosyandu);
      } else {
        if (isDummyAccount(userId)) {
          const globalPosyandu = localStorage.getItem("gizi_kader_posyandu");
          setPosyanduNameState(globalPosyandu || "Mawar - Kel. Limau Manis");
        } else {
          setPosyanduNameState(null);
        }
      }

      const savedPuskesmas = localStorage.getItem("gizi_bidan_puskesmas_" + userId);
      if (savedPuskesmas) {
        setPuskesmasNameState(savedPuskesmas);
      } else {
        if (isDummyAccount(userId)) {
          const globalPuskesmas = localStorage.getItem("gizi_bidan_puskesmas");
          setPuskesmasNameState(globalPuskesmas || "Puskesmas Pauh - Padang");
        } else {
          setPuskesmasNameState(null);
        }
      }
    }
  }, [user, isDemo, mockUser]);

  // Persistence of role in localStorage for session state stability
  useEffect(() => {
    const savedRole = localStorage.getItem("gizi_user_role");
    if (savedRole === "Kader" || savedRole === "Bidan") {
      setRoleState(savedRole);
    }
    const savedDemo = localStorage.getItem("gizi_is_demo");
    if (savedDemo === "true") {
      setIsDemo(true);
    }
    const savedMockUser = localStorage.getItem("gizi_mock_user");
    if (savedMockUser) {
      setMockUserState(savedMockUser);
    }
  }, []);

  const setRole = (newRole: "Kader" | "Bidan" | null) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem("gizi_user_role", newRole);
    } else {
      localStorage.removeItem("gizi_user_role");
    }
  };

  const setMockUser = (userVal: string | null) => {
    setMockUserState(userVal);
    if (userVal) {
      localStorage.setItem("gizi_mock_user", userVal);
    } else {
      localStorage.removeItem("gizi_mock_user");
    }
  };

  const setFullName = (name: string | null, customUserId?: string) => {
    setFullNameState(name);
    const userId = customUserId || (isDemo ? (mockUser || "demo") : (user?.email || "default"));
    if (name) {
      localStorage.setItem("gizi_user_fullname_" + userId, name);
      localStorage.setItem("gizi_user_fullname", name);
    } else {
      localStorage.removeItem("gizi_user_fullname_" + userId);
    }
  };

  const setPosyanduName = (name: string | null, customUserId?: string) => {
    setPosyanduNameState(name);
    const userId = customUserId || (isDemo ? (mockUser || "demo") : (user?.email || "default"));
    if (name) {
      localStorage.setItem("gizi_kader_posyandu_" + userId, name);
      localStorage.setItem("gizi_kader_posyandu", name);
    } else {
      localStorage.removeItem("gizi_kader_posyandu_" + userId);
    }
  };

  const setPuskesmasName = (name: string | null, customUserId?: string) => {
    setPuskesmasNameState(name);
    const userId = customUserId || (isDemo ? (mockUser || "demo") : (user?.email || "default"));
    if (name) {
      localStorage.setItem("gizi_bidan_puskesmas_" + userId, name);
      localStorage.setItem("gizi_bidan_puskesmas", name);
    } else {
      localStorage.removeItem("gizi_bidan_puskesmas_" + userId);
    }
  };

  const updateDemoStatus = (status: boolean) => {
    setIsDemo(status);
    localStorage.setItem("gizi_is_demo", status ? "true" : "false");
  };

  const logout = async () => {
    try {
      if (!isDemo) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("SignOut error:", e);
    } finally {
      setUser(null);
      setRole(null);
      setIsDemo(false);
      setMockUser(null);
      setFullName(null);
      setPosyanduName(null);
      setPuskesmasName(null);
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        setRole,
        isDemo,
        setIsDemo: updateDemoStatus,
        mockUser,
        setMockUser,
        fullName,
        setFullName,
        posyanduName,
        setPosyanduName,
        puskesmasName,
        setPuskesmasName,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
