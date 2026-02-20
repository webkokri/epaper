import { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";

// @mui icons
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// API
import { subscriptionAPI } from "services/api";

// Stripe element styling
const ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

// Card brand icons mapping
const CARD_BRAND_ICONS = {
  visa: (
    <svg width="40" height="25" viewBox="0 0 40 25" fill="none">
      <rect width="40" height="25" rx="3" fill="#1434CB"/>
      <path d="M16.2 17.5L18.1 7.5H20.5L18.6 17.5H16.2ZM27.8 7.7C27.3 7.5 26.5 7.3 25.5 7.3C23.1 7.3 21.4 8.5 21.4 10.3C21.4 11.6 22.6 12.3 23.5 12.7C24.5 13.1 24.8 13.4 24.8 13.8C24.8 14.4 24.1 14.7 23.4 14.7C22.4 14.7 21.9 14.6 21.1 14.2L20.8 14.1L20.5 16.2C21.1 16.5 22.2 16.7 23.3 16.7C25.9 16.7 27.5 15.5 27.6 13.6C27.6 12.6 27 11.8 25.6 11.2C24.8 10.8 24.3 10.5 24.3 10.1C24.3 9.7 24.8 9.3 25.7 9.3C26.5 9.3 27.1 9.4 27.6 9.7L27.8 9.8L28.1 7.7H27.8ZM32.5 7.5H30.7C30.1 7.5 29.7 7.7 29.4 8.2L25.8 17.5H28.4L28.9 16.1H32L32.3 17.5H34.5L32.5 7.5ZM29.7 14.2L30.9 10.8L31.6 14.2H29.7ZM13.8 7.5L11.4 14.3L11.1 12.8L10.3 8.5C10.2 7.9 9.8 7.5 9.2 7.5H5.5L5.5 7.8C6.4 8 7.2 8.3 7.9 8.7L9.9 17.5H12.5L16.4 7.5H13.8Z" fill="white"/>
    </svg>
  ),
  mastercard: (
    <svg width="40" height="25" viewBox="0 0 40 25" fill="none">
      <rect width="40" height="25" rx="3" fill="#EB001B"/>
      <circle cx="15" cy="12.5" r="7" fill="#FF5F00"/>
      <circle cx="25" cy="12.5" r="7" fill="#F79E1B"/>
      <path d="M20 6.5C21.4 7.6 22.3 9.4 22.3 11.5C22.3 13.6 21.4 15.4 20 16.5C18.6 15.4 17.7 13.6 17.7 11.5C17.7 9.4 18.6 7.6 20 6.5Z" fill="#FF5F00"/>
    </svg>
  ),
  amex: (
    <svg width="40" height="25" viewBox="0 0 40 25" fill="none">
      <rect width="40" height="25" rx="3" fill="#006FCF"/>
      <path d="M8.5 10.5L7 14.5H10L8.5 10.5ZM15.5 11.5V10H11V15H12.5V13.5H14.5V12H12.5V11.5H15.5ZM20 11.5L18.5 10H16V15H18.5L20 13.5V11.5ZM18.5 13.5H17.5V11.5H18.5V13.5ZM25 10L23.5 12.5L22 10H20V15H21.5V12L23 14.5L24.5 12V15H26V10H25ZM31 10H27V15H31V13.5H28.5V13H30.5V11.5H28.5V11.5H31V10Z" fill="white"/>
    </svg>
  ),
  discover: (
    <svg width="40" height="25" viewBox="0 0 40 25" fill="none">
      <rect width="40" height="25" rx="3" fill="#FF6000"/>
      <circle cx="32" cy="12.5" r="8" fill="#F79E1B"/>
      <path d="M8 10H10V15H8V10ZM11.5 10H13C14.4 10 15 10.8 15 12.5C15 14.2 14.4 15 13 15H11.5V10ZM13 13.5C13.5 13.5 13.5 13.2 13.5 12.5C13.5 11.8 13.5 11.5 13 11.5H13V13.5H13ZM16 10H17.5V15H16V10ZM21 11.5C20.5 11.5 20.2 11.8 20.2 12.2H22.8C22.8 10.8 22.2 10 21 10C19.8 10 19 10.8 19 12.5C19 14.2 19.8 15 21 15C22.2 15 22.8 14.2 22.8 13.3H21.5C21.5 13.7 21.2 14 21 14C20.5 14 20.2 13.7 20.2 12.8V12.2C20.2 11.8 20.5 11.5 21 11.5Z" fill="white"/>
    </svg>
  ),
  unknown: (
    <CreditCardIcon sx={{ fontSize: 40, color: "#7b809a" }} />
  ),
};

function PaymentForm({ plan, onSuccess, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  // Form state
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  // Field completion state
  const [fieldStates, setFieldStates] = useState({
    cardNumber: { complete: false, error: null },
    cardExpiry: { complete: false, error: null },
    cardCvc: { complete: false, error: null },
  });

  // Card brand state
  const [cardBrand, setCardBrand] = useState("unknown");

  // Form errors
  const [errors, setErrors] = useState({
    cardholderName: "",
  });

  // Check if form is valid
  const isFormValid = () => {
    return (
      cardholderName.trim().length >= 3 &&
      fieldStates.cardNumber.complete &&
      fieldStates.cardExpiry.complete &&
      fieldStates.cardCvc.complete &&
      !fieldStates.cardNumber.error &&
      !fieldStates.cardExpiry.error &&
      !fieldStates.cardCvc.error
    );
  };

  const handleCardNumberChange = (event) => {
    setFieldStates(prev => ({
      ...prev,
      cardNumber: {
        complete: event.complete,
        error: event.error?.message || null,
      },
    }));

    // Update card brand
    if (event.brand) {
      setCardBrand(event.brand);
    }
  };

  const handleCardExpiryChange = (event) => {
    setFieldStates(prev => ({
      ...prev,
      cardExpiry: {
        complete: event.complete,
        error: event.error?.message || null,
      },
    }));
  };

  const handleCardCvcChange = (event) => {
    setFieldStates(prev => ({
      ...prev,
      cardCvc: {
        complete: event.complete,
        error: event.error?.message || null,
      },
    }));
  };

  const handleCardholderNameChange = (event) => {
    const value = event.target.value;
    setCardholderName(value);

    if (value.trim().length < 3 && value.trim().length > 0) {
      setErrors(prev => ({
        ...prev,
        cardholderName: "Name must be at least 3 characters",
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        cardholderName: "",
      }));
    }
  };

  const handleBillingAddressChange = (field) => (event) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!isFormValid()) {
      onError("Please complete all required fields");
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create payment intent
      const { data: intentData } = await subscriptionAPI.createPaymentIntent(plan.id);

      // Prepare billing details
      const billingDetails = {
        name: cardholderName.trim(),
      };

      // Add billing address if provided
      if (billingAddress.line1 || billingAddress.city || billingAddress.postal_code) {
        billingDetails.address = {
          line1: billingAddress.line1 || undefined,
          city: billingAddress.city || undefined,
          state: billingAddress.state || undefined,
          postal_code: billingAddress.postal_code || undefined,
          country: billingAddress.country || "US",
        };
      }

      // Step 2: Confirm card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: billingDetails,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === "succeeded") {
        // Step 3: Confirm subscription on backend
        const { data: subscriptionData } = await subscriptionAPI.confirmSubscription(
          paymentIntent.id,
          plan.id
        );

        onSuccess(subscriptionData);

        // Redirect to success page
        setTimeout(() => {
          navigate("/subscription/success");
        }, 1500);
      } else {
        throw new Error("Payment was not successful");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError(error.response?.data?.message || error.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <MDBox component="form" onSubmit={handleSubmit}>
          <MDTypography variant="h5" fontWeight="medium" mb={2}>
            Payment Details
          </MDTypography>

          <MDBox mb={3}>
            <MDTypography variant="body2" color="text" mb={1}>
              Subscribing to: <strong>{plan.name}</strong>
            </MDTypography>
            <MDTypography variant="h4" color="info" fontWeight="bold">
              ${plan.price}/{plan.interval === "monthly" ? "month" : plan.interval === "quarterly" ? "quarter" : "year"}
            </MDTypography>
          </MDBox>

          <Divider sx={{ my: 2 }} />

          {/* Cardholder Name */}
          <MDBox mb={3}>
            <MDTypography variant="body2" fontWeight="medium" mb={1}>
              Cardholder Name <span style={{ color: "#f44336" }}>*</span>
            </MDTypography>
            <TextField
              fullWidth
              placeholder="John Doe"
              value={cardholderName}
              onChange={handleCardholderNameChange}
              error={!!errors.cardholderName}
              helperText={errors.cardholderName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: "#7b809a" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#d2d6da",
                  },
                  "&:hover fieldset": {
                    borderColor: "#adb5bd",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1A73E8",
                  },
                },
              }}
            />
          </MDBox>

          {/* Card Number */}
          <MDBox mb={3}>
            <MDTypography variant="body2" fontWeight="medium" mb={1}>
              Card Number <span style={{ color: "#f44336" }}>*</span>
            </MDTypography>
            <Box
              sx={{
                border: `1px solid ${fieldStates.cardNumber.error ? "#fa755a" : "#d2d6da"}`,
                borderRadius: "8px",
                padding: "14px 12px",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": {
                  borderColor: fieldStates.cardNumber.error ? "#fa755a" : "#adb5bd",
                },
                "&:focus-within": {
                  borderColor: fieldStates.cardNumber.error ? "#fa755a" : "#1A73E8",
                  boxShadow: fieldStates.cardNumber.error
                    ? "0 0 0 2px rgba(250, 117, 90, 0.1)"
                    : "0 0 0 2px rgba(26, 115, 232, 0.1)",
                },
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <CardNumberElement
                  options={ELEMENT_OPTIONS}
                  onChange={handleCardNumberChange}
                />
              </Box>
              <Tooltip title={cardBrand === "unknown" ? "Card type" : cardBrand.toUpperCase()}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {CARD_BRAND_ICONS[cardBrand] || CARD_BRAND_ICONS.unknown}
                </Box>
              </Tooltip>
            </Box>
            {fieldStates.cardNumber.error && (
              <MDTypography variant="caption" color="error" mt={0.5}>
                {fieldStates.cardNumber.error}
              </MDTypography>
            )}
          </MDBox>

          {/* Expiry and CVC */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="medium" mb={1}>
                Expiry Date <span style={{ color: "#f44336" }}>*</span>
              </MDTypography>
              <Box
                sx={{
                  border: `1px solid ${fieldStates.cardExpiry.error ? "#fa755a" : "#d2d6da"}`,
                  borderRadius: "8px",
                  padding: "14px 12px",
                  backgroundColor: "#fff",
                  "&:hover": {
                    borderColor: fieldStates.cardExpiry.error ? "#fa755a" : "#adb5bd",
                  },
                  "&:focus-within": {
                    borderColor: fieldStates.cardExpiry.error ? "#fa755a" : "#1A73E8",
                    boxShadow: fieldStates.cardExpiry.error
                      ? "0 0 0 2px rgba(250, 117, 90, 0.1)"
                      : "0 0 0 2px rgba(26, 115, 232, 0.1)",
                  },
                }}
              >
                <CardExpiryElement
                  options={ELEMENT_OPTIONS}
                  onChange={handleCardExpiryChange}
                />
              </Box>
              {fieldStates.cardExpiry.error && (
                <MDTypography variant="caption" color="error" mt={0.5}>
                  {fieldStates.cardExpiry.error}
                </MDTypography>
              )}
            </Grid>
            <Grid item xs={6}>
              <MDTypography variant="body2" fontWeight="medium" mb={1}>
                CVC <span style={{ color: "#f44336" }}>*</span>
              </MDTypography>
              <Box
                sx={{
                  border: `1px solid ${fieldStates.cardCvc.error ? "#fa755a" : "#d2d6da"}`,
                  borderRadius: "8px",
                  padding: "14px 12px",
                  backgroundColor: "#fff",
                  "&:hover": {
                    borderColor: fieldStates.cardCvc.error ? "#fa755a" : "#adb5bd",
                  },
                  "&:focus-within": {
                    borderColor: fieldStates.cardCvc.error ? "#fa755a" : "#1A73E8",
                    boxShadow: fieldStates.cardCvc.error
                      ? "0 0 0 2px rgba(250, 117, 90, 0.1)"
                      : "0 0 0 2px rgba(26, 115, 232, 0.1)",
                  },
                }}
              >
                <CardCvcElement
                  options={ELEMENT_OPTIONS}
                  onChange={handleCardCvcChange}
                />
              </Box>
              {fieldStates.cardCvc.error && (
                <MDTypography variant="caption" color="error" mt={0.5}>
                  {fieldStates.cardCvc.error}
                </MDTypography>
              )}
            </Grid>
          </Grid>

          {/* Billing Address (Optional) */}
          <MDBox mb={3}>
            <MDTypography variant="body2" fontWeight="medium" mb={1}>
              <HomeIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
              Billing Address (Optional)
            </MDTypography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Street Address"
                  value={billingAddress.line1}
                  onChange={handleBillingAddressChange("line1")}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d2d6da",
                      },
                      "&:hover fieldset": {
                        borderColor: "#adb5bd",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="City"
                  value={billingAddress.city}
                  onChange={handleBillingAddressChange("city")}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d2d6da",
                      },
                      "&:hover fieldset": {
                        borderColor: "#adb5bd",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="State"
                  value={billingAddress.state}
                  onChange={handleBillingAddressChange("state")}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d2d6da",
                      },
                      "&:hover fieldset": {
                        borderColor: "#adb5bd",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ZIP"
                  value={billingAddress.postal_code}
                  onChange={handleBillingAddressChange("postal_code")}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d2d6da",
                      },
                      "&:hover fieldset": {
                        borderColor: "#adb5bd",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Country"
                  value={billingAddress.country}
                  onChange={handleBillingAddressChange("country")}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#d2d6da",
                      },
                      "&:hover fieldset": {
                        borderColor: "#adb5bd",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1A73E8",
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </MDBox>

          {/* Security Badge */}
          <MDBox mb={3} display="flex" alignItems="center" justifyContent="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                padding: "8px 16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
              }}
            >
              <LockIcon sx={{ fontSize: 16, color: "#2e7d32" }} />
              <MDTypography variant="caption" color="text" fontWeight="medium">
                Secure SSL Encrypted Payment
              </MDTypography>
            </Box>
          </MDBox>

          {/* Accepted Cards */}
          <MDBox mb={3} display="flex" alignItems="center" justifyContent="center" gap={1}>
            <MDTypography variant="caption" color="text">
              We accept:
            </MDTypography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {CARD_BRAND_ICONS.visa}
              {CARD_BRAND_ICONS.mastercard}
              {CARD_BRAND_ICONS.amex}
              {CARD_BRAND_ICONS.discover}
            </Box>
          </MDBox>

          <Divider sx={{ my: 2 }} />

          {/* Action Buttons */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <MDButton
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={onCancel}
                disabled={processing}
              >
                Cancel
              </MDButton>
            </Grid>
            <Grid item xs={6}>
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={!isFormValid() || processing || !stripe}
              >
                {processing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Pay $${plan.price}`
                )}
              </MDButton>
            </Grid>
          </Grid>
        </MDBox>
      </CardContent>
    </Card>
  );
}

export default PaymentForm;
