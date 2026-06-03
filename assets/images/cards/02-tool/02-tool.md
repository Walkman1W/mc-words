# 2. 工具类 Tool

来源：`docs/Minecraft英语学习单词卡分类表 (1).docx` 里的 `工具类 Tool` 分类。

词条数量：25

## 词表

| English | Chinese | Sentence |
| --- | --- | --- |
| Tool | 工具 | This tool is useful. |
| Pickaxe | 镐 | I mine stone with a pickaxe. |
| Axe | 斧 | I cut wood with an axe. |
| Shovel | 铲 | I dig sand with a shovel. |
| Hoe | 锄头 | I farm with a hoe. |
| Shears | 剪刀 | I cut wool with shears. |
| Fishing Rod | 鱼竿 | I catch fish with a fishing rod. |
| Flint and Steel | 打火石 | Flint and steel makes fire. |
| Bucket | 桶 | I have a bucket. |
| Water Bucket | 水桶 | The water bucket has water. |
| Lava Bucket | 岩浆桶 | Be careful with lava. |
| Milk Bucket | 牛奶桶 | I drink milk. |
| Compass | 指南针 | The compass points the way. |
| Clock | 时钟 | The clock shows time. |
| Map | 地图 | I look at the map. |
| Spyglass | 望远镜 | I see far with a spyglass. |
| Brush | 刷子 | I use a brush carefully. |
| Lead | 拴绳 | I lead the animal. |
| Name Tag | 命名牌 | I name my pet. |
| Saddle | 鞍 | I ride a horse with a saddle. |
| Boat | 船 | I ride a boat. |
| Minecart | 矿车 | The minecart runs on rails. |
| Anvil | 铁砧 | The anvil can repair tools. |
| Enchanted Book | 附魔书 | The enchanted book is magic. |
| Firework Rocket | 烟花火箭 | The rocket flies high. |

## 参考1文字内容标注

参考图：`kapian/参考1.jpg`

用途：作为网页端或 imagegen 生成时的文字布局模板。生成单词卡时，参考图里的 `Magenta / 品红色 / /məˈdʒentə/` 等内容要替换为当前词条；栏目标题、挑战条结构和短文本密度保持一致。

| 区域 | 参考1准确文字 | 单词卡变量/写法 |
| --- | --- | --- |
| 编号徽章 | `10` | `[NO]`，例如 `001` |
| 英文大词 | `Magenta` | `[ENGLISH]`，保持拼写准确 |
| 中文释义 | `（品红色）` | `（[CHINESE]）` |
| 音标行 | `/ məˈdʒentə /` | `[IPA]`，旁边保留蓝色喇叭图标 |
| 右上气泡 | `亮眼的品红色，超有活力！` | 与目标词相关的一句短中文鼓励语 |
| 例句英文 | `Magenta is a vibrant mix of red and purple.` | `[SENTENCE_EN]`，高亮目标词 |
| 例句中文 | `品红色是红色和紫色混合出的鲜艳颜色。` | `[SENTENCE_CN]` |
| 栏目标题 1 | `游戏释义` | 固定标题 |
| 游戏释义正文 | `Magenta 是一种鲜艳、饱和度很高的紫红色染料，常用于装饰建筑、染色玻璃和创意配色，让作品更醒目。` | 用 `[ENGLISH] 是游戏里的“[CHINESE]”...` 写 1-2 句短解释 |
| 栏目标题 2 | `用途多多!` | 按分类可替换为 `怎么使用`、`动作多多`、`冒险用途` 等 |
| 用途标签 | `装饰建筑` / `染色玻璃` / `制作旗帜` / `创意配色` / `更多创意...` | 3-5 个短标签，尽量 2-4 个汉字 |
| 栏目标题 3 | `小知识` | 可按分类替换为小贴士标题 |
| 小知识正文 | `品红色视觉冲击力很强，很适合做亮点、花朵主题和童趣风格的设计。` | 与目标词相关的一句记忆提示 |
| 小知识公式 | `红色染料 + 紫色染料 = 品红色染料` | 如适用，用图标 + 箭头/加号表达关系 |
| 栏目标题 4 | `同类词` | 可保留或替换为同类词/相关词 |
| 同类词正文 | `pink purple, bright pink` / `（偏紫的粉色，亮粉色）` | 1-3 个英文相关词 + 中文提示 |
| 栏目标题 5 | `合成方式` | 如不适合合成，可替换为使用方式/获得方式 |
| 合成方式文字 | `红色染料 + 蓝色染料 + 白色染料 -> 品红色染料 ×1` | 图标化表达，文字要短 |
| 合成说明 | `将红色与紫色系染料搭配，可得到 Magenta Dye ×1。` | 一句短说明，目标词可保留英文 |
| 下方大栏目标题 | `建筑小贴士` | 按分类替换为对应主题贴士 |
| 下方大栏目正文 | `Magenta 很适合做花园、甜品屋、童话建筑和吸睛装饰色。` | 一句短中文，说明场景用途 |
| 下方图片标签 | `花朵主题` / `童话小屋` / `亮色点缀` | 3 个短标签 |
| 右下角色气泡 | `一抹品红色，让建筑更出彩！` | 与目标词相关的一句短中文 |
| 底部挑战条 | `小挑战：用 Magenta 给玻璃或羊毛染色，做一个亮眼的小角落吧！` | `小挑战：` + 一个可执行的小任务 |

## 模板提示词文字约束

```text
The card must use the reference text hierarchy: number badge, large English word, Chinese meaning in parentheses, IPA line with speaker icon, one bilingual example sentence box, green-tab information panels, a lavender tip band, and a yellow bottom challenge bar.
For each generated card, render the exact target word, Chinese meaning, IPA, English sentence, Chinese sentence, and challenge text from the row data.
Keep all body text short and readable. Do not invent extra labels. Do not misspell the English word. Do not use official Minecraft logos, Mojang text, watermarks, or official branding.
```

