/**
=========================================================
* Material Dashboard 2 React - Subscription Success
=========================================================

* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

// @mui icons
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The webhook will handle the actual subscription creation
    // We just show a success message here
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <DashboardLayout>
      <DashboardNavbar absolute isMini />
      <MDBox mt={8} mb={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Card sx={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            {loading ? (
              <MDBox>
                <MDTypography variant="h4" fontWeight="medium" gutterBottom>
                  Processing your subscription...
                </MDTypography>
                <MDTypography variant="body2" color="text">
                  Please wait while we confirm your payment.
                </MDTypography>
              </MDBox>
            ) : (
              <MDBox>
                <MDBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width="80px"
                  height="80px"
                  borderRadius="50%"
                  bgColor="success"
                  color="white"
                  mx="auto"
                  mb={3}
                >
                  <Icon fontSize="large">check</Icon>
                </MDBox>
                
                <MDTypography variant="h3" fontWeight="bold" gutterBottom>
                  Welcome Aboard!
                </MDTypography>
                
                <MDTypography variant="body1" color="text" mb={3}>
                  Your subscription has been successfully activated. 
                  You now have full access to all our premium content.
                </MDTypography>

                <MDBox display="flex" gap={2} justifyContent="center">
                  <MDButton
                    variant="gradient"
                    color="info"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </MDButton>
                  <MDButton
                    variant="outlined"
                    color="info"
                    onClick={() => navigate("/")}
                  >
                    Browse Content
                  </MDButton>
                </MDBox>
              </MDBox>
            )}
          </CardContent>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SubscriptionSuccess;
