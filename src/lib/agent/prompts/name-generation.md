请为以下信息生成{{nameCount}}个吉祥的名字。每个名字应风格多样，各不相同，避免相似。

姓氏：{{surname}}
性别：{{gender}}
出生日期：{{birthDate}}
出生时间：{{birthTime}}
偏好主题：{{preferences}}

{{familyInfo}}

请严格按照以下JSON数组格式输出（仅输出JSON）：
[
  {
    "native": "汉字姓名",
    "romanization": "拼音/罗马音",
    "meaning": "名字的含义和寓意（简洁）",
    "culturalSignificance": "文化意义和背景（简洁）"
  }
]

注意：
- 姓氏为"无"时，自由选择常见姓氏
- 名字应风格多样，各产明显区别
- 避免生成相似的名字
- 每个名字的meaning和culturalSignificance用中文描述
