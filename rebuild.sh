#!/bin/bash

echo "🔄 重新部署子图以捕获最新的 Store Data 交易..."

# 检查当前目录
if [ ! -f "subgraph.yaml" ]; then
    echo "❌ 请在子图项目根目录下运行此脚本"
    exit 1
fi

# 显示当前配置
echo "📋 当前子图配置:"
echo "合约地址: 0xcD6a42782d230D7c13A74ddec5dD140e55499Df9"
echo "起始区块: 9129000"
echo "网络: sepolia"

# 清理旧文件
echo "🧹 清理旧文件..."
rm -rf generated/
rm -rf build/

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成代码
echo "📝 生成类型定义..."
npm run codegen

if [ $? -ne 0 ]; then
    echo "❌ 代码生成失败！"
    echo "💡 请检查 schema.graphql 和 ABI 文件"
    exit 1
fi

# 构建
echo "🔨 构建子图..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    echo "💡 请检查 mapping.ts 文件"
    exit 1
fi

# 提示部署
echo "✅ 构建成功！现在可以部署:"
echo ""
echo "🔑 1. 先认证 (如果尚未认证):"
echo "   graph auth --studio YOUR_DEPLOY_KEY"
echo ""
echo "🚀 2. 部署子图:"
echo "   graph deploy --studio usdt-data-tracker"
echo ""
echo "⏱️ 3. 等待同步 (5-10分钟)"
echo ""
echo "🔍 4. 测试查询:"
echo "   在前端使用'诊断查询'按钮检查状态"
echo ""
echo "📊 预期结果:"
echo "   应该能看到4个 Store Data 交易的数据"
echo "   区块范围: 9129381 - 9130080"