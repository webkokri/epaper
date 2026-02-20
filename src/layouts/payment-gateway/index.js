/**
=========================================================
* Material Dashboard 2 React - Payment Gateway Management
=========================================================

* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

// @mui icons
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// API
import api from "services/api";

function PaymentGateway() {
  const [loading, setLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [config, setConfig] = useState({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    is_test_mode: true
  });
  const [showSecrets, setShowSecrets] = useState({
    secret: false,
    publishable: false,
    webhook: false
  });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success"
  });

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    activeSubscriptions: 0
  });

  useEffect(() => {
    fetchStripeStatus();
    fetchPaymentStats();
    loadConfig();
  }, []);

  const fetchStripeStatus = async () => {
    try {
      const response = await api.get("/subscriptions/stripe-status");
      setStripeStatus(response.data);
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await api.get("/subscriptions/payment-stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  };

  const loadConfig = () => {
    // Load from environment or local storage (in production, this should come from secure backend)
    const savedConfig = localStorage.getItem("stripe_config");
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const showSnackbar = (message, color = "success") => {
    setSnackbar({ open: true, message, color });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      // Save to local storage (in production, save to backend)
      localStorage.setItem("stripe_config", JSON.stringify(config));
      
      // Also update backend environment (this would need a secure endpoint in production)
      await api.post("/subscriptions/update-config", {
        stripe_secret_key: config.stripe_secret_key,
        stripe_publishable_key: config.stripe_publishable_key,
        stripe_webhook_secret: config.stripe_webhook_secret
      });
      
      showSnackbar("Configuration saved successfully");
      fetchStripeStatus();
    } catch (error) {
      console.error("Error saving config:", error);
      showSnackbar("Error saving configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const response = await api.post("/subscriptions/test-stripe-connection");
      if (response.data.success) {
        showSnackbar("Stripe connection successful!", "success");
      } else {
        showSnackbar("Stripe connection failed", "error");
      }
      fetchStripeStatus();
    } catch (error) {
      console.error("Error testing connection:", error);
      showSnackbar("Connection test failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleShowSecret = (key) => {
    setShowSecrets({
      ...showSecrets,
      [key]: !showSecrets[key]
    });
  };

  const maskKey = (key) => {
    if (!key) return "";
    if (key.length <= 8) return "****";
    return key.substring(0, 4) + "..." + key.substring(key.length - 4);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar absolute isMini />
      <MDBox mt={8} mb={3}>
        <MDBox mb={3}>
          <MDTypography variant="h3" fontWeight="medium">
            Payment Gateway Management
          </MDTypography>
          <MDTypography variant="body2" color="text">
            Configure and manage your Stripe payment integration
          </MDTypography>
        </MDBox>

        <Grid container spacing={3}>
          {/* Connection Status Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <MDTypography variant="h6" fontWeight="medium">
                    Connection Status
                  </MDTypography>
                  <Chip
                    label={stripeStatus?.connected ? "Connected" : "Not Connected"}
                    color={stripeStatus?.connected ? "success" : "error"}
                    size="small"
                  />
                </MDBox>
                
                <Divider sx={{ my: 2 }} />
                
                <MDBox mb={2}>
                  <MDTypography variant="body2" color="text" fontWeight="medium">
                    Mode:
                  </MDTypography>
                  <Chip
                    label={config.is_test_mode ? "Test Mode" : "Live Mode"}
                    color={config.is_test_mode ? "warning" : "success"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </MDBox>

                <MDBox mb={2}>
                  <MDTypography variant="body2" color="text" fontWeight="medium">
                    Webhook Status:
                  </MDTypography>
                  <MDTypography variant="body2" color={stripeStatus?.webhookConfigured ? "success" : "error"}>
                    {stripeStatus?.webhookConfigured ? "✓ Configured" : "✗ Not Configured"}
                  </MDTypography>
                </MDBox>

                <MDButton
                  variant="gradient"
                  color={stripeStatus?.connected ? "success" : "info"}
                  fullWidth
                  onClick={handleTestConnection}
                  disabled={loading}
                >
                  {loading ? "Testing..." : "Test Connection"}
                </MDButton>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Payment Statistics
                </MDTypography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center" p={2} bgcolor="grey.100" borderRadius="md">
                      <MDTypography variant="h4" fontWeight="bold" color="success">
                        ${stats.totalRevenue.toFixed(2)}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Total Revenue
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center" p={2} bgcolor="grey.100" borderRadius="md">
                      <MDTypography variant="h4" fontWeight="bold" color="info">
                        {stats.totalTransactions}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Total Transactions
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center" p={2} bgcolor="grey.100" borderRadius="md">
                      <MDTypography variant="h4" fontWeight="bold" color="success">
                        {stats.successfulPayments}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Successful
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <MDBox textAlign="center" p={2} bgcolor="grey.100" borderRadius="md">
                      <MDTypography variant="h4" fontWeight="bold" color="error">
                        {stats.failedPayments}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        Failed
                      </MDTypography>
                    </MDBox>
                  </Grid>
                </Grid>

                <MDBox mt={3} display="flex" gap={2}>
                  <MDButton
                    variant="outlined"
                    color="info"
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon sx={{ mr: 1 }}>open_in_new</Icon>
                    Stripe Dashboard
                  </MDButton>
                  
                  <MDButton
                    variant="outlined"
                    color="info"
                    href="https://dashboard.stripe.com/test/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon sx={{ mr: 1 }}>webhook</Icon>
                    Webhook Settings
                  </MDButton>
                </MDBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuration Form */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" fontWeight="medium" mb={3}>
                  Stripe Configuration
                </MDTypography>

                {!stripeStatus?.connected && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Stripe is not connected. Please configure your API keys to enable payments.
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stripe Secret Key"
                      name="stripe_secret_key"
                      value={showSecrets.secret ? config.stripe_secret_key : maskKey(config.stripe_secret_key)}
                      onChange={handleConfigChange}
                      placeholder="sk_test_..."
                      helperText="Your Stripe secret key (starts with sk_test_ or sk_live_)"
                      InputProps={{
                        endAdornment: (
                          <Tooltip title={showSecrets.secret ? "Hide" : "Show"}>
                            <IconButton onClick={() => toggleShowSecret("secret")} edge="end">
                              <Icon>{showSecrets.secret ? "visibility_off" : "visibility"}</Icon>
                            </IconButton>
                          </Tooltip>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stripe Publishable Key"
                      name="stripe_publishable_key"
                      value={showSecrets.publishable ? config.stripe_publishable_key : maskKey(config.stripe_publishable_key)}
                      onChange={handleConfigChange}
                      placeholder="pk_test_..."
                      helperText="Your Stripe publishable key (starts with pk_test_ or pk_live_)"
                      InputProps={{
                        endAdornment: (
                          <Tooltip title={showSecrets.publishable ? "Hide" : "Show"}>
                            <IconButton onClick={() => toggleShowSecret("publishable")} edge="end">
                              <Icon>{showSecrets.publishable ? "visibility_off" : "visibility"}</Icon>
                            </IconButton>
                          </Tooltip>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Webhook Secret"
                      name="stripe_webhook_secret"
                      value={showSecrets.webhook ? config.stripe_webhook_secret : maskKey(config.stripe_webhook_secret)}
                      onChange={handleConfigChange}
                      placeholder="whsec_..."
                      helperText="Your Stripe webhook endpoint secret"
                      InputProps={{
                        endAdornment: (
                          <Tooltip title={showSecrets.webhook ? "Hide" : "Show"}>
                            <IconButton onClick={() => toggleShowSecret("webhook")} edge="end">
                              <Icon>{showSecrets.webhook ? "visibility_off" : "visibility"}</Icon>
                            </IconButton>
                          </Tooltip>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.is_test_mode}
                          onChange={handleConfigChange}
                          name="is_test_mode"
                        />
                      }
                      label="Test Mode"
                    />
                    <MDTypography variant="caption" color="text" display="block" sx={{ ml: 4 }}>
                      Enable test mode to use Stripe test keys
                    </MDTypography>
                  </Grid>
                </Grid>

                <MDBox mt={3} display="flex" gap={2}>
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={handleSaveConfig}
                    disabled={loading}
                  >
                    <Icon sx={{ mr: 1 }}>save</Icon>
                    Save Configuration
                  </MDButton>
                  
                  <MDButton
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setConfig({
                        stripe_secret_key: "",
                        stripe_publishable_key: "",
                        stripe_webhook_secret: "",
                        is_test_mode: true
                      });
                      localStorage.removeItem("stripe_config");
                      showSnackbar("Configuration cleared");
                    }}
                  >
                    <Icon sx={{ mr: 1 }}>clear</Icon>
                    Clear
                  </MDButton>
                </MDBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Webhook Configuration Guide */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Webhook Configuration Guide
                </MDTypography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Webhooks are required for Stripe to notify your application about payment events.
                </Alert>

                <MDBox component="ol" sx={{ pl: 2 }}>
                  <MDTypography component="li" variant="body2" color="text" mb={1}>
                    Go to your <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">Stripe Dashboard Webhooks</a>
                  </MDTypography>
                  <MDTypography component="li" variant="body2" color="text" mb={1}>
                    Click "Add endpoint"
                  </MDTypography>
                  <MDTypography component="li" variant="body2" color="text" mb={1}>
                    Enter your endpoint URL: <code>{window.location.origin}/api/subscriptions/webhook</code>
                  </MDTypography>
                  <MDTypography component="li" variant="body2" color="text" mb={1}>
                    Select these events:
                    <ul style={{ marginTop: 8 }}>
                      <li>checkout.session.completed</li>
                      <li>invoice.payment_succeeded</li>
                      <li>invoice.payment_failed</li>
                      <li>customer.subscription.deleted</li>
                      <li>customer.subscription.updated</li>
                    </ul>
                  </MDTypography>
                  <MDTypography component="li" variant="body2" color="text" mb={1}>
                    Copy the "Signing secret" and paste it in the Webhook Secret field above
                  </MDTypography>
                </MDBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Snackbar */}
      <MDSnackbar
        color={snackbar.color}
        icon={snackbar.color === "success" ? "check" : "error"}
        title={snackbar.color === "success" ? "Success" : "Error"}
        content={snackbar.message}
        dateTime={new Date().toLocaleString()}
        open={snackbar.open}
        onClose={closeSnackbar}
        close={closeSnackbar}
        bgWhite
      >
        {snackbar.message}
      </MDSnackbar>
    </DashboardLayout>
  );
}

export default PaymentGateway;
