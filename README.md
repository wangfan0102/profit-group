
# 微信群收益打卡（完整项目）

## 功能
- 每人每天一条收益记录（自动覆盖）
- 总榜 / 月榜 / 周榜
- 成员历史记录
- 累计收益折线图（Canvas）
- 月历热力图
- JSON 导入导出

## GitHub Pages 部署
1. 新建 GitHub 仓库 `profit-group`
2. 上传整个项目
3. Settings → Pages → GitHub Actions
4. Push 到 main 即自动部署

## Supabase
1. 在 Supabase SQL Editor 中依次执行 `supabase/schema.sql` 和 `supabase/policies.sql`。
2. 打开 Supabase 的 Project Settings -> API，复制 Project URL 和 anon/publishable key。
3. 填入 `js/supabase-config.js`：

```js
window.PROFIT_GROUP_SUPABASE = {
  url: 'https://你的项目.supabase.co',
  anonKey: '你的 anon key'
};
```

页面会自动切换到 Supabase；如果两个值留空，则继续使用浏览器 LocalStorage。页面直接写入 `profit_records`，`members` 表可以保留但不是必需的。浏览器端只能使用 anon/publishable key，不能放 service_role key。
