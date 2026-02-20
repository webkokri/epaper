/**
=========================================================
* Material Dashboard 2 React - Subscription Cancel
=========================================================

* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useNavigate } from "react-router-dom";

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

function SubscriptionCancel() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <DashboardNavbar absolute isMini />
      <MDBox mt={8} mb={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Card sx={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <MDBox
              display="flex"
              justifyContent="center"
              alignItems="center"
              width="80px"
              height="80px"
              borderRadius="50%"
              bgColor="warning"
              color="white"
              mx="auto"
              mb={3}
            >
              <Icon fontSize="large">close</Icon>
            </MDBox>
            
            <MDTypography variant="h3" fontWeight="bold" gutterBottom>
              Checkout Canceled
            </MDTypography>
            
            <MDTypography variant="body1" color="text" mb={3}>
              Your subscription checkout was canceled. 
              No charges were made to your account.
            </MDTypography>

            <MDTypography variant="body2" color="text" mb={3}>
              If you have any questions or need assistance, please contact our support team.
            </MDTypography>

            <MDBox display="flex" gap={2} justifyContent="center">
              <MDButton
                variant="gradient"
                color="info"
                onClick={() => navigate("/subscription/checkout")}
              >
                Try Again
              </MDButton>
              <MDButton
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </MDButton>
            </MDBox>
          </CardContent>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SubscriptionCancel;
