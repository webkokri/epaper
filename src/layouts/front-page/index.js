/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page:  https://siman.ca/product/material-dashboard-react
* Copyright 2023 Creative Tim ( https://siman.ca)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// react-router-dom components
import { Link, useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// API
import { epaperAPI, settingsAPI, API_URL } from "services/api";

// Auth Context
import { useAuth } from "context/AuthContext";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";

function FrontPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, subscriptionStatus, checkSubscriptionStatus } = useAuth();
  const [ePapers, setEPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptionModeEnabled, setSubscriptionModeEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [siteSettings, setSiteSettings] = useState({
    site_name: "Site Title",
    site_title: "Digital Newspaper Publishing Platform",
    logo_url: null,
  });
  const itemsPerPage = 12;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    fetchEPapers();
    fetchSubscriptionMode();
    fetchSiteSettings();
  }, []);

  const fetchSubscriptionMode = async () => {
    try {
      setLoadingSettings(true);
      const response = await settingsAPI.checkSubscriptionMode();
      setSubscriptionModeEnabled(response.data.subscriptionModeEnabled);
    } catch (error) {
      console.error("Error fetching subscription mode:", error);
      setSubscriptionModeEnabled(false);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await settingsAPI.getPublicSettings();
      setSiteSettings(prev => ({
        ...prev,
        site_name: response.data.site_name || prev.site_name,
        site_title: response.data.site_title || prev.site_title,
        logo_url: response.data.logo_url || null,
      }));
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  };

  const fetchEPapers = async () => {
    try {
      const response = await epaperAPI.getAll();
      setEPapers(response.data || []);
    } catch (error) {
      console.error("Error fetching e-papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEPaper = (id) => {
    // If subscription mode is enabled
    if (subscriptionModeEnabled) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        navigate("/authentication/sign-in");
        return;
      }
      // If authenticated but no subscription, redirect to subscription page
      if (subscriptionStatus && !subscriptionStatus.hasActiveSubscription) {
        navigate("/subscription/checkout");
        return;
      }
    }
    // Otherwise, allow access to the e-paper
    navigate(`/epapers/public-view/${id}`);
  };

  const handleSubscribe = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Direct navigation - the route will handle auth check
    window.location.href = "/subscription/checkout";
  };

  const handleLogin = () => {
    navigate("/authentication/sign-in");
  };

  const handleSignUp = () => {
    navigate("/authentication/sign-up");
  };

  // Pagination logic
  const totalPages = Math.ceil(ePapers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEPapers = ePapers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* User Info / Login Button in Top Right */}
      <MDBox
        position="fixed"
        top={16}
        right={16}
        zIndex={1000}
        display="flex"
        alignItems="center"
        gap={2}
      >
        {isAuthenticated ? (
          <>
            {subscriptionStatus?.hasActiveSubscription && (
              <MDBox 
                component="span"
                sx={{ 
                  backgroundColor: "rgba(76, 175, 80, 0.3)", 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <MDTypography variant="caption" color="success" fontWeight="bold">
                  ✓ {subscriptionStatus.isFreePlan ? "Free Plan" : "Premium"}
                </MDTypography>
              </MDBox>
            )}
            <MDTypography variant="button" color="white" fontWeight="medium">
              {user?.name || user?.email}
            </MDTypography>
            <MDButton
              variant="gradient"
              color="error"
              size="small"
              onClick={handleLogout}
            >
              Logout
            </MDButton>
          </>
        ) : (
          <MDButton
            component={Link}
            to="/authentication/sign-in"
            variant="gradient"
            color="info"
          >
            Login
          </MDButton>
        )}
      </MDBox>

      <Box sx={{ width: "100%", minHeight: "100vh", py: 4 }}>
        <Box sx={{ maxWidth: "1400px", mx: "auto", px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header */}
          <MDBox mb={4} textAlign="center">
            {/* Logo Image */}
            {siteSettings.logo_url && (
              <MDBox
                component="img"
                src={`${API_URL.replace("/api", "")}${siteSettings.logo_url}`}
                alt="Site Logo"
                sx={{
                  width: { xs: "80px", sm: "100px", md: "120px" },
                  height: "auto",
                  mb: 2,
                }}
              />
            )}
            <MDTypography variant="h2" fontWeight="bold" color="white">
              {siteSettings.site_name}
            </MDTypography>
            <MDTypography variant="h5" fontWeight="medium" mt={1} color="white">
              {siteSettings.site_title}
            </MDTypography>
            <MDTypography variant="body1" color="white" mt={2}>
              Browse and read our collection of digital newspapers
            </MDTypography>
            
            {/* Subscription CTA - Show for unauthenticated users when subscription mode is enabled */}
            {subscriptionModeEnabled && !isAuthenticated && (
              <MDBox mt={3} p={3} sx={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, maxWidth: "600px", mx: "auto" }}>
                <MDTypography variant="h5" color="white" fontWeight="medium" gutterBottom>
                  🔒 Subscription Required
                </MDTypography>
                <MDTypography variant="body2" color="white" mb={3}>
                  Please login or create an account to access our e-papers.
                </MDTypography>
                <MDBox display="flex" gap={2} justifyContent="center">
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleLogin}
                  >
                    Login
                  </MDButton>
                  <MDButton
                    variant="outlined"
                    color="white"
                    onClick={handleSignUp}
                    sx={{ color: 'white', borderColor: 'white' }}
                  >
                    Sign Up
                  </MDButton>
                </MDBox>
              </MDBox>
            )}
            
            {/* Subscription CTA for authenticated users without subscription - only show when subscription mode is enabled */}
            {subscriptionModeEnabled && isAuthenticated && subscriptionStatus && !subscriptionStatus.hasActiveSubscription && (
              <MDBox mt={3} p={2} sx={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                <MDTypography variant="h6" color="white" fontWeight="medium" gutterBottom>
                  Unlock Full Access
                </MDTypography>
                <MDTypography variant="body2" color="white" mb={2}>
                  Subscribe now to access all our premium e-papers and exclusive content.
                </MDTypography>
                <MDButton
                  type="button"
                  variant="gradient"
                  color="success"
                  onClick={handleSubscribe}
                >
                  Subscribe Now
                </MDButton>
              </MDBox>
            )}
          </MDBox>

          {/* E-Papers Grid */}
          <MDBox mt={4}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <MDTypography variant="h4" fontWeight="medium" color="white">
                Available E-Papers
              </MDTypography>
              {subscriptionModeEnabled && isAuthenticated && subscriptionStatus?.hasActiveSubscription && (
                <MDTypography variant="button" color="success">
                  ✓ Full Access Enabled
                </MDTypography>
              )}
            </MDBox>
            
            {loading ? (
              <MDBox textAlign="center" py={4}>
                <MDTypography variant="h6" color="white">Loading...</MDTypography>
              </MDBox>
            ) : ePapers.length === 0 ? (
              <MDBox textAlign="center" py={4}>
                <MDTypography variant="h6" color="white">
                  No e-papers available at the moment.
                </MDTypography>
              </MDBox>
            ) : (
              <Grid container spacing={3}>
                {currentEPapers.map((paper, index) => {
                  // When subscription mode is enabled:
                  // - Unauthenticated users: blocked (show lock)
                  // - Authenticated non-subscribers: first 3 free, rest blocked
                  // - Subscribers: full access
                  const isFreePreview = index < 3;
                  const isUnauthenticated = !isAuthenticated;
                  const requiresSubscription = subscriptionModeEnabled && (
                    isUnauthenticated || 
                    (isAuthenticated && subscriptionStatus && !subscriptionStatus?.hasActiveSubscription && !isFreePreview)
                  );
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={paper.id}>
                      <Card 
                        sx={{ 
                          cursor: requiresSubscription ? "default" : "pointer",
                          height: "100%",
                          width: "100%",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          opacity: requiresSubscription ? 0.8 : 1,
                          "&:hover": {
                            transform: requiresSubscription ? "none" : "translateY(-4px)",
                            boxShadow: requiresSubscription ? "none" : "0 12px 32px rgba(0,0,0,0.3)",
                          },
                        }}
                        onClick={() => !requiresSubscription && handleViewEPaper(paper.id)}
                      >
                        <MDBox p={2}>
                          <MDBox
                            component="img"
                            src={
                              paper.first_page_image
                                ? `${API_URL.replace("/api", "")}${paper.first_page_image}`
                                : paper.thumbnail_path
                                  ? `${API_URL.replace("/api", "")}${paper.thumbnail_path}`
                                  : "/assets/images/home-decor-1.jpg"
                            }
                            alt={paper.title}
                            width="100%"
                            height="280px"
                            sx={{ 
                              objectFit: "cover", 
                              borderRadius: "md",
                              mb: 2,
                              filter: requiresSubscription ? "grayscale(100%) blur(1px)" : "none",
                            }}
                          />
                          <MDTypography variant="h6" fontWeight="medium" noWrap title={paper.title}>
                            {paper.title}
                          </MDTypography>
                          <MDTypography variant="caption" color="text" display="block" mt={0.5}>
                            {paper.page_count || paper.total_pages || 0} pages
                          </MDTypography>
                          <MDTypography variant="caption" color="text" display="block">
                            {new Date(paper.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </MDTypography>
                          <MDBox mt={2}>
                            {requiresSubscription ? (
                              <MDButton
                                variant="outlined"
                                color="warning"
                                fullWidth
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isUnauthenticated) {
                                    handleLogin();
                                  } else {
                                    handleSubscribe();
                                  }
                                }}
                              >
                                {isUnauthenticated ? "🔒 Login to Access" : "🔒 Subscribe to Access"}
                              </MDButton>
                            ) : (
                              <MDButton
                                variant="gradient"
                                color="info"
                                fullWidth
                                size="small"
                              >
                                {isFreePreview && !subscriptionStatus?.hasActiveSubscription ? "Free Preview" : "Read Now"}
                              </MDButton>
                            )}
                          </MDBox>
                        </MDBox>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </MDBox>

          {/* Pagination */}
          {totalPages > 1 && (
            <MDBox mt={4} display="flex" justifyContent="center" alignItems="center" gap={1}>
              <MDButton
                variant="outlined"
                color="info"
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </MDButton>
              
              <MDBox display="flex" gap={0.5}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <MDButton
                    key={pageNum}
                    variant={currentPage === pageNum ? "gradient" : "outlined"}
                    color="info"
                    size="small"
                    onClick={() => handlePageChange(pageNum)}
                    sx={{ minWidth: "40px" }}
                  >
                    {pageNum}
                  </MDButton>
                ))}
              </MDBox>
              
              <MDButton
                variant="outlined"
                color="info"
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </MDButton>
            </MDBox>
          )}

          {/* Showing X of Y papers */}
          {ePapers.length > 0 && (
            <MDBox mt={2} textAlign="center">
              <MDTypography variant="caption" color="white">
                Showing {startIndex + 1}-{Math.min(endIndex, ePapers.length)} of {ePapers.length} e-papers
              </MDTypography>
            </MDBox>
          )}

          {/* Footer Links */}
          <MDBox mt={4} textAlign="center">
            {!isAuthenticated ? (
              <MDTypography variant="button" color="white">
                Are you a publisher?{" "}
                <Link
                  to="/authentication/sign-in"
                  style={{ color: '#1A73E8', fontWeight: 500, textDecoration: 'none' }}
                >
                  Login here
                </Link>
              </MDTypography>
            ) : subscriptionModeEnabled && !subscriptionStatus?.hasActiveSubscription ? (
              <MDBox>
                <MDTypography variant="button" color="white" display="block" mb={1}>
                  Welcome back! You have limited access to free content.
                </MDTypography>
                <MDButton
                  type="button"
                  variant="gradient"
                  color="success"
                  size="small"
                  onClick={handleSubscribe}
                >
                  Upgrade to Premium
                </MDButton>
              </MDBox>
            ) : (
              <MDTypography variant="button" color="white">
                Welcome back! Enjoy unlimited access to all our e-papers.
                <br/>
                <MDButton
                  type="button"
                  variant="gradient"
                  color="success"
                  size="small"
                  onClick={() => window.open("https://gkmmedia.com/", "_blank")}
                >
                  Visit Official Website
                </MDButton>
              </MDTypography>
              
            )}
          </MDBox>
        </Box>
      </Box>
    </Box>
  );
}

export default FrontPage;
