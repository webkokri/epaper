/**
=========================================================
* Material Dashboard 2 React - Subscription Checkout
=========================================================

* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";

// @mui icons
import Icon from "@mui/material/Icon";
import CloseIcon from "@mui/icons-material/Close";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import Footer from "examples/Footer";

// Payment Form
import PaymentForm from "./PaymentForm";

// API
import { subscriptionAPI } from "services/api";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";

// Initialize Stripe
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function SubscriptionCheckout() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subscriptionRes] = await Promise.all([
        subscriptionAPI.getActivePlans(),
        subscriptionAPI.getMySubscription()
      ]);
      
      setPlans(plansRes.data || []);
      if (subscriptionRes.data && subscriptionRes.data.hasSubscription) {
        setCurrentSubscription(subscriptionRes.data.subscription);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setPlans([]);
      showSnackbar("Could not load subscription plans. Please refresh the page.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, color = "success") => {
    setSnackbar({ open: true, message, color });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubscribe = async (plan) => {
    // Check if user already has this plan
    if (currentSubscription && currentSubscription.plan_id === plan.id) {
      showSnackbar("You are already subscribed to this plan", "info");
      return;
    }

    // Check if user has a different active subscription
    if (currentSubscription && currentSubscription.plan_id !== plan.id) {
      showSnackbar("Please cancel your current subscription before subscribing to a new plan.", "warning");
      return;
    }

    if (plan.is_free) {
      showSnackbar("Free plan subscription coming soon!", "info");
    } else {
      // Open payment dialog for paid plans
      setSelectedPlan(plan);
      setPaymentDialogOpen(true);
    }
  };

  const handlePaymentSuccess = (subscriptionData) => {
    showSnackbar("Subscription created successfully! Redirecting...", "success");
    setPaymentDialogOpen(false);
    setSelectedPlan(null);
    // Refresh data
    setTimeout(() => {
      fetchData();
    }, 1000);
  };

  const handlePaymentError = (errorMessage) => {
    showSnackbar(errorMessage, "error");
  };

  const handlePaymentCancel = () => {
    setPaymentDialogOpen(false);
    setSelectedPlan(null);
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      await subscriptionAPI.cancelSubscription();
      showSnackbar("Subscription will be canceled at the end of the billing period");
      fetchData();
    } catch (error) {
      console.error("Error canceling subscription:", error);
      showSnackbar("Error canceling subscription", "error");
    } finally {
      setLoading(false);
    }
  };

  const getIntervalLabel = (interval) => {
    const labels = {
      monthly: "month",
      quarterly: "quarter",
      yearly: "year"
    };
    return labels[interval] || interval;
  };

  const getRecommendedPlan = () => {
    return plans.find(p => p.interval === "yearly" && !p.is_free) || plans[plans.length - 1];
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
      {/* Back to Home Button */}
      <MDBox
        position="fixed"
        top={16}
        left={16}
        zIndex={1000}
      >
        <MDButton
          component={Link}
          to="/"
          variant="outlined"
          color="white"
          size="small"
          sx={{ color: 'white', borderColor: 'white' }}
        >
          ← Back to Home
        </MDButton>
      </MDBox>

      <Box sx={{ width: "100%", minHeight: "100vh", py: 4 }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 2, sm: 3, md: 4 } }}>
          <MDBox mb={4} textAlign="center">
            <MDTypography variant="h2" fontWeight="bold" color="white" gutterBottom>
              Choose Your Plan
            </MDTypography>
            <MDTypography variant="body1" color="white">
              Select the perfect subscription plan for your needs
            </MDTypography>
          </MDBox>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card sx={{ mb: 4, backgroundColor: "info.main", color: "white" }}>
            <CardContent>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <MDBox>
                  <MDTypography variant="h6" color="white" fontWeight="bold">
                    Current Subscription: {currentSubscription.plan_name}
                  </MDTypography>
                  <MDTypography variant="body2" color="white">
                    Status: <Chip 
                      label={currentSubscription.status} 
                      color={currentSubscription.status === "active" ? "success" : "warning"}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </MDTypography>
                  {currentSubscription.current_period_end && (
                    <MDTypography variant="body2" color="white">
                      Renews on: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                    </MDTypography>
                  )}
                </MDBox>
                {!currentSubscription.is_free && (
                  <MDButton 
                    variant="outlined" 
                    color="white"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </MDButton>
                )}
              </MDBox>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <Grid container spacing={3} justifyContent="center">
          {plans.map((plan) => {
            const isRecommended = getRecommendedPlan()?.id === plan.id;
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            
            return (
              <Grid item xs={12} md={6} lg={3} key={plan.id}>
                <Card 
                  sx={{ 
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    border: isRecommended ? 2 : 0,
                    borderColor: "info.main"
                  }}
                >
                  {isRecommended && (
                    <Chip
                      label="Best Value"
                      color="info"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontWeight: "bold"
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <MDBox textAlign="center" mb={2}>
                      <MDTypography variant="h4" fontWeight="bold">
                        {plan.name}
                      </MDTypography>
                      <MDTypography variant="body2" color="text" sx={{ mt: 1 }}>
                        {plan.description}
                      </MDTypography>
                    </MDBox>

                    <MDBox textAlign="center" mb={3}>
                      <MDTypography variant="h2" fontWeight="bold" color={plan.is_free ? "success" : "dark"}>
                        {plan.is_free ? "Free" : `$${plan.price}`}
                      </MDTypography>
                      {!plan.is_free && (
                        <MDTypography variant="body2" color="text">
                          /{getIntervalLabel(plan.interval)}
                        </MDTypography>
                      )}
                    </MDBox>

                    <Divider sx={{ my: 2 }} />

                    <List dense>
                      {JSON.parse(plan.features || "[]").map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Icon color="success">check_circle</Icon>
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ variant: "body2" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <MDButton
                      variant={isCurrentPlan ? "outlined" : "gradient"}
                      color={isCurrentPlan ? "success" : "info"}
                      fullWidth
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrentPlan || loading}
                    >
                      {isCurrentPlan ? (
                        "Current Plan"
                      ) : (
                        plan.is_free ? "Get Started Free" : "Subscribe Now"
                      )}
                    </MDButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* FAQ */}
        <MDBox mt={6} textAlign="center">
          <MDTypography variant="h5" fontWeight="medium" gutterBottom color="white">
            Frequently Asked Questions
          </MDTypography>
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <MDTypography variant="body2" color="white" fontWeight="medium">
                Can I change my plan later?
              </MDTypography>
              <MDTypography variant="body2" color="white">
                Yes, you can upgrade or downgrade your plan at any time.
              </MDTypography>
            </Grid>
            <Grid item xs={12} md={4}>
              <MDTypography variant="body2" color="white" fontWeight="medium">
                How do I cancel?
              </MDTypography>
              <MDTypography variant="body2" color="white">
                You can cancel anytime from your account settings.
              </MDTypography>
            </Grid>
            <Grid item xs={12} md={4}>
              <MDTypography variant="body2" color="white" fontWeight="medium">
                Is there a refund policy?
              </MDTypography>
              <MDTypography variant="body2" color="white">
                We offer a 30-day money-back guarantee.
              </MDTypography>
            </Grid>
          </Grid>
        </MDBox>
        </Box>
        
        <Footer />
      </Box>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={handlePaymentCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDTypography variant="h5" fontWeight="medium">
              Complete Your Subscription
            </MDTypography>
            <IconButton onClick={handlePaymentCancel} size="small">
              <CloseIcon />
            </IconButton>
          </MDBox>
        </DialogTitle>
        <DialogContent>
          {!stripePublishableKey ? (
            <MDBox p={3} textAlign="center">
              <MDTypography variant="h6" color="error" gutterBottom>
                Stripe Not Configured
              </MDTypography>
              <MDTypography variant="body2" color="text" mb={2}>
                Please add your Stripe publishable key to the environment variables.
              </MDTypography>
              <MDTypography variant="caption" color="text">
                Set REACT_APP_STRIPE_PUBLISHABLE_KEY in your .env file
              </MDTypography>
              <MDBox mt={2}>
                <MDButton
                  variant="outlined"
                  color="info"
                  onClick={handlePaymentCancel}
                >
                  Close
                </MDButton>
              </MDBox>
            </MDBox>
          ) : selectedPlan && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                plan={selectedPlan}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <MDSnackbar
        color={snackbar.color}
        icon={snackbar.color === "success" ? "check" : snackbar.color === "info" ? "info" : "error"}
        title={snackbar.color === "success" ? "Success" : snackbar.color === "info" ? "Info" : "Error"}
        content={snackbar.message}
        dateTime={new Date().toLocaleString()}
        open={snackbar.open}
        onClose={closeSnackbar}
        close={closeSnackbar}
        bgWhite
      />
    </Box>
  );
}

export default SubscriptionCheckout;
