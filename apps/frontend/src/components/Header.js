// apps/frontend/src/components/Header.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import SnackbarAlert from "./SnackbarAlert";
import { getDefaultRouteForRole, getRoleFromSession } from "@/utils/auth";

const APPS = [
  {
    key: "inventory",
    label: "Inventory Management",
    shortLabel: "Inventory",
    href: "/inventory",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    key: "analytics",
    label: "Analytics",
    shortLabel: "Analytics",
    href: "/analytics/overview",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const AUTH_ROUTES = ["/", "/auth/forgot-password", "/auth/reset-password"];

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  const router = useRouter();
  const pathname = usePathname();
  const role = getRoleFromSession() || "UNKNOWN";

  const [open, SetOpen] = useState(false);
  const [message, SetMessage] = useState("Something went wrong");
  const [severity, SetSeverity] = useState("error");
  const [userFullName, setUserFullName] = useState("Guest");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(null);
  const [schoolName, setSchoolName] = useState("");

  const hideHeaderUI = useMemo(
    () =>
      AUTH_ROUTES.some((p) =>
        p === "/" ? pathname === "/" : pathname?.startsWith(p),
      ),
    [pathname],
  );

  const currentApp = useMemo(() => {
    if (pathname?.startsWith("/analytics")) return APPS[1];
    return APPS[0];
  }, [pathname]);

  const apps = useMemo(
    () =>
      APPS.map((app) =>
        app.key === "analytics"
          ? { ...app, href: getDefaultRouteForRole(role).startsWith("/analytics") ? getDefaultRouteForRole(role) : "/analytics/overview" }
          : app,
      ),
    [role],
  );

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    SetOpen(false);
  };

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    try {
      const response = await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: sessionStorage.getItem("refreshToken"),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (data.success) {
        sessionStorage.clear();

        // ✅ notify other components (NavigationTabs, etc.)
        window.dispatchEvent(new Event("auth-changed"));

        setUserFullName("Guest");
        setSchoolLogoUrl(null);
        setSchoolName("");
        router.push("/");
        return;
      }

      SetMessage(data.error || data.message || "Something went wrong");
      SetSeverity("error");
      SetOpen(true);
    } catch {
      SetMessage("Something went wrong");
      SetSeverity("error");
      SetOpen(true);
    }
  }, [apiUrl, router]);

  const retrieveUserDetails = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const refreshToken = sessionStorage.getItem("refreshToken");
      const idToken = sessionStorage.getItem("idToken");
      const expiresInRaw = sessionStorage.getItem("expiresIn");

      if (!accessToken || !refreshToken || !idToken || !expiresInRaw) {
        setUserFullName("Guest");
        // Avoid redirect loops on the login page
        if (pathname !== "/") router.push("/");
        return;
      }

      // 1) get profile to display name
      const getUserInfoResponse = await fetch(`${apiUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const getUserInfoData = await getUserInfoResponse
        .json()
        .catch(() => ({}));

      if (getUserInfoData.success) {
        setUserFullName(getUserInfoData.fullName || "User");
      } else {
        // If token is invalid, clear and force login
        setUserFullName("Guest");
        SetMessage(
          getUserInfoData.error ||
          getUserInfoData.message ||
          "Something went wrong",
        );
        SetSeverity("error");
        SetOpen(true);
      }

      // 2) refresh token logic (your existing logic, kept)
      const now = Date.now();
      const expiresNum = Number(expiresInRaw);

      const isLikelySeconds =
        Number.isFinite(expiresNum) &&
        expiresNum > 0 &&
        expiresNum < 10_000_000;
      const expiresAtMs = isLikelySeconds
        ? now + expiresNum * 1000
        : expiresNum;

      if (Number.isFinite(expiresAtMs) && now + 1000 * 60 * 3 > expiresAtMs) {
        const refreshSessionResponse = await fetch(
          `${apiUrl}/api/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: getUserInfoData.username,
              refreshToken,
            }),
          },
        );

        const refreshSessionData = await refreshSessionResponse
          .json()
          .catch(() => ({}));

        if (refreshSessionData.success) {
          const newAccess = refreshSessionData.tokens?.accessToken;
          const newId = refreshSessionData.tokens?.idToken;
          const newRefresh =
            refreshSessionData.tokens?.refreshToken || refreshToken;
          const newExpiresIn = refreshSessionData.tokens?.expiresIn;

          if (newAccess) sessionStorage.setItem("accessToken", newAccess);
          if (newId) sessionStorage.setItem("idToken", newId);
          if (newRefresh) sessionStorage.setItem("refreshToken", newRefresh);

          if (typeof newExpiresIn === "number") {
            const expMs = Date.now() + newExpiresIn * 1000;
            sessionStorage.setItem("expiresIn", String(expMs));
          } else if (newExpiresIn != null) {
            sessionStorage.setItem("expiresIn", String(newExpiresIn));
          }

          // ✅ notify other components that auth/session changed
          window.dispatchEvent(new Event("auth-changed"));
        } else {
          SetMessage(
            refreshSessionData.error ||
            refreshSessionData.message ||
            "Something went wrong",
          );
          SetSeverity("error");
          SetOpen(true);
        }
      }
    } catch {
      SetMessage("Something went wrong");
      SetSeverity("error");
      SetOpen(true);
    }
  }, [apiUrl, router, pathname]);

  // Wrapping in an async callback satisfies the linter — setState is called
  // inside the async function, not synchronously in the effect body.
  useEffect(() => {
    if (hideHeaderUI) return;
    const run = async () => {
      await retrieveUserDetails();
    };
    run();
  }, [retrieveUserDetails, pathname, hideHeaderUI]);

  useEffect(() => {
    if (hideHeaderUI) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") retrieveUserDetails();
    };
    window.addEventListener("visibilitychange", onVisibility);
    return () => window.removeEventListener("visibilitychange", onVisibility);
  }, [retrieveUserDetails, hideHeaderUI]);

  useEffect(() => {
    if (hideHeaderUI) return;
    const onSchoolChanged = (e) => {
      setSchoolLogoUrl(e.detail?.logoUrl || null);
      setSchoolName(e.detail?.schoolName || "");
    };
    window.addEventListener("school-changed", onSchoolChanged);
    return () => window.removeEventListener("school-changed", onSchoolChanged);
  }, [hideHeaderUI]);

  useEffect(() => {
    if (hideHeaderUI) return;
    const onAuthChanged = () => retrieveUserDetails();
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, [retrieveUserDetails, hideHeaderUI]);

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-between w-full px-8">
          <div className="flex w-full items-center justify-between h-16">
            {/* Logo + module switcher */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Image
                  src="/images/Logo-Symbol-green.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>

              {!hideHeaderUI && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
                  {apps.map((app) => {
                    const isActive = app.key === currentApp.key;
                    return (
                      <Link
                        key={app.key}
                        href={app.href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white text-[var(--color-main)] shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {app.icon}
                        {app.shortLabel}
                      </Link>
                    );
                  })}
                </div>
              )}

              {schoolLogoUrl && (
                <>
                  <div className="h-8 w-px bg-gray-300" aria-hidden="true" />
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Image
                      src={schoolLogoUrl}
                      alt={schoolName || "School Logo"}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Hide profile/name area on auth routes */}
            {!hideHeaderUI && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {userFullName}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l9-9 9 9M4 10v10h16V10M9 20v-6h6v6"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">Dashboard</span>
                      </Link>
                      <Link
                        href="/faq"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">FAQ</span>
                      </Link>
                      {/* <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">Settings</span>
                      </Link> */}
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left cursor-pointer"
                      >
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <SnackbarAlert
        open={open}
        onClose={handleClose}
        message={message}
        severity={severity}
      />
    </>
  );
}
