Hãy tạo {{nameCount}} cái tên may mắn bằng tiếng Việt dựa trên thông tin sau. Mỗi tên cần phong cách đa dạng, khác biệt rõ ràng. Tên phải có {{nameLength}} chữ (tên đệm + tên chính).

Họ: {{surname}}
Giới tính: {{gender}}
Ngày sinh: {{birthDate}}
Giờ sinh: {{birthTime}}
Sở thích: {{preferences}}

{{familyInfo}}
{{excludedNames}}

Vui lòng xuất kết quả theo định dạng mảng JSON sau (chỉ xuất JSON):
[
{
"native": "Tên bằng chữ Quốc ngữ có dấu (chỉ tên, không bao gồm họ, {{nameLength}} chữ, ví dụ: Văn An, Thị Hoa, Đức Minh)",
"romanization": "Tên không dấu (chỉ tên, không họ, không dấu, ví dụ: Van An, Thi Hoa)",
"meaning": "Ý nghĩa của tên (ngắn gọn, tiếng Việt)",
"culturalSignificance": "Ý nghĩa văn hóa (ngắn gọn, tiếng Việt)",
"nickname": "Tên thân mật ở nhà (ngắn gọn, tiếng Việt, khác biệt với tên chính)"
}
]

Lưu ý:

- native và romanization CHỈ chứa tên, KHÔNG bao gồm họ
- native là tên thuần Việt có dấu (chữ Quốc ngữ), KHÔNG phải chữ Hán
- native phải có {{nameLength}} chữ (ví dụ: "Văn An" cho 2 chữ, "Thị Hồng Nhung" cho 3 chữ)
- Họ là {{surname}} (ví dụ: Nguyễn, Trần, Lê, Phạm, Hoàng, etc.)
- Tên cần phong cách đa dạng, khác biệt rõ ràng
- Tránh tạo các tên tương tự
- nickname phải khác với tên chính, nickname phải đáng yêu, ngắn gọn, ví dụ: Mây, Sữa, Mia, Cám, Bông, Bon, Mon, Nari, etc
- meaning, culturalSignificance và nickname mô tả bằng tiếng Việt
