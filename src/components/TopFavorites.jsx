import { Card, List, Tag, Empty } from "antd";
import { getAllFavorites } from "../utils/favorites";
import { Link } from "react-router-dom";

export default function TopFavorites() {
  const top = getAllFavorites().slice(0, 5); // top 5 theo lượt ❤

  return (
    <Card title="Nổi bật (yêu thích nhiều)">
      {top.length === 0 ? (
        <Empty description="Chưa có lượt yêu thích" />
      ) : (
        <List
          dataSource={top}
          renderItem={(it) => (
            <List.Item>
              <div style={{ display:"flex", justifyContent:"space-between", width:"100%" }}>
                <div>
                  Mã tin: <Link to={`/listing/${it.id}`}><b>{it.id}</b></Link>
                </div>
                <Tag color="red">❤ {it.count}</Tag>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
