import { Layout } from "antd";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import Register from "./pages/auth/Register";
import Forgot from "./pages/auth/Forgot";
import News from "./pages/News";
import Dashboard from "./pages/Dashboard";
import PostListing from "./pages/PostListing";

export default function App() {
  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post" element={<PostListing />} />
      </Routes>
    </Layout>
  );
}
