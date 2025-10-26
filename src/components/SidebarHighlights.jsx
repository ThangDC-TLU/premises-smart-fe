import { Card, List, Typography } from "antd";

const data = [
  { id:1, title:"Đất Đấu Giá Hà Nội: Sôi Nổi Nguồn Cung Đầu Năm 2025", img:"https://picsum.photos/seed/a/400/240" },
  { id:2, title:"Realty: Nhà phố 2 tầng hiện đại", img:"https://picsum.photos/seed/b/400/240" },
  { id:3, title:"Quy Nhơn Iconic", img:"https://picsum.photos/seed/c/400/240" },
];

export default function SidebarHighlights(){
  return (
    <Card title="Nổi bật" bordered style={{ background:"#fff" }}>
      <List
        itemLayout="vertical"
        dataSource={data}
        renderItem={(it)=>(
          <List.Item key={it.id} style={{ paddingBottom: 12 }}>
            <img src={it.img} alt="" style={{ width:"100%", height:110, objectFit:"cover", borderRadius:8, marginBottom:8 }}/>
            <Typography.Text>{it.title}</Typography.Text>
          </List.Item>
        )}
      />
    </Card>
  );
}
