import { Layout, Row, Col } from "antd";
import HomeFilters from "../components/HomeFilters";
import ListingGrid from "../components/ListingGrid";
import TopFavorites from "../components/TopFavorites";
import MapBanner from "../components/MapBanner";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;

export default function Home(){
  const navigate = useNavigate();
  const openMap = () => navigate("/map"); // 👈 điều hướng

  return (
    <Content style={{ background:"#fff" }}>
      {typeof HomeFilters === "function" && <HomeFilters onSearch={()=>{}} />}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <MapBanner onOpen={openMap} /> {/* 👈 */}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px 24px" }}>
        <Row gutter={16} align="top">
          <Col xs={24} lg={17}>
            <ListingGrid pageSize={8} />
          </Col>
          <Col xs={24} lg={7} style={{ marginTop: 12 }}>
            <TopFavorites />
          </Col>
        </Row>
      </div>
    </Content>
  );
}
