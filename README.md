# USDT Data Tracker Subgraph

用于跟踪区块链数据系统中 DataStorage 合约事件的 The Graph 子图。

## 🚀 快速部署

### 1. 准备工作
确保已部署 DataStorage 合约并记录以下信息：
- ✅ 合约地址
- ✅ 部署区块号
- ✅ 网络名称 (默认: sepolia)

### 2. 更新配置
编辑 `subgraph.yaml` 中的关键信息：

```yaml
source:
  address: 'YOUR_CONTRACT_ADDRESS_HERE'  # 替换为您的合约地址
  startBlock: YOUR_START_BLOCK_HERE      # 替换为部署区块号
```

### 3. 一键部署
```bash
# 方法1: 使用脚本 (推荐)
chmod +x deploy.sh
./deploy.sh

# 方法2: 手动执行
npm install
npm run codegen
npm run build  
npm run deploy
```

## 🔧 常见问题解决

### 问题1: "Failed to compile mapping"
```bash
# 清理并重新生成
rm -rf generated/ build/
npm run codegen
npm run build
```

### 问题2: "Network not supported" 
检查 `subgraph.yaml` 中的网络设置：
- ✅ `sepolia` - Sepolia 测试网
- ✅ `mainnet` - 以太坊主网
- ✅ `polygon` - Polygon 主网

### 问题3: "Contract not found"
确认合约地址和起始区块号正确：
1. 在 Etherscan 检查合约是否存在
2. 确认起始区块号不早于合约部署区块
3. 验证网络设置正确

### 问题4: "Authorization required"
```bash
# 登录 Graph Studio
graph auth --studio YOUR_DEPLOY_KEY

# 然后重新部署
npm run deploy
```

## 📊 查询示例

部署成功后，可以使用以下 GraphQL 查询：

### 查询最新的数据条目
```graphql
{
  dataEntries(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user
    data
    dataType
    timestamp
    blockNumber
    transactionHash
  }
}
```

### 查询用户统计
```graphql
{
  users {
    id
    totalEntries
    firstEntryTime
    lastEntryTime
  }
}
```

### 查询合约统计
```graphql
{
  dataStorageContracts {
    id
    totalEntries
    totalUsers
    deploymentBlock
    deploymentTime
    deployer
  }
}
```

### 查询每日统计
```graphql
{
  dailyStats {
    id
    date
    entriesCount
    activeUsers
    newUsers
  }
}
```

## 🔗 相关链接

- **主项目**: https://github.com/limuran/blockchain-data-system
- **Graph Studio**: https://thegraph.com/studio/
- **GraphQL Playground**: 部署完成后在 Studio 中获取查询 URL

## 🆘 获取帮助

如果遇到其他问题，请：
1. 检查 The Graph Studio 中的部署日志
2. 确认合约 ABI 与实际合约匹配
3. 验证事件签名是否正确
4. 在主项目中创建 issue 描述具体问题