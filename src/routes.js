// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";

// E-Paper Publishing Platform layouts
import FrontPage from "layouts/front-page";
import EPapers from "layouts/epapers";
import UploadEPaper from "layouts/epapers/upload";
import AreaMapEditor from "layouts/epapers/area-editor";
import EPaperViewer from "layouts/epapers/viewer";
import PublicEPaperViewer from "layouts/epapers/public-viewer";
import Categories from "layouts/categories";
import UserManagement from "layouts/user-management";

// Subscription layouts
import Subscriptions from "layouts/subscriptions";
import SubscriptionCheckout from "layouts/subscription-checkout";
import SubscriptionSuccess from "layouts/subscription-success";
import SubscriptionCancel from "layouts/subscription-cancel";
import PaymentGateway from "layouts/payment-gateway";

// Settings layout
import Settings from "layouts/settings";

// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  {
    type: "collapse",
    name: "Front Page",
    key: "front-page",
    icon: <Icon fontSize="small">home</Icon>,
    route: "/",
    component: <FrontPage />,
    requiresAuth: false,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
    requiresAuth: false,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/authentication/sign-up",
    component: <SignUp />,
    requiresAuth: false,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
    publisherOnly: true,
  },
  {
    type: "collapse",
    name: "Categories",
    key: "categories",
    icon: <Icon fontSize="small">category</Icon>,
    route: "/categories",
    component: <Categories />,
    publisherOnly: true,
  },
  {
    type: "collapse",
    name: "Upload E-Paper",
    key: "upload-epaper",
    icon: <Icon fontSize="small">upload</Icon>,
    route: "/epapers/upload",
    component: <UploadEPaper />,
    publisherOnly: true,
  },
  {
    type: "collapse",
    name: "E-Papers",
    key: "epapers",
    icon: <Icon fontSize="small">newspaper</Icon>,
    route: "/epapers",
    component: <EPapers />,
    publisherOnly: true,
  },
  {
    type: "collapse",
    name: "View E-Paper",
    key: "view-epaper",
    icon: <Icon fontSize="small">visibility</Icon>,
    route: "/epapers/view/:id",
    component: <EPaperViewer />,
    publisherOnly: true,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Edit E-Paper",
    key: "edit-epaper",
    icon: <Icon fontSize="small">edit</Icon>,
    route: "/epapers/edit-areas/:id",
    component: <AreaMapEditor />,
    publisherOnly: true,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Public View E-Paper",
    key: "public-view-epaper",
    icon: <Icon fontSize="small">visibility</Icon>,
    route: "/epapers/public-view/:id",
    component: <PublicEPaperViewer />,
    requiresAuth: false,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "User Management",
    key: "user-management",
    icon: <Icon fontSize="small">manage_accounts</Icon>,
    route: "/admin/users",
    component: <UserManagement />,
    requiresAuth: true,
    adminOnly: true,
  },
  {
    type: "collapse",
    name: "Subscriptions",
    key: "subscriptions",
    icon: <Icon fontSize="small">card_membership</Icon>,
    route: "/admin/subscriptions",
    component: <Subscriptions />,
    requiresAuth: true,
    adminOnly: true,
  },
  {
    type: "collapse",
    name: "Payment Gateway",
    key: "payment-gateway",
    icon: <Icon fontSize="small">payment</Icon>,
    route: "/admin/payment-gateway",
    component: <PaymentGateway />,
    requiresAuth: true,
    adminOnly: true,
  },
  {
    type: "collapse",
    name: "Settings",
    key: "settings",
    icon: <Icon fontSize="small">settings</Icon>,
    route: "/admin/settings",
    component: <Settings />,
    requiresAuth: true,
    adminOnly: true,
  },
  {
    type: "collapse",
    name: "Check Website",
    key: "check-website",
    icon: <Icon fontSize="small">open_in_new</Icon>,
    href: "/",
    adminOnly: true,
  },
  {
    type: "collapse",
    name: "Subscription Checkout",
    key: "subscription-checkout",
    icon: <Icon fontSize="small">payment</Icon>,
    route: "/subscription/checkout",
    component: <SubscriptionCheckout />,
    requiresAuth: true,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Subscription Success",
    key: "subscription-success",
    icon: <Icon fontSize="small">check_circle</Icon>,
    route: "/subscription/success",
    component: <SubscriptionSuccess />,
    requiresAuth: true,
    hideInSidenav: true,
  },
  {
    type: "collapse",
    name: "Subscription Cancel",
    key: "subscription-cancel",
    icon: <Icon fontSize="small">cancel</Icon>,
    route: "/subscription/cancel",
    component: <SubscriptionCancel />,
    requiresAuth: true,
    hideInSidenav: true,
  },
];

export default routes;
