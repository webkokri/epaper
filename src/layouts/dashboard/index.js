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

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// API
import { dashboardAPI } from "services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    total_e_papers: 0,
    total_pages: 0,
    live_e_papers: 0,
    draft_e_papers: 0,
    used_storage: 0,
    max_storage: 1024,
    storage_percentage: 0,
    total_categories: 0,
    recent_uploads: 0
  });
  const [, setLoading] = useState(true);

  const { sales, tasks } = reportsLineChartData;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} flexGrow={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="newspaper"
                title="Total E-Papers"
                count={stats.total_e_papers}
                percentage={{
                  color: "success",
                  amount: stats.recent_uploads > 0 ? `+${stats.recent_uploads}` : "0",
                  label: "new this week",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="picture_as_pdf"
                title="Total Pages"
                count={(stats.total_pages || 0).toLocaleString()}
                percentage={{
                  color: "success",
                  amount: (stats.live_e_papers || 0).toString(),
                  label: "live",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="category"
                title="Categories"
                count={stats.total_categories}
                percentage={{
                  color: "info",
                  amount: (stats.draft_e_papers || 0).toString(),
                  label: "draft",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="storage"
                title="Storage Used"
                count={`${stats.used_storage} MB`}
                percentage={{
                  color: stats.storage_percentage > 80 ? "error" : "success",
                  amount: `${stats.storage_percentage}%`,
                  label: "of 1GB",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="website views"
                  description="Last Campaign Performance"
                  date="campaign sent 2 days ago"
                  chart={reportsBarChartData}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="daily sales"
                  description={
                    <>
                      (<strong>+15%</strong>) increase in today sales.
                    </>
                  }
                  date="updated 4 min ago"
                  chart={sales}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="dark"
                  title="completed tasks"
                  description="Last Campaign Performance"
                  date="just updated"
                  chart={tasks}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
