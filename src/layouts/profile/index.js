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

// @mui material components
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// React
import { useState } from "react";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Overview page components
import Header from "layouts/profile/components/Header";

function Overview() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setChangingPassword(true);

    try {
      // TODO: Implement API call to change password
      // For now, simulate success
      setTimeout(() => {
        setPasswordSuccess("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangingPassword(false);
      }, 1000);
    } catch (error) {
      setPasswordError("Failed to change password. Please try again.");
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header>
        {/* Change Password Section */}
        <MDBox pt={3} px={2} lineHeight={1.25}>
          <MDTypography variant="h6" fontWeight="medium">
            Change Password
          </MDTypography>
          <MDBox mb={1}>
            <MDTypography variant="button" color="text">
              Update your password to keep your account secure
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox p={2}>
          <Card>
            <MDBox pt={3} pb={3} px={3}>
              <MDBox component="form" role="form" onSubmit={handleChangePassword}>
                {passwordError && (
                  <MDBox mb={2}>
                    <MDTypography variant="caption" color="error">
                      {passwordError}
                    </MDTypography>
                  </MDBox>
                )}
                {passwordSuccess && (
                  <MDBox mb={2}>
                    <MDTypography variant="caption" color="success">
                      {passwordSuccess}
                    </MDTypography>
                  </MDBox>
                )}
                <MDBox mb={2}>
                  <MDInput
                    type="password"
                    label="Old Password"
                    fullWidth
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </MDBox>
                <MDBox mb={2}>
                  <MDInput
                    type="password"
                    label="New Password"
                    fullWidth
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </MDBox>
                <MDBox mb={2}>
                  <MDInput
                    type="password"
                    label="Confirm New Password"
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </MDBox>
                <MDBox mt={4} mb={1}>
                  <MDButton
                    variant="gradient"
                    color="info"
                    fullWidth
                    type="submit"
                    disabled={changingPassword}
                  >
                    {changingPassword ? "Changing Password..." : "Change Password"}
                  </MDButton>
                </MDBox>
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

      </Header>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
