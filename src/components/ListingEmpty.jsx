import { Typography, Pagination, Empty } from "antd";

export default function ListingEmpty(){
  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Cho thuê mặt bằng kinh doanh
      </Typography.Title>
      <div style={{ color:"#8c8c8c", marginBottom: 12 }}>
        Hiện có <b>0</b> kết quả trên tổng số <b>1</b> trang.
      </div>
      <Empty description="Chưa có kết quả"/>
      <div style={{ display:"flex", justifyContent:"center", marginTop: 12 }}>
        <Pagination current={1} total={1} pageSize={10} />
      </div>
    </div>
  );
}
