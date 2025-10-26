import { Layout, Row, Col } from "antd";
import HomeFilters from "../components/HomeFilters";        // nếu bạn đang dùng
import ListingEmpty from "../components/ListingEmpty";      // hoặc danh sách thật
import SidebarHighlights from "../components/SidebarHighlights"; // tuỳ chọn
import TopFavorites from "../components/TopFavorites";

const { Content } = Layout;

export default function Home(){
  return (
    <Content style={{ background:"#fff" }}>
      {/* Thanh tìm kiếm + filters + banner map (nếu có) */}
      {typeof HomeFilters === "function" && <HomeFilters onSearch={()=>{}} />}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px 24px" }}>
        <Row gutter={16} align="top">
          <Col xs={24} lg={17}>
            {/* Thay ListingEmpty bằng danh sách thực nếu đã có */}
            <ListingEmpty />
          </Col>
          <Col xs={24} lg={7} style={{ marginTop: 12 }}>
            <TopFavorites />
            {typeof SidebarHighlights === "function" && (
              <div style={{ marginTop: 16 }}>
                <SidebarHighlights />
              </div>
            )}
          </Col>
        </Row>
      </div>

      {/* Nút chat nổi (nếu có) */}
      <button
        style={{
          position:"fixed", right:24, bottom:24, width:56, height:56, borderRadius:"50%",
          background:"#1677ff", color:"#fff", border:0, boxShadow:"0 6px 16px rgba(0,0,0,.2)",
          fontSize:22, cursor:"pointer"
        }}
        title="Chat hỗ trợ"
      >💬</button>
    </Content>
  );
}

