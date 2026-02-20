/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page:  https://siman.ca/product/material-dashboard-react
* Copyright 2023 Siman's Support ( https://siman.ca)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Material Dashboard 2 React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Material Dashboard 2 React Dark Mode themes
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Material Dashboard 2 React routes
import routes from "routes";

// Material Dashboard 2 React contexts
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "context";
import { AuthProvider, useAuth } from "context/AuthContext";

// Images
import brandWhite from "assets/images/logo-ct.png";
import brandDark from "assets/images/logo-ct-dark.png";

// Protected Route component - defined outside App to prevent recreation
// Modified to allow subscription routes for all authenticated users
const ProtectedRoute = ({ children, allowSubscription = false }) => {
  const { isAuthenticated, loading, canAccessDashboard } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100vh"
      >
        Loading...
      </MDBox>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" replace />;
  }
  
  // For subscription routes, allow all authenticated users
  if (allowSubscription && location.pathname.startsWith('/subscription/')) {
    return children;
  }
  
  // Regular users (role: 'user') cannot access dashboard routes
  if (!canAccessDashboard()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route component - redirects to appropriate page if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, canAccessDashboard } = useAuth();
  
  if (loading) {
    return (
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100vh"
      >
        Loading...
      </MDBox>
    );
  }
  
  if (isAuthenticated) {
    // Regular users go to front page, admin/publisher go to dashboard
    if (canAccessDashboard()) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

// Admin Route component - only accessible to admin users
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  
  if (loading) {
    return (
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100vh"
      >
        Loading...
      </MDBox>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" replace />;
  }
  
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Publisher Route component - accessible to admin and publisher users
const PublisherRoute = ({ children }) => {
  const { isAuthenticated, loading, canAccessDashboard } = useAuth();
  
  if (loading) {
    return (
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100vh"
      >
        Loading...
      </MDBox>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" replace />;
  }
  
  if (!canAccessDashboard()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  // Routes that should not show the sidenav
  const hideSidenavRoutes = ["/", "/epapers/public-view", "/subscription"];
  const shouldHideSidenav = hideSidenavRoutes.some(route => 
    pathname === route || pathname.startsWith("/epapers/public-view/") || pathname.startsWith("/subscription/")
  );

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        let element;
        
        // Handle subscription routes - they should be accessible to all authenticated users
        if (route.route.startsWith('/subscription/')) {
          if (route.requiresAuth) {
            element = <ProtectedRoute allowSubscription={true}>{route.component}</ProtectedRoute>;
          } else {
            element = route.component;
          }
        } else if (route.adminOnly) {
          element = <AdminRoute>{route.component}</AdminRoute>;
        } else if (route.publisherOnly) {
          element = <PublisherRoute>{route.component}</PublisherRoute>;
        } else if (route.requiresAuth) {
          element = <ProtectedRoute>{route.component}</ProtectedRoute>;
        } else if (route.route === "/authentication/sign-in" || route.route === "/authentication/sign-up") {
          element = <PublicRoute>{route.component}</PublicRoute>;
        } else if (route.route === "/" || route.route === "/epapers/public-view/:id") {
          // Front page and public viewer - accessible to everyone without auth check
          element = route.component;
        } else {
          element = route.component;
        }
        return <Route path={route.route} element={element} key={route.key} />;
      }

      return null;
    });

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  const appContent = direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {layout === "dashboard" && !shouldHideSidenav && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
              brandName="E-Paper"
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/authentication/sign-in" replace />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {layout === "dashboard" && !shouldHideSidenav && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
            brandName="E-Paper"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {configsButton}
        </>
      )}
      {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/authentication/sign-in" replace />} />
        </Routes>

    </ThemeProvider>
  );

  return (
    <AuthProvider>
      {appContent}
    </AuthProvider>
  );
}
